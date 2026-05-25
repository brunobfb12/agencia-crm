---
name: Sessão 04/05/2026 — Fixes IA e CRM
description: Registro dos fixes aplicados em 04/05/2026 no workflow N8N e no CRM
type: project
originSessionId: cd0631a0-6d87-456e-8dc6-cb25c20d93e9
---
## Fixes aplicados em 04/05/2026

### N8N workflow VYYlP60j0e1cHuub — "Atendimento IA"

**1. "Salvar Resposta no CRM" — undefined JSON (IA parava de responder)**
- Causa: `$json` após "Atualizar Cliente CRM" não tinha `conversa.id` nem `lead.id`
- Fix: trocado para `$('Parsear Resposta IA').item.json.*` explícito

**2. coletaSection vs roteiroSection conflito**
- Causa: AI pedia email no meio do roteiro de qualificação
- Fix: coletaSection suprimido quando `perguntasQualificacao` ativo; apenas nome é pedido nesse caso

**3. agendamentoSection adicionado ao prompt**
- Quando cliente tem agendamento pendente, AI recebe instrução de não oferecer agendamento novamente

**4. Notificar Vendedor — RESOLVIDO ✅**
- Bugs corrigidos: porta 8080 → 8081 + formato JSON `text` → `textMessage.text`

### CRM (agencia-crm / ocrmfacil.com.br)

**5. dataNascimento timezone bug**
- Causa: `new Date("1983-11-08")` = UTC midnight → UTC-3 browser mostra dia 7
- Fix: servidor salva `1983-11-08T12:00:00Z`; display usa `parseDateLocal()` que extrai só YYYY-MM-DD

**6. Card do Lead — dados do cliente**
- Adicionados: nome, telefone (link wa.me), email, aniversário + idade calculada

**7. Modal Lead — muito grande / footer cortado**
- Fix: `maxHeight: calc(100vh - 2rem)`, conteúdo com `overflow-y-auto`, header/footer com `flex-shrink-0`

**8. Webhook mensagem — agendamentos**
- Agora retorna `agendamentos` pendentes do cliente para o N8N

### Status instâncias
- `studio_thaisypolicena` — conectada e funcionando ✅
- Outras 9 instâncias — aguardando QR Code

---

## Cal.com Webhook — CONCLUÍDO ✅

Ciclo completo funcionando:
1. Cal.com dispara webhook → N8N recebe payload
2. N8N chama `/api/webhook/agendamento` no CRM
3. CRM: localiza cliente por telefone, atualiza lead para `AGENDADO`, cria registro em `Agendamento`
4. N8N: notifica vendedor cadastrado via Evolution API 8081

**Studio Thaisypolicena** — testado e validado em produção.

---

## Áudio + Mídia — CONCLUÍDO ✅ (05/05/2026)

### Workflow ativo: A6mvYv4v7NbHSSUn ("Atendimento IA v2 Audio+Midia")
Substituiu VYYlP60j0e1cHuub (desativado).

### Transcrição de Áudio (Groq Whisper)
- Áudio WhatsApp (ogg/opus) → Evolution API `getBase64FromMediaMessage` → binary → Groq `whisper-large-v3-turbo` → transcrição PT → Claude responde
- **Fix crítico**: body correto é `{ message: $('Receber Mensagem').item.json.body.data }` (objeto data completo, não só a key)
- Groq key: presente no nó "Transcrever com Groq" do workflow A6mvYv4v7NbHSSUn
- Testado e funcionando ✅

### Envio de Mídia pela IA — Upload Real (05/05/2026 atualizado)
- Upload de arquivo real (JPG/PNG/PDF) na tela Configurações → Mídias da IA
- Arquivo salvo como base64 no PostgreSQL (coluna `Midia.base64` + `mimeType`)
- CRM API `/api/midias/upload` recebe multipart, converte para base64
- CRM API `/api/midias/{id}/base64?secret=crm2026midias` retorna base64 para N8N
- Claude recebe no prompt: lista de mídias com id + etiqueta + quando usar
- Claude responde: `"midia": {"midiaId": "ID_EXATO", "legenda": "texto"}`
- N8N fluxo: "Tem Mídia?" → "Buscar Midia Base64" (GET /api/midias/{id}/base64) → "Enviar Mídia ao Cliente" (sendMedia com base64)
- Secret do endpoint: `crm2026midias`

**N8N API key atual (12/05/2026):** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NThiY2U4Ny0yYTdkLTQxMDItYjU1Ni0wMWExZjJhYWVkOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiY2JlMWNkOGUtODIxYi00MmEyLWIzZjYtYjgzZGYwMDUzN2YwIiwiaWF0IjoxNzc4NDczNjMxfQ.qerSQqMlIUjev6-VH_g2gl1PqE28hRm_LzLGyj-UZ6Y

**Why:** Empresas precisam responder áudios (80% dos clientes usam) e enviar catálogos/PDFs
**How to apply:** Padrão já implementado, replicável para novas instâncias automaticamente
