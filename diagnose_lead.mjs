import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const telefone = "66992331664";

const lead = await prisma.lead.findFirst({
  where: {
    cliente: {
      telefone: { contains: telefone },
    },
  },
  include: {
    cliente: { select: { id: true, nome: true, telefone: true } },
    vendedor: { select: { id: true, nome: true, ativo: true } },
    empresa: { select: { id: true, nome: true } },
  },
});

if (!lead) {
  console.log("❌ Lead não encontrado com telefone:", telefone);
  process.exit(0);
}

console.log("=== DADOS DO LEAD ===");
console.log("Lead ID:", lead.id);
console.log("Cliente:", JSON.stringify(lead.cliente, null, 2));
console.log("Status:", lead.status);
console.log("Score:", lead.score);
console.log("Criado em:", lead.criadoEm);
console.log("Atualizado em:", lead.atualizadoEm);
console.log("Vendedor:", lead.vendedor);
console.log("Empresa:", lead.empresa);
console.log("\n=== OBSERVAÇÕES (flags) ===");
console.log(lead.observacoes || "[vazio]");
console.log("\n=== ÚLTIMA CONVERSA ===");
const conversa = await prisma.conversa.findFirst({
  where: { clienteId: lead.cliente.id },
  orderBy: { ultimaAtividade: "desc" },
  include: {
    mensagens: {
      orderBy: { criadoEm: "desc" },
      take: 1,
    },
  },
});

if (conversa) {
  console.log("Conversa ID:", conversa.id);
  console.log("Última atividade:", conversa.ultimaAtividade);
  console.log("Modo humano?", conversa.modoHumano);
  if (conversa.mensagens.length > 0) {
    const msg = conversa.mensagens[0];
    console.log("Última mensagem em:", msg.criadoEm);
    console.log("Direção:", msg.direcao);
  }
} else {
  console.log("[nenhuma conversa]");
}

console.log("\n=== VALORES PARA CÁLCULOS ===");
const now = new Date();
const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const h48 = new Date(now.getTime() - 48 * 60 * 60 * 1000);
const h72 = new Date(now.getTime() - 72 * 60 * 60 * 1000);
const d15 = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
const d60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
const d75 = new Date(now.getTime() - 75 * 24 * 60 * 60 * 1000);
const d90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

console.log("Agora:", now.toISOString());
console.log("h24:", h24.toISOString());
console.log("h48:", h48.toISOString());
console.log("h72:", h72.toISOString());
console.log("d15:", d15.toISOString());
console.log("d30:", d30.toISOString());
console.log("d60:", d60.toISOString());
console.log("d75:", d75.toISOString());
console.log("d90:", d90.toISOString());

console.log("\n=== COMPARAÇÃO COM CRITÉRIOS ===");
console.log("Lead atualizadoEm >= h72?", lead.atualizadoEm >= h72);
console.log("Lead atualizadoEm < h24?", lead.atualizadoEm < h24);
console.log("Lead atualizadoEm < h48?", lead.atualizadoEm < h48);
console.log("Lead atualizadoEm < d30?", lead.atualizadoEm < d30);
console.log("Lead atualizadoEm < d60?", lead.atualizadoEm < d60);
console.log("Lead atualizadoEm < d75?", lead.atualizadoEm < d75);
console.log("Lead atualizadoEm < d90?", lead.atualizadoEm < d90);

await prisma.$disconnect();
