// ============================================================
// FACILCRM V2 — N8N: Nó "Processar Instância Vendedor"
// Workflow: Rastreamento Vendedor
// Trigger: Webhook da instância do vendedor
// ============================================================

const body = $input.item.json.body || $input.item.json;
const event = ((body.event || '')).toUpperCase();
const data = body.data || {};
const key = data.key || {};
const instanciaVendedor = body.instance || body.instanceName || '';

// Só processa mensagens enviadas pelo vendedor (fromMe=true)
// ou recebidas de clientes na instância do vendedor
const isMsgVendedor = key.fromMe === true;
const isMsgCliente = key.fromMe === false;

if (!['MESSAGES_UPSERT', 'MESSAGES.UPSERT'].includes(event)) {
  return [{ json: { _ignorar: true, motivo: 'evento irrelevante' } }];
}

const remoteJid = key.remoteJid || '';
if (remoteJid.includes('@g.us')) {
  return [{ json: { _ignorar: true, motivo: 'grupo' } }];
}

let telefoneContato = remoteJid.replace(/@[^@]+$/, '');
// Normaliza número brasileiro
if (!telefoneContato.includes('@lid') && telefoneContato.startsWith('55') && telefoneContato.length === 12) {
  telefoneContato = '55' + telefoneContato.slice(2, 4) + '9' + telefoneContato.slice(4);
}

const msg = data.message || {};
const msgText = (msg.conversation || msg.extendedTextMessage?.text || '').toLowerCase();

// Detecta tipo de mensagem
const temAudio = !!(msg.audioMessage || msg.pttMessage);
const temImagem = !!(msg.imageMessage);
const temDocumento = !!(msg.documentMessage);
const temLink = msgText.includes('http') || msgText.includes('pix.') || msgText.includes('pagamento');

// Detecta orçamento enviado pelo vendedor
const palavrasOrcamento = [
  'orçamento', 'orcamento', 'proposta', 'valor:', 'total:', 'r$',
  'preço:', 'preco:', 'cotação', 'cotacao', 'tabela de preços'
];
const isOrcamento = isMsgVendedor && (
  temDocumento ||
  palavrasOrcamento.some(p => msgText.includes(p)) ||
  temLink
);

// Detecta confirmação de venda em áudio do vendedor
const isAudioVendedor = isMsgVendedor && temAudio;

// Detecta comprovante recebido do cliente
const isComprovante = isMsgCliente && (
  temImagem || temDocumento
) && (
  msgText.includes('comprovante') ||
  msgText.includes('pagamento') ||
  msgText.includes('pago') ||
  msgText.includes('transferência') ||
  msgText.includes('pix') ||
  temImagem // imagem recebida de cliente = possível comprovante
);

return [{
  json: {
    instanciaVendedor,
    telefoneContato,
    jid: remoteJid,
    isMsgVendedor,
    isMsgCliente,
    isOrcamento,
    isAudioVendedor,
    isComprovante,
    temAudio,
    temImagem,
    temDocumento,
    msgText: msgText.slice(0, 200),
    messageId: key.id || '',
    audioBase64: temAudio ? (data.message?.audioMessage?.base64 || null) : null,
  }
}];

// ============================================================
// NÓ SEGUINTE: "Buscar Lead no CRM"
// HTTP Request: GET /api/webhook/rastreamento-vendedor
// Body: { instanciaVendedor, telefoneContato, isOrcamento,
//         isAudioVendedor, isComprovante, audioBase64 }
// ============================================================
