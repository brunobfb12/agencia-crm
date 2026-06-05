/**
 * NODE N8N: Processar Chamada
 *
 * Entrada: $input.item.json contendo:
 *   - tipo: "CHAMADA"
 *   - instancia: "paredao_t9"
 *   - telefone: "5562981282288"
 *   - isVideo: true/false
 *
 * Ação: Chama webhook /api/webhook/chamada para notificar vendedor
 */

const item = $input.item.json;

if (item.tipo !== 'CHAMADA') {
  return [];
}

const appUrl = 'https://ocrmfacil.com.br';

const payload = {
  instancia: item.instancia,
  telefone: item.telefone,
  tipo: 'CHAMADA',
  isVideo: item.callMsg?.isVideo ?? false,
};

// Chamar webhook
const response = await fetch(`${appUrl}/api/webhook/chamada`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

const result = await response.json();

return [{
  json: {
    chamada_processada: true,
    lead_id: result.lead,
    cliente_nome: result.cliente,
    vendedor_notificado: result.notificado,
  }
}];
