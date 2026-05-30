// ═══════════════════════════════════════════════════════════════════
// NODE N8N: Detectar Opt-Out e Registrar no CRM
// ═══════════════════════════════════════════════════════════════════
//
// POSIÇÃO NO WORKFLOW (WhatsApp Agencia - Atendimento IA v2):
//   Logo após o node que extrai a mensagem do webhook (antes da IA).
//   Se detectar opt-out → chama /api/webhook/optout e para o fluxo.
//   Se não detectar → continua normalmente para a IA.
//
// COMO ADICIONAR:
//   1. Abrir workflow YCanhmW5AKNdvICI no N8N
//   2. Duplicar (opcional, para segurança)
//   3. Adicionar node "Code" após o node que lê a mensagem
//   4. Conectar: se output "optout" → node de resposta de confirmação
//                se output "continuar" → IA normalmente
// ═══════════════════════════════════════════════════════════════════

const mensagem = ($input.first().json.mensagem || "").trim().toUpperCase();
const instancia = $input.first().json.instancia || "";
const telefone  = $input.first().json.telefone  || "";

// Palavras que ativam opt-out (variações comuns em pt-BR)
const PALAVRAS_OPTOUT = [
  "PARAR",
  "SAIR",
  "STOP",
  "CANCELAR",
  "CANCELAR MENSAGENS",
  "NAO QUERO",
  "NÃO QUERO",
  "NAO QUERO MAIS",
  "NÃO QUERO MAIS",
  "DESCADASTRAR",
  "DESCADASTRE",
  "REMOVER",
  "ME REMOVA",
  "PARE",
  "CHEGA",
  "NUNCA MAIS",
  "BLOQUEAR",
];

// Verifica se a mensagem é exatamente uma das palavras ou contém o padrão
const ehOptOut = PALAVRAS_OPTOUT.some(palavra => {
  // Match exato (mensagem curta de 1-3 palavras)
  if (mensagem === palavra) return true;
  // Match no início da mensagem (ex: "PARAR POR FAVOR")
  if (mensagem.startsWith(palavra + " ")) return true;
  return false;
});

if (!ehOptOut) {
  return [{ json: { ...$input.first().json, _optout: false } }];
}

// ── Chamar webhook de opt-out no CRM ──────────────────────────────
let resultado = { ok: false, motivo: "não chamado" };

try {
  const response = await $http.request({
    method: "POST",
    url: "https://ocrmfacil.com.br/api/webhook/optout",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: "crm2026migra",
      instancia: instancia,
      telefone: telefone,
    }),
  });
  resultado = JSON.parse(response.body);
} catch (e) {
  resultado = { ok: false, motivo: String(e.message) };
}

// ── Montar resposta de confirmação para enviar ao cliente ──────────
const nomeCliente = resultado.nome || "cliente";
let mensagemResposta;

if (resultado.ok) {
  mensagemResposta =
    `Olá ${nomeCliente}! ✅ Seu pedido foi registrado com sucesso.\n\n` +
    `Você não receberá mais mensagens automáticas de nossa parte.\n\n` +
    `Caso mude de ideia, é só nos chamar aqui no WhatsApp. 😊`;
} else if (resultado.motivo === "já estava em opt-out") {
  mensagemResposta =
    `Olá! Você já estava cadastrado para não receber mensagens automáticas.\n\n` +
    `Não se preocupe — seu desejo continua registrado. 😊`;
} else {
  // Erro técnico — não expõe detalhes ao cliente
  mensagemResposta =
    `Recebemos sua solicitação! Vamos retirar você de nossa lista de mensagens automáticas.\n\n` +
    `Em caso de dúvida, fale com nossa equipe. 😊`;
}

return [{
  json: {
    ...$input.first().json,
    _optout: true,
    _optout_resultado: resultado,
    _mensagem_resposta: mensagemResposta,
  },
}];
