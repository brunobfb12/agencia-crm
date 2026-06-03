import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const N8N_URL = 'https://n8n-n8n.6jgzku.easypanel.host';
const WF_ID = 'YCanhmW5AKNdvICI';
const API_KEY = process.argv[2];

if (!API_KEY) { console.error('Uso: node patch_prompt_cache.mjs <API_KEY>'); process.exit(1); }

const headers = { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json' };

console.log('Buscando workflow...');
const wfRes = await fetch(`${N8N_URL}/api/v1/workflows/${WF_ID}`, { headers });
if (!wfRes.ok) { console.error('Erro:', await wfRes.text()); process.exit(1); }
const wf = await wfRes.json();

// 1. Atualizar prompt com os novos blocos de cache
const newPrompt = readFileSync(join(__dirname, 'prompt_atendimento_ia.js'), 'utf8');
const promptNode = wf.nodes.find(n => n.name === 'Montar Prompt Claude');
if (!promptNode) { console.error('Nó "Montar Prompt Claude" não encontrado'); process.exit(1); }
promptNode.parameters.jsCode = newPrompt;
console.log('✅ Prompt atualizado:', newPrompt.length, 'chars');

// 2. Adicionar header anthropic-beta ao node "Chamar Claude"
const claudeNode = wf.nodes.find(n => n.name === 'Chamar Claude');
if (!claudeNode) { console.error('Nó "Chamar Claude" não encontrado'); process.exit(1); }

const params = claudeNode.parameters;
if (!params.headerParameters) params.headerParameters = { parameters: [] };
if (!params.sendHeaders) params.sendHeaders = true;

const headerParams = params.headerParameters.parameters || [];
const jaTemBeta = headerParams.some(h => h.name === 'anthropic-beta');
if (!jaTemBeta) {
  headerParams.push({ name: 'anthropic-beta', value: 'prompt-caching-2024-07-31' });
  params.headerParameters.parameters = headerParams;
  console.log('✅ Header anthropic-beta adicionado ao "Chamar Claude"');
} else {
  console.log('⚠️  Header anthropic-beta já existia');
}

// 3. Push
const body = JSON.stringify({ name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: wf.settings, staticData: wf.staticData });
console.log('Enviando PUT...');
const putRes = await fetch(`${N8N_URL}/api/v1/workflows/${WF_ID}`, { method: 'PUT', headers, body });
if (!putRes.ok) { console.error('Erro no PUT:', await putRes.text()); process.exit(1); }
const result = await putRes.json();
console.log('✅ Workflow atualizado:', result.name, '| updatedAt:', result.updatedAt);
