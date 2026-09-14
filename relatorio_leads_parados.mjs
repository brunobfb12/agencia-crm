import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const now = new Date();
const h24ago = new Date(now.getTime() - 24 * 60 * 60 * 1000);

console.log(`Executado em: ${now.toISOString()}`);
console.log(`Critério: atualizadoEm < ${h24ago.toISOString()} (parado > 24h)\n`);
console.log("═".repeat(120) + "\n");

// Buscar leads parados
const leads = await prisma.lead.findMany({
  where: {
    status: { in: ["LEAD", "AQUECIMENTO", "PRONTO_PARA_COMPRAR"] },
    atualizadoEm: { lt: h24ago },
  },
  include: {
    cliente: { select: { nome: true, telefone: true } },
    empresa: { select: { nome: true } },
    vendedor: { select: { nome: true, ativo: true } },
  },
  orderBy: { atualizadoEm: "asc" },
});

// Função para extrair flags de observações
function extrairFlags(obs) {
  if (!obs) return [];
  const flags = obs.match(/\[([A-Z0-9_]+)\]/g) || [];
  return flags.map(f => f.replace(/\[|\]/g, ""));
}

// Função para calcular dias parado
function diasParado(data) {
  const diff = now.getTime() - data.getTime();
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  return dias;
}

// Agrupar por status
const porStatus = {
  LEAD: [],
  AQUECIMENTO: [],
  PRONTO_PARA_COMPRAR: [],
};

for (const lead of leads) {
  const info = {
    id: lead.id,
    cliente: lead.cliente.nome,
    telefone: lead.cliente.telefone,
    empresa: lead.empresa.nome,
    status: lead.status,
    vendedor: lead.vendedor ? `${lead.vendedor.nome} (${lead.vendedor.ativo ? "ativo" : "INATIVO"})` : "[sem vendedor]",
    vendedorInativo: lead.vendedor && !lead.vendedor.ativo,
    score: lead.score,
    diasParado: diasParado(lead.atualizadoEm),
    atualizadoEm: lead.atualizadoEm.toISOString(),
    flags: extrairFlags(lead.observacoes),
  };
  porStatus[lead.status].push(info);
}

// Exibir por status
for (const [status, leadsDoStatus] of Object.entries(porStatus)) {
  if (leadsDoStatus.length === 0) {
    console.log(`\n[${status}] — 0 leads parados\n`);
    continue;
  }

  console.log(`\n${"═".repeat(120)}`);
  console.log(`[${status}] — ${leadsDoStatus.length} lead(s) parado(s)`);
  console.log(`${"═".repeat(120)}\n`);

  for (const lead of leadsDoStatus) {
    console.log(`ID:                 ${lead.id}`);
    console.log(`Cliente:            ${lead.cliente}`);
    console.log(`Telefone:           ${lead.telefone}`);
    console.log(`Empresa:            ${lead.empresa}`);
    console.log(`Vendedor:           ${lead.vendedor}`);
    console.log(`Score:              ${lead.score}`);
    console.log(`Dias parado:        ${lead.diasParado}d`);
    console.log(`Última atividade:   ${lead.atualizadoEm}`);
    console.log(`Flags presentes:    ${lead.flags.length > 0 ? lead.flags.join(", ") : "[nenhuma]"}`);
    console.log("-".repeat(120) + "\n");
  }
}

// Resumo final
console.log("\n" + "═".repeat(120));
console.log("RESUMO");
console.log("═".repeat(120) + "\n");

const totalPorStatus = {
  LEAD: porStatus.LEAD.length,
  AQUECIMENTO: porStatus.AQUECIMENTO.length,
  PRONTO_PARA_COMPRAR: porStatus.PRONTO_PARA_COMPRAR.length,
};

const totalGeral = Object.values(totalPorStatus).reduce((a, b) => a + b, 0);

console.log(`Total de leads parados:\n`);
console.log(`  LEAD:                  ${totalPorStatus.LEAD}`);
console.log(`  AQUECIMENTO:           ${totalPorStatus.AQUECIMENTO}`);
console.log(`  PRONTO_PARA_COMPRAR:   ${totalPorStatus.PRONTO_PARA_COMPRAR}`);
console.log(`  ─────────────────────────`);
console.log(`  TOTAL:                 ${totalGeral}\n`);

// Contar vendedores inativos
const comVendedorInativo = leads.filter(l => l.vendedor && !l.vendedor.ativo);
console.log(`Leads com vendedor INATIVO:\n`);
if (comVendedorInativo.length === 0) {
  console.log(`  ✅ Nenhum lead com vendedor inativo\n`);
} else {
  console.log(`  ⚠️  ${comVendedorInativo.length} lead(s) com vendedor inativo:\n`);
  for (const lead of comVendedorInativo) {
    console.log(`     - ${lead.cliente.nome} (${lead.status}) → ${lead.vendedor.nome} [INATIVO]`);
  }
  console.log();
}

await prisma.$disconnect();
