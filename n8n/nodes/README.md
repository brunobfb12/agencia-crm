# N8N — Código dos nós do workflow

Estes arquivos são a **fonte da verdade** do código JavaScript que roda dentro dos nós "Code" do workflow N8N `YCanhmW5AKNdvICI` (WhatsApp Agencia - Atendimento IA v2).

> O código ao vivo fica no N8N. Após qualquer edição aqui, use `deploy_workflow.mjs` ou um script patch para aplicar no servidor.

## Arquivos

| Arquivo | Nó N8N | Função |
|---|---|---|
| `montar_prompt_claude.js` | Montar Prompt Claude | Monta o system prompt completo para o Haiku: empresa, produtos, regras, histórico, seção Calendly, aprendizados |
| `parsear_resposta_ia.js` | Parsear Resposta IA | Extrai JSON da resposta do Claude: resposta, novoStatus, notificarVendedor, mensagemVendedor, midia, dataRecontato |
| `filtrar_e_extrair.js` | Filtrar e Extrair | Filtra mensagens recebidas do webhook Evolution API (ignora grupos, mensagens próprias, etc.) |
| `mesclar_transcri_o.js` | Mesclar Transcrição | Une transcrição de áudio com contexto da mensagem |
| `preparar_audio_bin_rio.js` | Preparar Áudio Binário | Converte áudio recebido para base64 para transcrição |
| `preparar_documento.js` | Preparar Documento | Prepara documentos (PDF, etc.) recebidos via WhatsApp |
| `preparar_imagem.js` | Preparar Imagem | Prepara imagens recebidas via WhatsApp para análise do Claude |
