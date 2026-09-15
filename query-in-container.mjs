import pg from 'pg';

const { Client } = pg;

async function run() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'on8i0evlzu74rtprrdzr',
    database: 'agencia_crm'
  });

  try {
    await client.connect();

    console.log('=== CONTAR DOCUMENTOS VAZIOS (últimos 30 dias) ===\n');
    const res1 = await client.query(`
      SELECT COUNT(*) as total_vazio
      FROM "Mensagem"
      WHERE "direcao" = 'ENTRADA'
      AND ("conteudo" IS NULL OR "conteudo" = '')
      AND "criadoEm" >= NOW() - INTERVAL '30 days'
    `);

    console.log(`TOTAL: ${res1.rows[0].total_vazio}\n`);

    console.log('=== EXEMPLOS (primeiras 5) ===\n');
    const res2 = await client.query(`
      SELECT
        m."criadoEm"::text as data,
        c."telefone",
        c."nome",
        e."nome" as empresa
      FROM "Mensagem" m
      JOIN "Conversa" c2 ON m."conversaId" = c2."id"
      JOIN "Cliente" c ON c2."clienteId" = c."id"
      JOIN "Empresa" e ON c."empresaId" = e."id"
      WHERE m."direcao" = 'ENTRADA'
      AND ("conteudo" IS NULL OR "conteudo" = '')
      AND m."criadoEm" >= NOW() - INTERVAL '30 days'
      ORDER BY m."criadoEm" DESC
      LIMIT 5
    `);

    res2.rows.forEach((row, i) => {
      console.log(`${i+1}. ${row.data}`);
      console.log(`   Cliente: ${row.nome || 'SEM NOME'} (${row.telefone})`);
      console.log(`   Empresa: ${row.empresa}\n`);
    });

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await client.end();
  }
}

run();
