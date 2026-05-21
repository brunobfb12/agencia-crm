/**
 * Patch @lid fix no workflow Atendimento IA
 * Quando isLid=true, usa jid completo (ex: 223007586967668@lid)
 * em vez do número numeric que Evolution API não resolve.
 */

const N8N_URL = 'https://n8n-n8n.6jgzku.easypanel.host';
const WORKFLOW_ID = 'YCanhmW5AKNdvICI';
const API_KEY = process.env.N8N_API_KEY;

if (!API_KEY) {
  console.error('❌ Defina N8N_API_KEY=... node scripts/patch_lid_fix.mjs');
  process.exit(1);
}

console.log('📥 Buscando workflow...');
const res = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
  headers: { 'X-N8N-API-KEY': API_KEY },
});
const workflow = await res.json();
const wf = workflow.data ?? workflow;
const nodes = wf.nodes ?? [];

// --- Expressões originais e corrigidas ---

const OLD_SIMULAR = `JSON.stringify({ number: $('Salvar no CRM').item.json.telefonePrincipal || $('Parsear Resposta IA').item.json.telefone, presence: 'composing' })`;
const NEW_SIMULAR = `JSON.stringify({ number: $('Filtrar e Extrair').item.json.isLid ? $('Filtrar e Extrair').item.json.jid : ($('Salvar no CRM').item.json.telefonePrincipal || $('Parsear Resposta IA').item.json.telefone), presence: 'composing' })`;

const OLD_ENVIAR = `JSON.stringify({ number: $('Salvar no CRM').item.json.telefonePrincipal || $('Filtrar e Extrair').item.json.telefone, textMessage: { text: $('Parsear Resposta IA').item.json.aiResposta }, quoted: { key: { remoteJid: $('Filtrar e Extrair').item.json.jid, fromMe: false, id: $('Filtrar e Extrair').item.json.messageId } } })`;
const NEW_ENVIAR = `JSON.stringify({ number: $('Filtrar e Extrair').item.json.isLid ? $('Filtrar e Extrair').item.json.jid : ($('Salvar no CRM').item.json.telefonePrincipal || $('Filtrar e Extrair').item.json.telefone), textMessage: { text: $('Parsear Resposta IA').item.json.aiResposta }, quoted: { key: { remoteJid: $('Filtrar e Extrair').item.json.jid, fromMe: false, id: $('Filtrar e Extrair').item.json.messageId } } })`;

let patched = 0;

for (const node of nodes) {
  const body = node.parameters?.jsonBody;
  if (!body) continue;

  if (body.includes(OLD_SIMULAR)) {
    node.parameters.jsonBody = body.replace(OLD_SIMULAR, NEW_SIMULAR);
    console.log(`✏️  Patched: ${node.name} (Simular Digitando)`);
    patched++;
  } else if (body.includes(OLD_ENVIAR)) {
    node.parameters.jsonBody = body.replace(OLD_ENVIAR, NEW_ENVIAR);
    console.log(`✏️  Patched: ${node.name} (Enviar Resposta)`);
    patched++;
  }
}

if (patched === 0) {
  console.error('❌ Nenhum nó encontrado com as expressões esperadas.');
  console.error('Verifique se o workflow já foi atualizado ou se as expressões mudaram.');
  process.exit(1);
}

console.log(`\n📤 Enviando (${patched} nó(s) alterado(s))...`);
const put = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
  method: 'PUT',
  headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: wf.name,
    nodes,
    connections: wf.connections,
    settings: wf.settings,
    staticData: wf.staticData || null,
  }),
});

if (!put.ok) {
  console.error('❌ Erro ao salvar:', put.status, await put.text());
  process.exit(1);
}

console.log('✅ Workflow atualizado!');
console.log('Fix aplicado:');
console.log('  ✅ Simular Digitando → usa jid quando isLid=true');
console.log('  ✅ Enviar Resposta ao Cliente → usa jid quando isLid=true');
