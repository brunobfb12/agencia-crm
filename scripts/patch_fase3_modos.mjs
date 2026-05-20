/**
 * Patch Fase 3 — montar_prompt_claude.js → N8N
 * Adiciona modos explícitos de atendimento: RELACIONAR / AQUECER / VENDER
 * baseados em dias desde a última compra.
 *
 * Uso: $env:N8N_API_KEY="sua-chave"; node scripts/patch_fase3_modos.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const N8N_URL = 'https://n8n-n8n.6jgzku.easypanel.host';
const WORKFLOW_ID = 'YCanhmW5AKNdvICI';
const NODE_NAME = 'Montar Prompt Claude';
const API_KEY = process.env.N8N_API_KEY;

if (!API_KEY) {
  console.error('❌ Defina $env:N8N_API_KEY antes de rodar');
  process.exit(1);
}

const novocodigo = readFileSync(
  join(__dirname, '..', 'n8n', 'nodes', 'montar_prompt_claude.js'),
  'utf-8'
);

console.log(`📥 Buscando workflow ${WORKFLOW_ID}...`);
const res = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
  headers: { 'X-N8N-API-KEY': API_KEY },
});
if (!res.ok) {
  console.error('❌ Erro ao buscar workflow:', res.status, await res.text());
  process.exit(1);
}

const workflow = await res.json();
const wf = workflow.data ?? workflow;
const nodes = wf.nodes ?? [];
const node = nodes.find(n => n.name === NODE_NAME);

if (!node) {
  console.error(`❌ Nó "${NODE_NAME}" não encontrado.`);
  nodes.forEach(n => console.log(' -', n.name));
  process.exit(1);
}

node.parameters.jsCode = novocodigo;
console.log(`✏️  Novo código aplicado (${novocodigo.length} chars)`);

const payload = {
  name: wf.name,
  nodes,
  connections: wf.connections,
  settings: wf.settings,
  staticData: wf.staticData || null,
};

console.log(`📤 Enviando atualização...`);
const put = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
  method: 'PUT',
  headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

if (!put.ok) {
  console.error('❌ Erro ao salvar:', put.status, await put.text());
  process.exit(1);
}

console.log(`✅ Nó "${NODE_NAME}" atualizado com sucesso!`);
console.log('\nFase 3 aplicada:');
console.log('  ✅ diasDesdeCompra calculado de vendas[0].criadoEm');
console.log('  ✅ modoConversa: RELACIONAR (≤14d) / AQUECER (≤25d) / VENDER (>25d ou sem compra)');
console.log('  ✅ modoAtualSection com instruções explícitas por modo');
console.log('  ✅ roteiroSection suprimido em RELACIONAR e AQUECER');
