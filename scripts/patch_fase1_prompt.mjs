/**
 * Patch Fase 1 — montar_prompt_claude.js → N8N
 * Aplica as 3 melhorias do ciclo de relacionamento:
 *   1. isPrimeiraMensagem corrigido (conta só ENTRADA)
 *   2. fastTrackSection para compradores recorrentes
 *   3. modoConversaSection para leitura do contexto
 *
 * Uso: $env:N8N_API_KEY="sua-chave"; node scripts/patch_fase1_prompt.mjs
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
const nodes = workflow.nodes ?? workflow.data?.nodes ?? [];
const node = nodes.find(n => n.name === NODE_NAME);

if (!node) {
  console.error(`❌ Nó "${NODE_NAME}" não encontrado. Nós disponíveis:`);
  nodes.forEach(n => console.log(' -', n.name));
  process.exit(1);
}

const codigoAnterior = node.parameters?.jsCode ?? '(vazio)';
console.log(`\n📋 Código atual (primeiros 80 chars):\n${codigoAnterior.slice(0, 80)}...\n`);

node.parameters.jsCode = novocodigo;
console.log(`✏️  Novo código aplicado (${novocodigo.length} chars)`);

const payload = workflow.data ?? workflow;
payload.nodes = nodes;

console.log(`\n📤 Enviando atualização...`);
const put = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
  method: 'PUT',
  headers: {
    'X-N8N-API-KEY': API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
});

if (!put.ok) {
  const err = await put.text();
  console.error('❌ Erro ao salvar:', put.status, err);
  process.exit(1);
}

console.log(`✅ Nó "${NODE_NAME}" atualizado com sucesso!`);
console.log('\nMelhorias aplicadas:');
console.log('  ✅ isPrimeiraMensagem agora conta só mensagens ENTRADA');
console.log('  ✅ fastTrackSection para compradores recorrentes');
console.log('  ✅ modoConversaSection para leitura do contexto da conversa');
