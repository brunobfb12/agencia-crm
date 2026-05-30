import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const N8N_URL = 'https://n8n-n8n.6jgzku.easypanel.host';
const WF_ID = 'YCanhmW5AKNdvICI';
const API_KEY = process.argv[2];

if (!API_KEY) {
  console.error('Uso: node update_prompt_node.mjs <API_KEY>');
  process.exit(1);
}

const headers = { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json' };

console.log('Buscando workflow...');
const wfRes = await fetch(`${N8N_URL}/api/v1/workflows/${WF_ID}`, { headers });
if (!wfRes.ok) { console.error('Erro ao buscar workflow:', await wfRes.text()); process.exit(1); }
const wf = await wfRes.json();

const newCode = readFileSync(join(__dirname, 'prompt_atendimento_ia.js'), 'utf8');

const node = wf.nodes.find(n => n.name === 'Montar Prompt Claude');
if (!node) { console.error('Nó "Montar Prompt Claude" não encontrado'); process.exit(1); }

const oldLen = node.parameters.jsCode?.length ?? 0;
node.parameters.jsCode = newCode;
console.log(`Código: ${oldLen} → ${newCode.length} chars`);

const body = JSON.stringify({ name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: wf.settings, staticData: wf.staticData });

console.log('Enviando PUT...');
const putRes = await fetch(`${N8N_URL}/api/v1/workflows/${WF_ID}`, { method: 'PUT', headers, body });
if (!putRes.ok) { console.error('Erro no PUT:', await putRes.text()); process.exit(1); }
const result = await putRes.json();
console.log('✅ Workflow atualizado:', result.name, '| updatedAt:', result.updatedAt);
