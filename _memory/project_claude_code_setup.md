---
name: Configuração Claude Code — Skills e Slash Commands
description: 14 skills instaladas globalmente por categoria, slash commands do projeto e MCP whatsapp-agencia configurado
type: project
originSessionId: cd0631a0-6d87-456e-8dc6-cb25c20d93e9
---
## Skills instaladas globalmente (~/.agents/skills/)

Instaladas via `npx skills add ... --yes --global`. Total: **14 skills**.

### Dev & Arquitetura
| Skill | Repositório | Propósito |
|-------|-------------|-----------|
| `nextjs-app-router-patterns` | wshobson/agents | Padrões corretos do Next.js App Router |
| `typescript-expert` | sickn33/antigravity-awesome-skills | TypeScript avançado |
| `mcp-builder` | anthropics/skills | Criar servidores MCP em TypeScript ou Python |
| `webapp-testing` | anthropics/skills | Testes de UI com Playwright (headless, screenshots) |

### Banco de Dados
| Skill | Repositório | Propósito |
|-------|-------------|-----------|
| `prisma-client-api` | prisma/skills | Referência completa da API Prisma Client |
| `prisma-database-setup` | prisma/skills | Setup e migrações de banco com Prisma |
| `supabase-postgres-best-practices` | supabase/agent-skills | Otimização PostgreSQL — índices, RLS, connection pooling |

### Design & UI
| Skill | Repositório | Propósito |
|-------|-------------|-----------|
| `frontend-design` | anthropics/skills | Cria interfaces distintas, evita visual genérico de IA |
| `web-design-guidelines` | vercel-labs/agent-skills | Audita UI/UX e acessibilidade (Web Interface Guidelines Vercel) |
| `shadcn` | shadcn/ui (oficial) | Gerencia componentes shadcn/ui — add, search, fix, presets |
| `ai-image-generation` | inferen-sh/skills | Gera imagens com FLUX, Gemini, Grok, Seedream via CLI `belt` ⚠ 1 alerta Socket |

### Marketing & Conteúdo
| Skill | Repositório | Propósito |
|-------|-------------|-----------|
| `copywriting` | coreyhaines31/marketingskills | Copy de conversão para landing pages, CTAs, headlines |
| `content-strategy` | coreyhaines31/marketingskills | Planejamento de conteúdo, pilares, calendário editorial |

### Planejamento
| Skill | Repositório | Propósito |
|-------|-------------|-----------|
| `brainstorming` | obra/superpowers | Design colaborativo — HARD GATE: nenhum código sem design aprovado |

## Slash commands do projeto (agencia-crm/.claude/commands/)

Criados em `C:/Users/USUARIO/agencia-crm/.claude/commands/`:

- `/deploy` — push → Implantar no Easypanel → migrar → verificar. Inclui erros comuns de build.
- `/migrar` — executa migrações no banco (padrão e SQL personalizado via curl).
- `/status` — checklist de todos os serviços + instâncias WhatsApp + Painel Central.
- `/whatsapp` — comandos curl da Evolution API v1.8.2 + aviso sobre limitação @lid.

## MCP configurado (~/.claude/settings.json)

```json
{
  "mcpServers": {
    "whatsapp-agencia": {
      "type": "sse",
      "url": "https://n8n-n8n.6jgzku.easypanel.host/mcp/59f3f22e-9221-4533-b42f-93f11c08e589"
    }
  }
}
```

7 ferramentas MCP disponíveis: `verificar_instancia`, `enviar_mensagem`, `enviar_midia`, `buscar_mensagens`, `listar_chats`, `verificar_numero`, `listar_grupos`

**Why:** Arsenal completo para desenvolvimento full-stack, banco de dados, design, marketing e testes — tudo contextualizado para o projeto FácilCRM/agencia-crm.
**How to apply:** Para instalar nova skill: `npx skills add <url> --skill <nome> --yes --global`. Para novo MCP: editar `C:/Users/USUARIO/.claude/settings.json`.
