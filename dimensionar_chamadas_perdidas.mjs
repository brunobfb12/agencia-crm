import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function dimensionar() {
  try {
    console.log("\n=== DIMENSIONAMENTO: CHAMADAS PERDIDAS ===\n");

    // Query 1: Total com [CHAMADA_PERDIDA
    console.log("[1] Total de Lead com [CHAMADA_PERDIDA");
    const total = await prisma.lead.count({
      where: {
        observacoes: { contains: "[CHAMADA_PERDIDA" }
      }
    });
    console.log(`    ✅ Total: ${total} leads\n`);

    // Query 2: Quebrados por status
    console.log("[2] Quebrados por status");
    const porStatus = await prisma.lead.groupBy({
      by: ["status"],
      where: {
        observacoes: { contains: "[CHAMADA_PERDIDA" }
      },
      _count: true,
      orderBy: { _count: { _all: 'desc' } }
    });
    porStatus.forEach(row => {
      console.log(`    ${row.status.padEnd(25)} : ${row._count}`);
    });
    console.log("");

    // Query 3: Quantos têm telefonePrincipal null
    console.log("[3] Com telefonePrincipal null");
    const countNull = await prisma.lead.count({
      where: {
        observacoes: { contains: "[CHAMADA_PERDIDA" },
        cliente: { telefonePrincipal: null }
      }
    });
    console.log(`    ✅ ${countNull} leads com telefonePrincipal null (clientes "mortos")\n`);

    // Query 4: Quantos têm telefone @lid
    console.log("[4] BONUS - Com telefone @lid");
    const countAtLid = await prisma.lead.count({
      where: {
        observacoes: { contains: "[CHAMADA_PERDIDA" },
        cliente: { telefone: { contains: "@lid" } }
      }
    });
    console.log(`    ✅ ${countAtLid} leads com cliente.telefone @lid\n`);

    // Query 5: Amostra
    console.log("[5] Amostra de 5 registros");
    const amostra = await prisma.lead.findMany({
      where: {
        observacoes: { contains: "[CHAMADA_PERDIDA" }
      },
      include: {
        cliente: { select: { id: true, telefone: true, telefonePrincipal: true, nome: true } }
      },
      take: 5
    });
    amostra.forEach((lead, i) => {
      console.log(`    [${i+1}] Status: ${lead.status.padEnd(20)} | Tel: ${lead.cliente.telefone.padEnd(25)} | Principal: ${lead.cliente.telefonePrincipal || 'NULL'}`);
    });

    console.log("\n=== FIM ===\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ ERRO:", error.message);
    process.exit(1);
  }
}

dimensionar();
