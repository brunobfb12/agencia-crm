const N8N_URL = "https://n8n-n8n.6jgzku.easypanel.host";
const N8N_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NThiY2U4Ny0yYTdkLTQxMDItYjU1Ni0wMWExZjJhYWVkOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiY2JlMWNkOGUtODIxYi00MmEyLWIzZjYtYjgzZGYwMDUzN2YwIiwiaWF0IjoxNzc4NDczNjMxfQ.qerSQqMlIUjev6-VH_g2gl1PqE28hRm_LzLGyj-UZ6Y";
const NOVA_URL = "https://www.artificialintelligence-news.com/feed/";
const NOVO_NOME = "RSS AI News";

const wf = await fetch(`${N8N_URL}/api/v1/workflows/XvGoZeH61UcjO7g6`, {
  headers: { "X-N8N-API-KEY": N8N_KEY }
}).then(r => r.json());

// Fix node
for (const n of wf.nodes) {
  if (n.name === "RSS HuggingFace") {
    n.name = NOVO_NOME;
    n.parameters.url = NOVA_URL;
    console.log("Node renomeado para:", NOVO_NOME);
  }
  if (n.id === "code_parse") {
    n.parameters.jsCode = n.parameters.jsCode
      .replace('"nome":"HuggingFace","url":"https://huggingface.co/blog/feed.xml","tema":"IA / Claude / LLMs"',
               `"nome":"AI News","url":"${NOVA_URL}","tema":"IA / Claude / LLMs"`);
    console.log("jsCode atualizado");
  }
}

// Fix connections
const c = wf.connections;
if (c["RSS HuggingFace"]) {
  c[NOVO_NOME] = c["RSS HuggingFace"];
  delete c["RSS HuggingFace"];
}
for (const conn of (c["Toda Segunda 8h"]?.main?.[0] ?? [])) {
  if (conn.node === "RSS HuggingFace") conn.node = NOVO_NOME;
}

const res = await fetch(`${N8N_URL}/api/v1/workflows/XvGoZeH61UcjO7g6`, {
  method: "PUT",
  headers: { "X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({
    name: wf.name, nodes: wf.nodes, connections: wf.connections,
    settings: { executionOrder: "v1", saveManualExecutions: true, callerPolicy: "workflowsFromSameOwner" },
  }),
});

const data = await res.json();
if (!res.ok) { console.error("Erro:", JSON.stringify(data)); process.exit(1); }
console.log("✅ Atualizado!");
data.nodes.filter(n => n.name.startsWith("RSS")).forEach(n => console.log(`  ${n.name} → ${n.parameters.url}`));
