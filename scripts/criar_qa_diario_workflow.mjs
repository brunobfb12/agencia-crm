/**
 * Cria workflow "QA Diário IA - FácilCRM" no N8N
 * Roda todo dia às 08:00 BRT (11:00 UTC)
 * Chama /api/analise/qa-diario e envia relatório ao admin via WhatsApp
 *
 * Uso: node scripts/criar_qa_diario_workflow.mjs <N8N_API_KEY>
 */

const N8N_URL = 'https://n8n-n8n.6jgzku.easypanel.host';
const API_KEY = process.argv[2];
const ADMIN_PHONE = '5562984991999'; // número do admin (Bruno)
const ADMIN_INSTANCIA = 'o_crm_facil';
const EVO_URL = 'http://201.76.43.149:8080';
const EVO_KEY = 'SuaChaveSecreta123';

if (!API_KEY) {
  console.error('Uso: node scripts/criar_qa_diario_workflow.mjs <N8N_API_KEY>');
  process.exit(1);
}

const headers = { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json' };

const workflow = {
  name: 'QA Diário IA - FácilCRM',
  nodes: [
    {
      id: 'qa-node-0001',
      name: 'Cron 8h Diário',
      type: 'n8n-nodes-base.scheduleTrigger',
      typeVersion: 1.2,
      position: [0, 300],
      parameters: {
        rule: {
          interval: [{ field: 'cronExpression', expression: '0 11 * * *' }],
        },
      },
    },
    {
      id: 'qa-node-0002',
      name: 'Rodar QA',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [240, 300],
      parameters: {
        method: 'POST',
        url: 'https://ocrmfacil.com.br/api/analise/qa-diario',
        sendHeaders: true,
        headerParameters: { parameters: [{ name: 'Content-Type', value: 'application/json' }] },
        sendBody: true,
        specifyBody: 'json',
        jsonBody: '={ JSON.stringify({ secret: "crm2026migra", horas: 24 }) }',
        options: { response: { response: { neverError: true } } },
      },
    },
    {
      id: 'qa-node-0003',
      name: 'Tem Falhas?',
      type: 'n8n-nodes-base.if',
      typeVersion: 2,
      position: [480, 300],
      parameters: {
        conditions: {
          options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 1 },
          conditions: [{
            id: 'qa-cond-1',
            leftValue: '={{ $json.totalFalhas ?? 0 }}',
            rightValue: 0,
            operator: { type: 'number', operation: 'gt' },
          }],
          combinator: 'and',
        },
      },
    },
    {
      id: 'qa-node-0004',
      name: 'Montar Relatório',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [720, 200],
      parameters: {
        jsCode: `const d = $input.item.json;
const linhas = [];
linhas.push('🔍 *QA Diário IA — ' + new Date().toLocaleDateString('pt-BR') + '*');
linhas.push('📊 ' + d.empresasAnalisadas + ' empresas | ' + d.totalFalhas + ' falhas | ' + d.totalCorrecoesSalvas + ' correções salvas');
linhas.push('');
for (const r of (d.resultados || [])) {
  if (!r.falhasEncontradas) continue;
  linhas.push('🏢 *' + r.empresa + '*');
  linhas.push('_' + (r.resumo || '') + '_');
  for (const f of (r.falhas || []).slice(0,3)) {
    const icon = {json_exposto:'🚨',empresa_errada:'🚨',info_errada:'⚠️',oportunidade_perdida:'💰',loop_sem_avanco:'🔄',fallback_ativado:'⚡'}[f.tipo] || '⚠️';
    linhas.push(icon + ' [' + f.tipo + '] ' + f.descricao);
    if (f.correcao) linhas.push('   ✏️ ' + f.correcao);
  }
  linhas.push('');
}
if (d.totalCorrecoesSalvas > 0) {
  linhas.push('✅ ' + d.totalCorrecoesSalvas + ' correção(ões) aplicadas automaticamente no prompt da IA.');
}
return [{ json: { mensagem: linhas.join('\\n') } }];`,
      },
    },
    {
      id: 'qa-node-0005',
      name: 'Notificar Admin',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [960, 200],
      parameters: {
        method: 'POST',
        url: `${EVO_URL}/message/sendText/${ADMIN_INSTANCIA}`,
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: 'apikey', value: EVO_KEY },
            { name: 'Content-Type', value: 'application/json' },
          ],
        },
        sendBody: true,
        specifyBody: 'json',
        jsonBody: `={{ JSON.stringify({ number: "${ADMIN_PHONE}", text: $json.mensagem, options: { presence: "composing", delay: 2000 } }) }}`,
        options: {},
      },
    },
    {
      id: 'qa-node-0006',
      name: 'Sem Falhas — OK',
      type: 'n8n-nodes-base.noOp',
      typeVersion: 1,
      position: [720, 400],
      parameters: {},
    },
  ],
  connections: {
    'Cron 8h Diário': { main: [[{ node: 'Rodar QA', type: 'main', index: 0 }]] },
    'Rodar QA': { main: [[{ node: 'Tem Falhas?', type: 'main', index: 0 }]] },
    'Tem Falhas?': {
      main: [
        [{ node: 'Montar Relatório', type: 'main', index: 0 }],
        [{ node: 'Sem Falhas — OK', type: 'main', index: 0 }],
      ],
    },
    'Montar Relatório': { main: [[{ node: 'Notificar Admin', type: 'main', index: 0 }]] },
  },
  settings: { executionOrder: 'v1' },
  staticData: null,
};

console.log('Criando workflow QA Diário IA...');
const res = await fetch(`${N8N_URL}/api/v1/workflows`, {
  method: 'POST',
  headers,
  body: JSON.stringify(workflow),
});

if (!res.ok) {
  console.error('Erro ao criar:', await res.text());
  process.exit(1);
}

const created = await res.json();
console.log('Workflow criado. ID:', created.id);

// Ativar
await fetch(`${N8N_URL}/api/v1/workflows/${created.id}/activate`, { method: 'POST', headers });
console.log('✅ Workflow "QA Diário IA - FácilCRM" ativo. Roda todo dia às 08h BRT.');
console.log('ID para referência:', created.id);
