import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const now = new Date();

// Definir timewindows (igual ao route.ts)
const windowStart = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
const windowEnd = (days) => new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
const d60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
const d90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
const todayEnd = new Date(now);
todayEnd.setHours(23, 59, 59, 999);

console.log("[CONTAGEM DE RISCO] Executado em " + now.toISOString() + "\n");

// Helper para reportar resultados
async function reportarCadencia(nome, whereClause, selectFields = {}) {
  try {
    const leads = await prisma.lead.findMany({
      where: whereClause,
      select: {
        id: true,
        criadoEm: true,
        atualizadoEm: true,
        cliente: { select: { nome: true } },
        ...selectFields
      },
      orderBy: { atualizadoEm: "asc" },
      take: 3
    });

    const total = await prisma.lead.count({ where: whereClause });

    console.log("[" + nome + "]");
    console.log("  Total elegível: " + total);
    console.log("  3 mais antigos (por atualizadoEm):");
    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      console.log("    " + (i+1) + ". ID: " + lead.id);
      console.log("       Cliente: " + (lead.cliente?.nome || "SEM NOME"));
      console.log("       atualizadoEm: " + lead.atualizadoEm.toISOString());
    }
    console.log();
  } catch (e) {
    console.log("[" + nome + "] ERRO: " + e.message + "\n");
  }
}

// 1. posVenda - status VENDA_REALIZADA, atualizadoEm window(2)
await reportarCadencia("POS_VENDA", {
  status: "VENDA_REALIZADA",
  atualizadoEm: { gte: windowStart(2), lt: windowEnd(2) },
  empresa: { ativa: true },
  cliente: { telefone: { not: "" } }
});

// 2. reativacao15d - status FOLLOW_UP, dataRecontato null, atualizadoEm window(15)
await reportarCadencia("REATIVACAO_15D", {
  status: "FOLLOW_UP",
  dataRecontato: null,
  atualizadoEm: { gte: windowStart(15), lt: windowEnd(15) },
  empresa: { ativa: true },
  cliente: { telefone: { not: "" } }
});

// 3. reativacao30d - status FOLLOW_UP, dataRecontato null, atualizadoEm window(30)
await reportarCadencia("REATIVACAO_30D", {
  status: "FOLLOW_UP",
  dataRecontato: null,
  atualizadoEm: { gte: windowStart(30), lt: windowEnd(30) },
  empresa: { ativa: true },
  cliente: { telefone: { not: "" } }
});

// 4. reativacao90d - status SEM_INTERESSE, atualizadoEm < d90
await reportarCadencia("REATIVACAO_90D", {
  status: "SEM_INTERESSE",
  atualizadoEm: { lt: d90 },
  empresa: { ativa: true },
  cliente: { telefone: { not: "" } }
});

// 5. recontatos - dataRecontato lte todayEnd
await reportarCadencia("RECONTATOS", {
  status: { notIn: ["PERDIDO", "SEM_INTERESSE", "SEM_RESPOSTA", "VENDA_REALIZADA", "POS_VENDA", "AGENDADO", "NEGOCIACAO"] },
  dataRecontato: { lte: todayEnd },
  empresa: { ativa: true },
  cliente: { telefone: { not: "" } }
});

// 6. aniversarios - qualquer status exceto PERDIDO/SEM_INTERESSE/SEM_RESPOSTA, dataNascimento set
await reportarCadencia("ANIVERSARIOS", {
  status: { notIn: ["PERDIDO", "SEM_INTERESSE", "SEM_RESPOSTA"] },
  empresa: { ativa: true },
  cliente: { dataNascimento: { not: null }, telefone: { not: "" } }
});

// 7. semResposta60d (conversa franca) - status SEM_RESPOSTA, atualizadoEm < d60
await reportarCadencia("CONVERSA_FRANCA_60D", {
  status: "SEM_RESPOSTA",
  atualizadoEm: { lt: d60 },
  empresa: { ativa: true },
  cliente: { telefone: { not: "" } }
});

// 8. prontoConversa - status NEGOCIACAO
await reportarCadencia("PRONTO_CONVERSA_FRANCA", {
  status: "NEGOCIACAO",
  empresa: { ativa: true },
  cliente: { telefone: { not: "" } }
});

// 9. noShowLeads - status AGENDADO, dataVendaProvavel < agora
await reportarCadencia("NOSHOW_LEADS", {
  status: "AGENDADO",
  dataVendaProvavel: { lt: now },
  empresa: { ativa: true },
  cliente: { telefone: { not: "" } }
});

console.log("[RESUMO] Contagem completa");
await prisma.$disconnect();
