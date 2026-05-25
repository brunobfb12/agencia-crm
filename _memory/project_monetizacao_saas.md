---
name: Monetização FácilCRM — Trial + Assinatura
description: Sistema de monetização implementado em 2026-05-25 com Hotmart + trial 30 dias + bloqueio de plano
type: project
originSessionId: cd0631a0-6d87-456e-8dc6-cb25c20d93e9
---

## Status: IMPLEMENTADO ✅ (2026-05-25)

Gateway escolhido: **Hotmart** (não Nuvemshop — checkout mais simples para SaaS)

## Planos e preços

| Plano | Mensal | Anual/mês | Total anual | Economia | Limite leads |
|-------|--------|-----------|-------------|---------- |-------------|
| STARTER | R$497 | R$414 | R$4.970 | R$994 | 500 |
| PRO | R$897 | R$748 | R$8.970 | R$1.794 | 1.000 |
| AGENCY | R$1.497 | R$1.248 | R$14.970 | R$2.994 | 5.000 |
| isenta | grátis | — | — | — | ilimitado |

## Ucodes Hotmart por plano

```
STARTER: X105970507I  (mensal: ?off=gl10cife | anual: ?off=4vylb80p)
PRO:     D105975567P  (mensal: ?off=aeumfwka | anual: ?off=7vl7g284)
AGENCY:  M105975917J  (mensal: sem off       | anual: ?off=i6ul1rjy)
```

Checkout sempre recebe `?src=empresaId` para identificar a empresa no webhook.

## Fluxo de ativação (Hotmart → CRM)

1. Cliente acessa `/registro` → Empresa criada com `planStatus=TRIAL`, `trialFim=now+30d`
2. Após 30 dias → middleware redireciona para `/planos`
3. Cliente assina no Hotmart → webhook `POST /api/webhook/hotmart` com HOTTOK
4. Evento `PURCHASE_APPROVED` → Empresa recebe `planStatus=ATIVO`, `plano=PRO/STARTER/AGENCY`
5. Evento `PURCHASE_CANCELED/SUBSCRIPTION_CANCELLATION` → `planStatus=CANCELADO`
6. Evento `PURCHASE_REFUNDED/CHARGEBACK` → `planStatus=BLOQUEADO`

## Middleware de acesso (`middleware.ts`)

```
CENTRAL → sempre libera
isenta=true → sempre libera
planStatus=ATIVO → libera
planStatus=TRIAL + trialFim > agora → libera
qualquer outra situação → redireciona /planos
```

Matcher: `/dashboard/:path*`

## Schema Prisma — campos billing em Empresa

```prisma
planStatus  PlanStatus  // TRIAL | ATIVO | BLOQUEADO | CANCELADO
plano       PlanoTipo   // STARTER | PRO | AGENCY
trialFim    DateTime?
isenta      Boolean     @default(false)
assinaturaId String?    // código do subscriber na Hotmart
```

## Isenção das 10 empresas da agência

SQL para isentar uma empresa: `UPDATE "Empresa" SET "isenta" = true WHERE id = '...'`
SQL para isentar todas: `UPDATE "Empresa" SET "isenta" = true`
Rodar via: `POST https://ocrmfacil.com.br/api/admin/migrate` com `{"secret":"crm2026migra","sql":"..."}`

## Limite de leads (lib/plano.ts)

`verificarLimiteLeads(empresaId)` → conta leads totais, compara com limite do plano.
Bloqueia em: `POST /api/leads` (retorna 402), `POST /api/leads/ativar` (402), webhook mensagem (200 com motivo=limite_leads).
UI em `/dashboard/clientes` exibe mensagem com link para `/dashboard/assinatura`.

## PWA já implementado (2026-05-03)
- `public/manifest.json` + `public/sw.js` + ícones 192/512px
- Usuário pode instalar o app no celular pelo Chrome

**Why:** Produto validado com 10 empresas → pronto para vender externamente via Hotmart.
**How to apply:** Produto já está bloqueando e cobrando. Para isentar uma nova empresa interna, rodar SQL de isenção.
