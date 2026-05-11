# Estado do Projeto — FácilCRM / Agência WhatsApp

**Última atualização:** 2026-05-11  
**Domínio:** ocrmfacil.com.br  
**Repositório:** https://github.com/brunobfb12/agencia-crm

---

## Infraestrutura

| Serviço | URL / Acesso | Observação |
|---------|-------------|------------|
| VPS Locaweb | `201.76.43.149` | Online 24/7 |
| Easypanel | `http://201.76.43.149:3000` | Painel de deploy |
| Evolution API v1.8.2 | `http://201.76.43.149:8081` | **Usar esta** |
| Evolution API v2.1.1 | `http://201.76.43.149:8080` | Não usar |
| N8N | `https://n8n-n8n.6jgzku.easypanel.host` | Automação |
| PostgreSQL | Container `evolution_postgres`, banco `crm` | Dados do CRM |
| CRM Next.js | `https://ocrmfacil.com.br` | Produção |

**API key Evolution v1.8.2:** ver `.env` no VPS (Easypanel → n8n → variáveis)  
**Migration secret:** ver `.env` do projeto CRM

---

## N8N — Workflows Ativos

| ID | Nome | Status |
|----|------|--------|
| `YCanhmW5AKNdvICI` | WhatsApp Agencia - Atendimento IA v2 (Audio+Midia) | ✅ ATIVO |
| `prZeEVuGjuYkJAcC` | Cal.com Agendamento - AGENDADO Automático | ✅ ATIVO |
| `8GiFBs9x6tPv8Kyr` | Evolution MCP Server - WhatsApp envio | ⚪ inativo |

**Backups dos workflows:** `backups/n8n/` neste repositório.  
**Para restaurar:** `POST https://n8n-n8n.6jgzku.easypanel.host/api/v1/workflows` com o JSON do arquivo.

---

## N8N — Fluxo do Atendimento IA

```
WhatsApp → Evolution API webhook → N8N
  ↓
Filtrar e Extrair (texto / áudio / imagem / doc)
  ↓
Salvar no CRM (POST /api/webhook/mensagem)
  ↓ retorna: empresa, cliente, lead, histórico, mídias, agendamentos
  ↓
[Áudio] → Groq transcription → texto
[Imagem] → base64 → Claude Vision
[Doc]    → base64 → Claude
  ↓
Montar Prompt Claude (system prompt com contexto completo)
  ↓
Chamar Claude (claude-haiku-4-5-20251001 via api.anthropic.com)
  ↓
Parsear Resposta IA (extrai: resposta, novoStatus, midia, atualizarCliente)
  ↓
[Opcional] Atualizar Cliente CRM
[Opcional] Enviar Mídia
  ↓
Simular Digitando → /chat/sendPresence/{instancia}  ← CORRIGIDO em 11/05/2026
Aguardar Digitação (delay humanizado)
  ↓
Enviar Resposta ao Cliente → /message/sendText/{instancia}
  ↓
[Se necessário] Notificar Vendedor
```

---

## N8N — Fluxo Cal.com → Agendamento

```
Cal.com BOOKING_CREATED → N8N webhook
  ↓
POST /api/webhook/agendamento
  ↓ corpo: { instancia, nome, email, telefone, servico, dataAgendada, hora }
  ↓
CRM: upsert cliente → upsert lead (status AGENDADO) → cria Agendamento
  ↓
CRM retorna: mensagemVendedor (com link wa.me) + mensagemCliente
  ↓
N8N envia WhatsApp para vendedor E para cliente
```

---

## CRM — Endpoints Principais

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/webhook/mensagem` | POST | Recebe msg WhatsApp, retorna contexto para IA |
| `/api/webhook/agendamento` | POST | Recebe agendamento Cal.com, salva no CRM |
| `/api/admin/migrate` | POST | Executa migrações SQL |
| `/api/empresas` | GET/POST | Empresas |
| `/api/vendedores` | GET/POST | Vendedores |
| `/api/clientes` | GET | Clientes |
| `/api/leads` | GET/POST | Leads |

---

## Empresas e Instâncias WhatsApp

| Instância | Empresa | Status |
|-----------|---------|--------|
| `studio_thaisypolicena` | Studio Sobrancelhas Thaísy Policena | ✅ Em uso/teste |
| `ph_intima` | Ph Íntima | Aguardando QR |
| `di_charmy` | Di Charmy | Aguardando QR |
| `opus_automotivo` | Opus Estudio Automotivo | Aguardando QR |
| `parede_tintas_1` | Paredão Tintas (loja 1) | Aguardando QR |
| `hoken` | Hoken | Aguardando QR |
| `parede_tintas_2` | Paredão Tintas Av. Rio Verde | Aguardando QR |
| `relancer_cursos` | Relancer Cursos | Aguardando QR |
| `relancer_odontologia` | Spa Relancer Odontologia | Aguardando QR |
| `empresarios_crente` | Empresários Crente | Aguardando QR |

---

## Schema do Banco (resumo)

```
Empresa      — id, nome, instanciaWhatsapp, informacoes, calendlyUrl, perguntasQualificacao
Vendedor     — id, nome, telefone, empresaId, ativo, ordemChamada, ultimaAtribuicaoEm
Cliente      — id, nome, telefone, email, dataNascimento, tags, memoriaCliente, empresaId
Lead         — id, clienteId, empresaId, vendedorId, status, score, observacoes
Agendamento  — id, clienteId, tipo, dataAgendada, hora, notas, status, googleEventId
Conversa     — id, clienteId, modoHumano, ultimaMensagem, ultimaAtividade
Mensagem     — id, conversaId, conteudo, direcao (ENTRADA/SAIDA)
Midia        — id, empresaId, etiqueta, url, descricaoUso, tipo, ativo
Campanha     — id, empresaId, mensagem, tipo, status
CampanhaItem — id, campanhaId, leadId, telefone, nomeCliente, status
```

**Status de Lead:** `LEAD → AQUECIMENTO → PRONTO_PARA_COMPRAR → NEGOCIACAO → VENDA_REALIZADA → POS_VENDA → FOLLOW_UP | PERDIDO | SEM_INTERESSE | SEM_RESPOSTA | AGENDADO`

---

## Correções Aplicadas (histórico)

| Data | Problema | Solução |
|------|----------|---------|
| 2026-05-10 | Agendamentos duplicados (Cal.com dispara 2x) | Índice único `COALESCE(hora,'')` + catch P2002 |
| 2026-05-10 | Telefone `55+5562...` rejeitado pela Evolution API | Normalização em `/api/webhook/agendamento` e `/api/webhook/mensagem` |
| 2026-05-10 | Cliente não recebia notificação de agendamento | Adicionado `mensagemCliente` na resposta do webhook |
| 2026-05-11 | Mensagem vendedor sem link clicável | Link `wa.me/` + briefing de abordagem na `mensagemVendedor` |
| 2026-05-11 | "Simular Digitando" retornava 404 | Corrigido para `/chat/sendPresence` (endpoint correto v1.8.2) |

---

## Workflow de Deploy

```bash
git push origin main
# Easypanel → agencia-crm → Implantar → aguardar ✓ Ready
# Se mudou schema:
POST https://ocrmfacil.com.br/api/admin/migrate
{"secret":"crm2026migra"}
```

---

## Prevenção de Perdas — Checklist

- [x] Código CRM → GitHub (automático no `git push`)
- [x] Workflows N8N → `backups/n8n/` neste repositório
- [ ] **N8N volume persistente** → configurar no Easypanel (ver seção abaixo)
- [ ] **pg_dump automático** → agendar backup do PostgreSQL
- [ ] Exportar workflows N8N após cada alteração importante

---

## Como Corrigir: N8N Perdendo Dados no Container

**Causa:** O N8N armazena dados em `~/.n8n/` dentro do container. Quando o Easypanel recria o container (deploy/crash), esse diretório é apagado.

**Solução no Easypanel:**
1. Acesse `http://201.76.43.149:3000`
2. Abra o serviço **n8n**
3. Vá em **Volumes** (ou **Mounts**)
4. Adicione um volume: `Host path: /etc/easypanel/projects/n8n/data` → `Container path: /home/node/.n8n`
5. Salve e reimplante

Após isso, os dados do N8N ficam em disco persistente no VPS e sobrevivem a qualquer reinício de container.

**Solução adicional — backup automático via N8N API:**
Agendar um workflow cron no N8N que exporte todos os workflows via API e salve no repositório git a cada semana.

---

## Como Restaurar Workflows N8N

```bash
# Para cada arquivo em backups/n8n/:
curl -X POST https://n8n-n8n.6jgzku.easypanel.host/api/v1/workflows \
  -H "X-N8N-API-KEY: <token>" \
  -H "Content-Type: application/json" \
  -d @backups/n8n/YCanhmW5AKNdvICI__WhatsApp_Agencia.json

# Depois ativar:
curl -X POST https://n8n-n8n.6jgzku.easypanel.host/api/v1/workflows/<ID>/activate \
  -H "X-N8N-API-KEY: <token>"
```
