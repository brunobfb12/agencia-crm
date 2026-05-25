---
name: Status do Roadmap FácilCRM
description: O que está implementado vs pendente nas features prioritárias do produto — atualizado 2026-05-25
type: project
originSessionId: f149734d-c602-4e3b-8741-931e91ec958c
---
Estado em 2026-05-11 (sessão 4):

## Já implementado (não recriar)

- **Memória do cliente** ✅ — `memoriaCliente` no banco, incluso no prompt da IA.
- **Persona por empresa (nomeIA)** ✅ — campo `nomeIA` no Empresa, usado em follow-ups e reativações.
- **Follow-up backend** ✅ — `GET /api/leads/follow-up` retorna 4 tipos: pos_venda (D+2), reativacao_15d, reativacao_30d, recontato_agendado.
- **3 tipos de atendimento** ✅ — `tipoAtendimento = AGENDAMENTO/ORCAMENTO/AMBOS` no banco e no prompt da IA.
- **Follow-up cron N8N** ✅ — workflow `Cc9Gg7jV1IUH9qJE`, cron `0 12 * * *` UTC = 9h BRT.
- **Registro de venda via CRM** ✅ — `POST /api/vendas`, botão "Registrar Venda" no Kanban modal.
- **dataRecontato** ✅ — implementado 2026-05-11. Quando cliente diz que vai comprar depois de uma data, IA seta `novoStatus=FOLLOW_UP` e `dataRecontato=YYYY-MM-DD`. Cron dispara nessa data com mensagem "Conforme combinamos...". Após enviar, cron limpa `dataRecontato` via PATCH. Campo editável no Kanban modal. Variáveis `{nome}` disponíveis no campo data input tipo date.
- **mensagemPosVenda por empresa** ✅ — campo `mensagemPosVenda` no Empresa. Configurável em Configurações → Editar Info. Suporta variáveis `{nome}`, `{ia}`, `{empresa}`. Fallback para mensagem genérica.
- **Aniversário automático** ✅ — implementado 2026-05-11 sessão 4. `GET /api/leads/follow-up` agora retorna 2 itens por aniversariante: (1) mensagem de parabéns para o cliente via WhatsApp da empresa; (2) notificação para o vendedor com nome, idade e instrução para ligar — tipo `aniversario_vendedor`, `clienteTelefone` = telefone do vendedor. Sem migration necessária. Deploy pendente.

## Pendente — Próximo

**Ciclo de venda completo:**
- **Pós-venda com IA respondendo** ✅ — implementado 2026-05-12. N8N prompt inclui CONTEXTO POS-VENDA quando lead.status=VENDA_REALIZADA/POS_VENDA. Cron salva mensagem SAIDA na conversa via `/api/webhook/saida`. IA vê histórico completo e responde com tom pós-venda.

**Papéis e permissões:**
- **Papel GERENTE** ✅ — implementado 2026-05-12. Campo `cargo` (VENDEDOR|GERENTE) em Vendedor. Quando IA detecta reclamação pós-venda, usa `notificarGerente=true`. `/api/webhook/resposta` busca gerente da empresa e retorna telefone. N8N envia WhatsApp ao gerente com contexto do problema.

**Inteligência:**
- **IA aprende com vitórias** ✅ — implementado 2026-05-13. `/api/webhook/vitoria` analisa conversa com Claude Haiku e armazena em `empresa.aprendizados`. N8N workflow `YCanhmW5AKNdvICI` inclui `aprendizadosSection` no prompt. Máx 10 padrões separados por `\n---\n`.
- **Dashboard analytics** ✅ — implementado 2026-05-13.

**Campanhas:**
- **Sistema de campanhas** ✅ — implementado 2026-05-13. Tabelas `Campanha` e `CampanhaItem`. Workflow N8N `TtxFxrOR5ca5PMHm` dispara 1 msg/minuto. API: `GET /api/campanhas/pendente`, `PATCH /api/campanhas/item/{id}`. Script de criação: `scripts/recriar_campanha_workflow.mjs`.

## Follow-up API — tipos retornados (2026-05-11)

| tipo | quando dispara | destino mensagem |
|------|---------------|-----------------|
| `pos_venda` | D+2 após VENDA_REALIZADA | cliente |
| `reativacao_15d` | D+15 em FOLLOW_UP sem dataRecontato | cliente |
| `reativacao_30d` | D+30 em FOLLOW_UP sem dataRecontato | cliente |
| `recontato_agendado` | dataRecontato <= hoje | cliente |
| `aniversario` | dia do aniversário (dataNascimento) | cliente |
| `aniversario_vendedor` | dia do aniversário (dataNascimento) | telefone do vendedor |

## APIs novas desta sessão

- `POST /api/vendas` — cria Venda + move lead para VENDA_REALIZADA (transação Prisma)
- `GET /api/vendas?leadId=xxx` — lista vendas de um lead
- `PATCH /api/leads/{id}` — suporta `dataRecontato`
- `POST /api/webhook/resposta` — suporta `dataRecontato`

## N8N — Workflows ativos

| ID | Nome | Cron |
|----|------|------|
| `YCanhmW5AKNdvICI` | Atendimento IA v2 (Audio+Midia) | Webhook |
| `Cc9Gg7jV1IUH9qJE` | Follow-up Diário - CRM FácilCRM | 0 12 * * * UTC |
| `prZeEVuGjuYkJAcC` | Cal.com Agendamento - AGENDADO | Webhook |

## Implementado em 2026-05-15 (sessão atual)

- **Mobile optimization completa** ✅ — todas as páginas do dashboard otimizadas para celular:
  - `/dashboard/configuracoes`: 4 abas (Empresa, Vendedores, Mídias, WhatsApp) com cards e forms inline
  - `/dashboard/leads`: chips de status + lista filtrada no mobile, kanban só no desktop
  - `/dashboard/clientes`: cards com badge de status, telefone, empresa, botão Ativar
  - `/dashboard/central`: cards mobile para Planos, Ferramentas e Usuários; WhatsApp/Atividade já eram responsivos
- **Cron de Agendamentos automático** ✅ — `/api/cron/agendamentos?secret=crm2026migra` dispara todos os Agendamentos PENDENTE do dia via WhatsApp. Tipos cobertos: FOLLOW_UP, POS_VENDA, REATIVACAO, ANIVERSARIO, CONSULTA, TAREFA. Marca como CONCLUIDO + registra no histórico da conversa. Testado: encontra agendamentos corretamente; erro esperado "Connection Closed" porque instâncias aguardam QR.
- **N8N workflow cron agendamentos** ✅ — ID `v689m4inDNcEaSrb` "Cron - Agendamentos do Dia", ativo, Schedule `0 9 * * *`.
- **IA já conhece agendamentos do cliente** ✅ — `/api/webhook/mensagem` já retorna `agendamentos[]` com os próximos agendamentos PENDENTE do cliente (take:3, orderBy dataAgendada asc). N8N inclui no contexto do Claude/Haiku.

## Implementado em 2026-05-14 (sessão anterior)

- **IA aprende com perdas** ✅ — `POST /api/webhook/derrota`. Chamado automaticamente pelo `webhook/vendedor` ao registrar PERDIDO. Extrai motivo de perda + conversa, chama Haiku, salva `[PERDA] <padrão>` em `empresa.aprendizados`. Testado e funcionando.
- **aprendizadosSection no prompt** ✅ — `montar_prompt_claude.js` agora separa vitórias ("O QUE JA FUNCIONOU") de perdas ("OBJEÇÕES FREQUENTES"). Haiku usa os padrões para quebra de objeção preventiva. N8N `YCanhmW5AKNdvICI` atualizado.
- **Pressão ao vendedor** ✅ — `GET /api/leads/follow-up` retorna 4 novos tipos: `pressao_vendedor_24h`, `pressao_vendedor_48h`, `pressao_vendedor_72h`, `pressao_gerente_72h`. Leads NEGOCIACAO/PRONTO_PARA_COMPRAR/AGENDADO sem atualização caem nesses buckets. Gerente = vendedor com `cargo='GERENTE'` na mesma empresa.
- **N8N follow-up atualizado** ✅ — workflow `Cc9Gg7jV1IUH9qJE` tem novo nó `É Pressão Vendedor?` após `Enviar WhatsApp`. Tipos `pressao_*` vão para fim (não salvam no CRM, não atualizam lead). Outros tipos seguem fluxo normal.

## Follow-up API — todos os tipos retornados

| tipo | quando dispara | destino mensagem |
|------|---------------|-----------------|
| `pos_venda` | D+2 após VENDA_REALIZADA | cliente |
| `reativacao_15d` | D+15 em FOLLOW_UP sem dataRecontato | cliente |
| `reativacao_30d` | D+30 em FOLLOW_UP sem dataRecontato | cliente |
| `recontato_agendado` | dataRecontato <= hoje | cliente |
| `aniversario` | dia do aniversário | cliente |
| `aniversario_vendedor` | dia do aniversário | telefone do vendedor |
| `pressao_vendedor_24h` | lead parado 24–48h | telefone do vendedor |
| `pressao_vendedor_48h` | lead parado 48–72h | telefone do vendedor |
| `pressao_vendedor_72h` | lead parado +72h | telefone do vendedor |
| `pressao_gerente_72h` | lead parado +72h + gerente existe | telefone do gerente (cargo=GERENTE) |

## N8N — Workflows ativos

| ID | Nome | Cron/Trigger |
|----|------|------|
| `YCanhmW5AKNdvICI` | Atendimento IA v2 (Audio+Midia) | Webhook |
| `Cc9Gg7jV1IUH9qJE` | Follow-up Diário - CRM FácilCRM | 0 8 * * * UTC |
| `prZeEVuGjuYkJAcC` | Cal.com Agendamento - AGENDADO | Webhook |
| `TtxFxrOR5ca5PMHm` | Campanhas - Disparo WhatsApp | Webhook |

## Implementado em 2026-05-25 (sessão atual)

- **Sistema de monetização completo** ✅ — trial 30 dias, middleware bloqueando acesso ao dashboard, página `/planos` pública com preços, webhook Hotmart auto-ativa plano ao pagar. Gateway: **Hotmart** (ucodes: STARTER=X105970507I, PRO=D105975567P, AGENCY=M105975917J). Token JWT inclui `planStatus`, `trialFim`, `isenta`. Middleware libera: CENTRAL sempre, isenta=true sempre, ATIVO, TRIAL com trialFim>now.
- **Registro público** ✅ — `/registro` cria Empresa (planStatus=TRIAL, trialFim=now+30d) + Usuario perfil DONO + token com isenta=false.
- **Isenção de plano** ✅ — campo `isenta` no Empresa. SQL para isentar: `UPDATE "Empresa" SET "isenta" = true`. As 10 empresas da agência estão isentas.
- **Aba Assinatura no dashboard** ✅ — `/dashboard/assinatura` com status atual, countdown de trial, cards de planos com toggle Mensal/Anual, botão abre Hotmart com `?src=empresaId` para identificar empresa no webhook.
- **Limite de leads por plano** ✅ — `lib/plano.ts` verifica contra limites (STARTER:500, PRO:1000, AGENCY:5000, isenta=ilimitado). Bloqueia criação em: `POST /api/leads` (402), `POST /api/leads/ativar` (402), `POST /api/webhook/mensagem` (200 com motivo=limite_leads para não travar N8N). UI mostra erro + link "Ver planos e fazer upgrade →".
- **Tags em clientes** ✅ — 7 tags predefinidas em dois grupos:
  - **Origem:** Indicação, Anúncio, Orgânico
  - **Tipo:** VIP, Varejo, Atacado, Inadimplente
  - Página Clientes: badges coloridos por cliente, botão 🏷 abre modal de edição, barra de filtro por tag acima da tabela
  - Página Leads: botão "🏷 Por tag" na barra de campanha auto-seleciona todos os leads do tag escolhido
  - Salva via `PATCH /api/clientes/[id]` com `{ tags: [...] }` — campo `String[]` já existia no schema

**Why:** Produto pronto para monetizar — trial, bloqueio e checkout integrados ao Hotmart.
**How to apply:** Próximo passo: verificar se os QR codes das 10 instâncias estão escaneados e cadastrar vendedores/informações de cada empresa.
