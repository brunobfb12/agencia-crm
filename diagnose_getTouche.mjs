import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const now = new Date();

const hojeBRT = new Date(now.getTime() - 3 * 60 * 60 * 1000);
const CADENCIA_HOJE_CUTOFF = new Date(Date.UTC(
  hojeBRT.getUTCFullYear(),
  hojeBRT.getUTCMonth(),
  hojeBRT.getUTCDate(),
  3, 0, 0, 0
));

console.log("[SCRIPT] now=" + now.toISOString());
console.log("[SCRIPT] CADENCIA_HOJE_CUTOFF=" + CADENCIA_HOJE_CUTOFF.toISOString());
console.log("[SCRIPT] horarioBRT=" + ((now.getUTCHours() - 3 + 24) % 24) + "\n");

const cadenciaLeads = await prisma.lead.findMany({
  where: {
    status: { in: ["LEAD", "AQUECIMENTO"] },
    atualizadoEm: { gte: CADENCIA_HOJE_CUTOFF },
    empresa: { ativa: true },
    cliente: { telefone: { not: "" } },
  },
  include: {
    cliente: {
      include: {
        conversas: {
          orderBy: { ultimaAtividade: "desc" },
          take: 1,
          include: {
            mensagens: {
              orderBy: { criadoEm: "desc" },
              take: 10,
            },
          },
        },
      },
    },
    empresa: { select: { nome: true, instanciaWhatsapp: true, nomeIA: true } },
    vendedor: { select: { nome: true } },
  },
});

console.log("[QUERY] cadenciaLeads retornou " + cadenciaLeads.length + " leads\n");

function getTouche(lead) {
  const conversas = lead.cliente?.conversas ?? [];
  console.log("  conversas.length=" + conversas.length);
  if (conversas.length === 0) {
    console.log("  -> getTouche retorna null (linha 232: conversas.length === 0)");
    return null;
  }

  const mensagens = conversas[0]?.mensagens ?? [];
  console.log("  mensagens.length=" + mensagens.length);
  console.log("  ordem das mensagens:");
  for (let i = 0; i < mensagens.length; i++) {
    console.log("    [" + i + "] " + mensagens[i].direcao + " | " + mensagens[i].criadoEm);
  }

  let ultimaMsgIA = null;
  for (const msg of mensagens) {
    if (msg.direcao === "SAIDA") {
      ultimaMsgIA = msg;
      break;
    }
  }
  console.log("  ultimaMsgIA=" + (ultimaMsgIA ? ultimaMsgIA.criadoEm : "null"));

  if (!ultimaMsgIA) {
    console.log("  -> getTouche retorna null (linha 242: !ultimaMsgIA)");
    return null;
  }

  const ultimaMsgIATime = new Date(ultimaMsgIA.criadoEm).getTime();
  const agora = now.getTime();
  const minusDecorridos = (agora - ultimaMsgIATime) / (1000 * 60);
  console.log("  minusDecorridos=" + minusDecorridos.toFixed(1));

  let clienteRespondeu = false;
  for (const msg of mensagens) {
    if (msg.direcao === "ENTRADA" && new Date(msg.criadoEm).getTime() > ultimaMsgIATime) {
      clienteRespondeu = true;
      break;
    }
  }
  console.log("  clienteRespondeu=" + clienteRespondeu);

  if (clienteRespondeu) {
    console.log("  -> getTouche retorna null (linha 256: clienteRespondeu)");
    return null;
  }

  const obs = lead.observacoes ?? "";
  const temT1 = obs.includes("[T1:");
  console.log("  obs.includes[T1:]=" + temT1);

  if (!temT1 && minusDecorridos >= 30) {
    console.log("  -> getTouche retorna T1 (linha 269: !temT1 && minusDecorridos >= 30)");
    return { toque: 1, flag: "[T1:...]" };
  }

  console.log("  -> getTouche retorna null (linha 308: nenhuma condicao passou)");
  return null;
}

let totalTouches = 0;
const touchesByLeadId = new Map();

for (const lead of cadenciaLeads) {
  console.log("[LEAD] " + lead.id);
  console.log("  status=" + lead.status + " atualizadoEm=" + lead.atualizadoEm);
  const touche = getTouche(lead);
  console.log("  RESULTADO=" + (touche ? "T" + touche.toque : "null") + "\n");
  if (touche) {
    totalTouches++;
    touchesByLeadId.set(lead.id, touche);
  }
}

console.log("[SUMMARY]");
console.log("  cadenciaLeads.length=" + cadenciaLeads.length);
console.log("  leads com touche=" + totalTouches);
console.log("  leads map: " + JSON.stringify(Array.from(touchesByLeadId.entries())));

await prisma.$disconnect();
