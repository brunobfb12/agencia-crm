---
description: Guia de deploy do CRM no Easypanel
---

## Deploy do CRM — ocrmfacil.com.br

### 1. Fazer commit e push

```bash
git add -A
git commit -m "descrição da mudança"
git push origin main
```

### 2. Implantar no Easypanel

Acesse `http://201.76.43.149:3000` → projeto `agencia-crm` → botão **Implantar**.

Aguarde o build finalizar (acompanhe os logs). Build bem-sucedido mostra:
```
▲ Next.js 16.2.4
✓ Ready in Xms
```

### 3. Rodar migrações (se houver mudanças no banco)

```bash
curl -s -X POST https://ocrmfacil.com.br/api/admin/migrate \
  -H "Content-Type: application/json" \
  -d '{"secret":"crm2026migra"}' | jq .
```

Para SQL personalizado:
```bash
curl -s -X POST https://ocrmfacil.com.br/api/admin/migrate \
  -H "Content-Type: application/json" \
  -d '{"secret":"crm2026migra","sql":"ALTER TABLE ..."}' | jq .
```

### 4. Verificar

- Acesse `https://ocrmfacil.com.br` e confirme login funcionando
- Verifique as mudanças específicas que foram deployadas

### Dica: Erros de build comuns

- **Prisma no Alpine**: garantir `apk add openssl` no Dockerfile e `rm -rf node_modules` antes do `prisma generate`
- **TypeScript target ES2017**: não usar lookbehind regex `(?<=...)` — substituir por loops manuais
- **Prisma upsert type error**: não usar `as never` — usar conditional spreads `...(x !== null && { x })`
