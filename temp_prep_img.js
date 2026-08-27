const resp = $input.item.json;
const ctx = $('Filtrar e Extrair').item.json;
const crm = $('Salvar no CRM').item.json;

const base64 = resp.base64 || resp.data || '';
const mimeType = resp.mimetype || resp.mediaType || 'image/jpeg';

if (!base64) {
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
      mensagem: '[Imagem recebida - nao foi possivel processar]',
      tipo: 'TEXTO'
    }
  }];
}

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
    mensagem: ctx.mensagem || '[Imagem]',
    tipo: 'TEXTO',
    imagemBase64: base64,
    imagemMimeType: mimeType.startsWith('image/') ? mimeType : 'image/jpeg'
  }
}];