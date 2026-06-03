import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const N8N_URL = 'https://n8n-n8n.6jgzku.easypanel.host';
const WF_ID = 'YCanhmW5AKNdvICI';
const API_KEY = process.argv[2];

if (!API_KEY) { console.error('Uso: node patch_debounce_lock.mjs <API_KEY>'); process.exit(1); }

const headers = { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json' };

console.log('Buscando workflow...');
const wfRes = await fetch(`${N8N_URL}/api/v1/workflows/${WF_ID}`, { headers });
if (!wfRes.ok) { console.error('Erro:', await wfRes.text()); process.exit(1); }
const wf = await wfRes.json();

// ── 1. Atualizar prompt ───────────────────────────────────────────────────
const newPrompt = readFileSync(join(__dirname, 'prompt_atendimento_ia.js'), 'utf8');
const promptNode = wf.nodes.find(n => n.name === 'Montar Prompt Claude');
if (!promptNode) { console.error('Nó "Montar Prompt Claude" não encontrado'); process.exit(1); }
promptNode.parameters.jsCode = newPrompt;
console.log('✅ Prompt atualizado:', newPrompt.length, 'chars');

// ── 2. Wait 3s entre "Filtrar e Extrair" e "Salvar no CRM" ───────────────
const waitExiste = wf.nodes.find(n => n.name === 'Debounce 3s');
if (waitExiste) {
  waitExiste.parameters.amount = 3;
  console.log('⚠️  Node "Debounce 3s" já existe — ajustado para 3s.');
} else {
  wf.nodes.push({
    parameters: { resume: 'timeInterval', amount: 3, unit: 'seconds' },
    id: 'debounce-3s-' + Date.now(),
    name: 'Debounce 3s',
    type: 'n8n-nodes-base.wait',
    typeVersion: 1.1,
    position: [-1872, 192],
    webhookId: 'debounce-3s-001',
  });
  // Filtrar e Extrair → Debounce 3s
  wf.connections['Filtrar e Extrair'].main[0] = [{ node: 'Debounce 3s', type: 'main', index: 0 }];
  // Debounce 3s → Salvar no CRM
  wf.connections['Debounce 3s'] = { main: [[{ node: 'Salvar no CRM', type: 'main', index: 0 }]] };
  console.log('✅ Node "Debounce 3s" adicionado entre Filtrar e Salvar.');
}

// ── 3. IF "Já Processando?" entre "Verificar CRM OK" e "É Vendedor?" ──────
const ifExiste = wf.nodes.find(n => n.name === 'Já Processando?');
if (ifExiste) {
  console.log('⚠️  Node "Já Processando?" já existe — mantido.');
} else {
  wf.nodes.push({
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 1 },
        conditions: [{
          id: 'jp1',
          leftValue: '={{ $json.jaProcessando }}',
          rightValue: true,
          operator: { type: 'boolean', operation: 'true' },
        }],
        combinator: 'and',
      },
    },
    id: 'ja-processando-' + Date.now(),
    name: 'Já Processando?',
    type: 'n8n-nodes-base.if',
    typeVersion: 2,
    position: [-1464, 192],
  });

  // Verificar CRM OK → Já Processando? (em vez de → É Vendedor?)
  const connVerif = wf.connections['Verificar CRM OK'];
  const ignorarNode = connVerif.main[1]?.[0]?.node ?? 'Ignorar (invalido)';
  connVerif.main[0] = [{ node: 'Já Processando?', type: 'main', index: 0 }];

  // Já Processando? → main[0] (true) → Ignorar | main[1] (false) → É Vendedor?
  wf.connections['Já Processando?'] = {
    main: [
      [{ node: ignorarNode, type: 'main', index: 0 }],
      [{ node: 'É Vendedor?', type: 'main', index: 0 }],
    ],
  };
  console.log('✅ Node "Já Processando?" adicionado. True→Ignorar | False→É Vendedor?');
}

// ── 4. Push ───────────────────────────────────────────────────────────────
const body = JSON.stringify({ name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: wf.settings, staticData: wf.staticData });
console.log('Enviando PUT...');
const putRes = await fetch(`${N8N_URL}/api/v1/workflows/${WF_ID}`, { method: 'PUT', headers, body });
if (!putRes.ok) { console.error('Erro no PUT:', await putRes.text()); process.exit(1); }
const result = await putRes.json();
console.log('✅ Workflow atualizado:', result.name, '| updatedAt:', result.updatedAt);
