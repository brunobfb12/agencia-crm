---
name: Projeto WhatsApp CRM Agência
description: CRM em produção (ocrmfacil.com.br), N8N + Evolution API v1.8.2, 10 empresas, schema Prisma, isolamento por empresa, status atual
type: project
originSessionId: f149734d-c602-4e3b-8741-931e91ec958c
---
## Status Atual (2026-05-25)

**CRM:** https://ocrmfacil.com.br — deployado no Easypanel
**Evolution API v2.3.7:** `http://201.76.43.149:8080` — ativo (porta 8081 v1 desativada em 21/05/2026)
**N8N:** `https://n8n-n8n.6jgzku.easypanel.host`

## O que está funcionando ✅

- WhatsApp Web + Android: IA responde corretamente
- iPhone @lid: funcional via `quoted.key`
- "Assumir Conversa" / "Devolver para IA": funciona
- QR code no CRM: funciona
- Login de empresas individuais via painel central
- Isolamento por empresa: JWT-based
- Fluxo de orçamento: `tipoAtendimento=ORCAMENTO/AMBOS`
- Follow-up cron: workflow N8N `Cc9Gg7jV1IUH9qJE` ativo, 9h BRT diário
- Registro de venda: botão "Registrar Venda" no Kanban
- **dataRecontato**: IA agenda data de recontato → cron dispara na data → limpa campo após envio
- **mensagemPosVenda / mensagemAniversario**: personalizáveis por empresa, suporte a {nome} {ia} {empresa}
- **IA aprende com vitórias e perdas**: `aprendizados` em Empresa, incluído no prompt via `aprendizadosSection`
- **Sistema de Campanhas**: workflow `TtxFxrOR5ca5PMHm`, 1 msg/minuto, testado end-to-end
- **Pressão ao vendedor**: 24h/48h/72h + gerente_72h — todos os tipos no follow-up cron
- **Mobile optimization completa**: todas as páginas do dashboard adaptadas para celular (cards + tabela desktop)
- **Cron de Agendamentos** ✅ (2026-05-15): `/api/cron/agendamentos` dispara todos os tipos de Agendamento do dia. N8N workflow `v689m4inDNcEaSrb` ativo, 9h diário.
- **IA conhece agendamentos futuros**: `/api/webhook/mensagem` retorna `agendamentos[]` com os próximos 3 agendamentos pendentes do cliente.
- **Sistema de monetização** ✅ (2026-05-25): trial 30d, middleware, página /planos, webhook Hotmart, aba /dashboard/assinatura. Ver [[project_monetizacao_saas]].
- **Limite de leads por plano** ✅ (2026-05-25): STARTER=500, PRO=1000, AGENCY=5000, isenta=ilimitado. `lib/plano.ts`. Bloqueia POST /api/leads e /api/leads/ativar com 402.
- **Tags em clientes** ✅ (2026-05-25): 7 tags (Indicação, Anúncio, Orgânico, VIP, Varejo, Atacado, Inadimplente). Gerenciadas na página Clientes. Seleção por tag na barra de campanha do Kanban.

## Instâncias WhatsApp

**Apenas studio_thaisypolicena** conectada/em uso por enquanto. As outras 9 aguardam decisão.

## Pendente ❌

- 9 instâncias de produção não conectadas (decisão do usuário quando conectar)
- Vendedores não cadastrados para cada empresa
- Informações das empresas não preenchidas
- Mensagem pós-venda do Studio: preencher em Configurações com "Oi {nome}! Como ficou o design da sua sobrancelha?"

## Schema Prisma — campos relevantes

```
Empresa: tipoAtendimento, nomeIA, calendlyUrl, perguntasQualificacao, informacoes, mensagemPosVenda, mensagemAniversario, aprendizados, planStatus, plano, trialFim, isenta, assinaturaId
Cliente: memoriaCliente (TEXT), email, dataNascimento, tags (String[])
Lead: status, score, observacoes, dataRecontato (DateTime?)
Lead.status: LEAD → AQUECIMENTO → PRONTO_PARA_COMPRAR → AGENDADO → NEGOCIACAO → VENDA_REALIZADA → POS_VENDA → FOLLOW_UP | PERDIDO | SEM_INTERESSE | SEM_RESPOSTA
Venda: leadId, vendedorId, valor (Float?), descricao, status
```

## APIs do CRM — relevantes

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/leads/follow-up?secret=crm2026migra` | GET | Leads para follow-up (4 tipos: pos_venda, reativacao_15d, reativacao_30d, recontato_agendado) |
| `/api/leads/{id}` | PATCH | Edita lead (status, score, vendedorId, dataRecontato) |
| `/api/vendas` | POST | Cria Venda + move lead para VENDA_REALIZADA |
| `/api/webhook/resposta` | POST | IA → CRM (salva resposta, status, observacoes, dataRecontato) |
| `/api/admin/migrate` | POST | Migrações SQL (secret: crm2026migra) |

## N8N Workflows Ativos

| ID | Nome | Tipo |
|----|------|------|
| `YCanhmW5AKNdvICI` | Atendimento IA v2 (Audio+Midia) | Webhook |
| `Cc9Gg7jV1IUH9qJE` | Follow-up Diário - CRM FácilCRM | Cron `0 8 * * *` UTC |
| `prZeEVuGjuYkJAcC` | Cal.com Agendamento - AGENDADO | Webhook |
| `TtxFxrOR5ca5PMHm` | Campanhas - Disparo WhatsApp | Cron a cada 1 minuto |
| `v689m4inDNcEaSrb` | Cron - Agendamentos do Dia | Cron `0 9 * * *` (mesmo timezone) |

Backups locais: `C:\Users\USUARIO\agencia-crm\backups\n8n\`
Script de deploy N8N: `scripts/deploy_workflow.mjs` — chave atualizada em 2026-05-13 (expira, renovar em N8N settings)

## Deploy

1. `git push origin main` → Easypanel → projeto `agencia-crm` → **Implantar**
2. Migração SQL se mudou schema: `POST https://ocrmfacil.com.br/api/admin/migrate`

## N8N — Prompt da IA (prompt_node_new.js)

JSON de resposta da IA inclui: `resposta, novoStatus, notificarVendedor, mensagemVendedor, observacoes, atualizarCliente, midia, dataRecontato`
- `dataRecontato`: null ou "YYYY-MM-DD" — quando cliente agenda data futura para compra
- `midia`: quando incluído, foto JÁ FOI ENVIADA antes do texto — IA não diz "vou enviar"
