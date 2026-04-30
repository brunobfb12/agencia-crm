const N8N_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3MTRkZGMyZC02YTAwLTRkM2MtOTYxMy1mZTkwNjNhNmExMzIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZDFmODE0ZDUtM2RjMy00NzZjLThiNmItYTEyYTdlMDI2YTUxIiwiaWF0IjoxNzc3MzQ0MzUxfQ.T4pxcvcNtJd__4hLVtDfVDQeNyFK3NoshfihSAPnDS4";
const WF_ID  = "VYYlP60j0e1cHuub";
const BASE   = "https://n8n-n8n.6jgzku.easypanel.host/api/v1";
const EVO_V1 = "http://201.76.43.149:8081";

const headers = { "X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json" };

const wf = await fetch(`${BASE}/workflows/${WF_ID}`, { headers }).then(r => r.json());
console.log("Nodes:", wf.nodes.map(n => n.name).join(", "));

// --- Fix: "Enviar Resposta ao Cliente" ---
// Usar v1 (8081) pois teste_maio_26 está conectado lá
// Formato v1: { number, textMessage: { text }, quoted: { key: {...} } }
// quoted permite responder à msg original — WhatsApp resolve @lid via messageId, não por número
const enviarNode = wf.nodes.find(n => n.name === "Enviar Resposta ao Cliente");
if (!enviarNode) { console.error("Node 'Enviar Resposta ao Cliente' não encontrado!"); process.exit(1); }

enviarNode.parameters.url = `${EVO_V1}/message/sendText/{{ $('Parsear Resposta IA').item.json.instancia }}`;

// v1 format + quoted field for @lid support
enviarNode.parameters.jsonBody = `={{ JSON.stringify({
  number: $('Filtrar e Extrair').item.json.jid,
  textMessage: { text: $('Parsear Resposta IA').item.json.aiResposta },
  quoted: {
    key: {
      remoteJid: $('Filtrar e Extrair').item.json.jid,
      fromMe: false,
      id: $('Filtrar e Extrair').item.json.messageId
    }
  }
}) }}`;

console.log("✓ Enviar Resposta ao Cliente: v1 (8081) + quoted para @lid");

// --- Verificar Parsear Resposta IA ---
const parsearNode = wf.nodes.find(n => n.name === "Parsear Resposta IA");
if (parsearNode) {
  const code = parsearNode.parameters.jsCode || '';
  const hasOptionalChaining = code.includes('?.');
  const hasMarkdownStrip = code.includes('replace');
  console.log(`Parsear: optional chaining=${hasOptionalChaining}, markdown strip=${hasMarkdownStrip}`);

  if (hasOptionalChaining || !hasMarkdownStrip) {
    console.log("Corrigindo Parsear Resposta IA...");
    parsearNode.parameters.jsCode = `
const claude = $input.item.json;
const ctx = $('Montar Prompt Claude').item.json;
let ai = { resposta: null, novoStatus: null, notificarVendedor: false, mensagemVendedor: null, observacoes: null };
try {
  const content = claude.content || [];
  const first = content[0] || {};
  let text = first.text || '{}';
  // Remove markdown code fences if present
  text = text.replace(/^\`\`\`[a-z]*\\s*/m, '').replace(/\\s*\`\`\`\\s*$/m, '').trim();
  const parsed = JSON.parse(text);
  ai = Object.assign(ai, parsed);
} catch(e) {
  ai.resposta = 'Ola! Estou aqui para ajudar. Como posso te atender?';
}
if (!ai.resposta) ai.resposta = 'Ola! Como posso te ajudar hoje?';
return [{ json: Object.assign({}, ctx, {
  aiResposta: ai.resposta,
  novoStatus: ai.novoStatus,
  notificarVendedor: ai.notificarVendedor === true,
  mensagemVendedor: ai.mensagemVendedor,
  observacoes: ai.observacoes,
}) }];
`.trim();
    console.log("✓ Parsear Resposta IA corrigido");
  } else {
    console.log("✓ Parsear Resposta IA já está correto");
  }
}

// --- Salvar ---
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

console.log("✓ Workflow salvo com sucesso");
console.log("Nodes finais:", result.nodes.map(n => n.name).join(", "));
