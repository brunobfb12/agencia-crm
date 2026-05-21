/**
 * Adiciona options.presence + delay ao sendText do v2
 * O v2.3.7 mostra "digitando..." automaticamente antes de enviar.
 */

const N8N_URL = 'https://n8n-n8n.6jgzku.easypanel.host';
const WORKFLOW_ID = 'YCanhmW5AKNdvICI';
const API_KEY = process.env.N8N_API_KEY;

if (!API_KEY) { console.error('❌ Defina N8N_API_KEY'); process.exit(1); }

const res = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
  headers: { 'X-N8N-API-KEY': API_KEY },
});
const base = await res.json();
const wf = base.data ?? base;

let changes = 0;
for (const node of wf.nodes) {
  if (node.name !== 'Enviar Resposta ao Cliente') continue;
  const p = node.parameters;
  if (!p?.jsonBody) continue;

  const OLD = `text: $('Parsear Resposta IA').item.json.aiResposta, quoted:`;
  const NEW = `text: $('Parsear Resposta IA').item.json.aiResposta, options: { presence: 'composing', delay: 4000 }, quoted:`;

  if (p.jsonBody.includes(OLD)) {
    p.jsonBody = p.jsonBody.replace(OLD, NEW);
    console.log('✏️  Enviar Resposta ao Cliente: delay 4s + composing adicionado');
    changes++;
  }
}

if (changes === 0) {
  console.log('ℹ️  Nada para alterar (já aplicado?)');
  process.exit(0);
}

const put = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
  method: 'PUT',
  headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: wf.name, nodes: wf.nodes,
    connections: wf.connections, settings: wf.settings,
    staticData: wf.staticData || null,
  }),
});

if (!put.ok) { console.error('❌', put.status, await put.text()); process.exit(1); }
console.log('✅ Digitando restaurado — 4 segundos antes de enviar a resposta.');
