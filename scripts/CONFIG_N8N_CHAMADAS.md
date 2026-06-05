# Configuração N8N para Processar Chamadas WhatsApp

## Objetivo
Quando cliente ligar (voz ou vídeo), o sistema:
1. ✅ Detecta a chamada
2. ✅ Registra no lead
3. ✅ Notifica vendedor atribuído

## Passo a Passo

### 1. Entrar no N8N
- Acesse: `https://n8n-n8n.6jgzku.easypanel.host`
- Abra o workflow: **WhatsApp Agencia - Atendimento IA v2 (Audio+Midia)**
- ID: `YCanhmW5AKNdvICI`

### 2. Adicionar Nó de Decisão (If)

**Após o nó "Filtrar e Extrair":**

1. Clique em **+ Add Node**
2. Procure por **If**
3. Configure:
   ```
   Condition: Data → tipo
   Operation: equals
   Value: CHAMADA
   ```

### 3. Ramificação "Então" (True branch)

Na ramificação `true` (quando tipo === CHAMADA):

1. **Nó HTTP Request:**
   - Method: `POST`
   - URL: `https://ocrmfacil.com.br/api/webhook/chamada`
   - Headers: `Content-Type: application/json`
   - Body (JSON):
     ```json
     {
       "instancia": "{{ $node['Filtrar e Extrair'].json.instancia }}",
       "telefone": "{{ $node['Filtrar e Extrair'].json.telefone }}",
       "tipo": "CHAMADA",
       "isVideo": "{{ $node['Filtrar e Extrair'].json.callMsg.isVideo }}"
     }
     ```
   - Response Format: `JSON`

2. **Nó End** (termina o workflow para chamadas)

### 4. Ramificação "Senão" (False branch)

A ramificação `false` (mensagens normais) continua o fluxo atual:
- Claude IA
- Envio de resposta
- Etc.

### 5. Salvar e Ativar

1. Clique em **Save**
2. Clique em **Activate**
3. Pronto! Chamadas serão processadas automaticamente

---

## Fluxo Esperado

```
Cliente liga
    ↓
Evolution API detecta callMessage
    ↓
N8N: Filtrar e Extrair define tipo='CHAMADA'
    ↓
N8N: Decisão (If tipo === CHAMADA?)
    ↓
    SIM → HTTP Request → /api/webhook/chamada
    │      ├─ Registra [CLIENTE_TENTOU_LIGAR] no lead
    │      └─ Notifica vendedor no WhatsApp
    │
    NÃO → Continua atendimento IA normal (texto/áudio/vídeo)
```

---

## Teste

1. Cliente liga para a empresa (paredao_t9)
2. Vendedor recebe mensagem:
   ```
   📞 *CHAMADA DO CLIENTE!*
   
   👤 *Nome do Cliente*
   📱 *Telefone*
   🕐 *Hora*
   
   *Tipo:* Chamada DE VOZ
   
   ⚡ Ligue de volta AGORA!
   👉 https://wa.me/...
   ```
3. Lead aparece com flag `[CLIENTE_TENTOU_LIGAR_DATA_HORA]`

---

## Arquivos Criados

- `app/api/webhook/chamada/route.ts` — Webhook que processa chamadas
- `n8n/nodes/processar_chamada.js` — Node N8N (referência)
- `scripts/CONFIG_N8N_CHAMADAS.md` — Este arquivo

---

**Status:** ✅ Backend pronto | ⏳ Configuração N8N manual (5 min)
