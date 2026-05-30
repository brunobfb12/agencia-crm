const N8N_URL = "https://n8n-n8n.6jgzku.easypanel.host";
const N8N_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NThiY2U4Ny0yYTdkLTQxMDItYjU1Ni0wMWExZjJhYWVkOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiY2JlMWNkOGUtODIxYi00MmEyLWIzZjYtYjgzZGYwMDUzN2YwIiwiaWF0IjoxNzc4NDczNjMxfQ.qerSQqMlIUjev6-VH_g2gl1PqE28hRm_LzLGyj-UZ6Y";

// 1. Buscar chave do workflow de atendimento
const atend = await fetch(`${N8N_URL}/api/v1/workflows/YCanhmW5AKNdvICI`, {
  headers: { "X-N8N-API-KEY": N8N_KEY }
}).then(r => r.json());

const claudeNodeAtend = atend.nodes.find(n => n.name === "Chamar Claude");
const anthropicKey = claudeNodeAtend?.parameters?.headerParameters?.parameters
  ?.find(h => h.name === "x-api-key")?.value;

if (!anthropicKey) { console.error("Chave não encontrada no workflow de atendimento"); process.exit(1); }
console.log("Chave encontrada no workflow de atendimento ✓");

// 2. Buscar e atualizar workflow do Radar
const wf = await fetch(`${N8N_URL}/api/v1/workflows/XvGoZeH61UcjO7g6`, {
  headers: { "X-N8N-API-KEY": N8N_KEY }
}).then(r => r.json());

const claudeNode = wf.nodes.find(n => n.name === "Claude Analisa");
// Substituir $env.ANTHROPIC_API_KEY pela chave real
for (const h of (claudeNode.parameters.headerParameters.parameters || [])) {
  if (h.name === "x-api-key") {
    h.value = anthropicKey;
    console.log("Header x-api-key atualizado ✓");
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
if (!res.ok) { console.error("Erro ao salvar:", JSON.stringify(data)); process.exit(1); }
console.log("✅ Workflow do Radar atualizado — node Claude Analisa corrigido!");
