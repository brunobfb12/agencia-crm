import { readFileSync } from 'fs';

const N8N_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZjg5NmRlNS1jNTQ3LTQ2ZmMtOGUxMC00ODZkOWJhZjRmYzgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiOTRmZTI3N2YtOGFhYS00NjMzLTk5ZjctZTM0OTZiOWY4MmIxIiwiaWF0IjoxNzgxMjg2OTI5fQ.fUbO_flWLlAlpfSoyJ52jTU1aG6VM0KldAAY5MpwZLw";
const BASE = "https://n8n-n8n.6jgzku.easypanel.host/api/v1";
const WF_ID = "zsjXvvSqTBnAqK3g";
const NODE_NAME = "Montar Prompt Claude";

const jsCodeNovo = readFileSync('n8n/nodes/montar_prompt_claude.js', 'utf8');

console.log(`[DEPLOY] Qualificação simplificada (sem entrega/pagamento)...\n`);

try {
  // 1. GET workflow
  console.log("[1] Baixando workflow...");
  const getResp = await fetch(`${BASE}/workflows/${WF_ID}`, {
    headers: { "X-N8N-API-KEY": N8N_KEY },
  });
  const wf = await getResp.json();
  console.log(`✓ ${wf.name}\n`);

  // 2. Substituir jsCode
  const nodeIdx = wf.nodes.findIndex(n => n.name === NODE_NAME);
  console.log(`[2] Substituindo jsCode...\n`);
  wf.nodes[nodeIdx].parameters.jsCode = jsCodeNovo;

  // 3. PUT
  console.log("[3] Enviando PUT...");
  const putResp = await fetch(`${BASE}/workflows/${WF_ID}`, {
    method: "PUT",
    headers: { "X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: wf.name,
      nodes: wf.nodes,
      connections: wf.connections,
      settings: wf.settings ? { saveManualExecutions: wf.settings.saveManualExecutions, timezone: wf.settings.timezone } : {},
      staticData: wf.staticData || null,
    }),
  });

  if (!putResp.ok) {
    const err = await putResp.json();
    console.error(`✗ Erro HTTP ${putResp.status}: ${JSON.stringify(err)}`);
    process.exit(1);
  }

  console.log(`✓ PUT bem-sucedido\n`);

  // 4. Validar
  console.log("[4] Validando em produção...");
  const validateResp = await fetch(`${BASE}/workflows/${WF_ID}`, {
    headers: { "X-N8N-API-KEY": N8N_KEY },
  });
  const validateWf = await validateResp.json();
  const validateNode = validateWf.nodes.find(n => n.name === NODE_NAME);
  const jsCodeValidate = validateNode.parameters.jsCode;

  const strings = [
    "Me manda a lista de materiais que você precisa",
    "FECHAMENTO — CONFIRMAR E ENVIAR",
    "preencha só se cliente informou espontaneamente, senão \"A combinar\""
  ];

  console.log("\n[VALIDAÇÃO] Procurando mudanças:\n");
  let todosOk = true;
  strings.forEach(s => {
    const existe = jsCodeValidate.includes(s);
    console.log(`  ${existe ? "✓" : "✗"} "${s}"`);
    if (!existe) todosOk = false;
  });

  if (todosOk) {
    console.log("\n✅ SUCESSO! Qualificação simplificada está viva em produção.");
  } else {
    console.log("\n❌ FALHA na validação.");
    process.exit(1);
  }

  process.exit(0);

} catch (error) {
  console.error("[ERRO]", error.message);
  process.exit(1);
}
