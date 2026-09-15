import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const startTime = new Date("2026-09-14T20:00:00.000Z");
const endTime = new Date("2026-09-14T20:35:00.000Z");

console.log("[AUDIT FANTASMA - LEADS ATIVOS] Período: " + startTime.toISOString() + " até " + endTime.toISOString() + "\n");

// Buscar TODOS os registros nesse período, depois filtrar em JS
const mensagens = await prisma.mensagem.findMany({
  where: {
    direcao: "SAIDA",
    criadoEm: { gte: startTime, lte: endTime }
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
  }
});

// Filtrar fantasmas (conversa_franca + pronto_conversa_franca)
const mensagensFantasma = mensagens.filter(m =>
  m.conteudo.includes("Quero ser honesto com você: já faz") ||
  m.conteudo.includes("Quero ser transparente com você — tínhamos um pedido")
);

console.log("[TOTAL] Registros fantasma encontrados: " + mensagensFantasma.length + "\n");

// Agrupar por status do lead
const porStatus = {};
const statusAtivos = ["LEAD", "AQUECIMENTO", "NEGOCIACAO", "PRONTO_PARA_COMPRAR"];

for (const msg of mensagensFantasma) {
  const lead = msg.conversa.cliente.leads?.[0];
  const status = lead?.status || "SEM_LEAD";

  if (!porStatus[status]) porStatus[status] = [];
  porStatus[status].push({
    cliente: msg.conversa.cliente.nome,
    leadId: lead?.id,
    status: status,
    atualizadoEm: lead?.atualizadoEm,
    criadoMsg: msg.criadoEm
  });
}

console.log("[BREAKDOWN POR STATUS]\n");

let totalAtivos = 0;
for (const [status, items] of Object.entries(porStatus)) {
  const isAtivo = statusAtivos.includes(status);
  const label = isAtivo ? "✅ ATIVO" : "❌ INATIVO";
  console.log(label + " | " + status + ": " + items.length);
  if (isAtivo) totalAtivos += items.length;
}

console.log("\n[RESUMO]");
console.log("Total registros fantasma: " + mensagensFantasma.length);
console.log("Afetando leads ATIVOS no funil: " + totalAtivos);
console.log("Afetando leads INATIVOS: " + (mensagensFantasma.length - totalAtivos));

if (totalAtivos > 0) {
  console.log("\n[RISCO] Se " + totalAtivos + " cliente(s) voltar(em) a escrever:");
  console.log("  - A IA lerá no histórico uma mensagem que NUNCA enviou");
  console.log("  - Responderá em cima de contexto falso");
  console.log("  - Possível confusão de narrativa");
}

// Os 5 mais recentes com leads ativos
const ativosOrdenados = mensagensFantasma
  .filter(m => statusAtivos.includes(m.conversa.cliente.leads?.[0]?.status || ""))
  .sort((a, b) => b.criadoMsg.getTime() - a.criadoMsg.getTime())
  .slice(0, 5);

if (ativosOrdenados.length > 0) {
  console.log("\n[5 MAIS RECENTES - LEADS ATIVOS]\n");
  for (let i = 0; i < ativosOrdenados.length; i++) {
    const m = ativosOrdenados[i];
    const lead = m.conversa.cliente.leads?.[0];
    console.log("[" + (i+1) + "]");
    console.log("  Cliente: " + m.conversa.cliente.nome);
    console.log("  Status: " + lead?.status);
    console.log("  Última atividade: " + (lead?.atualizadoEm?.toISOString() || "N/A"));
    console.log("  Mensagem criada: " + m.criadoMsg.toISOString());
    console.log();
  }
} else {
  console.log("\n✅ BOAS NOTÍCIAS: Nenhum lead ATIVO afetado!");
}

await prisma.$disconnect();
