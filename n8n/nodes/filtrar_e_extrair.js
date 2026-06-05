const body = $input.item.json.body || $input.item.json;
const event = ((body.event || '')).toUpperCase();
const data = body.data || {};
const key = data.key || {};

if (key.fromMe === true) return [];
if ((key.remoteJid || '').includes('@g.us')) return [];
if (!['MESSAGES_UPSERT', 'MESSAGES.UPSERT'].includes(event)) return [];

const instancia = body.instance || body.instanceName || '';
const remoteJid = key.remoteJid || '';
const isLid = remoteJid.includes('@lid');

let telefone = remoteJid.replace(/@[^@]+$/, '');
if (!telefone || !instancia) return [];

if (!isLid && telefone.startsWith('55') && telefone.length === 12) {
  telefone = '55' + telefone.slice(2, 4) + '9' + telefone.slice(4);
}

const msg = data.message || {};
const extText = msg.extendedTextMessage || {};
const imgMsg = msg.imageMessage || {};
const vidMsg = msg.videoMessage || {};
const audioMsg = msg.audioMessage || msg.pttMessage || null;
const docMsg = msg.documentMessage || null;
const callMsg = msg.callMessage || null;

let tipo = 'TEXTO';
let mensagem = msg.conversation || extText.text || imgMsg.caption || vidMsg.caption || null;
let respostaImediata = null;

// Detectar chamada de voz/vídeo
if (callMsg) {
  tipo = 'CHAMADA';
  mensagem = '[CHAMADA ' + (callMsg.isVideo ? 'DE VIDEO' : 'DE VOZ') + ']';
  respostaImediata = null;
  // Continuar processamento para notificar vendedor
}

if (!mensagem) {
  if (callMsg) {
    tipo = 'CHAMADA';
    mensagem = '[CHAMADA ' + (callMsg.isVideo ? 'DE VIDEO' : 'DE VOZ') + ']';
    respostaImediata = null;
  } else if (audioMsg) {
    tipo = 'AUDIO';
    mensagem = '[AUDIO]';
    respostaImediata = null;
  } else if (docMsg) {
    tipo = 'DOCUMENTO';
    mensagem = '[DOCUMENTO]';
    respostaImediata = null;
  } else if (imgMsg.url || imgMsg.directPath) {
    tipo = 'IMAGEM';
    mensagem = '[IMAGEM]';
    respostaImediata = null;
  } else if (vidMsg.url || vidMsg.directPath) {
    tipo = 'VIDEO';
    mensagem = '[VIDEO]';
    respostaImediata = 'Não consegui abrir seu vídeo 🎥 Pode me mandar um áudio resumindo o que você falou? Assim consigo te ajudar melhor! 😊';
  } else {
    return [];
  }
}

return [{ json: {
  instancia,
  telefone,
  telefoneSend: isLid ? null : telefone,
  jid: remoteJid,
  isLid,
  mensagem,
  nomeContato: data.pushName || '',
  messageId: key.id || '',
  tipo,
  respostaImediata
}}];