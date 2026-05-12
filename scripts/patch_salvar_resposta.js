const fs = require('fs');
const path = require('path');

const wfPath = path.join(__dirname, '..', 'workflow_current.json');
const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));

// 1. Adicionar notificarGerente ao Salvar Resposta no CRM
const salvNode = wf.nodes.find(n => n.name === 'Salvar Resposta no CRM');
if (salvNode) {
  const old = salvNode.parameters.jsonBody;
  const updated = old.replace(
    'notificarVendedor: $(\'Parsear Resposta IA\').item.json.notificarVendedor })',
    'notificarVendedor: $(\'Parsear Resposta IA\').item.json.notificarVendedor, notificarGerente: $(\'Parsear Resposta IA\').item.json.notificarGerente })'
  );
  if (updated !== old) {
    salvNode.parameters.jsonBody = updated;
    console.log('✅ notificarGerente adicionado ao body do Salvar Resposta no CRM');
  } else {
    console.log('⚠️  Anchor não encontrado no Salvar Resposta — verificar manualmente');
    console.log('Body atual:', old.slice(0, 200));
  }
}

// 2. Corrigir body do Notificar Gerente
const notifNode = wf.nodes.find(n => n.name === 'Notificar Gerente');
if (notifNode) {
  notifNode.parameters.jsonBody = `={{ JSON.stringify({
  number: $('Salvar Resposta no CRM').item.json.gerente?.telefone,
  textMessage: { text: "\\u{1F6A8} *Escalada pós-venda*\\n\\n" + $('Parsear Resposta IA').item.json.mensagemVendedor + "\\n\\nCliente: " + $('Parsear Resposta IA').item.json.clienteNome }
}) }}`;
  console.log('✅ Body do Notificar Gerente corrigido');
}

fs.writeFileSync(wfPath, JSON.stringify(wf, null, 2), 'utf8');
console.log('\n✅ workflow_current.json salvo');
