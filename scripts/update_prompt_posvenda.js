const fs = require('fs');
const path = require('path');

const wfPath = path.join(__dirname, '..', 'workflow_current.json');
const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));

const node = wf.nodes.find(n => n.name === 'Montar Prompt Claude');
if (!node) { console.error('Node não encontrado'); process.exit(1); }

let code = node.parameters.jsCode;

// 1. Adicionar isPosVenda depois de isPrimeiraMensagem
const anchorA = "const isPrimeiraMensagem = historico.length <= 1;";
if (!code.includes("const isPosVenda")) {
  code = code.replace(
    anchorA,
    anchorA + "\nconst isPosVenda = lead.status === 'VENDA_REALIZADA' || lead.status === 'POS_VENDA';"
  );
  console.log('✅ isPosVenda adicionado');
} else {
  console.log('⚠️  isPosVenda já existe');
}

// 2. Adicionar posVendaSection depois do bloco reativacaoSection
const anchorB = "}\n\nconst roteiroSection";
if (!code.includes("posVendaSection")) {
  const posVendaCode = `

let posVendaSection = '';
if (isPosVenda) {
  posVendaSection = '\\nCONTEXTO POS-VENDA:\\n- Este cliente JA COMPROU. NAO use o fluxo de vendas normal.\\n- Objetivo: verificar satisfacao, resolver problemas, fidelizar.\\n- Se tiver problema: resolva com empatia. Se precisar escalar: notificarVendedor=true.\\n- Se satisfeito: agradeça, peca indicacao ou ofereça novidades relevantes.\\n- Ao concluir a conversa pos-venda: use novoStatus=POS_VENDA.';
}`;
  code = code.replace(anchorB, "}\n" + posVendaCode + "\n\nconst roteiroSection");
  console.log('✅ posVendaSection adicionado');
} else {
  console.log('⚠️  posVendaSection já existe');
}

// 3. Atualizar novoStatus no JSON schema para ser dinâmico
const anchorC = `'  "novoStatus": "LEAD|AQUECIMENTO|PRONTO_PARA_COMPRAR|null",'`;
if (code.includes(anchorC)) {
  code = code.replace(
    anchorC,
    `isPosVenda ? '  "novoStatus": "POS_VENDA|FOLLOW_UP|PERDIDO|null",' : '  "novoStatus": "LEAD|AQUECIMENTO|PRONTO_PARA_COMPRAR|null",'`
  );
  console.log('✅ novoStatus schema atualizado');
} else {
  console.log('⚠️  novoStatus anchor não encontrado — verificar manualmente');
}

// 4. Adicionar posVendaSection ao sistemaParts (depois de reativacaoSection)
const anchorD = "  reativacaoSection,";
if (code.includes(anchorD) && !code.includes("posVendaSection,")) {
  code = code.replace(anchorD, anchorD + "\n  posVendaSection,");
  console.log('✅ posVendaSection adicionado ao sistemaParts');
} else {
  console.log('⚠️  posVendaSection no sistemaParts já existe ou anchor não encontrado');
}

node.parameters.jsCode = code;
fs.writeFileSync(wfPath, JSON.stringify(wf, null, 2), 'utf8');
console.log('\n✅ workflow_current.json atualizado');
