const resp = $input.item.json;
const ctx = $('Filtrar e Extrair').item.json;

const base64 = resp.base64 || resp.data || '';

if (!base64) {
  return [{
    json: {
      _audioFallback: true,
      mensagem: '[Audio recebido - nao foi possivel processar]',
      instancia: ctx.instancia,
      telefone: ctx.telefone,
      telefoneSend: ctx.telefoneSend,
      jid: ctx.jid,
      isLid: ctx.isLid,
      nomeContato: ctx.nomeContato,
      messageId: ctx.messageId
    }
  }];
}

return [{
  json: {
    _audioFallback: false,
    instancia: ctx.instancia,
    telefone: ctx.telefone,
    telefoneSend: ctx.telefoneSend,
    jid: ctx.jid,
    isLid: ctx.isLid,
    nomeContato: ctx.nomeContato,
    messageId: ctx.messageId
  },
  binary: {
    audioFile: {
      data: base64,
      mimeType: 'audio/ogg',
      fileName: 'audio.ogg',
      fileType: 'audio'
    }
  }
}];