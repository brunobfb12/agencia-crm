import pg from 'pg';

const { Client } = pg;

async function run() {
  const client = new Client({
    host: '201.76.43.149',
    port: 5432,
    user: 'postgres',
    password: 'on8i0evlzu74rtprrdzr',
    database: 'agencia_crm',
    connectionTimeoutMillis: 5000
  });

  try {
    console.log('Conectando ao banco...');
    await client.connect();
    console.log('✓ Conectado!\n');

    // Query 1: Contar documentos vazios
    console.log('=== CONTANDO DOCUMENTOS VAZIOS (últimos 30 dias) ===\n');
    const res1 = await client.query(`
      SELECT COUNT(*) as total_vazio
      FROM "Mensagem"
      WHERE "direcao" = 'ENTRADA'
      AND ("conteudo" IS NULL OR "conteudo" = '')
      AND "criadoEm" >= NOW() - INTERVAL '30 days'
    `);

    console.log(`Total de mensagens ENTRADA vazias/nulas: ${res1.rows[0].total_vazio}\n`);

    // Query 2: Exemplos com contexto
    console.log('=== EXEMPLOS (primeiras 5) ===\n');
    const res2 = await client.query(`
      SELECT
        m."criadoEm"::text as data,
        c."telefone",
        c."nome",
        e."nome" as empresa,
        COALESCE(LENGTH(m."conteudo"), 0) as tamanho_conteudo,
        CASE
          WHEN m."conteudo" IS NULL THEN 'NULL'
          WHEN m."conteudo" = '' THEN 'VAZIO'
          ELSE 'OUTRO'
        END as tipo_vazio
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

    if (res2.rows.length === 0) {
      console.log('Nenhum exemplo encontrado.');
    } else {
      console.log(`${' '.repeat(19)} | TELEFONE      | NOME                | EMPRESA         | TAM | TIPO`);
      console.log('-'.repeat(100));
      res2.rows.forEach((row, i) => {
        const data = new Date(row.data).toLocaleDateString('pt-BR');
        const telefone = (row.telefone || '').substring(0, 13);
        const nome = (row.nome || 'SEM NOME').substring(0, 18);
        const empresa = (row.empresa || '?').substring(0, 15);
        console.log(`${i+1}. ${data} | ${telefone.padEnd(14)} | ${nome.padEnd(18)} | ${empresa.padEnd(15)} | ${row.tamanho_conteudo} | ${row.tipo_vazio}`);
      });
    }

    // Query 3: Contar por tipo_vazio
    console.log('\n=== DISTRIBUIÇÃO ===\n');
    const res3 = await client.query(`
      SELECT
        CASE
          WHEN "conteudo" IS NULL THEN 'NULL'
          WHEN "conteudo" = '' THEN 'VAZIO'
          ELSE 'OUTRO'
        END as tipo,
        COUNT(*) as qtd
      FROM "Mensagem"
      WHERE "direcao" = 'ENTRADA'
      AND ("conteudo" IS NULL OR "conteudo" = '')
      AND "criadoEm" >= NOW() - INTERVAL '30 days'
      GROUP BY tipo
      ORDER BY qtd DESC
    `);

    res3.rows.forEach(row => {
      console.log(`${row.tipo}: ${row.qtd}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

run();
