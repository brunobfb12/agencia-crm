import { readFileSync } from 'fs';

const N8N_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NThiY2U4Ny0yYTdkLTQxMDItYjU1Ni0wMWExZjJhYWVkOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiY2JlMWNkOGUtODIxYi00MmEyLWIzZjYtYjgzZGYwMDUzN2YwIiwiaWF0IjoxNzc4NDczNjMxfQ.qerSQqMlIUjev6-VH_g2gl1PqE28hRm_LzLGyj-UZ6Y";
const BASE = "https://n8n-n8n.6jgzku.easypanel.host/api/v1";
const WF_FILE = "C:/Users/USUARIO/agencia-crm/workflow_current.json";

const headers = { "X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json" };

const wf = JSON.parse(readFileSync(WF_FILE, 'utf8'));
const wfId = wf.id;

if (!wfId) {
  console.error("Workflow ID não encontrado no arquivo");
  process.exit(1);
}

console.log(`Deploying workflow "${wf.name}" (${wfId})...`);

// Build update payload — N8N API PUT expects only these fields
const payload = {
  name: wf.name,
  nodes: wf.nodes,
  connections: wf.connections,
  settings: wf.settings,
  staticData: wf.staticData || null,
};

const res = await fetch(`${BASE}/workflows/${wfId}`, {
  method: "PUT",
  headers,
  body: JSON.stringify(payload),
});

const data = await res.json();

if (!res.ok) {
  console.error("Erro:", res.status, JSON.stringify(data, null, 2));
  process.exit(1);
}

console.log(`✅ Workflow atualizado com sucesso!`);
console.log(`   Nome: ${data.name}`);
console.log(`   Ativo: ${data.active}`);
console.log(`   Nodes: ${data.nodes?.length}`);

// Verify aprendizados is in the deployed code
const promptNode = data.nodes?.find(n => n.name === 'Montar Prompt Claude');
if (promptNode?.parameters?.jsCode?.includes('aprendizadosSection')) {
  console.log(`✅ aprendizadosSection confirmado no node "Montar Prompt Claude"`);
} else {
  console.warn(`⚠️  aprendizadosSection NÃO encontrado no node após deploy`);
}
