import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const cutoffDate = new Date("2026-09-01T03:00:00.000Z");

console.log("[AUDIT V2] Marcação SEM_INTERESSE com ajustes");
console.log("[AUDIT] Data limite: " + cutoffDate.toISOString() + "\n");

// ===== AJUSTE 1: Excluir ORCAMENTO_ENVIADO e POS_VENDA =====
console.log("[AJUSTE 1] Excluindo ORCAMENTO_ENVIADO (28) e POS_VENDA (10)\n");

const leadsAntigos = await prisma.lead.findMany({
  where: {
    atualizadoEm: { lt: cutoffDate },
    status: { notIn: ["VENDA_REALIZADA", "PERDIDO", "SEM_INTERESSE", "ORCAMENTO_ENVIADO", "POS_VENDA"] }
  },
  select: {
    id: true,
    status: true,
    atualizadoEm: true,
    clienteId: true,
    vendedorId: true,
    observacoes: true
  }
});

console.log("Total leads após exclusão de ORCAMENTO_ENVIADO e POS_VENDA: " + leadsAntigos.length + "\n");

const porStatus = {};
for (const lead of leadsAntigos) {
  if (!porStatus[lead.status]) porStatus[lead.status] = 0;
  porStatus[lead.status]++;
}

console.log("Breakdown por status:");
for (const [status, count] of Object.entries(porStatus)) {
  console.log("  " + status + ": " + count);
}

// ===== AJUSTE 2: Verificar histórico de venda =====
console.log("\n[AJUSTE 2] Procurando leads com histórico de venda\n");

// Procurar por:
// 1. Vendas registradas
// 2. Observações com flags de fechamento
const vendas = await prisma.venda.findMany({
  where: {
    leadId: { in: leadsAntigos.map(l => l.id) }
  },
  select: { leadId: true }
});

const vendasSet = new Set(vendas.map(v => v.leadId));

const flagsVenda = ["[VENDA", "[fechado", "[VENDIDO", "[comprou"];
let leadsComFlagVenda = 0;

for (const lead of leadsAntigos) {
  if (lead.observacoes) {
    for (const flag of flagsVenda) {
      if (lead.observacoes.includes(flag)) {
        leadsComFlagVenda++;
        vendasSet.add(lead.id);
        break;
      }
    }
  }
}

console.log("Leads com Venda registrada: " + vendas.length);
console.log("Leads com flags de venda em observações: " + leadsComFlagVenda);
console.log("Total com histórico de venda: " + vendasSet.size);

// ===== AJUSTE 3: Contagem final =====
console.log("\n[AJUSTE 3] Contagem final após todos os ajustes\n");

const leadsParaMarcacao = leadsAntigos.filter(l => !vendasSet.has(l.id));

console.log("Leads antigos (filtro ajustado): " + leadsAntigos.length);
console.log("Menos: COM histórico de venda: -" + vendasSet.size);
console.log("────────────────────────────");
console.log("TOTAL A MARCAR: " + leadsParaMarcacao.length);

console.log("\nComparação com expectativa:");
console.log("  SEM_RESPOSTA (726) + FOLLOW_UP (21) + NEGOCIACAO (9) = 756");
console.log("  Menos leads com venda = ~" + leadsParaMarcacao.length + " ✓");

// ===== 10 mais recentes do grupo final =====
console.log("\n[FINAL] 10 mais recentes a marcar\n");

const final10 = await prisma.lead.findMany({
  where: {
    id: { in: leadsParaMarcacao.map(l => l.id) }
  },
  include: {
    cliente: { select: { nome: true } },
    vendedor: { select: { nome: true } }
  },
  orderBy: { atualizadoEm: "desc" },
  take: 10
});

for (let i = 0; i < final10.length; i++) {
  const lead = final10[i];
  console.log("[" + (i+1) + "]");
  console.log("  Cliente: " + lead.cliente.nome);
  console.log("  Status: " + lead.status);
  console.log("  Última atividade: " + lead.atualizadoEm.toISOString());
  console.log("  Vendedor: " + (lead.vendedor?.nome || "SEM VENDEDOR"));
  console.log();
}

// ===== Resumo final =====
console.log("[RESUMO FINAL]\n");
console.log("Registros FINAIS a marcar como SEM_INTERESSE: " + leadsParaMarcacao.length);
console.log("Leads preservados (COM venda): " + vendasSet.size);
console.log("Limpeza do funil: " + ((leadsParaMarcacao.length / leadsAntigos.length) * 100).toFixed(1) + "%");

await prisma.$disconnect();
