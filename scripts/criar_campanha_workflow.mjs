const N8N_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NThiY2U4Ny0yYTdkLTQxMDItYjU1Ni0wMWExZjJhYWVkOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiY2JlMWNkOGUtODIxYi00MmEyLWIzZjYtYjgzZGYwMDUzN2YwIiwiaWF0IjoxNzc4NDczNjMxfQ.qerSQqMlIUjev6-VH_g2gl1PqE28hRm_LzLGyj-UZ6Y";
const BASE = "https://n8n-n8n.6jgzku.easypanel.host/api/v1";
const EVO  = "http://201.76.43.149:8081";
const CRM  = "https://ocrmfacil.com.br";

const headers = { "X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json" };

// ---------------------------------------------------------------------------
// Code: Formatar + Humanizar mensagem (anti-spam)
// ---------------------------------------------------------------------------
const jsFormatar = `
const item = $input.item.json;
const nomeCompleto = item.nomeCliente || 'Cliente';
const primeiroNome = nomeCompleto.split(' ')[0];

// 1. Substituir {nome}
let msg = (item.mensagem || '').replace(/\\{nome\\}/g, primeiroNome);

// 2. Variações de humanização anti-spam
// Pequenas alterações que tornam cada mensagem única sem mudar o sentido

// a) Emojis opcionais no final — rotaciona por índice de segundo
const emojis = ['😊', '🙂', '👋', '✨', '💬', ''];
const emojiIdx = new Date().getSeconds() % emojis.length;
const emojiExtra = emojis[emojiIdx];

// b) Espaçamento variável: às vezes double-space antes de emoji, às vezes não
const sep = Math.random() > 0.5 ? '  ' : ' ';

// c) Pontuação final: varia entre nada, . ou !
const pontuacoes = ['', '.', ''];
const pont = pontuacoes[Math.floor(Math.random() * pontuacoes.length)];

// d) Saudações opcionais no início (apenas se msg não começa com Olá/Oi/Bom)
const comecaSaudacao = /^(ol[aá]|oi|bom|boa|tudo|hey)/i.test(msg.trim());
if (!comecaSaudacao && Math.random() > 0.6) {
  const saudacoes = ['Oi ' + primeiroNome + ', ', 'Olá ' + primeiroNome + '! ', 'Oi ' + primeiroNome + '! '];
  msg = saudacoes[Math.floor(Math.random() * saudacoes.length)] + msg;
}

// e) Adicionar emoji ao final somente se msg não termina já com emoji ou sinal
const terminaComEmojiOuSinal = /[\\u{1F000}-\\u{1FFFF}\\u{2600}-\\u{27BF}!?.]$/u.test(msg.trim());
if (!terminaComEmojiOuSinal && emojiExtra) {
  msg = msg.trimEnd() + pont + sep + emojiExtra;
}

// f) Delay aleatório: entre 15 e 55 segundos (anti-spam, simula digitação humana)
const delayMs = (15 + Math.floor(Math.random() * 40)) * 1000;

return [{ json: { ...item, mensagemFormatada: msg, delayMs } }];
`;

// ---------------------------------------------------------------------------
// Code: Sleep + Atualizar Status
// ---------------------------------------------------------------------------
const jsAtualizar = `
const evoResp = $input.item.json;
const ctx = $('Formatar Mensagem').item.json;

// Evolution API v1 retorna { key: {...} } no sucesso
const enviou = evoResp && !evoResp.error && !evoResp.status && (evoResp.key || evoResp.id || evoResp.messageId);
const status = enviou ? 'ENVIADO' : 'ERRO';
const erro   = enviou ? undefined : (evoResp.error || evoResp.message || JSON.stringify(evoResp).slice(0, 200));

const res = await fetch('${CRM}/api/campanhas/item/' + ctx.itemId, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ secret: 'crm2026migra', status, erro }),
});

const data = await res.json();
return [{ json: { itemId: ctx.itemId, status, enviou, data } }];
`;

const workflow = {
  name: "Campanhas - Disparo WhatsApp",
  settings: { executionOrder: "v1" },
  nodes: [
    // 1. Trigger: a cada 1 minuto
    {
      id: "node-schedule",
      name: "A cada 1 minuto",
      type: "n8n-nodes-base.scheduleTrigger",
      typeVersion: 1.2,
      position: [0, 0],
      parameters: {
        rule: { interval: [{ field: "minutes", minutesInterval: 1 }] },
      },
    },

    // 2. Buscar próximo item pendente
    {
      id: "node-buscar",
      name: "Buscar Pendente",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [240, 0],
      parameters: {
        method: "GET",
        url: `${CRM}/api/campanhas/pendente?secret=crm2026migra`,
        options: {},
      },
    },

    // 3. Verificar se há item
    {
      id: "node-if-pendente",
      name: "Tem Pendente?",
      type: "n8n-nodes-base.if",
      typeVersion: 2,
      position: [480, 0],
      parameters: {
        conditions: {
          options: { caseSensitive: true, leftValue: "", typeValidation: "loose" },
          conditions: [
            {
              id: "cond-pendente",
              leftValue: "={{ $json.pendente }}",
              rightValue: true,
              operator: { type: "boolean", operation: "true" },
            },
          ],
          combinator: "and",
        },
        options: {},
      },
    },

    // 4. Formatar + humanizar mensagem (anti-spam)
    {
      id: "node-formatar",
      name: "Formatar Mensagem",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [720, -120],
      parameters: { jsCode: jsFormatar },
    },

    // 5. Delay aleatório anti-spam (Wait node usa o delayMs calculado)
    {
      id: "node-delay",
      name: "Delay Anti-Spam",
      type: "n8n-nodes-base.wait",
      typeVersion: 1.1,
      position: [960, -120],
      parameters: {
        unit: "milliseconds",
        amount: "={{ $json.delayMs }}",
        resume: "timeInterval",
      },
      webhookId: "campanha-delay-webhook",
    },

    // 6. Enviar mensagem via Evolution API
    {
      id: "node-enviar",
      name: "Enviar via WhatsApp",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [1200, -120],
      continueOnFail: true,
      parameters: {
        method: "POST",
        url: `={{ '${EVO}/message/sendText/' + $json.instancia }}`,
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: "apikey",       value: "SuaChaveSecreta123" },
            { name: "Content-Type", value: "application/json" },
          ],
        },
        sendBody: true,
        specifyBody: "json",
        jsonBody: `={{ JSON.stringify({ number: $json.telefone, textMessage: { text: $json.mensagemFormatada } }) }}`,
        options: {},
      },
    },

    // 7. Atualizar status no CRM (ENVIADO ou ERRO)
    {
      id: "node-atualizar",
      name: "Atualizar Status",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [1440, -120],
      parameters: { jsCode: jsAtualizar },
    },
  ],

  connections: {
    "A cada 1 minuto": {
      main: [[{ node: "Buscar Pendente", type: "main", index: 0 }]],
    },
    "Buscar Pendente": {
      main: [[{ node: "Tem Pendente?", type: "main", index: 0 }]],
    },
    "Tem Pendente?": {
      main: [
        [{ node: "Formatar Mensagem", type: "main", index: 0 }], // true
        [],                                                        // false — encerra silenciosamente
      ],
    },
    "Formatar Mensagem": {
      main: [[{ node: "Delay Anti-Spam", type: "main", index: 0 }]],
    },
    "Delay Anti-Spam": {
      main: [[{ node: "Enviar via WhatsApp", type: "main", index: 0 }]],
    },
    "Enviar via WhatsApp": {
      main: [[{ node: "Atualizar Status", type: "main", index: 0 }]],
    },
  },
};

console.log("Criando workflow de campanhas com anti-spam...");

const res = await fetch(`${BASE}/workflows`, {
  method: "POST",
  headers,
  body: JSON.stringify(workflow),
});

const data = await res.json();

if (!res.ok) {
  console.error("Erro:", res.status, JSON.stringify(data, null, 2));
  process.exit(1);
}

console.log(`✅ Workflow criado: ${data.id}`);

const actRes = await fetch(`${BASE}/workflows/${data.id}/activate`, {
  method: "POST",
  headers,
});

if (actRes.ok) {
  console.log("✅ Ativado!");
} else {
  const e = await actRes.json();
  console.warn("⚠️  Falha ao ativar:", JSON.stringify(e));
}

console.log(`\n🔗 https://n8n-n8n.6jgzku.easypanel.host/workflow/${data.id}`);
