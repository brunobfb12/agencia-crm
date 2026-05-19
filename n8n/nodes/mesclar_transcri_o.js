const groqResp = $input.item.json;
const prep = $('Preparar Audio Binário').item.json;
const ctx = $('Filtrar e Extrair').item.json;
const crm = $('Salvar no CRM').item.json;

const transcricao = (groqResp.text || '').trim();
const fallbackMsg = prep._audioFallback ? prep.mensagem : '';

return [{
  json: {
    ...crm,
    instancia: ctx.instancia,
    telefone: ctx.telefone,
    telefoneSend: ctx.telefoneSend,
    jid: ctx.jid,
    isLid: ctx.isLid,
    nomeContato: ctx.nomeContato,
    messageId: ctx.messageId,
    mensagem: transcricao || fallbackMsg || '[Audio nao transcrito]',
    tipo: 'TEXTO'
  }
}];