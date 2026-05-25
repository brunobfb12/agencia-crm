---
name: Plano de IA para Atendimento WhatsApp
description: Decisão sobre qual IA usará no atendimento automático dos clientes
type: project
originSessionId: 93dc93a8-8cb7-4331-8887-d53d8740fef4
---
Atualmente usando Google Gemini 1.5 Flash (gratuito) para atender clientes no WhatsApp.

**Por:** Evitar custo de API no início, validar o sistema primeiro.

**Plano acordado com Bruno:**
1. Gemini atende os clientes agora
2. Claude avalia a qualidade das respostas do Gemini
3. Claude ajuda a ajustar/melhorar o prompt de sistema do Gemini
4. Após validação e geração de receita → migrar para Claude API (Sonnet ~U$20-50/mês)

**How to apply:** Quando Bruno pedir para avaliar respostas ou melhorar o atendimento, revisar as conversas do CRM e sugerir melhorias no prompt do nó "Montar Prompt Gemini" no workflow N8N.
