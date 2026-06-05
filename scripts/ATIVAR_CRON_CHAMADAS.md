# Ativar Cron para Processar Chamadas

## 🚀 Opção 1: Usar cron-job.org (RECOMENDADO - 2 minutos)

### Passo a Passo

1. **Abra:** https://cron-job.org/
2. **Clique em:** "Sign Up" (canto superior direito)
3. **Preencha:**
   - Email: seu email
   - Senha: qualquer senha
   - Timezone: America/Sao_Paulo

4. **Depois de logado, clique em:** "Create Cronjob"

5. **Preencha assim:**
   ```
   Title: Processar Chamadas WhatsApp
   
   URL to call: 
   https://ocrmfacil.com.br/api/cron/processar-chamadas?secret=crm2026migra
   
   Execution time: Every 5 minutes
   (Ou escolha custom: */5 * * * *)
   
   Notifications: Disabled
   ```

6. **Clique em:** "Create Cronjob"

7. ✅ **Pronto!** Cron ativado!

---

## 🔧 Opção 2: Adicionar no Easypanel (se quiser)

Se preferir gerenciar tudo no Easypanel:

1. **Easypanel → agencia-crm → Cron Jobs**
2. **Clique em "Add Cron Job"**
3. **Schedule:** `35 09 * * *` (09:35 todo dia)
4. **Command:** 
   ```bash
   curl -s "https://ocrmfacil.com.br/api/cron/processar-chamadas?secret=crm2026migra" > /dev/null
   ```
5. **Salvar**

---

## ✅ Verificar se está funcionando

Depois de ativar, faça um **teste manual:**

```bash
curl -s "https://ocrmfacil.com.br/api/cron/processar-chamadas?secret=crm2026migra"
```

Deve retornar:
```json
{
  "total": 0,
  "processadas": []
}
```

(0 = nenhuma chamada para processar no momento - é normal!)

---

## 📞 Quando Cliente Ligar

1. Cliente liga para empresa
2. Evolution API detecta chamada
3. Conversa criada com `[CHAMADA DE VOZ/VIDEO]`
4. **Cron roda (a cada 5 min)**
5. ✅ Registra `[CLIENTE_TENTOU_LIGAR]` no lead
6. ✅ Notifica vendedor no WhatsApp

---

**Status:**
- ✅ Endpoint criado
- ✅ Deploy feito
- ⏳ Cron: Escolha Opção 1 ou 2 acima

Qual opção você prefere? **1** ou **2**? 🎯
