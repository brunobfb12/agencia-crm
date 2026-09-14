import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

console.log("=== PROCURANDO CLIENTES COM 'MENDONCA' ===\n");

const clientes = await prisma.cliente.findMany({
  where: {
    nome: { contains: "Mendonca", mode: "insensitive" },
  },
  include: {
    leads: {
      select: {
        id: true,
        status: true,
        score: true,
        criadoEm: true,
        atualizadoEm: true,
        vendedorId: true,
        observacoes: true,
      },
    },
  },
});

console.log(`Encontrados ${clientes.length} cliente(s):\n`);

for (const cliente of clientes) {
  console.log("=".repeat(80));
  console.log(`CLIENTE: ${cliente.nome}`);
  console.log(`ID: ${cliente.id}`);
  console.log(`Telefone: ${cliente.telefone}`);
  console.log(`Leads: ${cliente.leads.length}`);

  if (cliente.leads.length > 0) {
    console.log("\n  LEADS:");
    for (const lead of cliente.leads) {
      console.log(`\n  - ID: ${lead.id}`);
      console.log(`    Status: ${lead.status}`);
      console.log(`    Score: ${lead.score}`);
      console.log(`    Criado em: ${lead.criadoEm}`);
      console.log(`    Atualizado em: ${lead.atualizadoEm}`);
      console.log(`    Vendedor ID: ${lead.vendedorId}`);
      console.log(`    Observações:\n${lead.observacoes || "[vazio]"}`);
    }
  }
  console.log("\n");
}

await prisma.$disconnect();
