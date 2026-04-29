---
description: Comandos e diagnósticos para o WhatsApp via Evolution API v1.8.2
---

## WhatsApp — Evolution API v1.8.2 (porta 8081)

### Enviar mensagem de texto

```bash
curl -s -X POST http://201.76.43.149:8081/message/sendText/WPP2 \
  -H "apikey: SuaChaveSecreta123" \
  -H "Content-Type: application/json" \
  -d '{"number":"5562984707771","textMessage":{"text":"Olá, teste!"}}' | jq .
```

### Verificar conexão de uma instância

```bash
curl -s http://201.76.43.149:8081/instance/connectionState/WPP2 \
  -H "apikey: SuaChaveSecreta123" | jq .
```

### Verificar se número tem WhatsApp

```bash
curl -s -X POST http://201.76.43.149:8081/chat/whatsappNumbers/WPP2 \
  -H "apikey: SuaChaveSecreta123" \
  -H "Content-Type: application/json" \
  -d '{"numbers":["5562984707771"]}' | jq .
```

### Buscar histórico de mensagens

```bash
curl -s -X POST http://201.76.43.149:8081/chat/findMessages/WPP2 \
  -H "apikey: SuaChaveSecreta123" \
  -H "Content-Type: application/json" \
  -d '{"where":{"key":{"remoteJid":"5562984707771@s.whatsapp.net"}},"limit":20}' | jq .
```

### Listar chats abertos

```bash
curl -s http://201.76.43.149:8081/chat/findChats/WPP2 \
  -H "apikey: SuaChaveSecreta123" | jq '.[0:5]'
```

### AVISO — Limitação @lid (iPhones)

A Evolution API v1.8.2 **não consegue enviar** para números com JID no formato `@lid`
(ex: `58136828342503@lid`). Isso afeta iPhones com WhatsApp Business recente.
Clientes no Android funcionam normalmente com `@s.whatsapp.net`.

### MCP Tools disponíveis

Use as ferramentas do servidor MCP `whatsapp-agencia` para operações com a instância como parâmetro dinâmico:
- `verificar_instancia` — verifica status da conexão
- `enviar_mensagem` — envia texto
- `enviar_midia` — envia arquivo/imagem
- `buscar_mensagens` — histórico de conversa
- `listar_chats` — chats ativos
- `verificar_numero` — verifica se número tem WhatsApp
- `listar_grupos` — grupos da instância
