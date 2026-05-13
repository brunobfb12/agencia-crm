const N8N_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NThiY2U4Ny0yYTdkLTQxMDItYjU1Ni0wMWExZjJhYWVkOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiY2JlMWNkOGUtODIxYi00MmEyLWIzZjYtYjgzZGYwMDUzN2YwIiwiaWF0IjoxNzc4NDczNjMxfQ.qerSQqMlIUjev6-VH_g2gl1PqE28hRm_LzLGyj-UZ6Y";
const BASE = "https://n8n-n8n.6jgzku.easypanel.host/api/v1";
const headers = { "X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json" };

const wf = await fetch(`${BASE}/workflows/VYYlP60j0e1cHuub`, { headers }).then(r => r.json());

const enviar = wf.nodes.find(n => n.name === "Enviar Resposta ao Cliente");

// Priority order for 'number' field:
// 1. telefonePrincipal from CRM (real phone resolved from @lid by name lookup)
// 2. telefone from Filtrar (the raw phone, works for Android/WhatsApp Web)
// Always include quoted.key for proper reply threading on all platforms
enviar.parameters.url = "=http://201.76.43.149:8081/message/sendText/{{ $('Parsear Resposta IA').item.json.instancia }}";

enviar.parameters.jsonBody = `={{ JSON.stringify({
  number: $('Salvar no CRM').item.json.telefonePrincipal || $('Filtrar e Extrair').item.json.telefone,
  textMessage: { text: $('Parsear Resposta IA').item.json.aiResposta },
  quoted: {
    key: {
      remoteJid: $('Filtrar e Extrair').item.json.jid,
      fromMe: false,
      id: $('Filtrar e Extrair').item.json.messageId
    }
  }
}) }}`;

console.log("URL:", enviar.parameters.url);
console.log("Body preview:", enviar.parameters.jsonBody.slice(0, 300));

const res = await fetch(`${BASE}/workflows/VYYlP60j0e1cHuub`, {
  method: "PUT",
  headers,
  body: JSON.stringify({
    name: wf.name, nodes: wf.nodes, connections: wf.connections,
    settings: { executionOrder: wf.settings.executionOrder }, staticData: null
  })
});
const result = await res.json();
if (!res.ok) { console.error("ERRO:", JSON.stringify(result)); process.exit(1); }
console.log("✓ N8N atualizado — número usa telefonePrincipal (lookup CRM) ou telefone direto");
