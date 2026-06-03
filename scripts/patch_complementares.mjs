import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const N8N_URL = 'https://n8n-n8n.6jgzku.easypanel.host';
const CRM_URL = 'https://ocrmfacil.com.br';
const WF_ID = 'YCanhmW5AKNdvICI';
const API_KEY = process.argv[2];
const SECRET = 'crm2026migra';

if (!API_KEY) { console.error('Uso: node patch_complementares.mjs <N8N_API_KEY>'); process.exit(1); }

// ── Guia de complementares para lojas de tintas ───────────────────────────
const guia = `TINTAS DE PAREDE (acrílica, fosca, acetinada, semibrilho, semiacetinada):
- PRIMER/SELADOR: ofereça quando cliente mencionar parede nova (reboco/gesso/concreto), cor escura sendo coberta por cor clara, descascamento anterior, manchas de umidade ou mofo. Argumento curto: "evita descascar de novo e economiza tinta na aplicação"
- ROLO: só se cliente NÃO for profissional. "Tem rolo? Temos de lã (fosco/acetinado) e espuma (semibrilho) — o tipo certo faz diferença no acabamento final"
- FITA CREPE: quase sempre. "E fita crepe para proteger rodapés e esquadrias?"
- LIXA: quase sempre. "Tem lixa? Preparar a superfície garante que a tinta agarra melhor e dura mais"

ESMALTE SINTÉTICO / ESMALTE À ÁGUA:
- DILUENTE: sempre. Thinner para sintético, água para à base d'água — informe qual usar conforme o produto escolhido
- LIXA DE FERRO (#120-#220): sempre para superfície metálica
- PINCEL: se não foi mencionado na lista do cliente

TEXTURA / GRAFIATO / CIMENTO QUEIMADO:
- DESEMPENADEIRA ou ESPÁTULA: essencial, ofereça sempre
- SELADOR: se parede nova ou área externa

VERNIZ:
- PINCEL específico ou rolo de espuma: sempre
- LIXA FINA (#220+): se madeira nova ou retoque
- AGUARRÁS: se verniz sintético

MASSA CORRIDA / MASSA ACRÍLICA:
- ESPÁTULA: sempre
- LIXA (#120-#180): para após secar

REGRAS DA BALANÇA:
- Profissional/pintor (lista com 3+ itens, termos técnicos, menciona obra/construtora): pule complementares básicos — ele já tem. Foque em confirmar a lista com precisão e agilidade
- Consumidor final (1-2 itens, pergunta sobre aplicação, não sabe metragem): conduza com gentileza, explique brevemente o porquê de cada item
- NUNCA argumente sobre a escolha do produto do cliente — só adicione informação quando for genuinamente útil (ex: cliente quer tinta interna para área externa → avise com cuidado, não com crítica)
- NUNCA force se o cliente recusar — aceite e passe para o próximo item da lista ou para PASSO 1`;

const n8nHeaders = { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json' };

// ── 1. Atualizar N8N ──────────────────────────────────────────────────────
console.log('Buscando workflow N8N...');
const wfRes = await fetch(`${N8N_URL}/api/v1/workflows/${WF_ID}`, { headers: n8nHeaders });
if (!wfRes.ok) { console.error('Erro N8N:', await wfRes.text()); process.exit(1); }
const wf = await wfRes.json();

const newPrompt = readFileSync(join(__dirname, 'prompt_atendimento_ia.js'), 'utf8');
const promptNode = wf.nodes.find(n => n.name === 'Montar Prompt Claude');
if (!promptNode) { console.error('Nó "Montar Prompt Claude" não encontrado'); process.exit(1); }
promptNode.parameters.jsCode = newPrompt;
console.log('✅ Prompt atualizado:', newPrompt.length, 'chars');

const putRes = await fetch(`${N8N_URL}/api/v1/workflows/${WF_ID}`, {
  method: 'PUT', headers: n8nHeaders,
  body: JSON.stringify({ name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: wf.settings, staticData: wf.staticData }),
});
if (!putRes.ok) { console.error('Erro PUT N8N:', await putRes.text()); process.exit(1); }
const wfResult = await putRes.json();
console.log('✅ N8N atualizado:', wfResult.updatedAt);

// ── 2. Popular empresas via API ───────────────────────────────────────────
const empresas = [
  { id: 'cmpobysoo005uby15asbzajzd', nome: 'Paredão Tintas - T9' },
  { id: 'cmpobzlhy005vby15x43yf7ro', nome: 'Paredão Tintas - Av.Rio Verde' },
];

for (const emp of empresas) {
  const r = await fetch(`${CRM_URL}/api/empresas/${emp.id}?secret=${SECRET}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ complementaresGuia: guia }),
  });
  const d = await r.json();
  if (d.complementaresGuia || d.id) {
    console.log(`✅ ${emp.nome}: guia salvo (${guia.length} chars)`);
  } else {
    console.log(`⚠️  ${emp.nome}:`, JSON.stringify(d).slice(0, 100));
  }
}
