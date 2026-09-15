import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const clienteTelefone = "5562991093694";
const todayStart = new Date();
todayStart.setHours(0, 0, 0, 0);

console.log("[INVESTIGA P2] Cliente: " + clienteTelefone);
console.log("[INVESTIGA P2] Data busca: " + todayStart.toISOString() + " até agora\n");

// Buscar cliente por telefone
const cliente = await prisma.cliente.findFirst({
  where: { telefone: clienteTelefone }
});

if (!cliente) {
  console.log("[ERRO] Cliente com telefone " + clienteTelefone + " não encontrado");
  await prisma.$disconnect();
  process.exit(1);
}

console.log("[CLIENTE] ID: " + cliente.id + ", Nome: " + cliente.nome + "\n");

// Buscar todas as conversas do cliente
const conversas = await prisma.conversa.findMany({
  where: { clienteId: cliente.id },
  include: {
    mensagens: {
      orderBy: { criadoEm: "asc" }
    }
  }
});

console.log("[CONVERSAS] Total: " + conversas.length + "\n");

// Para cada conversa, listar todas as mensagens de hoje
for (const conv of conversas) {
  const msgHoje = conv.mensagens.filter(m => {
    const msgTime = new Date(m.criadoEm);
    return msgTime >= todayStart;
  });

  if (msgHoje.length === 0) continue;

  console.log("[CONVERSA] ID: " + conv.id);
  console.log("[CONVERSA] processando: " + conv.processando);
  console.log("[CONVERSA] processandoEm: " + (conv.processandoEm ? conv.processandoEm.toISOString() : "null"));
  console.log("[CONVERSA] Mensagens hoje: " + msgHoje.length + "\n");

  for (let i = 0; i < msgHoje.length; i++) {
    const msg = msgHoje[i];
    console.log("[MSG " + (i+1) + "]");
    console.log("  ID: " + msg.id);
    console.log("  Direcao: " + msg.direcao);
    console.log("  CriadoEm: " + msg.criadoEm.toISOString());
    console.log("  Conteudo: " + msg.conteudo);
    console.log();
  }

  // Contar respostas duplicadas
  const entrada = msgHoje.filter(m => m.direcao === "ENTRADA");
  const saida = msgHoje.filter(m => m.direcao === "SAIDA");
  console.log("[STATS] ENTRADA: " + entrada.length + ", SAIDA: " + saida.length);

  if (entrada.length > 0 && saida.length > entrada.length) {
    console.log("⚠️  ALERTA: Mais SAIDA que ENTRADA! Possível duplicação de respostas IA");
    console.log("    Relação: " + saida.length + " respostas para " + entrada.length + " mensagens = " + (saida.length / entrada.length).toFixed(1) + "x");
  }
  console.log("\n---\n");
}

await prisma.$disconnect();
