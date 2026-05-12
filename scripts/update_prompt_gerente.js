const fs = require('fs');
const path = require('path');

const wfPath = path.join(__dirname, '..', 'workflow_current.json');
const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));

const node = wf.nodes.find(n => n.name === 'Montar Prompt Claude');
if (!node) { console.error('Node não encontrado'); process.exit(1); }

let code = node.parameters.jsCode;

// 1. Adicionar notificarGerente ao JSON schema (depois de notificarVendedor)
const anchorA = `'  "notificarVendedor": false,'`;
if (code.includes(anchorA) && !code.includes('notificarGerente')) {
  code = code.replace(anchorA,
    `'  "notificarVendedor": false,',\n  '  "notificarGerente": false,',`
  );
  console.log('✅ notificarGerente adicionado ao schema JSON');
} else {
  console.log('⚠️  notificarGerente já existe ou anchor não encontrado');
}

// 2. Adicionar instrução de gerente na seção CONTEXTO POS-VENDA
const anchorB = `- Ao concluir a conversa pos-venda: use novoStatus=POS_VENDA.';`;
if (code.includes(anchorB)) {
  code = code.replace(anchorB,
    `- Se o cliente reclamar ou estiver insatisfeito: notificarGerente=true com mensagemVendedor descrevendo o problema.\\n- Ao concluir a conversa pos-venda: use novoStatus=POS_VENDA.';`
  );
  console.log('✅ Instrução de gerente adicionada ao CONTEXTO POS-VENDA');
} else {
  console.log('⚠️  Anchor do CONTEXTO POS-VENDA não encontrado');
}

// 3. Atualizar a linha do QUANDO notificarVendedor para incluir gerente
const anchorC = `'QUANDO notificarVendedor=true, mensagemVendedor DEVE conter nome do cliente, o que quer e tom da conversa.',`;
if (code.includes(anchorC)) {
  code = code.replace(anchorC,
    `'QUANDO notificarVendedor=true, mensagemVendedor DEVE conter nome do cliente, o que quer e tom da conversa.',\n  'QUANDO notificarGerente=true: use em reclamacoes pos-venda. mensagemVendedor deve descrever o problema e o tom do cliente.',`
  );
  console.log('✅ Regra notificarGerente adicionada');
} else {
  console.log('⚠️  Anchor da regra notificarVendedor não encontrado');
}

node.parameters.jsCode = code;
fs.writeFileSync(wfPath, JSON.stringify(wf, null, 2), 'utf8');
console.log('\n✅ workflow_current.json atualizado com gerente');
