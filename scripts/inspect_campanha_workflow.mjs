/**
 * Inspeciona o workflow de campanhas para encontrar nós de delay/wait
 * Uso: node scripts/inspect_campanha_workflow.mjs SUA_API_KEY
 */
const API_KEY  = process.argv[2];
const BASE_URL = "https://n8n-n8n.6jgzku.easypanel.host";
const WF_ID    = "TtxFxrOR5ca5PMHm";

if (!API_KEY) { console.error("Uso: node inspect_campanha_workflow.mjs SUA_API_KEY"); process.exit(1); }

const res = await fetch(`${BASE_URL}/api/v1/workflows/${WF_ID}`, {
  headers: { "X-N8N-API-KEY": API_KEY, "Content-Type": "application/json" },
});

if (!res.ok) { console.error("Erro ao buscar workflow:", res.status, await res.text()); process.exit(1); }

const wf = await res.json();
console.log(`\n=== ${wf.name} (${WF_ID}) ===\n`);

for (const node of wf.nodes) {
  const type = node.type.split(".").pop();
  console.log(`[${type}] "${node.name}"`);

  // Wait node
  if (node.type === "n8n-nodes-base.wait") {
    console.log("  → WAIT NODE");
    console.log("  → params:", JSON.stringify(node.parameters, null, 2));
  }

  // Code node com sleep / delay
  if (node.type === "n8n-nodes-base.code") {
    const code = node.parameters?.jsCode || node.parameters?.pythonCode || "";
    if (/sleep|delay|setTimeout|wait/i.test(code)) {
      console.log("  → CODE NODE com delay");
      console.log("  → código:", code.slice(0, 400));
    }
  }

  // HTTP Request com delay/presença
  if (node.type === "n8n-nodes-base.httpRequest") {
    const url = node.parameters?.url || "";
    const body = JSON.stringify(node.parameters?.body || {});
    if (/delay|presence|composing/i.test(url + body)) {
      console.log("  → HTTP REQUEST com delay/presença");
      console.log("  → url:", url);
    }
  }

  // Set / Function com números grandes (ms → segundos)
  if (["n8n-nodes-base.set", "n8n-nodes-base.function"].includes(node.type)) {
    const val = JSON.stringify(node.parameters || "");
    if (/\d{4,}/.test(val)) {
      console.log("  → SET/FUNCTION com valor numérico grande (possível ms)");
      console.log("  → params:", val.slice(0, 300));
    }
  }
}

console.log("\n=== FIM DA INSPEÇÃO ===");
