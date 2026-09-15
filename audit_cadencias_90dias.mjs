import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const now = new Date();
const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
const d90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

console.log("[AUDIT] Executado em: " + now.toISOString());
console.log("[AUDIT] Período 7 dias: " + d7.toISOString() + " até " + now.toISOString());
console.log("[AUDIT] Período 90 dias: " + d90.toISOString() + " até " + now.toISOString() + "\n");

// ===== PARTE 1: Conversa Franca (últimos 7 dias) =====
console.log("[PARTE 1] CONVERSA FRANCA - Últimos 7 dias");
console.log("=".repeat(100) + "\n");

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

// Filtros de conversa franca pelos templates conhecidos
const conversaFrancas = mensagens7d.filter(msg => {
  const c = msg.conteudo;
  // conversa_franca: "Quero ser honesto com você: já faz"
  // pronto_conversa_franca: "Quero ser transparente com você — tínhamos um pedido"
  return (c.includes("Quero ser honesto") || c.includes("Quero ser transparente")) &&
         (c.includes("pedido em andamento") || c.includes("dias que não conversamos"));
});

console.log("Total de clientes com CONVERSA_FRANCA: " + conversaFrancas.length + "\n");

for (let i = 0; i < conversaFrancas.length; i++) {
  const msg = conversaFrancas[i];
  const lead = msg.conversa.cliente.leads?.[0];
  console.log("[" + (i+1) + "]");
  console.log("  Nome: " + msg.conversa.cliente.nome);
  console.log("  Telefone: " + msg.conversa.cliente.telefone);
  console.log("  Data envio: " + msg.criadoEm.toISOString());
  console.log("  Última atividade lead: " + (lead?.atualizadoEm ? lead.atualizadoEm.toISOString() : "N/A"));
  console.log();
}

// ===== PARTE 2: Contagem por tipo (90 dias) =====
console.log("\n[PARTE 2] CONTAGEM POR TIPO - Últimos 90 dias");
console.log("=".repeat(100) + "\n");

const mensagens90d = await prisma.mensagem.findMany({
  where: {
    direcao: "SAIDA",
    criadoEm: { gte: d90 }
  },
  select: { conteudo: true, criadoEm: true }
});

console.log("Total de mensagens SAIDA (90d): " + mensagens90d.length + "\n");

const tipos = {
  conversa_franca: { count: 0, keywords: ["Quero ser honesto", "já faz"] },
  pronto_conversa_franca: { count: 0, keywords: ["Quero ser transparente", "pedido em andamento"] },
  reativacao_15d: { count: 0, keywords: ["Faz um tempo que não conversamos", "Temos novidades"] },
  reativacao_30d: { count: 0, keywords: ["Sentimos sua falta", "condição especial"] },
  reativacao_90d_sem_interesse: { count: 0, keywords: ["Faz tempo que não conversamos — tudo bem"] },
  pos_venda: { count: 0, keywords: ["Tudo certo com seu pedido", "sua experiência"] },
  aniversario: { count: 0, keywords: ["aniversário", "parabéns"] },
  recontato_agendado: { count: 0, keywords: ["agendar", "ficou alguma dúvida"] },
  noshow_reagendar: { count: 0, keywords: ["você tinha um horário agendado", "reagendar"] },
  lembrete_ld0: { count: 0, keywords: ["Estou aqui aguardando sua confirmação"] },
  cadencia_t1_t5: { count: 0, keywords: ["Passando pra tirar qualquer dúvida", "Ainda por aqui pra ajudar", "Você ainda tem interesse", "Consegui te ajudar", "Vou parar de te chamar"] },
  desconhecido: { count: 0, keywords: [] }
};

for (const msg of mensagens90d) {
  const c = msg.conteudo;
  let identificado = false;

  for (const [tipo, config] of Object.entries(tipos)) {
    if (tipo === "desconhecido") continue;
    if (config.keywords.length === 0) continue;

    const matches = config.keywords.every(k => c.includes(k));
    if (matches) {
      tipos[tipo].count++;
      identificado = true;
      break;
    }
  }

  if (!identificado) {
    tipos.desconhecido.count++;
  }
}

console.log("Breakdown por tipo:\n");
let totalIdentificado = 0;
for (const [tipo, config] of Object.entries(tipos)) {
  if (config.count > 0) {
    console.log("  " + tipo + ": " + config.count);
    if (tipo !== "desconhecido") totalIdentificado += config.count;
  }
}

console.log("\nTotal identificado: " + totalIdentificado);
console.log("Total desconhecido: " + tipos.desconhecido.count);
console.log("Cobertura: " + ((totalIdentificado / mensagens90d.length) * 100).toFixed(1) + "%");

console.log("\n[FIM DO AUDIT]");
await prisma.$disconnect();
