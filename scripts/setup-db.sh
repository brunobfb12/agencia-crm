#!/bin/sh
# Cria o banco agencia_crm se não existir e roda as migrations
npx prisma migrate deploy
