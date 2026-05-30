import https from 'https';

const informacoes = `PRODUTOS: CRM com IA para WhatsApp — atende leads 24/7, qualifica automaticamente, faz follow-up, pos-venda, kanban de leads, campanhas, aniversario automatico e Roda de Relacionamento (ciclo completo ate recompra).

COMO FUNCIONA:
A IA atende o lead no WhatsApp, qualifica, aquece e so chama o vendedor quando esta pronto para comprar — com resumo completo da conversa. Vendedor so entra para fechar.

PRECOS:
- Starter: R$497/mes (ou R$4.970/ano, 2 meses gratis) — 1 WhatsApp, ate 500 leads
- Pro: R$897/mes (ou R$8.970/ano, 2 meses gratis) — ate 2 WhatsApp, leads ilimitados, campanhas, analytics — MAIS POPULAR
- Agency: R$1.497/mes (ou R$14.970/ano, 2 meses gratis) — ate 3 WhatsApp, implantacao feita por nos, suporte prioritario, gerente de conta dedicado
- Todos os planos: 30 dias gratis sem cartao, cancele quando quiser sem multa

PAGAMENTO: PIX, cartao de credito parcelado ou recorrencia. Sem multa de rescisao.

DIFERENCIAIS:
- Cobrado por empresa, nao por usuario (Kommo cobra por usuario — 3 vendedores = ate R$1.800/mes; aqui sao R$497)
- IA inclusa em todos os planos (Letalk e Umbler cobram a parte; Umbler cobra R$3.000 de setup + ate R$2.089/mes)
- Roda de Relacionamento exclusiva: pos-venda D+7/D+20/D+45, reativacao de carteira inativa, aniversario automatico
- Setup em 5 minutos, sem tecnico ou programador

LINK CADASTRO:
- Starter: https://www.ocrmfacil.com.br/registro?plano=STARTER
- Pro: https://www.ocrmfacil.com.br/registro?plano=PRO
- Agency: https://www.ocrmfacil.com.br/registro?plano=AGENCY
- Site completo: https://www.ocrmfacil.com.br

HORARIO: segunda a sexta 08:00-19:00, sabados 08:00-13:00.`;

const perguntas = `ROTEIRO DE QUALIFICACAO (siga naturalmente, UMA pergunta por vez):

ETAPA 1 - Negocio
"Me conta sobre sua empresa — qual e o segmento e como voce vende hoje?"

ETAPA 2 - Equipe
"Voce tem vendedores ou atende sozinho? Se tem equipe, quantos?"

ETAPA 3 - Dor principal
"Como esta o atendimento hoje? Consegue responder todos os leads no mesmo dia?"
- Se demoram: "Exatamente isso a IA resolve — responde em menos de 30s, qualquer hora."
- Se perdem follow-up: "O follow-up automatico foi feito pra isso — zero leads esquecidos."

ETAPA 4 - Urgencia
"Voce busca solucao para comecar agora ou ainda esta pesquisando?"

ETAPA 5 - Indicar plano e enviar link
- 1 pessoa ou comecando → Starter R$497/mes: https://www.ocrmfacil.com.br/registro?plano=STARTER
- 2 a 5 vendedores → Pro R$897/mes: https://www.ocrmfacil.com.br/registro?plano=PRO
- Agencia ou multiplas empresas → Agency R$1.497/mes: https://www.ocrmfacil.com.br/registro?plano=AGENCY
"Pelo que voce me contou, o plano [NOME] e o ideal. 30 dias gratis sem cartao. Posso enviar o link?"

ETAPA 6 - Se hesitar
"O risco e zero — gratis, sem cartao, cancela quando quiser. O que te impede de testar?"

ETAPA 7 - Se pedir mais tempo
"Sem problema! Tem alguma duvida especifica que posso resolver agora?"`;

function sendRequest(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request({
      hostname: 'ocrmfacil.com.br', port: 443,
      path: '/api/admin/migrate', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Update each field separately to avoid dollar-sign conflicts
const updates = [
  { field: 'nomeIA',            value: 'Sofia' },
  { field: 'tipoAtendimento',   value: 'AGENDAMENTO' },
  { field: 'informacoes',       value: informacoes },
  { field: 'perguntasQualificacao', value: perguntas },
];

for (const { field, value } of updates) {
  const r = await sendRequest({
    secret: 'crm2026migra',
    sql: `UPDATE "Empresa" SET "${field}" = '${value.replace(/'/g, "''")}' WHERE "instanciaWhatsapp" = 'o_crm_facil'`
  });
  console.log(field + ':', r.ok ? 'OK' : 'ERRO — ' + r.result);
}

// Verify
const check = await sendRequest({
  secret: 'crm2026migra',
  querySql: `SELECT "nomeIA", "tipoAtendimento", length(informacoes) as info_chars, length("perguntasQualificacao") as pq_chars FROM "Empresa" WHERE "instanciaWhatsapp" = 'o_crm_facil'`
});
const row = check.rows[0];
console.log('\n=== Verificação ===');
console.log('nomeIA:', row.nomeIA);
console.log('tipoAtendimento:', row.tipoAtendimento);
console.log('informacoes:', row.info_chars, 'chars');
console.log('perguntasQualificacao:', row.pq_chars, 'chars');
