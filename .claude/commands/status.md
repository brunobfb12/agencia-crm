---
description: Verifica o status de todos os serviços do sistema
---

## Status do Sistema — Agência CRM

### WhatsApp — todas as instâncias

Use a ferramenta MCP `verificar_instancia` para cada instância:

| Instância | Empresa |
|-----------|---------|
| `WPP2` | Teste (conectado) |
| `ph_intima` | Ph Íntima |
| `di_charmy` | Di Charmy |
| `opus_automotivo` | Opus Automotivo |
| `parede_tintas_1` | Paredão Tintas (loja 1) |
| `hoken` | Hoken |
| `parede_tintas_2` | Paredão Tintas Av. Rio Verde |
| `relancer_cursos` | Relancer Cursos |
| `studio_thaisypolicena` | Studio Sobrancelhas |
| `relancer_odontologia` | Spa Relancer Odontologia |
| `empresarios_crente` | Empresários Crente |

### Evolution API (porta 8081)

```bash
curl -s http://201.76.43.149:8081/instance/connectionState/WPP2 \
  -H "apikey: SuaChaveSecreta123" | jq .
```

### CRM — health check

```bash
curl -s https://ocrmfacil.com.br/api/empresas | jq 'length'
```

### N8N — workflows ativos

Acesse `https://n8n-n8n.6jgzku.easypanel.host` e verifique:
- Workflow "WhatsApp Agência - 10 Empresas (MCP)" → ativo
- Workflow "Atendimento IA" (ID: `VYYlP60j0e1cHuub`) → ativo

### Painel Central (CRM)

Acesse `https://ocrmfacil.com.br/dashboard/central` com perfil CENTRAL para ver:
- Status WhatsApp de todas as instâncias (ao vivo)
- Ferramentas com vencimento próximo
- Métricas de atividade (mensagens hoje, leads hoje, mensagens no mês)
