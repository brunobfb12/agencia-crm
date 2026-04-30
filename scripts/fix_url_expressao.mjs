const N8N_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3MTRkZGMyZC02YTAwLTRkM2MtOTYxMy1mZTkwNjNhNmExMzIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZDFmODE0ZDUtM2RjMy00NzZjLThiNmItYTEyYTdlMDI2YTUxIiwiaWF0IjoxNzc3MzQ0MzUxfQ.T4pxcvcNtJd__4hLVtDfVDQeNyFK3NoshfihSAPnDS4";
const WF_ID  = "VYYlP60j0e1cHuub";
const BASE   = "https://n8n-n8n.6jgzku.easypanel.host/api/v1";

const headers = { "X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json" };
const wf = await fetch(`${BASE}/workflows/${WF_ID}`, { headers }).then(r => r.json());

const enviarNode = wf.nodes.find(n => n.name === "Enviar Resposta ao Cliente");

// N8N requires "=" prefix for expression fields — without it, {{ }} is treated as literal text
// BEFORE: "http://...{{ $(...) }}"  → literal string, 404
// AFTER:  "=http://...{{ $(...) }}" → evaluated expression
enviarNode.parameters.url = "=http://201.76.43.149:8081/message/sendText/{{ $('Parsear Resposta IA').item.json.instancia }}";

console.log("URL corrigida:", enviarNode.parameters.url);
console.log("jsonBody:", enviarNode.parameters.jsonBody);

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
  console.error("ERRO:", JSON.stringify(result));
  process.exit(1);
}
console.log("✓ Workflow salvo. URL da expressão corrigida.");
