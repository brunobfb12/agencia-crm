const N8N_URL = "https://n8n-n8n.6jgzku.easypanel.host";
const N8N_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NThiY2U4Ny0yYTdkLTQxMDItYjU1Ni0wMWExZjJhYWVkOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiY2JlMWNkOGUtODIxYi00MmEyLWIzZjYtYjgzZGYwMDUzN2YwIiwiaWF0IjoxNzc4NDczNjMxfQ.qerSQqMlIUjev6-VH_g2gl1PqE28hRm_LzLGyj-UZ6Y";
const WF_ID = "XvGoZeH61UcjO7g6";
const NOVA_URL = "https://news.google.com/rss/search?q=LGPD+ANPD+privacidade&hl=pt-BR&gl=BR&ceid=BR:pt-419";

const wf = await fetch(`${N8N_URL}/api/v1/workflows/${WF_ID}`, {
  headers: { "X-N8N-API-KEY": N8N_KEY }
}).then(r => r.json());

// Fix node
for (const n of wf.nodes) {
  if (n.name === "RSS ANPD") {
    n.name = "RSS LGPD News";
    n.parameters.url = NOVA_URL;
    console.log("Node renomeado para RSS LGPD News");
  }
  if (n.id === "code_parse") {
    n.parameters.jsCode = n.parameters.jsCode.replace(
      '"nome":"ANPD","url":"https://www.gov.br/anpd/pt-br/RSS","tema":"LGPD / Regulação"',
      `"nome":"LGPD News","url":"${NOVA_URL}","tema":"LGPD / Regulação"`
    );
    console.log("jsCode atualizado");
  }
}

// Fix connections
const conns = wf.connections;
if (conns["RSS ANPD"]) {
  conns["RSS LGPD News"] = conns["RSS ANPD"];
  delete conns["RSS ANPD"];
}
for (const c of (conns["Toda Segunda 8h"]?.main?.[0] ?? [])) {
  if (c.node === "RSS ANPD") c.node = "RSS LGPD News";
}

const res = await fetch(`${N8N_URL}/api/v1/workflows/${WF_ID}`, {
  method: "PUT",
  headers: { "X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({
    name: wf.name,
    nodes: wf.nodes,
    connections: wf.connections,
    settings: { executionOrder: "v1", saveManualExecutions: true, callerPolicy: "workflowsFromSameOwner" },
  }),
});

const data = await res.json();
if (!res.ok) { console.error("Erro:", JSON.stringify(data)); process.exit(1); }

console.log("✅ Workflow atualizado!");
console.log("RSS nodes:");
data.nodes.filter(n => n.name.startsWith("RSS")).forEach(n => console.log(`  ${n.name} → ${n.parameters.url}`));
