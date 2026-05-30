/**
 * Patch: intervalo anti-spam do workflow de campanhas
 *   - Cron: 1 minuto → 2 minutos
 *   - Adiciona Code node "Delay Aleatório" (0-60s) antes do envio
 * Uso: node scripts/patch_campanha_interval.mjs SUA_API_KEY
 */
import { randomUUID } from "crypto";

const API_KEY  = process.argv[2];
const BASE_URL = "https://n8n-n8n.6jgzku.easypanel.host";
const WF_ID    = "TtxFxrOR5ca5PMHm";

if (!API_KEY) { console.error("Uso: node patch_campanha_interval.mjs SUA_API_KEY"); process.exit(1); }

// ── 1. Buscar workflow ──────────────────────────────────────────────
console.log("Buscando workflow...");
const res = await fetch(`${BASE_URL}/api/v1/workflows/${WF_ID}`, {
  headers: { "X-N8N-API-KEY": API_KEY },
});
if (!res.ok) { console.error("Erro ao buscar workflow:", res.status, await res.text()); process.exit(1); }
const wf = await res.json();

console.log(`\nWorkflow: "${wf.name}"`);
console.log("Nós atuais:", wf.nodes.map(n => `"${n.name}"`).join(" → "));

// ── 2. Ajustar cron (1 min → 2 min) ───────────────────────────────
const cronNode = wf.nodes.find(n => n.type === "n8n-nodes-base.scheduleTrigger");
if (!cronNode) { console.error("Cron node não encontrado"); process.exit(1); }

const oldRule = JSON.stringify(cronNode.parameters?.rule ?? cronNode.parameters);
// Atualizar para 2 minutos — o scheduleTrigger usa rule.interval
if (cronNode.parameters?.rule) {
  cronNode.parameters.rule = { interval: [{ field: "minutes", minutesInterval: 2 }] };
} else if (cronNode.parameters?.triggerTimes) {
  // formato alternativo
  cronNode.parameters.triggerTimes = { item: [{ mode: "everyX", value: 2, unit: "minutes" }] };
} else {
  // Dump atual para diagnóstico
  console.error("Formato do cron desconhecido:", JSON.stringify(cronNode.parameters, null, 2));
  process.exit(1);
}
console.log(`\n✅ Cron atualizado: ${oldRule} → a cada 2 minutos`);

// ── 3. Verificar se já existe nó de delay aleatório ────────────────
const jaTemDelay = wf.nodes.some(n => n.name === "Delay Aleatório");

if (!jaTemDelay) {
  // Encontrar nó "Formatar Mensagem" e "Enviar via WhatsApp"
  const formatarNode  = wf.nodes.find(n => n.name === "Formatar Mensagem");
  const enviarNode    = wf.nodes.find(n => n.name === "Enviar via WhatsApp");

  if (!formatarNode || !enviarNode) {
    console.log("\n⚠️  Nós 'Formatar Mensagem' ou 'Enviar via WhatsApp' não encontrados.");
    console.log("   Nós existentes:", wf.nodes.map(n => `"${n.name}"`).join(", "));
    console.log("   Pulando adição do delay — apenas o cron foi ajustado.");
  } else {
    // Posicionar o novo nó entre os dois
    const midX = Math.round((formatarNode.position[0] + enviarNode.position[0]) / 2);
    const midY = Math.round((formatarNode.position[1] + enviarNode.position[1]) / 2);

    // Empurrar enviarNode e nós subsequentes para a direita
    const formatarIdx = wf.nodes.indexOf(formatarNode);
    const enviarIdx   = wf.nodes.indexOf(enviarNode);
    const shiftX      = 280;
    // Identificar nós "à direita" do enviarNode na cadeia de conexões
    const nodesToShift = new Set();
    function collectDownstream(nodeName) {
      for (const [fromName, conns] of Object.entries(wf.connections)) {
        if (fromName !== nodeName) continue;
        for (const portConns of Object.values(conns)) {
          for (const connArr of portConns) {
            for (const c of connArr) {
              if (!nodesToShift.has(c.node)) {
                nodesToShift.add(c.node);
                collectDownstream(c.node);
              }
            }
          }
        }
      }
    }
    collectDownstream(enviarNode.name);
    nodesToShift.add(enviarNode.name);
    for (const node of wf.nodes) {
      if (nodesToShift.has(node.name)) node.position[0] += shiftX;
    }

    // Criar nó de delay aleatório
    const delayNodeId   = randomUUID();
    const delayNodeName = "Delay Aleatório";
    const delayNode = {
      id: delayNodeId,
      name: delayNodeName,
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [midX, midY],
      parameters: {
        jsCode: [
          "// Anti-spam: aguarda entre 0 e 60 segundos de forma aleatória",
          "// Junto com o cron de 2 min → intervalo total: 2 a 3 min entre mensagens",
          "const segundos = Math.floor(Math.random() * 60);",
          "await new Promise(r => setTimeout(r, segundos * 1000));",
          "return items;",
        ].join("\n"),
      },
    };
    wf.nodes.push(delayNode);

    // Atualizar conexões:
    // Antes: formatarNode → enviarNode
    // Depois: formatarNode → delayNode → enviarNode
    const formatarConns = wf.connections[formatarNode.name];
    if (formatarConns?.main?.[0]) {
      formatarConns.main[0] = formatarConns.main[0].map(c => {
        if (c.node === enviarNode.name) return { node: delayNodeName, type: "main", index: 0 };
        return c;
      });
    }
    wf.connections[delayNodeName] = {
      main: [[{ node: enviarNode.name, type: "main", index: 0 }]],
    };

    console.log(`✅ Nó "Delay Aleatório" adicionado entre "${formatarNode.name}" e "${enviarNode.name}"`);
    console.log("   Delay: 0–60 segundos aleatório");
  }
} else {
  console.log('\n⚠️  Nó "Delay Aleatório" já existe — pulando.');
}

// ── 4. Salvar workflow ──────────────────────────────────────────────
console.log("\nAtualizando workflow no N8N...");
const putRes = await fetch(`${BASE_URL}/api/v1/workflows/${WF_ID}`, {
  method: "PUT",
  headers: { "X-N8N-API-KEY": API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({
    name: wf.name,
    nodes: wf.nodes,
    connections: wf.connections,
    settings: wf.settings ?? {},
    staticData: wf.staticData ?? null,
  }),
});

if (!putRes.ok) {
  console.error("Erro ao salvar:", putRes.status);
  console.error(await putRes.text());
  process.exit(1);
}

console.log("\n✅ Workflow atualizado com sucesso!");
console.log("\nResumo das mudanças:");
console.log("  ⏱ Cron: a cada 2 minutos (era 1 minuto)");
console.log("  🎲 Delay aleatório: 0–60 segundos antes de cada envio");
console.log("  📊 Intervalo total entre mensagens: 2 a 3 minutos");
console.log("  🔒 Padrão: imprevisível — reduz risco de detecção de bot");
