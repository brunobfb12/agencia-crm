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

console.log(`[DIAGNOSE] now=${now.toISOString()}`);
console.log(`[DIAGNOSE] CADENCIA_HOJE_CUTOFF=${CADENCIA_HOJE_CUTOFF.toISOString()}\n`);

// Query idêntica ao da rota
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

console.log(`[QUERY] cadenciaLeads retornou ${cadenciaLeads.length} leads\n`);

// Replicar getTouche
function getTouche(lead) {
  const conversas = lead.cliente?.conversas ?? [];
  if (conversas.length === 0) {
    console.log(`  -> getTouche: null (sem conversas)`);
    return null;
  }

  const mensagens = conversas[0]?.mensagens ?? [];
  let ultimaMsgIA = null;
  for (const msg of mensagens) {
    if (msg.direcao === "SAIDA") {
      ultimaMsgIA = msg;
      break;
    }
  }
  if (!ultimaMsgIA) {
    console.log(`  -> getTouche: null (sem msg SAIDA)`);
    return null;
  }

  const ultimaMsgIATime = new Date(ultimaMsgIA.criadoEm).getTime();
  const agora = now.getTime();
  const minusDecorridos = (agora - ultimaMsgIATime) / (1000 * 60);

  let clienteRespondeu = false;
  for (const msg of mensagens) {
    if (msg.direcao === "ENTRADA" && new Date(msg.criadoEm).getTime() > ultimaMsgIATime) {
      clienteRespondeu = true;
      break;
    }
  }
  if (clienteRespondeu) {
    console.log(`  -> getTouche: null (cliente respondeu)`);
    return null;
  }

  const obs = lead.observacoes ?? "";
  const temT1 = obs.includes("[T1:");

  if (!temT1 && minusDecorridos >= 30) {
    console.log(`  -> getTouche: T1 (${minusDecorridos.toFixed(1)} min, sem [T1:])`);
    return { toque: 1 };
  }

  console.log(`  -> getTouche: null (temT1=${temT1}, mins=${minusDecorridos.toFixed(1)})`);
  return null;
}

// Testar getTouche para cada lead
for (const lead of cadenciaLeads) {
  console.log(`\n[LEAD] ${lead.id}`);
  console.log(`  status: ${lead.status}`);
  console.log(`  atualizadoEm: ${lead.atualizadoEm}`);
  console.log(`  conversas: ${lead.cliente?.conversas?.length ?? 0}`);
  const touche = getTouche(lead);
}

console.log(`\n[SUMMARY] cadenciaLeads=${cadenciaLeads.length}, todos deram null em getTouche`);
await prisma.$disconnect();
