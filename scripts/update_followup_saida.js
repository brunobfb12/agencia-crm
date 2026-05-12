const fs = require('fs');
const path = require('path');

const wfPath = path.join(__dirname, '..', 'workflow_followup.json');
const raw = fs.readFileSync(wfPath, 'utf8').replace(/^﻿/, ''); // strip BOM
const wf = JSON.parse(raw);

// 1. Adicionar nó "Salvar Mensagem no CRM" após Enviar WhatsApp
const novoNo = {
  id: "fu-node-salvar-saida",
  name: "Salvar Mensagem no CRM",
  type: "n8n-nodes-base.httpRequest",
  typeVersion: 4.2,
  position: [1320, 200],
  parameters: {
    method: "POST",
    url: "https://ocrmfacil.com.br/api/webhook/saida",
    sendBody: true,
    specifyBody: "json",
    jsonBody: `={{ JSON.stringify({
  secret: "crm2026migra",
  instancia: $json.instancia,
  telefone: $json.telefoneLimpo,
  mensagem: $json.mensagem
}) }}`,
    options: { ignoreResponseCode: true }
  },
  continueOnFail: true
};

// Só adiciona se ainda não existir
if (!wf.nodes.find(n => n.id === 'fu-node-salvar-saida')) {
  wf.nodes.push(novoNo);
  console.log('✅ Nó "Salvar Mensagem no CRM" adicionado');
} else {
  console.log('⚠️  Nó já existe');
}

// 2. Ajustar posição do "Preparar Atualização Lead" para dar espaço
const prep = wf.nodes.find(n => n.name === 'Preparar Atualização Lead');
if (prep && prep.position[0] === 1440) {
  prep.position = [1560, 200];
  console.log('✅ Posição de "Preparar Atualização Lead" ajustada');
}

// 3. Reconectar: Enviar WhatsApp → Salvar Mensagem → Preparar Atualização
// Primeiro verifica a estrutura de connections
const conn = wf.connections;

// Remove ligação direta Enviar WhatsApp → Preparar Atualização Lead (se existir)
if (conn['Enviar WhatsApp']) {
  const main = conn['Enviar WhatsApp'].main;
  if (main && main[0]) {
    main[0] = main[0].filter(c => c.node !== 'Preparar Atualização Lead');
    // Adiciona Enviar WhatsApp → Salvar Mensagem no CRM
    const jaTemSaida = main[0].some(c => c.node === 'Salvar Mensagem no CRM');
    if (!jaTemSaida) {
      main[0].push({ node: 'Salvar Mensagem no CRM', type: 'main', index: 0 });
      console.log('✅ Conexão Enviar WhatsApp → Salvar Mensagem no CRM');
    }
  }
}

// Adiciona Salvar Mensagem no CRM → Preparar Atualização Lead
if (!conn['Salvar Mensagem no CRM']) {
  conn['Salvar Mensagem no CRM'] = {
    main: [[{ node: 'Preparar Atualização Lead', type: 'main', index: 0 }]]
  };
  console.log('✅ Conexão Salvar Mensagem no CRM → Preparar Atualização Lead');
}

fs.writeFileSync(wfPath, JSON.stringify(wf, null, 2), 'utf8');
console.log('\n✅ workflow_followup.json atualizado');
