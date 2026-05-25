---
name: Anti-spam e Humanização do Atendimento WhatsApp
description: Requisitos de humanização, anti-spam e handling de mídia para o atendimento IA via WhatsApp
type: project
originSessionId: cd0631a0-6d87-456e-8dc6-cb25c20d93e9
---
Requisitos definidos pelo usuário para o atendimento automático via WhatsApp:

**Anti-spam**
- Nunca enviar a mesma mensagem para múltiplos leads (caracteriza spam)
- Distribuição da carteira sempre com espaço entre envios para não disparar filtros de spam
- Mensagens em massa (ex: follow-up, reativação) devem ter delay entre cada envio

**Humanização da resposta**
- Mostrar indicador "digitando..." antes de enviar a resposta
  - **Evolution API v1 (8081):** `POST /chat/updatePresence/{instancia}` com `{ number, presence: 'composing' }`
  - **Evolution API v2 (8080):** `POST /chat/sendPresence/{instancia}` com `{ number, presence: 'composing', delay: 3000 }` ← endpoint correto, testado e funcionando em 21/05/2026
  - No nó "Enviar Resposta ao Cliente" do N8N v2: `options: { presence: 'composing', delay: 4000 }` dentro do sendText (redundante mas mantido)
- Delay proporcional ao tamanho da mensagem antes de enviar (imitar velocidade de digitação humana)
- Não responder de imediato — adicionar Wait node no N8N antes do envio

**Handling de mídia recebida**
- Áudio: IA não consegue ouvir. Responder pedindo para digitar a mensagem.
- Foto/vídeo/arquivo: IA não consegue ver. Responder que recebeu e que um atendente vai analisar, notificar vendedor.
- Aplicar no workflow: detectar tipo da mensagem (messageType) e tratar cada caso.

**Why:** Evitar bloqueio do número no WhatsApp, manter naturalidade do atendimento e preservar a reputação das instâncias das 10 empresas.

**How to apply:** Ao modificar o workflow N8N de atendimento, sempre incluir: delay antes do envio, presença "digitando", verificação do tipo de mensagem, e nunca disparar mensagens idênticas em sequência.
