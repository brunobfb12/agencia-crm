# Fix: Bloqueio de Domingo - Workflow Follow-up Diário

## Status da Investigação

**Data:** 2026-08-16  
**Workflow ID:** MdutCohjqU5doIpi  
**Status:** ⚠️ CRÍTICO - Falta bloqueio de domingo em produção

---

## 1. Problema Identificado

O workflow "Follow-up Diário" em produção **NÃO está bloqueando envios aos DOMINGOS**.

### Código Atual (SEM bloqueio):
```javascript
const now = new Date();
const brtHour = (now.getUTCHours() - 3 + 24) % 24;
if (brtHour < 8 || brtHour >= 18) return [];
const items = $input.item.json.items;
if (!items || items.length === 0) return [];
return items.map(item => ({ json: item }));
```

**Problema:** Apenas verifica horário comercial (8h-18h), ignora domingos.

---

## 2. Código Esperado (COM bloqueio)

```javascript
const brtNow = new Date(Date.now() - 3 * 60 * 60 * 1000);
if (brtNow.getUTCDay() === 0) return [];
if (brtNow.getUTCHours() < 8 || brtNow.getUTCHours() >= 18) return [];
const items = $input.item.json.items;
if (!items || items.length === 0) return [];
return items.map(item => ({ json: item }));
```

**Mudanças:**
- ✅ Adiciona `const brtNow = new Date(Date.now() - 3 * 60 * 60 * 1000);` - conversão BRT
- ✅ Adiciona `if (brtNow.getUTCDay() === 0) return [];` - bloqueio de domingo (dia 0)
- ✅ Altera verificação de horário para usar `brtNow` em vez de `now`

---

## 3. Comparação com Backup

**Arquivo de backup:** `C:\Users\USUARIO\agencia-crm\backups\n8n\Cc9Gg7jV1IUH9qJE__Follow-up Diario - CRM FacilCRM.json`

- **Linhas 86-87:** Contém código COM bloqueio de domingo (correto)
- **Linhas 308-309:** Contém código SEM bloqueio (igual à produção atual)

**Conclusão:** Backup tem versão corrigida, mas produção reverteu para versão bugada.

---

## 4. Instruções de Correção Manual

### Via N8N UI:

1. Acesse: https://n8n-n8n.6jgzku.easypanel.host
2. Abra o workflow `MdutCohjqU5doIpi` (Follow-up Diário - CRM FácilCRM)
3. Clique no nó **"Dividir em Items"**
4. Cole o código corrigido acima na aba "Code"
5. Clique "Save"
6. Ative o workflow (se desativado)

### Via curl (linha de comando):

```bash
curl -X PUT \
  "https://n8n-n8n.6jgzku.easypanel.host/api/v1/workflows/MdutCohjqU5doIpi" \
  -H "X-N8N-API-KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZjg5NmRlNS1jNTQ3LTQ2ZmMtOGUxMC00ODZkOWJhZjRmYzgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiOTRmZTI3N2YtOGFhYS00NjMzLTk5ZjctZTM0OTZiOWY4MmIxIiwiaWF0IjoxNzgxMjg2OTI5fQ.fUbO_flWLlAlpfSoyJ52jTU1aG6VM0KldAAY5MpwZLw" \
  -H "Content-Type: application/json" \
  -d @workflow_updated.json
```

---

## 5. Verificação Pós-Correção

Após aplicar o fix:

1. Teste o workflow aos domingos - deve retornar `[]` (vazio)
2. Teste entre 8h-18h em dia útil - deve enviar normalmente
3. Teste fora de 8h-18h em dia útil - deve retornar `[]` (vazio)

---

## 6. Regras de Envio Esperadas

Após correção, o workflow **APENAS** envia mensagens:
- ✅ De segunda a sexta-feira
- ✅ Entre 08:00 e 17:59 (BRT)
- ❌ Aos domingos (todos os horários)
- ❌ Sábados (todos os horários) - verificar se há outra regra
- ❌ Fora do horário comercial

---

## 7. Impacto

**CRÍTICO:** Mensagens estão sendo enviadas aos domingos, violando politica de horário comercial.

---

## Próximos Passos

- [ ] Aplicar o código corrigido
- [ ] Testar em domingo para confirmar bloqueio
- [ ] Atualize backup local após confirmação
- [ ] Documente a mudança no MEMORY.md

---

**Investigação realizada:** 2026-08-16
**Agente:** Claude Haiku
