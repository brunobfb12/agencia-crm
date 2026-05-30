const N8N_URL = "https://n8n-n8n.6jgzku.easypanel.host";
const N8N_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NThiY2U4Ny0yYTdkLTQxMDItYjU1Ni0wMWExZjJhYWVkOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiY2JlMWNkOGUtODIxYi00MmEyLWIzZjYtYjgzZGYwMDUzN2YwIiwiaWF0IjoxNzc4NDczNjMxfQ.qerSQqMlIUjev6-VH_g2gl1PqE28hRm_LzLGyj-UZ6Y";
const EVO_KEY = "SuaChaveSecreta123";

const wf = await fetch(`${N8N_URL}/api/v1/workflows/XvGoZeH61UcjO7g6`, {
  headers: { "X-N8N-API-KEY": N8N_KEY }
}).then(r => r.json());

const wppNode = wf.nodes.find(n => n.name === "Enviar no WhatsApp");
for (const h of (wppNode.parameters.headerParameters.parameters || [])) {
  if (h.name === "apikey") {
    h.value = EVO_KEY;
    console.log("Header apikey atualizado ✓");
  }
}

const res = await fetch(`${N8N_URL}/api/v1/workflows/XvGoZeH61UcjO7g6`, {
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
console.log("✅ Node 'Enviar no WhatsApp' corrigido!");
