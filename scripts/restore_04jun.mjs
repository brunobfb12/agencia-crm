import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';

const __dir = dirname(fileURLToPath(import.meta.url));

const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZjg5NmRlNS1jNTQ3LTQ2ZmMtOGUxMC00ODZkOWJhZjRmYzgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMGY5OWViNTItNTExZC00OGQzLTg2NjItODBkNTZiOTE2YWM0IiwiaWF0IjoxNzgwODQ1NjYyfQ.Q25suaqjXq_yzf4J3FJF1kBkN2siaf-rRH1dVN4N4u4";
const BASE = "https://n8n-n8n.6jgzku.easypanel.host";

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'X-N8N-API-KEY': API_KEY,
        'Content-Type': 'application/json',
        ...(data && { 'Content-Length': Buffer.byteLength(data) })
      },
      rejectUnauthorized: false
    };
    const r = https.request(options, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}: ${d.slice(0, 300)}`));
        else resolve(JSON.parse(d));
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

// Mapeamento: nome do nó → arquivo local
const NODE_FILES = {
  'Filtrar e Extrair':   join(__dir, '../n8n/nodes/filtrar_e_extrair.js'),
  'Montar Prompt Claude': join(__dir, '../n8n/nodes/montar_prompt_claude.js'),
  'Parsear Resposta IA': join(__dir, '../n8n/nodes/parsear_resposta_ia.js'),
  'Preparar Audio Binário': join(__dir, '../n8n/nodes/preparar_audio_bin_rio.js'),
  'Preparar Imagem':     join(__dir, '../n8n/nodes/preparar_imagem.js'),
  'Preparar Documento':  join(__dir, '../n8n/nodes/preparar_documento.js'),
  'Mesclar Transcrição': join(__dir, '../n8n/nodes/mesclar_transcri_o.js'),
};

// Lê workflow_live.json (03/06 base)
const wf = JSON.parse(readFileSync(join(__dir, 'workflow_live.json'), 'utf8'));
console.log(`\n📂 Workflow carregado: "${wf.name}" (${wf.nodes.length} nós)`);

// Atualiza cada nó com o código local mais recente
let updated = 0;
for (const [nodeName, filePath] of Object.entries(NODE_FILES)) {
  const node = wf.nodes.find(n => n.name === nodeName);
  if (!node) { console.log(`  ⚠️  Nó não encontrado: ${nodeName}`); continue; }
  try {
    const code = readFileSync(filePath, 'utf8');
    node.parameters.jsCode = code;
    console.log(`  ✅ ${nodeName} atualizado`);
    updated++;
  } catch {
    console.log(`  ⚠️  Arquivo não encontrado: ${filePath}`);
  }
}
console.log(`\n${updated} nós atualizados com código local\n`);

// Verifica se o workflow já existe no N8N
const originalId = wf.id; // YCanhmW5AKNdvICI
let existingId = null;

console.log('🔍 Verificando workflows existentes no N8N...');
try {
  const list = await req('GET', '/api/v1/workflows?limit=50');
  const existing = list.data?.find(w => w.id === originalId || w.name === wf.name);
  if (existing) {
    existingId = existing.id;
    console.log(`  ✅ Encontrado: "${existing.name}" (ID: ${existingId})`);
  } else {
    console.log('  ℹ️  Nenhum workflow com esse nome/ID encontrado — será criado novo');
  }
} catch (e) {
  console.log('  ⚠️  Erro ao listar workflows:', e.message);
}

// Prepara body para envio
const body = {
  name: wf.name,
  nodes: wf.nodes,
  connections: wf.connections,
  settings: wf.settings || {},
  staticData: wf.staticData || null,
};

let result;
if (existingId) {
  console.log(`\n📤 Atualizando workflow existente (PUT /${existingId})...`);
  result = await req('PUT', `/api/v1/workflows/${existingId}`, body);
} else {
  console.log('\n📤 Criando novo workflow (POST)...');
  result = await req('POST', '/api/v1/workflows', body);
}

const newId = result.id;
console.log(`  ✅ Workflow salvo! ID: ${newId}`);

// Ativa o workflow
console.log('\n▶️  Ativando workflow...');
try {
  await req('POST', `/api/v1/workflows/${newId}/activate`);
  console.log('  ✅ Ativo!');
} catch (e) {
  console.log('  ⚠️  Erro ao ativar (ative manualmente no N8N):', e.message);
}

console.log(`\n🎉 Restauração concluída!`);
console.log(`   URL: ${BASE}/workflow/${newId}`);
console.log(`\n⚠️  IMPORTANTE: verifique as credenciais (Anthropic, Evolution, Groq) no N8N após importar.`);
