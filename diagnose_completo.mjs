import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const leadId = "cmtbjhe6x000fjkt4nziaz5m5";

// Buscar lead completo
const lead = await prisma.lead.findUnique({
  where: { id: leadId },
  include: {
    cliente: { select: { id: true, nome: true, telefone: true, dataNascimento: true } },
    vendedor: { select: { id: true, nome: true, ativo: true } },
    empresa: { select: { id: true, nome: true, ativa: true } },
  },
});

if (!lead) {
  console.log("Lead não encontrado");
  process.exit(1);
}

const now = new Date();
const h2 = new Date(now.getTime() - 2 * 60 * 60 * 1000);
const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const h48 = new Date(now.getTime() - 48 * 60 * 60 * 1000);
const h72 = new Date(now.getTime() - 72 * 60 * 60 * 1000);
const d15 = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
const d60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
const d75 = new Date(now.getTime() - 75 * 24 * 60 * 60 * 1000);
const d90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

// Buscar conversa para LD0
const conversa = await prisma.conversa.findFirst({
  where: { clienteId: lead.clienteId },
  include: {
    mensagens: { orderBy: { criadoEm: "desc" }, take: 1 },
  },
});

const ultimaMensagem = conversa?.mensagens?.[0];
const ultimaAtividadeConversa = conversa?.ultimaAtividade;
const modoHumano = conversa?.modoHumano;

console.log("╔════════════════════════════════════════════════════════════════╗");
console.log("║                      DADOS DO LEAD                             ║");
console.log("╚════════════════════════════════════════════════════════════════╝\n");

console.log("Lead ID:           ", lead.id);
console.log("Cliente:           ", lead.cliente.nome, `(${lead.cliente.telefone})`);
console.log("Status:            ", lead.status);
console.log("Score:             ", lead.score);
console.log("Criado em:         ", lead.criadoEm.toISOString());
console.log("Atualizado em:     ", lead.atualizadoEm.toISOString());
console.log("Vendedor:          ", lead.vendedor?.nome, `(ativo: ${lead.vendedor?.ativo})`);
console.log("Empresa:           ", lead.empresa.nome, `(ativa: ${lead.empresa.ativa})`);
console.log("\nÚltima atividade:  ", ultimaAtividadeConversa?.toISOString());
console.log("Modo humano:       ", modoHumano);
console.log("Última mensagem:   ", ultimaMensagem?.criadoEm.toISOString());

console.log("\n" + "═".repeat(70));
console.log("OBSERVAÇÕES (FLAGS):");
console.log("═".repeat(70));
console.log(lead.observacoes || "[vazio]");

console.log("\n" + "═".repeat(70));
console.log("ANÁLISE DE CRITÉRIOS DE CADÊNCIA");
console.log("═".repeat(70) + "\n");

const obs = lead.observacoes || "";
const criteria = {
  "T1": {
    descricao: "LEAD parado 24-48h",
    condicoes: [
      `status = "LEAD"`,
      `atualizadoEm >= h48 (${lead.atualizadoEm >= h48})`,
      `atualizadoEm < h24 (${lead.atualizadoEm < h24})`,
    ],
    passou: lead.status === "LEAD" && lead.atualizadoEm >= h48 && lead.atualizadoEm < h24,
    processado: obs.includes("[T1]"),
  },
  "T2": {
    descricao: "LEAD parado 48-72h (sem [T1])",
    condicoes: [
      `status = "LEAD"`,
      `atualizadoEm >= h72 (${lead.atualizadoEm >= h72})`,
      `atualizadoEm < h48 (${lead.atualizadoEm < h48})`,
      `!includes "[T1]" (${!obs.includes("[T1]")})`,
    ],
    passou: lead.status === "LEAD" && lead.atualizadoEm >= h72 && lead.atualizadoEm < h48 && !obs.includes("[T1]"),
    processado: obs.includes("[T2]"),
  },
  "T3": {
    descricao: "LEAD ou AQUECIMENTO parado 72-96h",
    condicoes: [
      `status in ["LEAD", "AQUECIMENTO"] (${["LEAD", "AQUECIMENTO"].includes(lead.status)})`,
      `atualizadoEm < h72 (${lead.atualizadoEm < h72})`,
    ],
    passou: ["LEAD", "AQUECIMENTO"].includes(lead.status) && lead.atualizadoEm < h72,
    processado: obs.includes("[T3]"),
  },
  "T4": {
    descricao: "LEAD parado 96-120h (sem [T1]/[T2])",
    condicoes: [
      `status = "LEAD"`,
      `atualizadoEm < h72 (${lead.atualizadoEm < h72})`,
      `!includes "[T1]" && !includes "[T2]" (${!obs.includes("[T1]") && !obs.includes("[T2]")})`,
    ],
    passou: lead.status === "LEAD" && lead.atualizadoEm < h72 && !obs.includes("[T1]") && !obs.includes("[T2]"),
    processado: obs.includes("[T4]"),
  },
  "T5": {
    descricao: "LEAD parado 120h+ (sem flags anteriores)",
    condicoes: [
      `status = "LEAD"`,
      `atualizadoEm < h72 (${lead.atualizadoEm < h72})`,
      `sem flags T1-T4 (${!obs.includes("[T1]") && !obs.includes("[T2]") && !obs.includes("[T3]") && !obs.includes("[T4]")})`,
    ],
    passou: lead.status === "LEAD" && lead.atualizadoEm < h72 && !obs.includes("[T1]") && !obs.includes("[T2]") && !obs.includes("[T3]") && !obs.includes("[T4]"),
    processado: obs.includes("[T5]"),
  },
  "LD0": {
    descricao: "AQUECIMENTO 0-2h, horário comercial, sem [LD0]",
    condicoes: [
      `status = "AQUECIMENTO"`,
      `!includes "[LD0]" (${!obs.includes("[LD0]")})`,
      `ultimaAtividadeConversa >= h2 (${ultimaAtividadeConversa >= h2})`,
    ],
    passou: lead.status === "AQUECIMENTO" && !obs.includes("[LD0]") && ultimaAtividadeConversa >= h2,
    processado: obs.includes("[LD0]"),
  },
  "PC1": {
    descricao: "PRONTO_PARA_COMPRAR 0-1d, sem [PC1]",
    condicoes: [
      `status = "PRONTO_PARA_COMPRAR"`,
      `atualizadoEm >= h24 (${lead.atualizadoEm >= h24})`,
      `!includes "[PC1]" (${!obs.includes("[PC1]")})`,
    ],
    passou: lead.status === "PRONTO_PARA_COMPRAR" && lead.atualizadoEm >= h24 && !obs.includes("[PC1]"),
    processado: obs.includes("[PC1]"),
  },
  "aqQuentes": {
    descricao: "AQUECIMENTO + (score >= 6 OU confirmado)",
    condicoes: [
      `status = "AQUECIMENTO"`,
      `score >= 6 (${lead.score >= 6}) OU includes "CONFIRMADO" (${obs.includes("CONFIRMADO")})`,
    ],
    passou: lead.status === "AQUECIMENTO" && (lead.score >= 6 || obs.includes("CONFIRMADO")),
    processado: obs.includes("[PVA]"),
  },
  "aquecimentoParaProto": {
    descricao: "AQUECIMENTO + confirmado + score >= 6 + parado 72-48h",
    condicoes: [
      `status = "AQUECIMENTO"`,
      `score >= 6 (${lead.score >= 6})`,
      `includes "CONFIRMADO" (${obs.includes("CONFIRMADO")})`,
      `atualizadoEm >= h72 (${lead.atualizadoEm >= h72})`,
      `atualizadoEm < h48 (${lead.atualizadoEm < h48})`,
    ],
    passou: lead.status === "AQUECIMENTO" && lead.score >= 6 && obs.includes("CONFIRMADO") && lead.atualizadoEm >= h72 && lead.atualizadoEm < h48,
    processado: obs.includes("[P2_AUTO_PRONTO]"),
  },
  "aquecimentoSemResposta": {
    descricao: "AQUECIMENTO parado 72h+",
    condicoes: [
      `status = "AQUECIMENTO"`,
      `atualizadoEm < h72 (${lead.atualizadoEm < h72})`,
    ],
    passou: lead.status === "AQUECIMENTO" && lead.atualizadoEm < h72,
    processado: obs.includes("[AQUE_SEM_RESPOSTA]"),
  },
};

for (const [key, data] of Object.entries(criteria)) {
  console.log(`\n${key.toUpperCase()}: ${data.descricao}`);
  console.log("-".repeat(65));
  data.condicoes.forEach(c => console.log(`  ✓ ${c}`));
  console.log(`  → SE PASSAR: ${data.passou ? "✅ SIM" : "❌ NÃO"}`);
  console.log(`  → JÁ PROCESSADO: ${data.processado ? "✅ SIM ([flag] encontrada)" : "❌ NÃO"}`);
}

await prisma.$disconnect();
