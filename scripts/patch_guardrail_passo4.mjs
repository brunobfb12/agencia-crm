import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const N8N_URL = 'https://n8n-n8n.6jgzku.easypanel.host';
const WF_ID = 'YCanhmW5AKNdvICI';
const API_KEY = process.argv[2];

if (!API_KEY) {
  console.error('Uso: node patch_guardrail_passo4.mjs <API_KEY>');
  process.exit(1);
}

const headers = { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json' };

console.log('Buscando workflow...');
const wfRes = await fetch(`${N8N_URL}/api/v1/workflows/${WF_ID}`, { headers });
if (!wfRes.ok) { console.error('Erro ao buscar workflow:', await wfRes.text()); process.exit(1); }
const wf = await wfRes.json();

// ── 1. Atualizar prompt "Montar Prompt Claude" ────────────────────────────
const newPromptCode = readFileSync(join(__dirname, 'prompt_atendimento_ia.js'), 'utf8');
const promptNode = wf.nodes.find(n => n.name === 'Montar Prompt Claude');
if (!promptNode) { console.error('Nó "Montar Prompt Claude" não encontrado'); process.exit(1); }
const oldPromptLen = promptNode.parameters.jsCode?.length ?? 0;
promptNode.parameters.jsCode = newPromptCode;
console.log(`Prompt: ${oldPromptLen} → ${newPromptCode.length} chars`);

// ── 2. Verificar se guardrail já existe ───────────────────────────────────
const jaExiste = wf.nodes.find(n => n.name === 'Guardrail PASSO 4');
if (jaExiste) {
  console.log('⚠️  Node "Guardrail PASSO 4" já existe — só atualizando o código.');
  jaExiste.parameters.jsCode = guardrailCode();
} else {
  // ── 3. Adicionar node guardrail entre "Parsear Resposta IA" e "Tem Dados p/ Atualizar?" ──
  const guardrailNode = {
    parameters: { jsCode: guardrailCode() },
    id: 'guardrail-passo4-' + Date.now(),
    name: 'Guardrail PASSO 4',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [-770, 80],
  };
  wf.nodes.push(guardrailNode);

  // Redirecionar: Parsear Resposta IA → Guardrail PASSO 4
  if (wf.connections['Parsear Resposta IA']) {
    wf.connections['Parsear Resposta IA'].main[0] = [
      { node: 'Guardrail PASSO 4', type: 'main', index: 0 }
    ];
  }

  // Guardrail PASSO 4 → Tem Dados p/ Atualizar?
  wf.connections['Guardrail PASSO 4'] = {
    main: [[{ node: 'Tem Dados p/ Atualizar?', type: 'main', index: 0 }]]
  };

  console.log('✅ Node "Guardrail PASSO 4" adicionado entre Parsear e Tem Dados.');
}

// ── 4. Push ────────────────────────────────────────────────────────────────
const body = JSON.stringify({
  name: wf.name,
  nodes: wf.nodes,
  connections: wf.connections,
  settings: wf.settings,
  staticData: wf.staticData,
});

console.log('Enviando PUT...');
const putRes = await fetch(`${N8N_URL}/api/v1/workflows/${WF_ID}`, { method: 'PUT', headers, body });
if (!putRes.ok) { console.error('Erro no PUT:', await putRes.text()); process.exit(1); }
const result = await putRes.json();
console.log('✅ Workflow atualizado:', result.name, '| updatedAt:', result.updatedAt);

// ── Código do guardrail ────────────────────────────────────────────────────
function guardrailCode() {
  return `const ai = $input.item.json;
const resposta = (ai.aiResposta || '').toLowerCase();
const leadStatus = (ai.lead && ai.lead.status) || 'LEAD';

// Status onde o vendedor já foi notificado — não re-notificar
const vendedorJaNotificado = ['NEGOCIACAO', 'AGENDADO', 'VENDA_REALIZADA', 'POS_VENDA'].includes(leadStatus);

if (!vendedorJaNotificado) {
  // Padrões que indicam que a IA completou o PASSO 4 (encaminhar ao vendedor)
  const passo4Patterns = [
    'time de vendas',
    'passo seu pedido',
    'passo sua lista',
    'encaminho sua lista',
    'encaminho seu pedido',
    'vou passar sua lista',
    'vou passar seu pedido',
    'vendedor calcular',
    'vendedor vai te enviar o valor',
    'vendedor vai te chamar',
    'vendedor vai te passar',
    'ja passo pro vendedor',
    'já passo pro vendedor',
    'ja passo seu pedido',
    'já passo seu pedido',
  ];

  const isPasso4 = passo4Patterns.some(p => resposta.includes(p));

  // Força NEGOCIACAO + notificarVendedor se o texto indica PASSO 4
  // mas o JSON não foi preenchido corretamente pela IA
  if (isPasso4 && !ai.novoStatus) {
    ai.novoStatus = 'NEGOCIACAO';
    ai.notificarVendedor = true;
  }
}

return [{ json: ai }];`;
}
