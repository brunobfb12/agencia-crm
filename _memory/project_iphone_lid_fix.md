---
name: iPhone @lid Fix — Status e Padrão para Novas Instâncias
description: Solução completa para IA responder iPhones (JID @lid) via Evolution API v1.8.2. Verificado em produção em 04/05/2026.
type: project
originSessionId: cd0631a0-6d87-456e-8dc6-cb25c20d93e9
---
## Contexto

iPhones com WhatsApp Business recente enviam JID no formato `@lid` (ex: `215942449639550@lid`) em vez de `@s.whatsapp.net`. A Evolution API v1.8.2 **não consegue enviar para @lid diretamente**. A solução é resolver o número real via CRM.

## Status atual (migrado para v2 em 04/05/2026)

- ✅ **Evolution API v2.3.7** em uso (porta 8080) — suporte nativo a @lid
- ✅ **10/10 instâncias** criadas no v2 com webhook correto para N8N
- ✅ **N8N workflow** (`VYYlP60j0e1cHuub`) migrado — URLs e formato do body atualizados
- ✅ **CRM** migrado — todos os arquivos apontam para :8080
- ✅ **CRM webhook** `/api/webhook/mensagem` tem resolução @lid por nome
- ⚠️ **Aguardando:** re-escanear QR Codes das 10 instâncias no v2 (`http://201.76.43.149:8080/manager`)

## Como funciona o fluxo @lid

1. iPhone envia `remoteJid: 215942449639550@lid`
2. N8N "Filtrar e Extrair" detecta `isLid: true`, extrai telefone sem sufixo
3. CRM webhook detecta: `isLid = !telefone.startsWith("55")`
4. Busca cliente com mesmo nome e `telefone.startsWith("55")` no banco
5. Se encontrado: `telefonePrincipal = numero_brasileiro` → envia normalmente
6. Se não encontrado (cliente novo): salva conversa no CRM, envio WhatsApp falha silenciosamente (`continueOnFail: true`), vendedor responde manualmente

## N8N — node "Enviar Resposta ao Cliente" (v2 correto)

```javascript
={{ JSON.stringify({
  number: $('Salvar no CRM').item.json.telefonePrincipal || $('Filtrar e Extrair').item.json.telefone,
  text: $('Parsear Resposta IA').item.json.aiResposta
}) }}
```

**v2 usa `text` direto, não `textMessage: { text }`. Nunca usar** `isLid ? jid : telefonePrincipal`.

## N8N — node "Simular Digitando" (v2 correto)

Path: `POST /chat/sendPresence/{instancia}` (v1 era `chat/updatePresence`)

```javascript
={{ JSON.stringify({ number: $('Salvar no CRM').item.json.telefonePrincipal || $('Parsear Resposta IA').item.json.telefone, delay: 3000, presence: 'composing' }) }}
```

## Diferenças v1 → v2 (para referência futura)

| | v1 (:8081) | v2 (:8080) |
|---|---|---|
| sendText body | `{ number, textMessage: { text } }` | `{ number, text }` |
| webhook/set body | `{ enabled, url, events... }` | `{ webhook: { enabled, url, events... } }` |
| sendPresence path | `POST /chat/updatePresence/{inst}` | `POST /chat/sendPresence/{inst}` |
| sendPresence body | `{ number, presence }` | `{ number, delay, presence }` |
| webhook/find response | direto | mesmo |
| connectionState | mesmo | mesmo |

## Criação de novas instâncias — já está configurado automaticamente

O endpoint `POST /api/central/instancia` (arquivo: `app/api/central/instancia/route.ts`) já:
1. Cria a instância na Evolution API v2 com webhook configurado para o N8N
2. Configura `events: ["MESSAGES_UPSERT"]`
3. Aponta para `https://n8n-n8n.6jgzku.easypanel.host/webhook/whatsapp`
4. Usa formato correto v2 `{ webhook: { ... } }` para o set

**Novas instâncias criadas pelo CRM já nascem com tudo configurado.** Só precisa escanear o QR Code.

## Verificação rápida de webhook (todas as instâncias)

```javascript
// Checar se todas as instâncias têm webhook correto
GET http://201.76.43.149:8081/webhook/find/{instancia}
// Esperado: { enabled: true, url: "https://n8n-n8n.6jgzku.easypanel.host/webhook/whatsapp" }
```

## @lid para VENDEDORES (adicionado 14/05/2026)

`webhook/vendedor` também recebe @lid quando o vendedor usa iPhone. Solução implementada:
1. Detecta @lid: `isLid = !telefone.startsWith("55") && telNorm.length > 13`
2. Tenta match por telefone (últimos 9 dígitos) — funciona para Android
3. Se falha e é @lid: busca todos os vendedores da empresa e compara primeiro nome em JS com normalização NFD (remove diacríticos) — funciona para iPhone
4. `nomeContato` agora passado pelo N8N no `Verificar Vendedor`

## Limitação conhecida

Cliente NOVO que usa iPhone exclusivamente (nunca usou Android/Web nessa empresa):
- Não tem registro com número brasileiro no CRM
- Resolução por nome falha
- IA não responde no WhatsApp (mas mensagem fica no CRM)
- Solução definitiva requer Evolution API v2+ ou pedir número ao cliente

**Why:** Evolution API v1.8.2 não suporta envio para JID @lid. Única forma de enviar é ter o número `55...` real.

**How to apply:** Ao criar nova instância, não precisa fazer nada além de escanear o QR Code. O workflow N8N e o CRM já tratam @lid automaticamente. Se cliente novo iPhone não receber resposta, verificar se tem registro com `telefone` brasileiro no banco.
