import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Período: 2026-09-14 20:00:00Z até 20:35:00Z
const startTime = new Date("2026-09-14T20:00:00.000Z");
const endTime = new Date("2026-09-14T20:35:00.000Z");

console.log("[AUDIT FANTASMA] Período: " + startTime.toISOString() + " até " + endTime.toISOString() + "\n");

// ===== PARTE 1: Contagem total =====
const totalMensagens = await prisma.mensagem.count({
  where: {
    direcao: "SAIDA",
    criadoEm: { gte: startTime, lte: endTime }
  }
});

console.log("[PARTE 1] Total de registros Mensagem (SAIDA) nesse período: " + totalMensagens);
console.log();

// ===== PARTE 2: Breakdown por conteúdo =====
const mensagens = await prisma.mensagem.findMany({
  where: {
    direcao: "SAIDA",
    criadoEm: { gte: startTime, lte: endTime }
  },
  select: {
    id: true,
    conteudo: true,
    criadoEm: true,
    conversa: { select: { clienteId: true, cliente: { select: { nome: true } } } }
  },
  orderBy: { criadoEm: "asc" }
});

console.log("[PARTE 2] Breakdown por tipo de conteúdo:\n");

const tipos = {};
for (const msg of mensagens) {
  const c = msg.conteudo;
  let tipo = "DESCONHECIDO";

  if (c.includes("Quero ser honesto") || c.includes("já faz")) tipo = "conversa_franca_60d";
  else if (c.includes("Quero ser transparente") || c.includes("pedido em andamento")) tipo = "pronto_conversa_franca";
  else if (c.includes("Passando pra tirar qualquer dúvida")) tipo = "cadencia_t1";
  else if (c.includes("Ainda por aqui pra ajudar")) tipo = "cadencia_t2";
  else if (c.includes("Faz um tempo que não conversamos") && c.includes("novidades")) tipo = "reativacao_15d";
  else if (c.includes("Sentimos sua falta")) tipo = "reativacao_30d";
  else if (c.includes("Faz tempo que não conversamos — tudo bem")) tipo = "reativacao_90d";
  else if (c.includes("aniversário")) tipo = "aniversario";

  if (!tipos[tipo]) tipos[tipo] = [];
  tipos[tipo].push({ cliente: msg.conversa.cliente.nome, criadoEm: msg.criadoEm });
}

for (const [tipo, items] of Object.entries(tipos)) {
  console.log(tipo + ": " + items.length);
}

console.log("\n[PARTE 3] Detalhes de conversa_franca:\n");

const conversaFrancas = mensagens.filter(m =>
  m.conteudo.includes("Quero ser honesto") || m.conteudo.includes("já faz")
);

console.log("Total conversa_franca: " + conversaFrancas.length);
console.log("\nPrimeiras 10:");

for (let i = 0; i < Math.min(10, conversaFrancas.length); i++) {
  const msg = conversaFrancas[i];
  console.log("[" + (i+1) + "]");
  console.log("  Cliente: " + msg.conversa.cliente.nome);
  console.log("  Criado: " + msg.criadoEm.toISOString());
  console.log("  Preview: " + msg.conteudo.substring(0, 100) + "...");
  console.log();
}

// ===== PARTE 4: Verificar se entram no histórico =====
console.log("[PARTE 4] Integração com histórico da IA:\n");

console.log("O histórico é buscado via webhook/mensagem com:");
console.log(`  conversas[0].mensagens (últimas 10 por padrão)`);
console.log(`  Inclui TODOS os registros Mensagem da Conversa, independente de quando foram criados`);
console.log(`\nCada Mensagem com direcao='SAIDA' é incluída no contexto enviado à IA.`);
console.log(`Logo: TODOS esses registros fantasma entram no histórico da IA.`);

await prisma.$disconnect();
