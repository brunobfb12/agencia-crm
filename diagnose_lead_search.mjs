import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const telefone = "66992331664";
const telefoneFormatado = "(66) 99233-1664";
const telefoneLimpo = telefone.replace(/\D/g, "");

console.log("=== BUSCANDO CLIENTE ===");
console.log("Procurando por:", telefone);
console.log("Telefone formatado:", telefoneFormatado);
console.log("Telefone limpo:", telefoneLimpo);

// Tenta várias formas
const cliente1 = await prisma.cliente.findFirst({
  where: { telefone: { contains: telefone } },
  select: { id: true, nome: true, telefone: true },
});

const cliente2 = await prisma.cliente.findFirst({
  where: { telefone: telefone },
  select: { id: true, nome: true, telefone: true },
});

const cliente3 = await prisma.cliente.findFirst({
  where: { telefone: { contains: telefoneLimpo } },
  select: { id: true, nome: true, telefone: true },
});

console.log("\nResultado contains:", cliente1);
console.log("Resultado exact:", cliente2);
console.log("Resultado contains limpo:", cliente3);

// Se encontrou, lista leads desse cliente
const cliente = cliente1 || cliente2 || cliente3;
if (cliente) {
  console.log("\n=== LEADS DO CLIENTE ===");
  const leads = await prisma.lead.findMany({
    where: { clienteId: cliente.id },
    select: {
      id: true,
      status: true,
      score: true,
      criadoEm: true,
      atualizadoEm: true,
      vendedorId: true,
      observacoes: true,
    },
  });
  console.log(JSON.stringify(leads, null, 2));
} else {
  console.log("\n❌ Cliente não encontrado em nenhuma variação");
  // Lista primeiros 5 clientes para debug
  const clientes = await prisma.cliente.findMany({
    take: 5,
    select: { id: true, nome: true, telefone: true },
  });
  console.log("\nPrimeiros 5 clientes no banco:");
  console.log(JSON.stringify(clientes, null, 2));
}

await prisma.$disconnect();
