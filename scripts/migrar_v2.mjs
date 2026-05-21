/**
 * Migra workflow Atendimento IA de Evolution API v1 (8081) para v2 (8080)
 * Mudanças aplicadas nó a nó:
 *   1. URLs: 8081 → 8080
 *   2. sendText: remove wrapper textMessage, usa campo "text" direto
 *   3. sendMedia: remove wrapper mediaMessage, campos vão para o root
 *   4. Notificar Vendedor: mesmo ajuste de sendText
 */

const N8N_URL = 'https://n8n-n8n.6jgzku.easypanel.host';
const WORKFLOW_ID = 'YCanhmW5AKNdvICI';
const API_KEY = process.env.N8N_API_KEY;

if (!API_KEY) { console.error('❌ Defina N8N_API_KEY=...'); process.exit(1); }

console.log('📥 Buscando workflow...');
const res = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
  headers: { 'X-N8N-API-KEY': API_KEY },
});
const base = await res.json();
const wf = base.data ?? base;
const nodes = wf.nodes;

let changes = 0;

for (const node of nodes) {
  const p = node.parameters;
  if (!p) continue;

  // 1. URLs: 8081 → 8080
  if (p.url && p.url.includes('8081')) {
    p.url = p.url.replaceAll('8081', '8080');
    console.log(`  🔗 URL atualizada: ${node.name}`);
    changes++;
  }

  if (!p.jsonBody) continue;
  const original = p.jsonBody;

  // 2. Enviar Resposta ao Cliente: textMessage.text → text (raiz)
  if (node.name === 'Enviar Resposta ao Cliente') {
    p.jsonBody = p.jsonBody.replace(
      /textMessage:\s*\{\s*text:\s*(\$\('Parsear Resposta IA'\)\.item\.json\.aiResposta)\s*\}/,
      'text: $1'
    );
    if (p.jsonBody !== original) { console.log(`  ✏️  ${node.name}: textMessage → text`); changes++; }
  }

  // 3. Notificar Vendedor: textMessage.text → text
  if (node.name === 'Notificar Vendedor') {
    p.jsonBody = p.jsonBody.replace(
      /textMessage:\s*\{\s*text:\s*(.*?)\s*\}\s*\}/,
      'text: $1 }'
    );
    if (p.jsonBody !== original) { console.log(`  ✏️  ${node.name}: textMessage → text`); changes++; }
  }

  // 4. Resposta Mídia (resposta imediata): textMessage → text
  if (node.name === 'Resposta Mídia') {
    p.jsonBody = p.jsonBody.replace(
      /textMessage:\s*\{\s*text:\s*(\$json\.respostaImediata)\s*\}/,
      'text: $1'
    );
    if (p.jsonBody !== original) { console.log(`  ✏️  ${node.name}: textMessage → text`); changes++; }
  }

  // 5. Enviar Mídia ao Cliente: mediaMessage: { ... } → campos no root
  if (node.name === 'Enviar Mídia ao Cliente') {
    p.jsonBody = p.jsonBody.replace(
      /mediaMessage:\s*\{(\s*mediatype:[^,]+,\s*media:[^,]+,\s*fileName:[^,]+,\s*caption:[^}]+)\}/,
      '$1'
    );
    // Remove vírgula extra antes do que era mediaMessage
    p.jsonBody = p.jsonBody.replace(/,\s*mediaMessage:/, ',');
    if (p.jsonBody !== original) { console.log(`  ✏️  ${node.name}: mediaMessage → root`); changes++; }
  }
}

if (changes === 0) {
  console.log('ℹ️  Nenhuma mudança necessária (já migrado?)');
  process.exit(0);
}

console.log(`\n📤 Salvando (${changes} mudança(s))...`);
const put = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
  method: 'PUT',
  headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: wf.name, nodes, connections: wf.connections,
    settings: wf.settings, staticData: wf.staticData || null,
  }),
});

if (!put.ok) {
  console.error('❌ Erro:', put.status, (await put.text()).slice(0, 400));
  process.exit(1);
}

console.log('✅ Workflow migrado para Evolution API v2 (porta 8080)!');
console.log('\nPróximos passos:');
console.log('  1. Configure webhook da instância no port 8080');
console.log('  2. Escaneie QR: http://201.76.43.149:8080/manager');
console.log('  3. Re-escaneie studio_thaisypolicena também');
