#!/bin/bash

echo "=== CONTANDO MENSAGENS VAZIAS (últimos 30 dias) ==="

ssh root@201.76.43.149 << 'EOFSH'
docker exec $(docker ps -q --filter 'name=crm') bash -c '
PGPASSWORD=on8i0evlzu74rtprrdzr psql -h localhost -U postgres -d agencia_crm << "EOF"
SELECT COUNT(*) as total_vazio FROM "Mensagem" WHERE "direcao" = '"'"'ENTRADA'"'"' AND ("conteudo" IS NULL OR "conteudo" = '"'"''"'"') AND "criadoEm" >= NOW() - INTERVAL '"'"'30 days'"'"';
EOF
'
EOFSH

echo ""
echo "=== EXEMPLOS (primeiras 5) ==="

ssh root@201.76.43.149 << 'EOFSH'
docker exec $(docker ps -q --filter 'name=crm') bash -c '
PGPASSWORD=on8i0evlzu74rtprrdzr psql -h localhost -U postgres -d agencia_crm << "EOF"
SELECT m."criadoEm"::text as data, c."telefone", c."nome", e."nome" as empresa, LENGTH(m."conteudo") as tam FROM "Mensagem" m JOIN "Conversa" c2 ON m."conversaId" = c2."id" JOIN "Cliente" c ON c2."clienteId" = c."id" JOIN "Empresa" e ON c."empresaId" = e."id" WHERE m."direcao" = '"'"'ENTRADA'"'"' AND (m."conteudo" IS NULL OR m."conteudo" = '"'"''"'"') AND m."criadoEm" >= NOW() - INTERVAL '"'"'30 days'"'"' ORDER BY m."criadoEm" DESC LIMIT 5;
EOF
'
EOFSH
