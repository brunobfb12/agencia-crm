const N8N_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3MTRkZGMyZC02YTAwLTRkM2MtOTYxMy1mZTkwNjNhNmExMzIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZDFmODE0ZDUtM2RjMy00NzZjLThiNmItYTEyYTdlMDI2YTUxIiwiaWF0IjoxNzc3MzQ0MzUxfQ.T4pxcvcNtJd__4hLVtDfVDQeNyFK3NoshfihSAPnDS4";
const WF_ID  = "VYYlP60j0e1cHuub";
const BASE   = "https://n8n-n8n.6jgzku.easypanel.host/api/v1";

const headers = { "X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json" };

const wf = await fetch(`${BASE}/workflows/${WF_ID}`, { headers }).then(r => r.json());
console.log("Nodes antes:", wf.nodes.map(n => n.name).join(", "));

// Check if already added
if (wf.nodes.find(n => n.name === "Modo Humano?")) {
  console.log("Nó 'Modo Humano?' já existe — nada a fazer.");
  process.exit(0);
}

// Position: between Verificar CRM OK and Montar Prompt Claude
const verificarNode = wf.nodes.find(n => n.name === "Verificar CRM OK");

const modoHumanoNode = {
  id: crypto.randomUUID(),
  name: "Modo Humano?",
  type: "n8n-nodes-base.if",
  typeVersion: 2,
  position: [verificarNode.position[0] + 240, verificarNode.position[1]],
  parameters: {
    conditions: {
      options: { caseSensitive: true, leftValue: "", typeValidation: "strict", version: 1 },
      conditions: [{
        id: "mh1",
        leftValue: "={{ $('Salvar no CRM').item.json.modoHumano }}",
        rightValue: true,
        operator: { type: "boolean", operation: "true" }
      }],
      combinator: "and"
    },
    options: {}
  }
};

wf.nodes.push(modoHumanoNode);

// Rebuild connections
const conns = {};
for (const [key, val] of Object.entries(wf.connections)) {
  if (key === "Verificar CRM OK") {
    // true branch → Modo Humano? | false branch → Ignorar
    conns[key] = { main: [
      [{ node: "Modo Humano?",       type: "main", index: 0 }],
      [{ node: "Ignorar (invalido)", type: "main", index: 0 }]
    ]};
  } else {
    conns[key] = val;
  }
}
// Modo Humano? true → Ignorar | false → Montar Prompt Claude
conns["Modo Humano?"] = { main: [
  [{ node: "Ignorar (invalido)",   type: "main", index: 0 }],
  [{ node: "Montar Prompt Claude", type: "main", index: 0 }]
]};

const body = JSON.stringify({
  name: wf.name,
  nodes: wf.nodes,
  connections: conns,
  settings: { executionOrder: wf.settings.executionOrder },
  staticData: null
});

const res = await fetch(`${BASE}/workflows/${WF_ID}`, { method: "PUT", headers, body });
const result = await res.json();

if (!res.ok) {
  console.error("ERRO:", JSON.stringify(result));
  process.exit(1);
}

console.log("OK — nodes agora:", result.nodes.map(n => n.name).join(", "));
