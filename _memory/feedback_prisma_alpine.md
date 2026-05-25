---
name: Prisma no Alpine Linux requer OpenSSL instalado
description: No Alpine Linux, o Prisma falha ao detectar libssl e gera binário errado — sempre instalar openssl no Dockerfile
type: feedback
originSessionId: 93dc93a8-8cb7-4331-8887-d53d8740fef4
---
No Alpine Linux (`node:20-alpine`), o Prisma não detecta a versão do OpenSSL automaticamente e gera `libquery_engine-linux-musl.so.node` (para OpenSSL 1.1.x) em vez de `linux-musl-openssl-3.0.x`. Isso causa erro em runtime: `Error loading shared library libssl.so.1.1`.

**Why:** Alpine Linux com Node 20 usa OpenSSL 3.x, mas o Prisma precisa do pacote `openssl` instalado para detectar a versão corretamente.

**How to apply:** Sempre incluir `RUN apk add --no-cache openssl` no Dockerfile antes do `npx prisma generate`. Também limpar `node_modules` antes do `npm install` para evitar binários antigos de plataforma diferente.

Dockerfile correto para o projeto CRM:
```dockerfile
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl
COPY . .
RUN rm -rf node_modules .next
RUN npm install --ignore-scripts
RUN npx prisma generate
RUN npm run build
ENV PORT=80
ENV NODE_ENV=production
EXPOSE 80
CMD ["npm", "start"]
```
