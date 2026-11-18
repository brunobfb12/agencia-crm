#!/bin/bash
# Alarme de atendimento do CRM (FácilCRM). NÃO agendado: rodar manualmente ou via cron depois de validado.
#   /root/alarme_atendimento.sh                 envia alertas de verdade
#   DRY=1 /root/alarme_atendimento.sh           ensaio: só imprime o que enviaria (sem envio, estado e log)
#   EXCECOES="" /root/alarme_atendimento.sh     sobrescreve EXCECOES só nesta execução
# Config e NTFY_TOPIC ficam em /root/.alarme.env (nenhum segredo neste arquivo).
# A key da Evolution é lida do container em tempo de execução e nunca impressa nem gravada.

ENV_FILE=/root/.alarme.env
STATE_DIR=/root/.alarme_state
LOG=/var/log/alarme_atendimento.log
EVO_SVC=evolution_evolution-api
DRY=${DRY:-0}
export TZ=America/Sao_Paulo

# Carrega a config sem perder um EXCECOES definido no ambiente
_exc_set=${EXCECOES+x}
_exc_val=${EXCECOES-}
set -a
. "$ENV_FILE"
set +a
if [ -n "$_exc_set" ]; then EXCECOES=$_exc_val; fi
: "${EXCECOES:=}" "${LIMITE_BADMAC:=20}" "${LIMITE_SILENCIO_MIN:=150}" "${LIMITE_ESPERA_MIN:=10}"

NOW=$(date +%s)
DOW=$(date +%u)                      # 1=seg ... 7=dom
HORA=$((10#$(date +%H)))
COMERCIAL=0
if [ "$DOW" -le 6 ] && [ "$HORA" -ge 8 ] && [ "$HORA" -lt 18 ]; then COMERCIAL=1; fi
INI08=$(date -d "$(date +%F) 08:00" +%s)
RESUMO=""
add() { RESUMO="$RESUMO | $1"; }

finaliza() {
  if [ "$DRY" != 1 ]; then
    mkdir -p "$(dirname "$LOG")"
    echo "$(date '+%F %T') comercial=$COMERCIAL$RESUMO" >> "$LOG"
  fi
  echo "$(date '+%F %T') DRY=$DRY comercial=$COMERCIAL$RESUMO"
}

PG=$(docker ps --filter "name=^evolution_postgres\.1\." --format '{{.Names}}' | head -1)
EVO=$(docker ps --filter "name=^evolution_evolution-api\.1\." --format '{{.Names}}' | head -1)
KEY=$(docker inspect "$EVO" --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null | grep '^AUTHENTICATION_API_KEY=' | cut -d= -f2-)

q() { docker exec "$PG" psql -U postgres -d crm -tA -c "$1"; }

enviar() {  # $1=prioridade  $2=tags  $3=texto
  if [ "$DRY" = 1 ]; then echo "[DRY] ntfy priority=$1 tags=$2: $3"; return 0; fi
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' -H "Title: Alarme CRM" -H "Priority: $1" -H "Tags: $2" -d "$3" "https://ntfy.sh/$NTFY_TOPIC")
  [ "$code" = "200" ]
}

avalia() {  # $1=chave  $2=1 problema / 0 ok  $3=descrição
  local key=$1 prob=$2 desc=$3 f="$STATE_DIR/$1.state"
  if [ "$prob" = 1 ]; then
    if [ -f "$f" ] && [ $(( NOW - $(cut -d'|' -f1 "$f") )) -lt 3600 ]; then
      add "$key:ja_alertado"; return 0
    fi
    if enviar high warning "⚠️ $desc"; then
      add "$key:ALERTA"
      if [ "$DRY" != 1 ]; then mkdir -p "$STATE_DIR"; echo "$NOW|$desc" > "$f"; fi
    else
      add "$key:ERRO_ENVIO"
    fi
  elif [ -f "$f" ]; then
    local antes
    antes=$(cut -d'|' -f2- "$f")
    if enviar default white_check_mark "✅ normalizado: $antes"; then
      add "$key:NORMALIZADO"
      if [ "$DRY" != 1 ]; then rm -f "$f"; fi
    else
      add "$key:ERRO_ENVIO"
    fi
  else
    add "$key:ok"
  fi
}

estado() {  # $1=instância -> state da conexão na Evolution
  printf 'header = "apikey: %s"\n' "$KEY" | curl -s -m 15 -K - "http://localhost:8080/instance/connectionState/$1" | grep -o '"state":"[a-z]*"' | cut -d'"' -f4
}

# Instâncias: Empresa ativa com instanciaWhatsapp, menos EXCECOES
MON=$(q "SELECT \"instanciaWhatsapp\" FROM \"Empresa\" WHERE ativa = true AND \"instanciaWhatsapp\" IS NOT NULL ORDER BY 1;")
RC_DB=$?
if [ "$RC_DB" -ne 0 ] || [ -z "$PG" ]; then
  add "banco:ERRO"
  avalia erro_db 1 "Alarme não conseguiu consultar o banco do CRM. Verificar o container do Postgres."
  finaliza
  exit 1
fi

EXC=$(echo "$EXCECOES" | tr ',' ' ')
MONIT=""
for i in $MON; do
  case "$i" in ""|*[!A-Za-z0-9_-]*) continue ;; esac
  skip=0
  for e in $EXC; do [ "$i" = "$e" ] && skip=1; done
  if [ "$skip" -eq 0 ]; then MONIT="$MONIT $i"; fi
done
add "monitoradas=$(echo $MONIT | wc -w)"

declare -A ST

# 1) CONEXÃO (24h)
for i in $MONIT; do
  ST[$i]=$(estado "$i")
  if [ -z "${ST[$i]}" ]; then ST[$i]=sem_resposta; fi
  if [ "${ST[$i]}" = open ]; then
    avalia "conexao_$i" 0 ""
  else
    avalia "conexao_$i" 1 "Instância $i desconectada (state: ${ST[$i]}). Reconectar via QR code."
  fi
done

# 2) DECIFRAGEM (24h): Bad MAC nos últimos 15 min (log do serviço, não por instância)
BM=$(docker service logs --since 15m "$EVO_SVC" 2>&1 | grep -c 'Bad MAC')
case "$BM" in
  ''|*[!0-9]*) add "badmac:ERRO_LEITURA"; BM=0 ;;
  *)
    if [ "$BM" -gt "$LIMITE_BADMAC" ]; then
      avalia badmac 1 "Bad MAC: $BM erros de decifragem nos últimos 15 min (limite $LIMITE_BADMAC)."
    else
      avalia badmac 0 ""
    fi ;;
esac
add "badmac15m=$BM"

# 3) e 4) só em horário comercial (seg–sáb, 08h–18h BRT)
if [ "$COMERCIAL" = 1 ]; then
  # 3) SILÊNCIO: ref = maior entre a última ENTRADA da instância e 08:00 de hoje
  for i in $MONIT; do
    if [ "${ST[$i]}" != open ]; then add "silencio_$i:pulado_desconectada"; continue; fi
    last=$(q "SELECT COALESCE(extract(epoch FROM max(m.\"criadoEm\")), 0)::bigint FROM \"Mensagem\" m JOIN \"Conversa\" c ON c.id = m.\"conversaId\" JOIN \"Cliente\" cl ON cl.id = c.\"clienteId\" JOIN \"Empresa\" ea ON ea.id = cl.\"empresaId\" WHERE m.direcao = 'ENTRADA' AND ea.\"instanciaWhatsapp\" = '$i';")
    case "$last" in ''|*[!0-9]*) add "silencio_$i:ERRO_DB"; continue ;; esac
    ref=$last
    if [ "$ref" -lt "$INI08" ]; then ref=$INI08; fi
    min=$(( (NOW - ref) / 60 ))
    if [ "$min" -gt "$LIMITE_SILENCIO_MIN" ]; then
      avalia "silencio_$i" 1 "Sem mensagem de cliente em $i há ${min} min (horário comercial; limite ${LIMITE_SILENCIO_MIN} min)."
    else
      avalia "silencio_$i" 0 ""
    fi
  done

  # 4) CLIENTE ESPERANDO: última mensagem ENTRADA entre 3h e LIMITE_ESPERA_MIN atrás, modoHumano=false
  if [ -n "$MONIT" ]; then
    IN=$(for i in $MONIT; do printf "'%s'," "$i"; done | sed 's/,$//')
    ESP=$(q "WITH u AS (SELECT DISTINCT ON (\"conversaId\") \"conversaId\", direcao, \"criadoEm\" FROM \"Mensagem\" ORDER BY \"conversaId\", \"criadoEm\" DESC), x AS (SELECT ea.\"instanciaWhatsapp\" AS inst, RIGHT(cl.telefone, 4) AS t4, u.\"criadoEm\" AS ts FROM u JOIN \"Conversa\" c ON c.id = u.\"conversaId\" JOIN \"Cliente\" cl ON cl.id = c.\"clienteId\" JOIN \"Empresa\" ea ON ea.id = cl.\"empresaId\" WHERE u.direcao = 'ENTRADA' AND c.\"modoHumano\" = false AND ea.\"instanciaWhatsapp\" IN ($IN) AND u.\"criadoEm\" >= (now() AT TIME ZONE 'UTC') - interval '3 hours' AND u.\"criadoEm\" <= (now() AT TIME ZONE 'UTC') - interval '${LIMITE_ESPERA_MIN} minutes'), r AS (SELECT inst, t4, row_number() OVER (PARTITION BY inst ORDER BY ts) AS rn FROM x) SELECT inst, count(*), string_agg(t4, ',' ORDER BY rn) FILTER (WHERE rn <= 5) FROM r GROUP BY inst;")
    RC_E=$?
    for i in $MONIT; do
      if [ "$RC_E" -ne 0 ]; then add "espera_$i:ERRO_DB"; continue; fi
      linha=$(echo "$ESP" | grep "^$i|")
      n=$(echo "$linha" | cut -d'|' -f2)
      lst=$(echo "$linha" | cut -d'|' -f3)
      n=${n:-0}
      if [ "$n" -gt 0 ]; then
        avalia "espera_$i" 1 "$n cliente(s) aguardando resposta em $i há mais de ${LIMITE_ESPERA_MIN} min, sem atendimento humano. Últimos 4 dígitos (até 5): $lst"
      else
        avalia "espera_$i" 0 ""
      fi
    done
  fi
else
  add "silencio/espera:fora_horario"
fi

finaliza
