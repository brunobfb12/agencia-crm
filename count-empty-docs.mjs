import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function run() {
  try {
    console.log('=== CONTANDO MENSAGENS VAZIAS (últimos 30 dias) ===\n');

    const sql = `
SELECT COUNT(*) as total
FROM "Mensagem"
WHERE "direcao" = 'ENTRADA'
AND ("conteudo" IS NULL OR "conteudo" = '')
AND "criadoEm" >= NOW() - INTERVAL '30 days';
`.trim();

    // Copiar script para container e executar via psql
    const cmd = `ssh root@201.76.43.149 "docker exec $(docker ps -q --filter 'name=crm') env PGPASSWORD=on8i0evlzu74rtprrdzr psql -h localhost -U postgres -d agencia_crm -c \\"${sql.replace(/"/g, '\\"')}\\"" 2>&1`;

    console.log('Executando SQL...\n');
    const { stdout, stderr } = await execAsync(cmd);

    if (stderr && !stderr.includes('WARNING')) {
      console.error('Erro:', stderr);
      process.exit(1);
    }

    console.log(stdout);

    // Agora pedir exemplos
    console.log('\n=== EXEMPLOS (primeiras 5) ===\n');
    const sqlExamples = `
SELECT
  m."id",
  m."criadoEm"::text,
  c."telefone",
  c."nome",
  e."nome" as empresa,
  m."conteudo"
FROM "Mensagem" m
JOIN "Conversa" c2 ON m."conversaId" = c2."id"
JOIN "Cliente" c ON c2."clienteId" = c."id"
JOIN "Empresa" e ON c."empresaId" = e."id"
WHERE m."direcao" = 'ENTRADA'
AND (m."conteudo" IS NULL OR m."conteudo" = '')
AND m."criadoEm" >= NOW() - INTERVAL '30 days'
ORDER BY m."criadoEm" DESC
LIMIT 5;
`.trim();

    const cmd2 = `ssh root@201.76.43.149 "docker exec $(docker ps -q --filter 'name=crm') env PGPASSWORD=on8i0evlzu74rtprrdzr psql -h localhost -U postgres -d agencia_crm -c \\"${sqlExamples.replace(/"/g, '\\"')}\\"" 2>&1`;

    const { stdout: stdoutEx } = await execAsync(cmd2);
    console.log(stdoutEx);

  } catch (error) {
    console.error('Erro ao executar:', error.message);
    process.exit(1);
  }
}

run();
