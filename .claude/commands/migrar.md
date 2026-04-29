---
description: Executa as migrações do banco de dados no VPS
---

## Rodar Migrações — PostgreSQL CRM

### Migrações padrão (todas as alterações pendentes)

```bash
curl -s -X POST https://ocrmfacil.com.br/api/admin/migrate \
  -H "Content-Type: application/json" \
  -d '{"secret":"crm2026migra"}' | jq .
```

### SQL personalizado (uma coluna específica, por exemplo)

```bash
curl -s -X POST https://ocrmfacil.com.br/api/admin/migrate \
  -H "Content-Type: application/json" \
  -d '{"secret":"crm2026migra","sql":"ALTER TABLE \"Cliente\" ADD COLUMN IF NOT EXISTS \"novaColuna\" TEXT"}' | jq .
```

### Verificar estrutura atual (via psql no VPS)

Conectar diretamente ao PostgreSQL requer acesso SSH ao VPS:
```bash
# Dentro do VPS via Easypanel terminal:
psql -h evolution_postgres -U postgres -d crm -c "\d \"Cliente\""
```

### Modelos do banco (schema.prisma)

| Modelo | Tabela | Campos principais |
|--------|--------|-------------------|
| Empresa | Empresa | id, nome, instanciaWhatsapp, informacoes, ativa |
| Vendedor | Vendedor | id, nome, telefone, empresaId, ativo, ordemChamada, ultimaAtribuicaoEm |
| Cliente | Cliente | id, nome, telefone, email, dataNascimento, empresaId |
| Lead | Lead | id, clienteId, empresaId, vendedorId, status, score, observacoes |
| Ferramenta | Ferramenta | id, nome, tipo, valor, vencimento, link, ativo |
| Usuario | Usuario | id, nome, email, senha, perfil (CENTRAL/EMPRESA), empresaId |
