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
console.log("[SCRIPT] CADENCIA_HOJE_CUTOFF=" + CADENCIA_HOJE_CUTOFF.toISOString() + "\n");

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
  if (conversas.length === 0) return null;

  const mensagens = conversas[0]?.mensagens ?? [];
  let ultimaMsgIA = null;
  for (const msg of mensagens) {
    if (msg.direcao === "SAIDA") {
      ultimaMsgIA = msg;
      break;
    }
  }
  if (!ultimaMsgIA) return null;

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
  if (clienteRespondeu) return null;

  const obs = lead.observacoes ?? "";
  const temT1 = obs.includes("[T1:");

  if (!temT1 && minusDecorridos >= 30) {
    return { toque: 1, flag: "[T1:...]" };
  }

  return null;
}

const t1Leads = [];
const t2Leads = [];
const t3Leads = [];
const t4Leads = [];
const t5Leads = [];

for (const lead of cadenciaLeads) {
  const touche = getTouche(lead);
  if (touche && touche.toque === 1) {
    t1Leads.push({ ...lead, flag: touche.flag });
  }
}

console.log("[CADENCIA] t1Leads=" + t1Leads.length + " leads");

// Simular buildItem
const buildItem = (lead, tipo, mensagem) => ({
  tipo,
  leadId: lead.id,
  clienteTelefone: lead.cliente.telefone,
  clienteNome: lead.cliente.nome ?? lead.cliente.telefone,
  instancia: lead.empresa.instanciaWhatsapp,
  empresaNome: lead.empresa.nome,
  mensagem,
});

let items = [];
items.push(
  ...t1Leads
    .filter((l) => l.empresa.instanciaWhatsapp)
    .map((l) => {
      const nome = l.cliente.nome ? ` ${l.cliente.nome.split(" ")[0]}` : "";
      const ia = l.empresa.nomeIA ?? "Eu";
      return buildItem(l, "cadencia_t1",
        `Oi${nome}! ${ia} aqui, da ${l.empresa.nome}. Passando pra tirar qualquer dúvida! 😊`
      );
    })
);

console.log("[ITEMS] após items.push(t1Leads)=" + items.length + " items\n");

// ===== leadToClienteMap =====
console.log("[LEADMAP] buildando leadToClienteMap...");
const leadToClienteMap = new Map();

// Corrigida: sem colchetes extras
for (const leads of [t1Leads, t2Leads, t3Leads, t4Leads, t5Leads]) {
  for (const lead of leads) {
    if (lead?.id && lead?.cliente?.id) {
      leadToClienteMap.set(lead.id, lead.cliente.id);
    }
  }
}

console.log("[LEADMAP] total entries=" + leadToClienteMap.size);
for (const [leadId, clienteId] of leadToClienteMap) {
  console.log("  " + leadId + " -> " + clienteId);
}
console.log();

// ===== TRAVA 2 =====
console.log("[TRAVA2] Verificando mensagens SAIDA hoje...");
const clienteMessageTypes = new Set([
  "cadencia_t1", "cadencia_t2", "cadencia_t3", "cadencia_t4", "cadencia_t5"
]);

const cadeciaTiposExclusosTrava2 = new Set([
  "cadencia_t1", "cadencia_t2", "cadencia_t3", "cadencia_t4", "cadencia_t5"
]);

const clienteIdsItems = new Set();
for (const item of items.filter(it => clienteMessageTypes.has(it.tipo) && !cadeciaTiposExclusosTrava2.has(it.tipo))) {
  const clienteId = leadToClienteMap.get(item.leadId);
  console.log("  item.leadId=" + item.leadId + " -> clienteId=" + (clienteId || "NOT FOUND"));
  if (clienteId) clienteIdsItems.add(clienteId);
}

console.log("[TRAVA2] clienteIdsItems.size=" + clienteIdsItems.size + "\n");

const todayStart = new Date(now);
todayStart.setHours(0, 0, 0, 0);
console.log("[TRAVA2] Procurando mensagens SAIDA desde " + todayStart.toISOString());

const mensagensHoje = clienteIdsItems.size > 0
  ? await prisma.mensagem.findMany({
      where: {
        direcao: "SAIDA",
        criadoEm: { gte: todayStart },
        conversa: { clienteId: { in: Array.from(clienteIdsItems) } },
      },
      select: { conversa: { select: { clienteId: true } } },
    })
  : [];

console.log("[TRAVA2] mensagensHoje.length=" + mensagensHoje.length);

const clientesComMsgHoje = new Set(mensagensHoje.map(m => m.conversa.clienteId));
console.log("[TRAVA2] clientesComMsgHoje.size=" + clientesComMsgHoje.size);
console.log();

// Aplicar TRAVA 2
console.log("[TRAVA2] Filtrando items...");
const itemsApposTrava2 = items.filter(it => {
  if (cadeciaTiposExclusosTrava2.has(it.tipo)) {
    console.log("  " + it.leadId + ": tipo=" + it.tipo + " (T1-T5 sempre passam) passes=true");
    return true;
  }
  const clienteId = leadToClienteMap.get(it.leadId);
  const passes = clienteId && !clientesComMsgHoje.has(clienteId);
  console.log("  " + it.leadId + ": clienteId=" + (clienteId || "undefined") + " passes=" + passes);
  return passes;
});

console.log("\n[RESULTADO]");
console.log("  items.length ANTES TRAVA2=" + items.length);
console.log("  items.length DEPOIS TRAVA2=" + itemsApposTrava2.length);

const itemsFinais = itemsApposTrava2.slice(0, 5);
console.log("  items.length DEPOIS slice(0,5)=" + itemsFinais.length);
console.log("\nEsperado: 6 items antes de trava2, 6 após, 5 após slice");

await prisma.$disconnect();
