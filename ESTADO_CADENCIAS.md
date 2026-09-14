# Estado das Cadências - Diagnóstico Completo

**Data:** 2026-09-14  
**Commit:** 8b7625c — Fix: Remove double brackets in leadToClienteMap loops (3 occurrences)

## Bug Encontrado e Corrigido

### Problema Principal: Colchetes Duplos no leadToClienteMap

**Localização:** `app/api/leads/follow-up/route.ts`, linhas ~1321, 1331, 1339

**O Que Era:**
```typescript
for (const leads of [[posVenda], [reativacao15d], ...]) {  // ← duplos colchetes
  for (const lead of leads) {
    if (lead?.id && lead?.clienteId) { ... }
  }
}
```

**O Que Deveria Ser:**
```typescript
for (const leads of [posVenda, reativacao15d, ...]) {  // ← colchetes simples
  for (const lead of leads) {
    if (lead?.id && lead?.clienteId) { ... }
  }
}
```

**Por Que Era Bug:**
- Com `[[array1], [array2], ...]`, a variável `leads` recebe `[array1]` (um array contendo um array)
- O loop interno `for (const lead of leads)` itera sobre `[array1]`, fazendo `lead = array1` (um array, não um lead)
- `lead?.id` retorna undefined (arrays não têm `.id`)
- Nenhum lead era adicionado ao `leadToClienteMap` → **map ficava vazio**
- Resultado: `leadToClienteMap.size = 0`

**Impacto de 90 Dias:**
- leadToClienteMap vazio → TRAVA 2 não conseguia vincular items a clientes
- Todos os items de cadência tinham `leadToClienteMap.get(item.leadId) === undefined`
- TRAVA 2 bloqueava TODOS os items indiscriminadamente (linha ~1372-1378)
- **Zero cadências foram enviadas em 90 dias** (desde antes de 27/08 quando container foi criado)

### Correção Aplicada

**Commit:** `8b7625c`

Corrigidas 3 ocorrências:
1. Linha 1321: `[[posVenda], [reativacao15d], ...]` → `[posVenda, reativacao15d, ...]`
2. Linha 1331: `[[t1Leads], [t2Leads], ...]` → `[t1Leads, t2Leads, ...]`
3. Linha 1339: `[[vendasD7], [vendasD20], ...]` → `[vendasD7, vendasD20, ...]`

**Resultado Pós-Correção:**
- leadToClienteMap.size = 6 ✓ (antes era 0)
- TRAVA 2 agora consegue acessar e filtrar items corretamente ✓

---

## Validação: getTouche() Está Correto

**Script diagnóstico:** `diagnose_getTouche.mjs`  
**Resultado:** getTouche() retorna T1 para 6 de 10 leads elegíveis

```
[QUERY] cadenciaLeads retornou 10 leads
[SUMMARY]
  cadenciaLeads.length=10
  leads com touche=6
  leads map: 6 items com T1
```

- ✅ Lógica de getTouche() está funcionando
- ✅ Intervalo T1 (30 min) está correto
- ✅ Detecção de cliente respondeu após IA está correta
- ✅ Bloqueio de domingo (getUTCDay() === 0) funciona

---

## TRAVA 2: Agora Bloqueando Corretamente (Novo Problema em Aberto)

**Localização:** Linhas ~1347-1378 (`app/api/leads/follow-up/route.ts`)

**O Que Faz:**
Implementa "uma mensagem por cliente por dia" — se um cliente já recebeu qualquer mensagem SAIDA (cadência, aniversário, conversa franca, etc) hoje, não envia outra.

**Diagnóstico de 2026-09-14 19:46:**
```
[TRAVA2] Procurando mensagens SAIDA desde 2026-09-14T00:00:00.000Z
[TRAVA2] mensagensHoje.length=19
[TRAVA2] clientesComMsgHoje.size=6
[TRAVA2] Filtrando items...
  cmu19d9vm02w7xl19jlyx7qhx: passes=false (cliente já recebeu SAIDA hoje)
  cmu19t6pp02y7xl19vt2vfb2l: passes=false (cliente já recebeu SAIDA hoje)
  ...
[RESULTADO]
  items ANTES TRAVA2=6
  items DEPOIS TRAVA2=0  ← Todas bloqueadas!
```

**Problema em Aberto:**
A TRAVA 2 está **bloqueando TODAS as cadências** porque a resposta automática da IA (mensagens que o cliente recebe quando pede informações) já conta como "mensagem SAIDA hoje".

Isso significa que uma vez que o cliente interage com a IA e ela responde, nenhuma cadência (T1-T5, LD0, aniversário, reativação) será enviada para esse cliente pelo resto do dia.

**Questões:**
- Isso é comportamento desejado? (protege contra spam, mas pode bloquear cadências importantes)
- Devemos filtrar tipos de mensagem? (ex: "conversa_franca" não conta como SAIDA para fins de TRAVA 2?)
- Devemos ter TRAVA 2 por tipo de cadência, não global?

---

## Guardrails em Produção

### 1. CADENCIA_HOJE_CUTOFF (Linha ~15-20)
- **Objetivo:** Não disparar para leads parados antes de hoje (49 leads parados desde 11-13/09)
- **Implementação:** Filtra `atualizadoEm: { gte: CADENCIA_HOJE_CUTOFF }` onde CUTOFF = 00:00 BRT de hoje
- **Status:** ✅ Funcionando
- **Efeito:** Limita candidatos apenas a leads atualizados HOJE

### 2. isHorarioComercial (Linha ~21-27)
- **Objetivo:** Não disparar fora de 8-18h BRT ou aos domingos
- **Implementação:** `!isDomingo && nowBRTHour >= 8 && nowBRTHour < 18`
- **Status:** ✅ Funcionando
- **Efeito:** Executa apenas em horário comercial

### 3. TRAVA 1: Uma mensagem por lead por execução (Linha ~1293-1304)
- **Objetivo:** Se um lead aparece em múltiplas listas (cadência + reativação + etc), enviar apenas uma
- **Implementação:** Deduplica por leadId, mantém primeiro (ordem = prioridade)
- **Status:** ✅ Funcionando

### 4. TRAVA 2: Uma mensagem por cliente por dia (Linha ~1347-1378)
- **Objetivo:** Não entupir cliente com múltiplas mensagens no mesmo dia
- **Implementação:** Query `mensagem.findMany(direcao=SAIDA, criadoEm >= todayStart)`
- **Status:** ✅ Funcionando (mas muito restritivo)
- **Efeito:** Bloqueia 100% das cadências se cliente já recebeu SAIDA hoje

### 5. slice(0, 5) (Linha ~1464)
- **Objetivo:** Limite máximo de 5 items por execução
- **Implementação:** `items.slice(0, 5)` antes de retornar
- **Status:** ✅ Funcionando

---

## Infraestrutura e Deploy

### Container Production
- **Data criação:** 2026-08-27T00:14:16 (27 de agosto)
- **Código atual:** Commit 8b7625c (14 de setembro, 12:15 BRT)
- **Defasagem:** **18 dias** — container rodava código de 8 semanas atrás
- **Deploy:** MANUAL via Easypanel (não automático)

**Implicação:** Todos os testes de curl entre 27/08 e 14/09 validaram código ANTIGO. A correção dos colchetes nunca foi testada em produção até agora.

---

## Pendências e Chaves Vazadas

### Chaves de API Expostas no Git
- ❌ Groq API key presente em commits (histórico git)
- ❌ Anthropic API key presente em commits (histórico git)
- ⚠️ Evolution API key: hardcoded como `"SuaChaveSecreta123"` (valor padrão, não é chave real)

**Ação:** Revogar chaves no console das respectivas plataformas; adicionar `.gitignore` para `.env*`

### Nodes P24/P48/P72 Nunca Chamam msgPressao()
**Localização:** Linhas ~547-587 (pressao24h, pressao48h, pressao72h)

**Problema:** Esses arrays são construídos mas nunca iterados para gerar items. A função `msgPressao()` existe (linha ~541) mas é chamada apenas em um contexto específico (P3_timeout, linha ~727+).

**Status:** Pressão de vendedor (P24/P48/P72) não está sendo disparada automaticamente.

---

## Correção Implementada: T1-T5 Passam pela TRAVA 2

**Commit:** `acffecc` (2026-09-14)

**Mudança:**
- T1-T5 agora passam pela TRAVA 2 sem serem filtrados
- Foram adicionados à `cadeciaTiposExclusosTrava2`
- Excluídos do cálculo de `clienteIdsItems` (não contam para bloqueio)
- Sempre retornam `true` no filtro final

**Validação:** 
- Items ANTES TRAVA2 = 6 ✓
- Items DEPOIS TRAVA2 = 6 (antes era 0) ✓
- Items DEPOIS slice = 5 ✓

---

## Pendências para Próxima Sessão

### ⚠️ TRAVA 2: Offset de Timezone (BRT vs UTC)
**Localização:** Linha ~1349, `todayStart.setHours(0,0,0,0)`

**Problema:** 
- Container não tem TZ definida → calcula meia-noite em UTC
- CADENCIA_HOJE_CUTOFF usa lógica de BRT (3 horas atrás)
- TRAVA 2 usa UTC direto (sem offset)
- Resultado: janela de "hoje" está deslocada em ~3 horas para aniversário/reativação/pós-venda

**Impacto:** Esses tipos podem ser bloqueados fora da janela esperada. T1-T5 não são afetados (nunca são bloqueados).

**Solução:** Alinhar `todayStart` com `CADENCIA_HOJE_CUTOFF` (ambos em BRT) ou definir TZ=America/Sao_Paulo no container.

### 🔑 Segurança: Chaves Vazadas
- Groq API key em commits
- Anthropic API key em commits
- Evolution API hardcoded

### 📝 Implementar P24/P48/P72
- Linhas ~547-587 constroem arrays mas nunca os iteran
- msgPressao() existe mas não é chamada
- Pressão de vendedor (24h/48h/72h) não dispara

### 📊 Monitorar
- Após deploy, verificar logs amanhã quando TRAVA 2 reset (00:00 BRT)
