// Recria o workflow de campanhas do zero — sem Code nodes problemáticos
// Usa apenas HTTP Request nodes e IF nodes nativos do N8N

const N8N_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NThiY2U4Ny0yYTdkLTQxMDItYjU1Ni0wMWExZjJhYWVkOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiY2JlMWNkOGUtODIxYi00MmEyLWIzZjYtYjgzZGYwMDUzN2YwIiwiaWF0IjoxNzc4NDczNjMxfQ.qerSQqMlIUjev6-VH_g2gl1PqE28hRm_LzLGyj-UZ6Y";
const BASE = "https://n8n-n8n.6jgzku.easypanel.host/api/v1";
const EVO  = "http://201.76.43.149:8081";
const CRM  = "https://ocrmfacil.com.br";
const OLD_WF_ID = "Iu41i3D2wRmOHkAV";
const h = { "X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json" };

// Helper to build the correct jsCode for Formatar Mensagem
// Using String.raw to avoid any template literal escaping issues
const jsFormatar = String.raw`
const item = $input.item.json;
const nomeCompleto = item.nomeCliente || 'Cliente';
const primeiroNome = nomeCompleto.split(' ')[0];
let msg = (item.mensagem || '').replace(/\{nome\}/g, primeiroNome);

// Anti-spam: variação de texto
const emojis = ['😊', '🙂', '👋', '✨', '💬', ''];
const emojiExtra = emojis[new Date().getSeconds() % emojis.length];
const terminaComSinal = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}!?.]$/u.test(msg.trim());
if (!terminaComSinal && emojiExtra) msg = msg.trimEnd() + ' ' + emojiExtra;

return [{ json: { ...item, mensagemFormatada: msg } }];
`.trim();

// For the Marcar no CRM node, we use N8N expression syntax directly
// $json = output from Enviar via WhatsApp (Evolution response)
// $('Formatar Mensagem').item.json.itemId = original item ID from upstream
const marcarUrl = `={{ '${CRM}/api/campanhas/item/' + $('Formatar Mensagem').item.json.itemId }}`;
const marcarBody = `={{ JSON.stringify({ secret: 'crm2026migra', status: ($json.key || $json.id || $json.messageId) ? 'ENVIADO' : 'ERRO', erro: ($json.key || $json.id || $json.messageId) ? null : ($json.error || $json.message || 'Erro desconhecido').toString().slice(0,200) }) }}`;

const workflow = {
  name: "Campanhas - Disparo WhatsApp",
  settings: { executionOrder: "v1" },
  nodes: [
    // 1. Trigger: a cada 1 minuto
    {
      id: "nd-schedule",
      name: "A cada 1 minuto",
      type: "n8n-nodes-base.scheduleTrigger",
      typeVersion: 1.2,
      position: [0, 0],
      parameters: {
        rule: { interval: [{ field: "minutes", minutesInterval: 1 }] },
      },
    },
    // 2. Buscar próximo item
    {
      id: "nd-buscar",
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
    // 3. IF: tem pendente?
    {
      id: "nd-if",
      name: "Tem Pendente?",
      type: "n8n-nodes-base.if",
      typeVersion: 2,
      position: [480, 0],
      parameters: {
        conditions: {
          options: { caseSensitive: true, leftValue: "", typeValidation: "loose" },
          conditions: [{ id: "c1", leftValue: "={{ $json.pendente }}", rightValue: true, operator: { type: "boolean", operation: "true" } }],
          combinator: "and",
        },
        options: {},
      },
    },
    // 4. Formatar mensagem com variação anti-spam
    {
      id: "nd-formatar",
      name: "Formatar Mensagem",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [720, -100],
      parameters: { jsCode: jsFormatar },
    },
    // 5. Enviar via Evolution API
    {
      id: "nd-enviar",
      name: "Enviar via WhatsApp",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [960, -100],
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
    // 6. Marcar item como ENVIADO/ERRO no CRM
    {
      id: "nd-marcar",
      name: "Marcar no CRM",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [1200, -100],
      continueOnFail: true,
      parameters: {
        method: "PATCH",
        url: marcarUrl,
        sendHeaders: true,
        headerParameters: {
          parameters: [{ name: "Content-Type", value: "application/json" }],
        },
        sendBody: true,
        specifyBody: "json",
        jsonBody: marcarBody,
        options: {},
      },
    },
  ],
  connections: {
    "A cada 1 minuto": { main: [[{ node: "Buscar Pendente",    type: "main", index: 0 }]] },
    "Buscar Pendente":  { main: [[{ node: "Tem Pendente?",     type: "main", index: 0 }]] },
    "Tem Pendente?":    { main: [
      [{ node: "Formatar Mensagem",  type: "main", index: 0 }], // true
      [],                                                         // false — para
    ]},
    "Formatar Mensagem": { main: [[{ node: "Enviar via WhatsApp", type: "main", index: 0 }]] },
    "Enviar via WhatsApp": { main: [[{ node: "Marcar no CRM", type: "main", index: 0 }]] },
  },
};

// 1. Delete old workflow
console.log(`Deletando workflow antigo (${OLD_WF_ID})...`);
const delRes = await fetch(`${BASE}/workflows/${OLD_WF_ID}`, { method: "DELETE", headers: h });
console.log(`Delete: ${delRes.status}`);

// 2. Create new workflow
console.log("Criando workflow novo...");
const createRes = await fetch(`${BASE}/workflows`, { method: "POST", headers: h, body: JSON.stringify(workflow) });
const created = await createRes.json();
if (!createRes.ok) { console.error("Erro ao criar:", JSON.stringify(created).slice(0,300)); process.exit(1); }
console.log(`Criado: ${created.id} | nodes: ${created.nodes.length}`);

// 3. Activate
const actRes = await fetch(`${BASE}/workflows/${created.id}/activate`, { method: "POST", headers: h });
if (actRes.ok) {
  console.log("Ativado!");
} else {
  const e = await actRes.json();
  console.warn("Falha ao ativar:", JSON.stringify(e));
}

// 4. Verify node expressions
const m = created.nodes.find(n => n.name === "Marcar no CRM");
const f = created.nodes.find(n => n.name === "Formatar Mensagem");
console.log("\nVerificando...");
console.log("Marcar URL:", m.parameters.url);
console.log("Marcar Body:", m.parameters.jsonBody.slice(0, 80) + "...");
console.log("Formatar jsCode primeiros 50:", f.parameters.jsCode.slice(0, 50));
console.log(`\nURL: https://n8n-n8n.6jgzku.easypanel.host/workflow/${created.id}`);
