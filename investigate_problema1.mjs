import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const clienteTelefone = "5562984265297";
const todayStart = new Date();
todayStart.setHours(0, 0, 0, 0);

console.log("[INVESTIGA P1] Cliente: " + clienteTelefone);
console.log("[INVESTIGA P1] Data busca: " + todayStart.toISOString() + " até agora\n");

// Buscar cliente por telefone
const cliente = await prisma.cliente.findFirst({
  where: { telefone: clienteTelefone }
});

if (!cliente) {
  console.log("[ERRO] Cliente com telefone " + clienteTelefone + " não encontrado");
  await prisma.$disconnect();
  process.exit(1);
}

console.log("[CLIENTE] ID: " + cliente.id);
console.log("[CLIENTE] Nome: " + cliente.nome + "\n");

// Buscar todos os leads desse cliente
const leads = await prisma.lead.findMany({
  where: { clienteId: cliente.id },
  orderBy: { criadoEm: "asc" }
});

console.log("[LEADS] Total do cliente: " + leads.length);
for (const lead of leads) {
  console.log("  - ID: " + lead.id + ", criado: " + lead.criadoEm.toISOString() + ", status: " + lead.status);
}
console.log();

// Buscar todas as mensagens SAIDA dele hoje
const mensagensHoje = await prisma.mensagem.findMany({
  where: {
    direcao: "SAIDA",
    criadoEm: { gte: todayStart },
    conversa: { clienteId: cliente.id }
  },
  orderBy: { criadoEm: "asc" }
});

console.log("[MENSAGENS SAIDA HOJE] Total: " + mensagensHoje.length + "\n");

for (let i = 0; i < mensagensHoje.length; i++) {
  const msg = mensagensHoje[i];
  console.log("[MSG " + (i+1) + "]");
  console.log("ID: " + msg.id);
  console.log("criadoEm: " + msg.criadoEm.toISOString());
  console.log("conteudo: " + msg.conteudo);
  console.log();
}

// Analisar qual tipo de cadência
if (mensagensHoje.length > 0) {
  console.log("[ANALISE] Comparando com templates conhecidos...");
  for (const msg of mensagensHoje) {
    const conteudo = msg.conteudo.toLowerCase();
    let tipo = "DESCONHECIDO";

    if (conteudo.includes("passando pra tirar qualquer dúvida")) tipo = "T1-T5 (cadencia)";
    if (conteudo.includes("aniversário")) tipo = "ANIVERSARIO";
    if (conteudo.includes("reativar") || conteudo.includes("reativação")) tipo = "REATIVACAO";
    if (conteudo.includes("pós-venda") || conteudo.includes("realizada")) tipo = "POS_VENDA";
    if (conteudo.includes("interesse") && conteudo.includes("franco")) tipo = "CONVERSA_FRANCA";

    console.log("  " + msg.criadoEm.toISOString() + ": " + tipo);
  }
}

// Agora verificar quantos leads ANTIGOS estão elegíveis
console.log("\n[VERIFICACAO CUTOFF]");
const CADENCIA_HOJE_CUTOFF = new Date();
const hojeBRT = new Date(new Date().getTime() - 3 * 60 * 60 * 1000);
const cutoff = new Date(Date.UTC(hojeBRT.getUTCFullYear(), hojeBRT.getUTCMonth(), hojeBRT.getUTCDate(), 3, 0, 0, 0));

console.log("CADENCIA_HOJE_CUTOFF: " + cutoff.toISOString());
for (const lead of leads) {
  const passaCutoff = new Date(lead.atualizadoEm) >= cutoff;
  console.log("  Lead " + lead.id + ": atualizadoEm=" + lead.atualizadoEm.toISOString() + " passa_cutoff=" + passaCutoff);
}

await prisma.$disconnect();
