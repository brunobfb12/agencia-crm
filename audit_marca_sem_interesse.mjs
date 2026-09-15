import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const cutoffDate = new Date("2026-09-01T03:00:00.000Z");

console.log("[AUDIT] Marcação SEM_INTERESSE para leads antigos");
console.log("[AUDIT] Data limite: " + cutoffDate.toISOString() + " (meia-noite BRT de 1º de setembro)");
console.log("[AUDIT] Condição: atualizadoEm < " + cutoffDate.toISOString() + " E status NOT IN [VENDA_REALIZADA, PERDIDO, SEM_INTERESSE]\n");

// ===== PARTE 1: Contar por status =====
console.log("[PARTE 1] Leads antigos por status (antes de exclusões)\n");

const leadsAntigos = await prisma.lead.findMany({
  where: {
    atualizadoEm: { lt: cutoffDate },
    status: { notIn: ["VENDA_REALIZADA", "PERDIDO", "SEM_INTERESSE"] }
  },
  select: { id: true, status: true, atualizadoEm: true, clienteId: true, vendedorId: true }
});

console.log("Total leads antigos (critério acima): " + leadsAntigos.length + "\n");

const porStatus = {};
for (const lead of leadsAntigos) {
  if (!porStatus[lead.status]) porStatus[lead.status] = 0;
  porStatus[lead.status]++;
}

for (const [status, count] of Object.entries(porStatus)) {
  console.log("  " + status + ": " + count);
}

// ===== PARTE 2: Quantos têm Venda? =====
console.log("\n[PARTE 2] Dos leads antigos acima, quantos têm Venda registrada?\n");

const leadsAntIdsWithoutVendas = [];
const leadsAntIdsWithVendas = [];

// Query vendas desses leads
const vendasDoLeads = await prisma.venda.findMany({
  where: {
    leadId: { in: leadsAntigos.map(l => l.id) }
  },
  select: { leadId: true }
});

const vendasSet = new Set(vendasDoLeads.map(v => v.leadId));

for (const lead of leadsAntigos) {
  if (vendasSet.has(lead.id)) {
    leadsAntIdsWithVendas.push(lead.id);
  } else {
    leadsAntIdsWithoutVendas.push(lead.id);
  }
}

console.log("Leads antigos COM Venda: " + leadsAntIdsWithVendas.length);
console.log("Leads antigos SEM Venda: " + leadsAntIdsWithoutVendas.length);
console.log("→ Serão marcados como SEM_INTERESSE: " + leadsAntIdsWithoutVendas.length + "\n");

// ===== PARTE 3: 10 mais recentes do grupo a ser marcado =====
console.log("[PARTE 3] 10 mais recentes do grupo a ser marcado (SEM Venda)\n");

const leadsParaMarcacao = await prisma.lead.findMany({
  where: {
    id: { in: leadsAntIdsWithoutVendas }
  },
  include: {
    cliente: { select: { nome: true } },
    vendedor: { select: { nome: true } }
  },
  orderBy: { atualizadoEm: "desc" },
  take: 10
});

for (let i = 0; i < leadsParaMarcacao.length; i++) {
  const lead = leadsParaMarcacao[i];
  console.log("[" + (i+1) + "]");
  console.log("  Cliente: " + lead.cliente.nome);
  console.log("  Status: " + lead.status);
  console.log("  Última atividade: " + lead.atualizadoEm.toISOString());
  console.log("  Vendedor: " + (lead.vendedor?.nome || "SEM VENDEDOR"));
  console.log();
}

// ===== PARTE 4: Prepare o UPDATE =====
console.log("[PARTE 4] UPDATE que seria executado\n");

console.log("```typescript");
console.log("await prisma.lead.updateMany({");
console.log("  where: {");
console.log("    id: { in: [");
console.log("      // " + leadsAntIdsWithoutVendas.length + " leads (IDs omitidos)");
console.log("    ] }");
console.log("  },");
console.log("  data: {");
console.log("    status: 'SEM_INTERESSE'");
console.log("  }");
console.log("});");
console.log("```");
console.log();
console.log("[RESUMO DO UPDATE]");
console.log("Registros a serem afetados: " + leadsAntIdsWithoutVendas.length);
console.log("Todos os afetados receberiam status=SEM_INTERESSE");
console.log("Critério: atualizadoEm < 2026-09-01T03:00:00Z E SEM Venda registrada");

// Verificação adicional
console.log("\n[VERIFICAÇÃO ADICIONAL]");
console.log("Leads antigos COM Venda (serão PRESERVADOS): " + leadsAntIdsWithVendas.length);
console.log("  - Esses permanecem no funil para recompra e follow-up");

await prisma.$disconnect();
