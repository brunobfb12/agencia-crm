import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const now = new Date();
const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
const d90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

console.log("[AUDIT] Período 7 dias: " + d7.toISOString() + " até " + now.toISOString());
console.log("[AUDIT] Período 90 dias: " + d90.toISOString() + " até " + now.toISOString() + "\n");

// Templates conhecidos do código para identificar tipos de cadência
const templates = {
  conversa_franca_60d: "ainda há interesse",
  pronto_conversa_franca: "transparente",
  reativacao_15d: "Reativação",
  reativacao_30d: "30 dias",
  reativacao_90d: "Reativação",
  pos_venda: "compra realizada",
  aniversario: "aniversário",
  recontato_agendado: "agendado",
  noshow_reagendar: "confirmar",
};

// ===== PARTE 1: Conversa Franca últimos 7 dias =====
console.log("[PARTE 1] CONVERSA FRANCA - Últimos 7 dias");
console.log("=".repeat(80) + "\n");

const mensagens7d = await prisma.mensagem.findMany({
  where: {
    direcao: "SAIDA",
    criadoEm: { gte: d7 }
  },
  include: {
    conversa: {
      include: {
        cliente: {
          include: {
            leads: {
              orderBy: { atualizadoEm: "desc" },
              take: 1
            }
          }
        }
      }
    }
  },
  orderBy: { criadoEm: "desc" }
});

let conversaFrancaCount = 0;
const conversaFrancaData = [];

for (const msg of mensagens7d) {
  const conteudo = msg.conteudo.toLowerCase();
  let isConversaFranca = false;

  // Detectar conversa franca
  if (conteudo.includes("ainda há interesse") ||
      conteudo.includes("transparente") ||
      conteudo.includes("pedido em andamento")) {
    isConversaFranca = true;
  }

  if (isConversaFranca) {
    conversaFrancaCount++;
    const cliente = msg.conversa.cliente;
    const lead = cliente.leads?.[0];

    conversaFrancaData.push({
      nome: cliente.nome,
      telefone: cliente.telefone,
      dataEnvio: msg.criadoEm,
      ultimaAtividadeLead: lead?.atualizadoEm || null,
      conteudoPreview: msg.conteudo.substring(0, 80)
    });
  }
}

console.log("Total de clientes com CONVERSA_FRANCA nos últimos 7 dias: " + conversaFrancaCount + "\n");

for (let i = 0; i < conversaFrancaData.length; i++) {
  const data = conversaFrancaData[i];
  console.log("[" + (i+1) + "]");
  console.log("  Nome: " + data.nome);
  console.log("  Telefone: " + data.telefone);
  console.log("  Data envio: " + data.dataEnvio.toISOString());
  console.log("  Última atividade lead: " + (data.ultimaAtividadeLead ? data.ultimaAtividadeLead.toISOString() : "N/A"));
  console.log("  Preview: " + data.conteudoPreview + "...");
  console.log();
}

// ===== PARTE 2: Contagem por tipo nos últimos 90 dias =====
console.log("\n[PARTE 2] CONTAGEM POR TIPO DE CADÊNCIA - Últimos 90 dias");
console.log("=".repeat(80) + "\n");

const mensagens90d = await prisma.mensagem.findMany({
  where: {
    direcao: "SAIDA",
    criadoEm: { gte: d90 }
  },
  select: { conteudo: true, criadoEm: true }
});

console.log("Total de mensagens SAIDA nos últimos 90 dias: " + mensagens90d.length + "\n");

const contadores = {
  conversa_franca_60d: 0,
  pronto_conversa_franca: 0,
  reativacao_15d: 0,
  reativacao_30d: 0,
  reativacao_90d: 0,
  pos_venda: 0,
  aniversario: 0,
  recontato_agendado: 0,
  noshow_reagendar: 0,
  desconhecido: 0
};

for (const msg of mensagens90d) {
  const conteudo = msg.conteudo.toLowerCase();
  let tipo = "desconhecido";

  // Heurística para identificar tipo
  if (conteudo.includes("ainda há interesse") || conteudo.includes("franco")) {
    tipo = "conversa_franca_60d";
  } else if (conteudo.includes("transparente") || conteudo.includes("pedido em andamento")) {
    tipo = "pronto_conversa_franca";
  } else if (conteudo.includes("passando pra tirar qualquer dúvida")) {
    tipo = "cadencia_t1_t5"; // não contar
    continue;
  } else if (conteudo.includes("reativar") || conteudo.includes("aí")) {
    if (conteudo.includes("15")) tipo = "reativacao_15d";
    else if (conteudo.includes("30")) tipo = "reativacao_30d";
    else tipo = "reativacao_90d";
  } else if (conteudo.includes("pós-venda") || conteudo.includes("compra realizada")) {
    tipo = "pos_venda";
  } else if (conteudo.includes("aniversário")) {
    tipo = "aniversario";
  } else if (conteudo.includes("agendado")) {
    tipo = "recontato_agendado";
  } else if (conteudo.includes("confirmar") || conteudo.includes("agendamento")) {
    tipo = "noshow_reagendar";
  }

  if (tipo !== "desconhecido" && contadores[tipo] !== undefined) {
    contadores[tipo]++;
  } else if (tipo === "desconhecido") {
    contadores.desconhecido++;
  }
}

console.log("Breakdown por tipo:\n");
for (const [tipo, count] of Object.entries(contadores)) {
  if (count > 0) {
    console.log("  " + tipo + ": " + count);
  }
}

console.log("\n[FIM DO AUDIT]");
await prisma.$disconnect();
