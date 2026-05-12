const fs = require('fs');
const path = require('path');

const wfPath = path.join(__dirname, '..', 'workflow_current.json');
const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));

// 1. Adicionar nó "Deve Notificar Gerente?"
const ifGerente = {
  id: "wf-node-if-gerente",
  name: "Deve Notificar Gerente?",
  type: "n8n-nodes-base.if",
  typeVersion: 2,
  position: [2400, 320],
  parameters: {
    conditions: {
      options: { caseSensitive: true, leftValue: "", typeValidation: "strict", version: 1 },
      conditions: [{
        id: "gc1",
        leftValue: "={{ $('Parsear Resposta IA').item.json.notificarGerente }}",
        rightValue: true,
        operator: { type: "boolean", operation: "true" }
      }],
      combinator: "and"
    },
    options: {}
  }
};

// 2. Adicionar nó "Notificar Gerente"
const notifGerente = {
  id: "wf-node-notif-gerente",
  name: "Notificar Gerente",
  type: "n8n-nodes-base.httpRequest",
  typeVersion: 4.2,
  position: [2640, 240],
  continueOnFail: true,
  parameters: {
    method: "POST",
    url: "=http://201.76.43.149:8081/message/sendText/{{ $('Parsear Resposta IA').item.json.instancia }}",
    sendHeaders: true,
    headerParameters: {
      parameters: [
        { name: "apikey", value: "SuaChaveSecreta123" },
        { name: "Content-Type", value: "application/json" }
      ]
    },
    sendBody: true,
    specifyBody: "json",
    jsonBody: `={{ JSON.stringify({
  number: $('Salvar Resposta no CRM').item.json.gerente?.telefone,
  textMessage: { text: "🚨 *Escalada pós-venda*\\n\\n" + $('Parsear Resposta IA').item.json.mensagemVendedor + "\\n\\nCliente: " + $('Parsear Resposta IA').item.json.clienteNome }
}) }}`,
    options: {}
  }
};

// Só adiciona se não existirem
if (!wf.nodes.find(n => n.id === 'wf-node-if-gerente')) {
  wf.nodes.push(ifGerente);
  console.log('✅ Nó "Deve Notificar Gerente?" adicionado');
}
if (!wf.nodes.find(n => n.id === 'wf-node-notif-gerente')) {
  wf.nodes.push(notifGerente);
  console.log('✅ Nó "Notificar Gerente" adicionado');
}

// 3. Conectar: Salvar Resposta no CRM → Deve Notificar Gerente? → Notificar Gerente
const conn = wf.connections;

// Salvar Resposta no CRM → Deve Notificar Gerente? (adiciona saída paralela)
const salvResp = conn['Salvar Resposta no CRM'];
if (salvResp && salvResp.main && salvResp.main[0]) {
  const jaTemGerente = salvResp.main[0].some(c => c.node === 'Deve Notificar Gerente?');
  if (!jaTemGerente) {
    salvResp.main[0].push({ node: 'Deve Notificar Gerente?', type: 'main', index: 0 });
    console.log('✅ Salvar Resposta no CRM → Deve Notificar Gerente?');
  }
}

// Deve Notificar Gerente? → true → Notificar Gerente
if (!conn['Deve Notificar Gerente?']) {
  conn['Deve Notificar Gerente?'] = {
    main: [
      [{ node: 'Notificar Gerente', type: 'main', index: 0 }], // true
      []                                                          // false
    ]
  };
  console.log('✅ Conexão Deve Notificar Gerente? → Notificar Gerente');
}

fs.writeFileSync(wfPath, JSON.stringify(wf, null, 2), 'utf8');
console.log('\n✅ workflow_current.json atualizado com nós do gerente');
