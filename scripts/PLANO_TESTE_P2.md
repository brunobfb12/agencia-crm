# PLANO DE TESTE P2 — Transições Automáticas do Funil

**Data:** 2026-06-05  
**Versão:** 1.0  
**Responsável:** Bruno  
**Ambiente:** Staging (Easypanel)

---

## 📋 RESUMO

Testar 3 transições automáticas implementadas no cron follow-up:

1. **P2.1:** LEAD → AQUECIMENTO (parado 24-48h)
2. **P2.2:** AQUECIMENTO "quente" → PRONTO_PARA_COMPRAR (score ≥6 + CONFIRMADO + P72 + 24-48h)
3. **P2.3:** Re-notificação ao vendedor quando PC1 dispara

---

## 🎯 OBJETIVO

Validar que:
- Leads transitam entre status automaticamente ✅
- Notificações ao vendedor são enviadas ✅
- Observações são atualizadas com flags [P2_AUTO_PRONTO], [P72], [PC1_NOTIF_VEND] ✅
- Nenhum lead fica preso ✅

---

## 🚀 PASSO A PASSO — TESTE MANUAL

### SETUP (5 min)

1. **Acessar CRM Staging:**
   ```
   URL: https://staging-crm.seu-dominio.com 
   (ou localhost:3000 se rodar localmente)
   ```

2. **Logar como admin ou dono da empresa**

3. **Ir para:** Dashboard → Leads

---

### TESTE 1: P2.1 (LEAD → AQUECIMENTO)

**Objetivo:** Verificar se leads LEAD que responderam avançam para AQUECIMENTO

**Setup:**
- Criar cliente de teste: `[TEST] Cliente P2.1`
- Criar lead com status `LEAD`
- Mandar 1 mensagem do cliente → salva conversa
- **IMPORTANTE:** Editar manualmente a data `atualizadoEm` para 36h atrás (no banco ou via API)

**Executar:**
```bash
# Rodar cron follow-up
curl -X GET "https://seu-crm/api/leads/follow-up?secret=crm2026migra"
```

**Verificar:**
- [ ] Lead deve estar em status `AQUECIMENTO`
- [ ] Observações devem manter o conteúdo anterior
- [ ] Nenhuma notificação deve ser enviada (P2.1 é só transição)

**Tempo:** ~2 min

---

### TESTE 2: P2.2 (AQUECIMENTO "quente" → PRONTO_PARA_COMPRAR)

**Objetivo:** Verificar se leads AQUECIMENTO com pedido confirmado avançam para PRONTO quando P72 passa

**Setup:**
- Criar cliente de teste: `[TEST] Cliente P2.2`
- Criar lead com status `AQUECIMENTO`
- Preenchimento manual:
  - `score` = 8 (ou ≥6)
  - `observacoes` = `[P72]\nPedido: Tinta X 18L\nCONFIRMADO`
  - `atualizadoEm` = 60h atrás (entre 48-72h para bater a condição)
  - `vendedor` = atribuir a um vendedor ativo

**Executar:**
```bash
curl -X GET "https://seu-crm/api/leads/follow-up?secret=crm2026migra"
```

**Verificar:**
- [ ] Lead deve estar em status `PRONTO_PARA_COMPRAR`
- [ ] Observações devem incluir `[P2_AUTO_PRONTO]`
- [ ] **CRÍTICO:** Vendedor deve receber mensagem WhatsApp com:
  ```
  🚀 Oi [NOME VENDEDOR]! O lead [CLIENTE] foi movido para PRONTO_PARA_COMPRAR!
  
  📋 *Pedido:* Tinta X 18L
  
  O pedido está confirmado — chama AGORA! ⚡
  ```

**Tempo:** ~5 min (incluindo verificação de WhatsApp)

---

### TESTE 3: P2.3 (Re-notificação PC1)

**Objetivo:** Verificar se vendedor é notificado quando PC1 (conversa franca) vai ser disparado

**Setup:**
- Criar cliente de teste: `[TEST] Cliente P2.3`
- Criar lead com status `PRONTO_PARA_COMPRAR` ou `NEGOCIACAO`
- Preenchimento manual:
  - `observacoes` = `[P72]\nPedido: Kit Completo`
  - `atualizadoEm` = 100h atrás (≥96h para bater PC1)
  - `vendedor` = atribuir a um vendedor ativo
  - **Importante:** NÃO ter `[PC1]` ou `[PC1_NOTIF_VEND]` em observações

**Executar:**
```bash
curl -X GET "https://seu-crm/api/leads/follow-up?secret=crm2026migra"
```

**Verificar:**
1. [ ] Lead deve estar em status `PRONTO_PARA_COMPRAR` ou `NEGOCIACAO` (não muda)
2. [ ] Observações devem incluir `[PC1]` (flag adicionada antes de disparar ao cliente)
3. [ ] Vendedor deve receber mensagem WhatsApp com:
   ```
   ⚠️ Oi [NOME VENDEDOR]! O lead [CLIENTE] está parado há 96h.
   
   📋 *Pedido:* Kit Completo
   
   Vou enviar uma CONVERSA FRANCA ao cliente AGORA. Você tem 24h para fechar 
   antes dele ser movido para FOLLOW_UP!
   
   É a última chance! 🔥
   ```
4. [ ] Cliente deve receber mensagem da IA com conversa franca:
   ```
   Oi [NOME]! [IA] aqui, da [EMPRESA]. Quero ser transparente com você — 
   tínhamos um pedido em andamento e queria entender o que aconteceu.
   
   O que precisa acontecer para a gente fechar esse pedido? Me conta sem 
   compromisso, pode ser agora ou numa data melhor 😊
   ```

**Tempo:** ~5 min

---

## ✅ CHECKLIST FINAL

Após rodar os 3 testes:

- [ ] Todos os leads transicionaram corretamente
- [ ] Observações incluem as flags esperadas ([P2_AUTO_PRONTO], [PC1], [PC1_NOTIF_VEND])
- [ ] Vendedores receberam notificações no WhatsApp nos momentos certos
- [ ] Clientes receberam mensagens de reativação/conversa franca
- [ ] Nenhum erro nos logs (`/api/leads/follow-up`)
- [ ] Nenhum lead ficou "travado" em um status

---

## 🐛 SE ALGO FALHAR

| Problema | Debug |
|----------|-------|
| Lead não mudou de status | Verificar `atualizadoEm` (está no passado?) + score ≥6 (se P2.2) |
| Notificação não chegou | Verificar `vendedor.telefone` está preenchido + instância WhatsApp ativa |
| Observações não atualizadas | Verificar se query está achando o lead + prisma.lead.update chamado |
| Erro 500 no cron | Verificar logs: `Easypanel → agencia-crm → Logs → /api/leads/follow-up` |

---

## 📊 TEMPO TOTAL: ~15 min

- Setup: 5 min
- Teste P2.1: 2 min
- Teste P2.2: 5 min
- Teste P2.3: 5 min
- Limpeza: 2 min

---

## 🎯 RESULTADO ESPERADO

```
✅ P2.1: LEAD (36h) → AQUECIMENTO
✅ P2.2: AQUECIMENTO (60h, quente) → PRONTO + notifica vendedor
✅ P2.3: PRONTO (100h) → PC1 disparado + notifica vendedor

Total: 3/3 testes passando = DEPLOY PARA PRODUÇÃO LIBERADO
```

---

## 📝 ANOTAÇÕES

Espaço para anotar resulta dos e observações:

```
Data do teste: _______________
Testador: _______________
Empresa teste: _______________

Observações:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

## ➡️ PRÓXIMOS PASSOS

**Se tudo passou:**
1. ✅ Fazer deploy em produção (`git push origin main`)
2. ✅ Monitorar logs por 24h
3. ✅ Testar em 2-3 instâncias reais

**Se algo falhou:**
1. ❌ Abrir issue no GitHub
2. ❌ Descrever qual teste falhou
3. ❌ Compartilhar logs relevantes
