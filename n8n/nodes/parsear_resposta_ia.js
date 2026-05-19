const claude = $input.item.json;
const ctx = $('Montar Prompt Claude').item.json;

let ai = {
  resposta: null, novoStatus: null,
  notificarVendedor: false, mensagemVendedor: null,
  notificarGerente: false, mensagemGerente: null,
  observacoes: null, atualizarCliente: null, midia: null, score: null
};
try {
  const content = claude.content || [];
  const first = content[0] || {};
  let text = first.text || '{}';
  text = text.replace(/^```[a-z]*\s*/m, '').replace(/\s*```\s*$/m, '').trim();
  const parsed = JSON.parse(text);
  ai = Object.assign(ai, parsed);
} catch(e) {
  ai.resposta = 'Ola! Estou aqui para ajudar. Como posso te atender?';
}

if (!ai.resposta) ai.resposta = 'Ola! Como posso te ajudar hoje?';

if (ai.midia && !ai.midia.midiaId) {
  ai.midia = null;
}

const scoreNum = (ai.score != null && !isNaN(Number(ai.score))) ? Number(ai.score) : undefined;

return [{ json: Object.assign({}, ctx, {
  aiResposta: ai.resposta,
  novoStatus: ai.novoStatus,
  notificarVendedor: ai.notificarVendedor === true,
  mensagemVendedor: ai.mensagemVendedor,
  notificarGerente: ai.notificarGerente === true,
  mensagemGerente: ai.mensagemGerente,
  observacoes: ai.observacoes,
  atualizarCliente: ai.atualizarCliente || null,
  midia: ai.midia || null,
  score: scoreNum,
}) }];
