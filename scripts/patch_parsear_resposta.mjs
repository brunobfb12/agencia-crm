/**
 * Patch parsear_resposta_ia.js → N8N
 * Adiciona notificarGerente no catch do JSON parse para alertar falhas silenciosas.
 *
 * Uso: $env:N8N_API_KEY="sua-chave"; node scripts/patch_parsear_resposta.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const N8N_URL = 'https://n8n-n8n.6jgzku.easypanel.host';
const WORKFLOW_ID = 'YCanhmW5AKNdvICI';
const NODE_NAME = 'Parsear Resposta IA';
const API_KEY = process.env.N8N_API_KEY;

if (!API_KEY) {
  console.error('❌ Defina $env:N8N_API_KEY antes de rodar');
  process.exit(1);
}

const novocodigo = readFileSync(
  join(__dirname, '..', 'n8n', 'nodes', 'parsear_resposta_ia.js'),
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

console.log('\nNós disponíveis:');
nodes.forEach(n => console.log(' -', n.name));

const node = nodes.find(n => n.name === NODE_NAME);

if (!node) {
  console.error(`\n❌ Nó "${NODE_NAME}" não encontrado.`);
  console.error('Verifique o nome exato acima e ajuste NODE_NAME no script.');
  process.exit(1);
}

node.parameters.jsCode = novocodigo;
console.log(`\n✏️  Novo código aplicado ao nó "${NODE_NAME}" (${novocodigo.length} chars)`);

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
console.log('\nFix aplicado:');
console.log('  ✅ catch do JSON parse agora define notificarGerente: true');
console.log('  ✅ mensagemGerente inclui o erro real para diagnóstico');
