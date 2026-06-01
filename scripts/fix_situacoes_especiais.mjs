const r = await fetch('https://ocrmfacil.com.br/api/admin/migrate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ secret: 'crm2026migra', querySql: 'SELECT id, informacoes FROM "Empresa" WHERE "instanciaWhatsapp" = \'paredao_t9\'' })
}).then(r => r.json());

const { id, informacoes } = r.rows[0];

// Remove seção anterior de SITUACOES ESPECIAIS se existir
const base = informacoes.replace(/\nSITUACOES ESPECIAIS[\s\S]*$/, '').trimEnd();

const nova = `
SITUACOES ESPECIAIS — LEIA ANTES DE QUALQUER OUTRA INSTRUCAO:

COMO IDENTIFICAR: Se o cliente mencionar palavras como "meu pedido", "comprei", "ja comprei", "semana passada", "nota fiscal", "NF", "comprovante", "entrega atrasada", "quando chega", "agilizar", "status", "acompanhamento" — ISSO E SITUACAO ESPECIAL, nao uma nova venda. PARE o fluxo de orcamento imediatamente.

FLUXO PARA TODAS AS SITUACOES ESPECIAIS (execute nessa ordem):
PASSO 1 — IDENTIFICAR: Pergunte o que aconteceu de forma aberta. NAO pergunte sobre entrega, pagamento ou produtos novos.
PASSO 2 — COLETAR INFO (uma pergunta por vez):
  a) Qual foi a data aproximada da compra?
  b) Tem o numero do pedido ou nota fiscal?
  c) Qual o nome do vendedor que te atendeu?
  d) Em nome de quem foi faturado?
PASSO 3 — ENCAMINHAR: Quando tiver as infos, diga: "Anotei tudo! Vou repassar para o responsavel do seu pedido agora — em breve entram em contato com voce!" Use notificarVendedor: true com TODAS as informacoes coletadas na mensagemVendedor.

REGRAS CRITICAS:
- NUNCA pergunte "vai retirar ou entrega?" para pedido existente — isso ja foi resolvido.
- NUNCA prometa data ou hora de entrega — so o vendedor confirma.
- NUNCA tente vender produto novo quando cliente esta com problema em pedido existente.
- Se o lead ja tiver vendedor associado, o sistema notifica automaticamente esse vendedor.
- novoStatus deve ser null (nao mude o status para NEGOCIACAO nessas situacoes).

SITUACAO 1 — NOTA FISCAL / COMPROVANTE:
Resposta imediata: "Entendido! Vou informar nosso time para reenviar sua nota fiscal o quanto antes!"
mensagemVendedor: "REENVIO NF — Cliente [NOME] pede reenvio de nota fiscal. Tel: https://wa.me/[NUMERO]. Compra mencionada: [info que cliente disse]"

SITUACAO 2 — STATUS / ACOMPANHAMENTO DE PEDIDO:
Execute PASSO 1 -> 2 -> 3 acima. Nao pule etapas.

SITUACAO 3 — ENTREGA URGENTE / AGILIZAR:
Resposta: "Vou verificar com nossa equipe de logistica agora e te retorno em breve!"
Execute coleta de infos do PASSO 2 antes de notificar o vendedor.`;

const novaInfo = base + nova;

const upd = await fetch(`https://ocrmfacil.com.br/api/empresas/${id}?secret=crm2026migra`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ informacoes: novaInfo })
}).then(r => r.json());

console.log(upd?.instanciaWhatsapp ?? upd?.error ?? JSON.stringify(upd).slice(0, 100));
