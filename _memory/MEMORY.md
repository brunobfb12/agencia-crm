# Memory Index

- [Regras para o Claude](feedback_regras_claude.md) — Princípios de trabalho, execução de ações, frases-gatilho e segurança digital
- [Projeto WhatsApp CRM Agência](project_whatsapp_crm.md) — CRM em produção (ocrmfacil.com.br), N8N + Evolution API v2.3.7, 10 empresas, schema Prisma, status atual do projeto
- [Visão do Produto FácilCRM](project_facilcrm_visao.md) — Domínio facilcrm.com.br, funcionalidades de IA, histórico de conversas/compras, follow-up e aniversário automáticos
- [Prisma no Alpine Linux](feedback_prisma_alpine.md) — Dockerfile CRM requer `apk add openssl` + `rm -rf node_modules` antes do prisma generate
- [Plano de IA para Atendimento](project_ia_atendimento.md) — Gemini gratuito agora, Claude avalia e treina, migrar para Claude API após validação
- [Configuração Claude Code](project_claude_code_setup.md) — 14 skills por categoria (dev, banco, design, marketing, planejamento), 4 slash commands (/deploy /migrar /status /whatsapp), MCP whatsapp-agencia
- [Anti-spam e Humanização WhatsApp](project_antispam_humanizacao.md) — Delay de digitação, anti-spam, distribuição de carteira espaçada, handling de áudio/foto/vídeo/arquivo
- [Economia de Contexto e Subagentes](feedback_economia_contexto.md) — Padrão obrigatório: subagentes para tarefas pesadas, respostas curtas, nunca narrar processo
- [Monetização FácilCRM](project_monetizacao_saas.md) — Trial 30 dias, Nuvemshop como gateway preferido (user é partner), PWA feito, Capacitor e billing para quando monetizar
- [iPhone @lid Fix — Padrão para todas as instâncias](project_iphone_lid_fix.md) — Solução @lid verificada 04/05/2026: 10/10 instâncias OK, workflow N8N corrigido, novas instâncias já nascem configuradas
- [Sessão 04/05/2026 — Fixes IA + Cal.com próximo](project_sessao_04mai2026.md) — Fixes aplicados + plano Cal.com webhook para AGENDADO automático
- [Sistema de Build N8N](project_n8n_build_system.md) — nodes/*.js são a fonte da verdade; scripts .mjs temporários para patch + push; nunca salvar API key em arquivo
- [Status do Roadmap FácilCRM](project_roadmap_status.md) — Atualizado 2026-05-14: pressão vendedor ✅, IA aprende com perdas ✅, todos os tipos de follow-up documentados
- [Vendedor — Pressão e Aprendizado](project_vendedor_pressao_aprendizado.md) — /webhook/derrota, aprendizadosSection no prompt, pressao_vendedor_24h/48h/72h, testado 2026-05-14
- [N8N — nunca usar PowerShell para Code nodes](feedback_n8n_powershell_dollar.md) — PowerShell strips `$input`/`$('Node')` → sempre usar scripts .mjs via node
- [Primeiro Cliente de Teste](project_primeiro_cliente_teste.md) — Semana 19/05/2026: fechando CLT de teste para iniciar operação real do FácilCRM
- [Roda de Relacionamento](project_roda_relacionamento.md) — Conceito central do FácilCRM: jornada automática do lead, IA cuida do relacionamento, vendedor só fecha
