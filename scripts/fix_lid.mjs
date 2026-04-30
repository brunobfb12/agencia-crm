const N8N_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3MTRkZGMyZC02YTAwLTRkM2MtOTYxMy1mZTkwNjNhNmExMzIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZDFmODE0ZDUtM2RjMy00NzZjLThiNmItYTEyYTdlMDI2YTUxIiwiaWF0IjoxNzc3MzQ0MzUxfQ.T4pxcvcNtJd__4hLVtDfVDQeNyFK3NoshfihSAPnDS4";
const WF_ID  = "VYYlP60j0e1cHuub";
const BASE   = "https://n8n-n8n.6jgzku.easypanel.host/api/v1";
const EVO_V2 = "http://201.76.43.149:8080";

const headers = { "X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json" };

const wf = await fetch(`${BASE}/workflows/${WF_ID}`, { headers }).then(r => r.json());
console.log("Nodes:", wf.nodes.map(n => n.name).join(", "));

// --- Fix 1: "Filtrar e Extrair" — add messageKey to output for @lid quoted reply ---
const filtrarNode = wf.nodes.find(n => n.name === "Filtrar e Extrair");
if (!filtrarNode) { console.error("Node 'Filtrar e Extrair' não encontrado!"); process.exit(1); }

const newFiltrarCode = `
const body = $input.item.json.body || $input.item.json;
const event = ((body.event || '')).toUpperCase();
const data = body.data || {};
const key = data.key || {};

if (key.fromMe === true) return [];
if ((key.remoteJid || '').includes('@g.us')) return [];
if (!['MESSAGES_UPSERT', 'MESSAGES.UPSERT'].includes(event)) return [];

const instancia = body.instance || body.instanceName || '';
const remoteJid = key.remoteJid || '';

let telefone = remoteJid.replace(/@[^@]+$/, '');
if (!telefone || !instancia) return [];

// Brasil 9-digit fix (12 digits = DDD sem nono digito)
if (telefone.startsWith('55') && telefone.length === 12) {
  telefone = '55' + telefone.slice(2, 4) + '9' + telefone.slice(4);
}

const msg = data.message || {};
const extText = msg.extendedTextMessage || {};
const imgMsg = msg.imageMessage || {};
const vidMsg = msg.videoMessage || {};
const mensagem = msg.conversation || extText.text || imgMsg.caption || vidMsg.caption || null;
if (!mensagem) return [];

return [{ json: {
  instancia,
  telefone,
  jid: remoteJid,
  mensagem,
  nomeContato: data.pushName || '',
  messageId: key.id || '',
  tipo: 'TEXTO'
}}];
`.trim();

filtrarNode.parameters.jsCode = newFiltrarCode;
console.log("✓ Filtrar e Extrair atualizado");

// --- Fix 2: "Enviar Resposta ao Cliente" — v2 format + quoted for @lid ---
const enviarNode = wf.nodes.find(n => n.name === "Enviar Resposta ao Cliente");
if (!enviarNode) { console.error("Node 'Enviar Resposta ao Cliente' não encontrado!"); process.exit(1); }

console.log("Enviar node type:", enviarNode.type);
console.log("Enviar node params keys:", Object.keys(enviarNode.parameters || {}));
console.log("Enviar node url:", enviarNode.parameters.url || enviarNode.parameters.requestUrl || 'N/A');

// Update URL to v2 endpoint
const newUrl = `${EVO_V2}/message/sendText/{{ $('Parsear Resposta IA').item.json.instancia }}`;

// v2 body format with quoted for @lid support:
// number = full JID (handles both @s.whatsapp.net and @lid)
// quoted = reply to original message (bypasses @lid number check)
const newBody = `={{ JSON.stringify({
  number: $('Filtrar e Extrair').item.json.jid,
  text: $('Parsear Resposta IA').item.json.aiResposta,
  quoted: {
    key: {
      remoteJid: $('Filtrar e Extrair').item.json.jid,
      fromMe: false,
      id: $('Filtrar e Extrair').item.json.messageId
    }
  }
}) }}`;

if (enviarNode.parameters.url !== undefined) {
  enviarNode.parameters.url = newUrl;
} else if (enviarNode.parameters.requestUrl !== undefined) {
  enviarNode.parameters.requestUrl = newUrl;
}

// Find and update body field
if (enviarNode.parameters.body !== undefined) {
  enviarNode.parameters.body = newBody;
} else if (enviarNode.parameters.jsonBody !== undefined) {
  enviarNode.parameters.jsonBody = newBody;
} else if (enviarNode.parameters.bodyParameters !== undefined) {
  // some n8n versions use bodyParameters array
  console.log("bodyParameters:", JSON.stringify(enviarNode.parameters.bodyParameters));
}

// Also check sendBody / specifyBody
console.log("Full enviar params:", JSON.stringify(enviarNode.parameters, null, 2));

console.log("✓ Enviar Resposta ao Cliente atualizado");

// --- Fix 3: Disable v1 webhook for teste_maio_26 ---
// We'll do this separately via Evolution API
const disableV1Webhook = await fetch(
  "http://201.76.43.149:8081/webhook/set/teste_maio_26",
  {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: "SuaChaveSecreta123" },
    body: JSON.stringify({ enabled: false, url: "", events: [] })
  }
);
console.log("v1 webhook disable status:", disableV1Webhook.status);

// --- Save workflow ---
const putBody = JSON.stringify({
  name: wf.name,
  nodes: wf.nodes,
  connections: wf.connections,
  settings: { executionOrder: wf.settings.executionOrder },
  staticData: null
});

const res = await fetch(`${BASE}/workflows/${WF_ID}`, { method: "PUT", headers, body: putBody });
const result = await res.json();

if (!res.ok) {
  console.error("ERRO ao salvar:", JSON.stringify(result));
  process.exit(1);
}

console.log("✓ Workflow salvo. Nodes:", result.nodes.map(n => n.name).join(", "));
