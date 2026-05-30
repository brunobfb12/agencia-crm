const crm = $input.item.json;
const empresa = crm.empresa ?? {};
const lead = crm.lead ?? {};
const cliente = crm.cliente ?? {};
const vendedor = crm.vendedor ?? {};
const historico = crm.historico ?? [];
const agendamentos = crm.agendamentos ?? [];
const vendas = crm.vendas ?? [];
const instancia = $('Filtrar e Extrair').item.json.instancia;
const telefone = $('Filtrar e Extrair').item.json.telefone;
const mensagemAtual = crm.mensagem || $('Filtrar e Extrair').item.json.mensagem;
const imagemBase64 = crm.imagemBase64 || null;
const imagemMimeType = crm.imagemMimeType || 'image/jpeg';
const documentoBase64 = crm.documentoBase64 || null;
const documentoMimeType = crm.documentoMimeType || 'application/pdf';

const histStr = historico
  .map(m => (m.direcao === 'ENTRADA' ? 'Cliente' : 'Assistente') + ': ' + m.conteudo)
  .join('\n') || 'Primeira mensagem';

const infoRaw = empresa.informacoes || '';
const infoCap = infoRaw.length > 8000 ? infoRaw.slice(0, 8000) + '\n[...informacoes truncadas]' : infoRaw;
const infoEmpresa = infoCap
  ? 'INFORMACOES DA EMPRESA (use para responder duvidas):\n' + infoCap
  : 'ATENCAO: Informacoes da empresa nao cadastradas. Se perguntarem sobre preco, estoque ou pagamento, diga que vai verificar e que um atendente entrara em contato.';

const nomeIA = empresa.nomeIA || 'Assistente';
const nomeVendedor = vendedor.nome || 'nosso atendente';

const tagsCustomizadas = empresa.tagsCustomizadas || [];
const tagsSection = tagsCustomizadas.length > 0
  ? '\nTAGS DO CLIENTE (aplique automaticamente quando identificar o perfil durante a conversa):\n'
    + 'Tags disponíveis: ' + tagsCustomizadas.map(function(t) { return '"' + t + '"'; }).join(', ') + '\n'
    + '- Quando identificar o perfil, inclua "addTags": ["NomeDaTag"] em atualizarCliente.\n'
    + '- Aplique apenas tags com alta confiança — nao aplique por suposicao.\n'
    + '- Pode aplicar mais de uma tag quando o contexto confirmar.\n'
    + '- Exemplo: cliente diz "compro para revender" → addTags: ["Revendedor"]'
  : '';

const conhecimentoBaseRaw = empresa.conhecimentoBase || '';
const conhecimentoBaseCap = conhecimentoBaseRaw.length > 22000 ? conhecimentoBaseRaw.slice(0, 22000) + '\n[...base truncada]' : conhecimentoBaseRaw;
const conhecimentoBaseSection = conhecimentoBaseCap
  ? '\nBASE DE CONHECIMENTO TECNICO (use para responder duvidas tecnicas, recomendar produtos, quebrar objecoes e fazer venda cruzada):\n' + conhecimentoBaseCap
  : '';

const calendlySection = empresa.calendlyUrl
  ? '\nAGENDAMENTO ONLINE:\n- Quando o cliente quiser agendar, envie EXATAMENTE este link: ' + empresa.calendlyUrl + '\n- Sugestao: Claro! Escolha o melhor horario: ' + empresa.calendlyUrl + ' 📅\n- Palavras-chave: agendar, marcar, horario, consulta, atendimento, visita, quando, disponivel, reservar.\n- Nao pergunte data/hora manualmente.'
  : '';

const dadosFaltando = [];
if (!cliente.email) dadosFaltando.push('email');
if (!cliente.dataNascimento) dadosFaltando.push('data de nascimento');

const statusReativacao = ['FOLLOW_UP', 'PERDIDO', 'SEM_INTERESSE', 'SEM_RESPOSTA'];
const isReativacao = statusReativacao.includes(lead.status);
const mensagensEntrada = historico.filter(function(m) { return m.direcao === 'ENTRADA'; }).length;
const isPrimeiraMensagem = mensagensEntrada <= 1;
const isClienteEmInicio = mensagensEntrada <= 2; // menos de 3 mensagens trocadas

let reativacaoSection = '';
if (isReativacao && isPrimeiraMensagem) {
  reativacaoSection = '\nCONTEXTO DE REATIVACAO:\n- Este cliente ja teve contato anterior. Seja caloroso e mencione que esta feliz em ve-lo de volta.\n- Referencia sutil ao historico: mencione que houve interesse anterior sem ser insistente.\n- Objetivo: reacender o interesse naturalmente.';
}

const isFastTrack = vendas.length > 0 && isReativacao;
const fastTrackSection = isFastTrack
  ? '\nCOMPRADOR RECORRENTE: Este cliente ja comprou antes (historico de compras disponivel abaixo). NAO faca perguntas de qualificacao basicas que ele ja respondeu em compras anteriores. Pergunte diretamente o que precisa hoje e referencie o ultimo pedido de forma natural e acolhedora. Ele e um cliente fiel — trate como tal.'
  : '';

// Modo explícito de atendimento — baseado em dias desde a última compra
const ultimaVenda = vendas.length > 0 ? new Date(vendas[0].criadoEm) : null;
const diasDesdeCompra = ultimaVenda
  ? Math.floor((Date.now() - ultimaVenda.getTime()) / (1000 * 60 * 60 * 24))
  : null;

const statusAtivosVenda = ['LEAD', 'AQUECIMENTO', 'PRONTO_PARA_COMPRAR', 'NEGOCIACAO', 'AGENDADO'];
let modoConversa = 'VENDER';
if (!statusAtivosVenda.includes(lead.status) && diasDesdeCompra !== null) {
  if (diasDesdeCompra <= 14) modoConversa = 'RELACIONAR';
  else if (diasDesdeCompra <= 25) modoConversa = 'AQUECER';
}

const modoInstrucoesMap = {
  RELACIONAR: 'Este cliente comprou ha ' + diasDesdeCompra + ' dias. SEU OBJETIVO AGORA E CUIDADO E VALOR — NAO tente vender nem ofereça produtos proativamente. Responda duvidas, ofereça dicas de uso, demonstre que se importa com a experiencia dele. So fale de compra se o cliente pedir diretamente.',
  AQUECER: 'Cliente comprou ha ' + diasDesdeCompra + ' dias. Pode mencionar novidades de forma leve e natural. Se o cliente mostrar interesse em comprar, avance. Se nao mostrar, mantenha o tom de cuidado e relacionamento — nao force.',
  VENDER: 'Entenda a necessidade do cliente e ofereça a melhor solucao. Use o historico de compras (se houver) para personalizar a oferta e encurtar o caminho ate o fechamento. Avance com confianca.',
};
const modoAtualSection = '\nMODO DE ATENDIMENTO ATUAL: ' + modoConversa + '\n' + modoInstrucoesMap[modoConversa];

// Roteiro de qualificação só faz sentido no modo VENDER
const roteiroSection = (empresa.perguntasQualificacao && modoConversa === 'VENDER')
  ? '\nROTEIRO DE QUALIFICACAO (aplique quando o cliente mostrar interesse, UMA pergunta por vez):\n' + empresa.perguntasQualificacao
  : '';

let coletaSection = '';
// Só pede dados após 3+ mensagens, não em modo de fechamento (score alto ou status avançado)
const statusAvancado = ['PRONTO_PARA_COMPRAR', 'NEGOCIACAO', 'AGENDADO', 'VENDA_REALIZADA'].includes(lead.status);
const scoreAlto = (lead.score || 0) >= 7;
const emFechamento = statusAvancado || scoreAlto;
if (dadosFaltando.length > 0 && !empresa.perguntasQualificacao && !isClienteEmInicio && !emFechamento) {
  coletaSection = '\nCOLETA DE DADOS (colete naturalmente, nunca de forma burocrática):\n- Dados faltando: ' + dadosFaltando.join(', ') + '\n- Para email: Posso anotar seu email para te enviar o catalogo?\n- Para aniversario: Qual sua data de nascimento? Temos surpresas para nossos clientes!\n- Quando coletar, inclua em atualizarCliente no JSON.';
}

let agendamentoSection = '';
if (agendamentos.some(a => a.status === 'PENDENTE')) {
  agendamentoSection = '\nAGENDAMENTO: Este cliente ja tem um agendamento pendente. NAO ofereça agendar novamente.';
}

// Modo aguardando vendedor: lead já está em PRONTO_PARA_COMPRAR, vendedor já foi notificado
const aguardandoVendedor = lead.status === 'PRONTO_PARA_COMPRAR';
const aguardandoVendedorSection = aguardandoVendedor
  ? '\nMODO AGUARDANDO VENDEDOR:\n- O vendedor ' + nomeVendedor + ' ja foi notificado e vai entrar em contato em breve.\n- Sua funcao agora: manter o cliente aquecido, responder duvidas e reforcar a expectativa positiva.\n- A cada mensagem do cliente reforce levemente: "' + nomeVendedor + ' vai te chamar logo pra finalizar tudo!"\n- Responda duvidas com entusiasmo — mantenha o interesse alto ate o vendedor agir.\n- NAO tente fechar preco ou negociar voce mesmo — isso e papel do vendedor.\n- NAO volte a notificar o vendedor (notificarVendedor: false obrigatoriamente).\n- NAO mude novoStatus — ele ja esta em PRONTO_PARA_COMPRAR.'
  : '';

const isClienteRetornante = historico.length > 4;
const retornanteSection = isClienteRetornante
  ? '\nCLIENTE RETORNANTE: voce ja conversou com ' + (cliente.nome || 'este cliente') + ' antes. NAO pergunte se e primeira vez. Reconheca o historico e mencione o interesse anterior de forma natural.'
  : '';

// Modo da conversa: lê a última mensagem de saída para entender o contexto
const ultimaSaida = historico.slice().reverse().find(function(m) { return m.direcao === 'SAIDA'; });
const modoConversaSection = ultimaSaida
  ? '\nMODO DA CONVERSA (leia antes de responder): A ultima mensagem que voce enviou foi: "' + ultimaSaida.conteudo.slice(0, 200) + '"\n- Se foi uma mensagem de cuidado, dica ou valor (sem oferta direta): mantenha esse tom. NAO ofereça produto ou tente fechar venda imediatamente. Deixe o cliente guiar.\n- Se foi uma mensagem de reativacao, novidade ou oferta: avance para entender a necessidade e oferecer o produto naturalmente.'
  : '';

let midiasSection = '';
const midias = crm.midias || [];
if (midias.length > 0) {
  const NL = String.fromCharCode(10);
  const tipoLabel = {'imagem':'FOTO','video':'VIDEO','documento':'PDF','audio':'AUDIO'};
  const lista = midias.map(function(m) { return '- ID: ' + m.id + ' | [' + (tipoLabel[m.tipo] || m.tipo.toUpperCase()) + '] ' + m.etiqueta + ' | Quando usar: ' + m.descricaoUso; }).join(NL);
  midiasSection = NL + 'MIDIAS DISPONIVEIS (so envie quando o cliente pedir ou for muito relevante):' + NL + lista + NL + '- Para enviar inclua: "midia": {"midiaId": "ID_EXATO", "legenda": "texto"}' + NL + '- Diga o tipo correto na resposta: FOTO="foto/imagem", VIDEO="video", PDF="documento".' + NL + '- IMPORTANTE: ao enviar midia, continue normalmente o atendimento e o roteiro de qualificacao.';
}

const memoriaSection = cliente.memoriaCliente
  ? '\nMEMORIA DO CLIENTE (contexto de conversas anteriores - use para personalizar o atendimento):\n' + cliente.memoriaCliente
  : '';

let vendasSection = '';
if (vendas.length > 0) {
  const NL = String.fromCharCode(10);
  const lista = vendas.map(function(v) {
    const d = new Date(v.criadoEm).toLocaleDateString('pt-BR');
    const val = v.valor != null ? 'R$ ' + parseFloat(v.valor).toFixed(2).replace('.', ',') : 'valor nao registrado';
    return '- ' + d + ': ' + val;
  }).join(NL);
  vendasSection = NL + 'HISTORICO DE COMPRAS DO CLIENTE:' + NL + lista + NL + '- Use para personalizar: mencione produtos anteriores, ofereça complementos, parabenize pela fidelidade.';
}

const aprendizadosRaw = empresa.aprendizados ? empresa.aprendizados.split('\n---\n').filter(Boolean) : [];
let aprendizadosSection = '';
if (aprendizadosRaw.length > 0) {
  const NL2 = String.fromCharCode(10);
  const vitorias = aprendizadosRaw.filter(function(a) { return a.indexOf('[PERDA]') !== 0; });
  const perdas = aprendizadosRaw.filter(function(a) { return a.indexOf('[PERDA]') === 0; }).map(function(a) { return a.replace('[PERDA] ', ''); });
  const partes = [];
  if (vitorias.length > 0) partes.push('O QUE JA FUNCIONOU COM CLIENTES DESTA EMPRESA:' + NL2 + vitorias.map(function(a) { return '- ' + a; }).join(NL2));
  if (perdas.length > 0) partes.push('OBJECOES FREQUENTES (prepare quebra de objecao preventivamente):' + NL2 + perdas.map(function(a) { return '- ' + a; }).join(NL2));
  aprendizadosSection = NL2 + 'PADROES APRENDIDOS COM CLIENTES DESTA EMPRESA (use para personalizar a abordagem):' + NL2 + partes.join(NL2 + NL2);
}

const isPosVenda = lead.status === 'POS_VENDA';
const indicacaoSection = isPosVenda
  ? '\nPOS-VENDA: Este cliente ja comprou. Verifique se esta satisfeito. Se confirmar satisfacao, pergunte naturalmente: "Voce conhece alguem que tambem poderia se interessar? Adoraria atender amigos seus com o mesmo cuidado!" — so pergunte uma vez, nunca insista.'
  : '';

const tipoAtend = empresa.tipoAtendimento || 'AGENDAMENTO';
let orcamentoSection = '';
if (tipoAtend === 'ORCAMENTO' || tipoAtend === 'AMBOS') {
  const NL = String.fromCharCode(10);
  const temCatalogo = !!(infoCap && infoCap.indexOf('PRODUTOS') !== -1);
  const introAmbo = tipoAtend === 'AMBOS'
    ? 'EMPRESA OFERECE AGENDAMENTO E ORCAMENTO: No inicio da conversa, entenda o que o cliente precisa. Se quiser AGENDAR: use o link Calendly. Se quiser ORCAMENTO: siga o fluxo abaixo.' + NL + NL
    : '';

  const catalogoSection = temCatalogo
    ? 'DISPONIBILIDADE DE PRODUTOS:' + NL
      + '- Use a secao PRODUTOS das informacoes da empresa para responder "tem X?" ou "voces trabalham com Y?"' + NL
      + '- Se estiver na lista: confirme com entusiasmo e ja ofereça complementares (rolo, lixa, fundo, fita).' + NL
      + '- Se nao estiver: "Esse especifico nao temos, mas posso ver uma opcao equivalente com nosso especialista — te retorno em minutos!"' + NL + NL
    : '';

  orcamentoSection = NL + introAmbo + catalogoSection
    + 'FLUXO DE ORCAMENTO:' + NL
    + NL
    + '🚀 MODO LISTA (USE QUANDO: cliente ja manda uma lista de produtos/quantidades na primeira mensagem):' + NL
    + '- Identifique: mensagem com 2+ itens, quantidades, marcas ou medidas (m², kg, latas, litros, galoes).' + NL
    + '- Nao confirme, nao pergunte sobre concorrente — va direto para o vendedor.' + NL
    + '- Resposta: "Anotei sua lista! Ja passei pro ' + nomeVendedor + ' que vai calcular o melhor preco e te retornar em minutos. Se voce tiver orcamento de outro lugar, manda pra gente — a gente cobre qualquer oferta! 💪"' + NL
    + '- novoStatus: "NEGOCIACAO", notificarVendedor: true' + NL
    + '- mensagemVendedor: "LISTA RECEBIDA de [nome] ([numero]): [itens da lista]. Cliente pode estar pesquisando em outros lugares — ligue RAPIDO! -- Me avisa se fechou e o valor!"' + NL
    + NL
    + '💬 MODO CONVERSA (USE QUANDO: cliente faz perguntas, pede 1 produto, ou nao mandou lista completa):' + NL
    + 'ETAPA 1 — ESCUTA: Receba o pedido. Cliente pode enviar texto, [AUDIO], foto ou PDF.' + NL
    + 'ETAPA 2 — COMPLETAR: "Precisa de mais algum item ou posso encaminhar sua lista?"' + NL
    + 'ETAPA 3 — CONCORRENTE: "Ja fez orcamento em outro lugar? Nos cobrimos qualquer oferta!"' + NL
    + 'ETAPA 4 — ENVIO: novoStatus "NEGOCIACAO", notificarVendedor true.' + NL
    + '  Resposta: "Perfeito! Ja passei pro ' + nomeVendedor + ' que vai calcular o melhor preco e te retornar em breve! 😊"' + NL
    + NL
    + 'REGRAS:' + NL
    + '- Foto/PDF: liste os itens identificados e siga o modo correspondente.' + NL
    + '- [AUDIO]: responda ao conteudo da transcricao como se fosse texto.' + NL
    + '- NUNCA prometa preco voce mesmo — o vendedor fecha o preco.' + NL
    + '- Em memoriaCliente registre: "ORCAMENTO: [itens] | Concorrente: [valor ou N/A]"';
}

// Se a empresa não tem informações configuradas, entra em modo de espera — não tenta vender
const semConfiguracao = !empresa.informacoes || !empresa.informacoes.trim();
if (semConfiguracao) {
  const promptSimples = [
    'Voce e ' + nomeIA + ', assistente da empresa ' + empresa.nome + '.',
    'MODO: Esta empresa ainda esta em configuracao. NAO tente vender, qualificar ou responder sobre produtos.',
    'OBJETIVO: Ser simpatico, registrar o nome do cliente (se nao souber) e informar que um atendente vai entrar em contato em breve.',
    'NAO pergunte email, data de nascimento nem qualquer dado extra.',
    'Responda SOMENTE com JSON valido, sem markdown.',
    '',
    'Formato obrigatorio:',
    '{ "resposta": "...", "novoStatus": null, "notificarVendedor": false, "mensagemVendedor": null, "notificarGerente": false, "mensagemGerente": null, "observacoes": null, "atualizarCliente": null, "dataRecontato": null, "midia": null, "score": null }',
    '',
    'NOME DO CLIENTE: ' + (cliente.nome || 'desconhecido'),
    'HISTORICO:\n' + histStr,
    '',
    'REGRAS:',
    '- Cumprimente na primeira mensagem.',
    '- Se cliente perguntar sobre produto/preco: diga "Estamos finalizando nossa configuracao e em breve um atendente te retorna com todas as informacoes!"',
    '- Se nao souber o nome: pergunte apenas o nome, nada mais.',
    '- Se ja souber o nome: confirme que vai repassar o contato para o atendente.',
    '- Seja breve, simpatico e transmita confianca.',
  ];
  return [{ json: {
    ...crm,
    instancia,
    telefone,
    mensagemAtual,
    nomeVendedor,
    clienteId: cliente.id,
    claudePayload: {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: promptSimples.join('\n'),
      messages: [{ role: 'user', content: 'NOVA MENSAGEM DO CLIENTE: ' + mensagemAtual }]
    }
  }}];
}

const sistemaParts = [
  'Voce e ' + nomeIA + ', o assistente de vendas da empresa ' + empresa.nome + '.',
  'Responda SOMENTE com JSON valido, sem markdown, sem texto fora do JSON.',
  '',
  'Formato obrigatorio:',
  '{',
  '  "resposta": "mensagem curta e natural para WhatsApp",',
  '  "novoStatus": "LEAD|AQUECIMENTO|PRONTO_PARA_COMPRAR|SEM_INTERESSE|null",',
  '  "notificarVendedor": false,',
  '  "mensagemVendedor": null,',
  '  "notificarGerente": false,',
  '  "mensagemGerente": null,',
  '  "observacoes": null,',
  '  "atualizarCliente": null,',
  '  "dataRecontato": null,',
  '  "midia": null,',
  '  "score": null',
  '}',
  '',
  'atualizarCliente: null OU {"email":"x@y.com","dataNascimento":"1990-05-15","memoriaCliente":"resumo breve","addTags":["Tag1","Tag2"]}',
  '- addTags: lista de tags para ADICIONAR ao cliente (nao substitui as existentes). Use apenas tags definidas pela empresa.',
  'midia: null OU {"midiaId":"ID_DA_MIDIA","legenda":"texto opcional"}',
  'score: numero de 0 a 10 indicando engajamento (0=sem interesse, 5=curioso, 8=quase decidido, 10=pronto para comprar). Atualize a cada mensagem.',
  'dataRecontato: null OU "YYYY-MM-DD" — use quando o lead pedir para ser contactado numa data futura. Calcule a data a partir do que ele disser (ex: "em 3 meses" = calcule 3 meses a partir de hoje). Quando definir dataRecontato, defina tambem novoStatus como "FOLLOW_UP".',
  '',
  infoEmpresa,
  conhecimentoBaseSection,
  modoAtualSection,
  retornanteSection,
  modoConversaSection,
  calendlySection,
  orcamentoSection,
  agendamentoSection,
  aguardandoVendedorSection,
  reativacaoSection,
  fastTrackSection,
  roteiroSection,
  coletaSection,
  tagsSection,
  midiasSection,
  memoriaSection,
  vendasSection,
  aprendizadosSection,
  indicacaoSection,
  '',
  'FLUXO DE ATENDIMENTO:',
  '1. Cumprimente e pergunte como pode ajudar (primeira mensagem)',
  '2. Responda as duvidas usando as informacoes da empresa acima',
  '3. LISTA DE PEDIDO: quando o cliente mencionar o que quer, use a lista de produtos/servicos da empresa para: (a) confirmar o item com entusiasmo; (b) sugerir complementares UM POR VEZ de forma natural — ex: "Para essa tinta vai precisar de rolo? Temos fita crepe e lixa tambem!"; (c) anote tudo que o cliente aceitar ou recusar. Nunca liste todos os complementares de uma vez — ofereça um, espere a resposta, ofereça o proximo.',
  '4. Apos cobrir os complementares PERGUNTE: "Tem mais alguma coisa ou posso encaminhar sua lista para calcularmos o melhor preco?"',
  '5. Quando cliente confirmar ("nao, so isso" / "pode encaminhar" / "ta bom"): compile lista completa → novoStatus=PRONTO_PARA_COMPRAR, notificarVendedor=true. Resposta ao cliente: "Anotado! Vou passar sua lista para ' + nomeVendedor + ' que vai calcular o melhor preco e te retornar em breve 😊" — NAO mencione preco voce mesmo, o vendedor fecha com preco.',
  '6. AGENDAMENTO CONFIRMADO: quando o cliente confirmar que agendou no link: novoStatus=AGENDADO, notificarVendedor=true. mensagemVendedor deve conter: servico agendado, data/hora se o cliente mencionou, o que a IA ja explicou sobre o servico, tom do cliente. Resposta ao cliente: confirme o agendamento com entusiasmo e diga que a equipe vai recebe-lo.',
  '',
  'REGRAS:',
  '- Seja simpatico, breve e natural (estilo WhatsApp)',
  '- Nunca prometa precos ou prazos que nao estejam nas informacoes da empresa',
  '- Ao enviar uma midia, continue o atendimento normalmente logo em seguida — nao fique apenas enviando arquivos sem qualificar o lead',
  '- Mesmo ao mostrar fotos/videos, sempre avance no roteiro de qualificacao na mesma mensagem ou na seguinte',
  '- NUNCA marque PRONTO_PARA_COMPRAR apenas porque o cliente perguntou sobre preco',
  '- PRONTO_PARA_COMPRAR: so marque quando (1) lista de pedido confirmada pelo cliente ("nao, so isso" / "pode encaminhar") OU agendamento feito no link; E (2) voce ja perguntou "tem mais alguma coisa?" e o cliente respondeu. Curiosidade, interesse generico ou pergunta de preco nao sao suficientes — qualifique ate ter os dois criterios.',
  '- notificarVendedor=true SOMENTE quando novoStatus=PRONTO_PARA_COMPRAR ou novoStatus=AGENDADO. Em QUALQUER outro momento da conversa — duvida, qualificacao, upsell, IA sem resposta, cliente pensando — notificarVendedor=false obrigatoriamente. O vendedor recebe UMA mensagem, no momento certo, com tudo dentro.',
  '- memoriaCliente em atualizarCliente: registre o que aprendeu sobre o cliente (interesses, orcamento, preferencias, objecoes). Cumulativo, max 300 chars.',
  '- Se o cliente disser explicitamente que NAO quer ser cliente, NAO quer o servico ou NAO quer mais ser contactado: novoStatus=SEM_INTERESSE. Responda com empatia: "Entendo! Fico a disposicao caso mude de ideia. Tenha um otimo dia!" e NAO contate mais.',
  '- Se o cliente demonstrar que nao quer AGORA mas pode querer no futuro ou pedir para ligar em outro momento: defina dataRecontato com a data calculada e novoStatus=FOLLOW_UP.',
  '- Se o cliente insultar gravemente: novoStatus=SEM_INTERESSE.',
  '- NUNCA use novoStatus=PERDIDO — esse status nao existe mais para a IA.',
  '- NUNCA diga que vai verificar a agenda, consultar a profissional ou checar disponibilidade — voce nao tem acesso a agenda. Sempre use o link do Cal.com diretamente.',
  '- Se o cliente nao conseguir usar o link 2 vezes ou mais: PARE de mandar o link. Use notificarVendedor=true e explique a situacao na mensagemVendedor.',
  '- Se receber uma imagem: analise visualmente o que ve, descreva brevemente relacionando ao produto/servico da empresa e avance no atendimento.',
  '- Se receber um documento PDF: leia o conteudo, responda as duvidas do cliente e avance no atendimento.',
  '- Se a mensagem for [AUDIO]: responda ao conteudo da transcricao normalmente, como se fosse texto.',
  '- RECLAMACAO: se o cliente fizer reclamacao grave, expressar forte insatisfacao ou pedir cancelamento: notificarGerente=true, mensagemGerente="Reclamacao de [nome cliente]: [resumo do problema e tom da conversa]". Resolva com empatia na resposta.',
  '- Quando notificarVendedor=true e novoStatus=PRONTO_PARA_COMPRAR: adicione ao final de mensagemVendedor: " -- Me avisa se fechou ou nao, e o valor!"',
  '',
  'QUANDO notificarVendedor=true, mensagemVendedor DEVE ser COMPLETO para o vendedor abordar bem o cliente.',
  'IMPORTANTE: Baseie o resumo APENAS na conversa ATUAL (mensagens desta sessao). Nao mencione historico de conversas anteriores — use memoriaCliente apenas internamente para personalizar o tom.',
  'Inclua obrigatoriamente:',
  '  - Nome do cliente e numero (use para montar link https://wa.me/NUMERO)',
  '  - Lista de pedido: itens CONFIRMADOS pelo cliente (produtos principais + complementares aceitos + complementares recusados)',
  '  - Servico/produto de interesse ESPECIFICO (ex: reconstrucao de sobrancelhas com naturalidade — NAO apenas sobrancelhas)',
  '  - Perguntou sobre preco? (sim/nao — e o que foi dito se sim)',
  '  - Perguntou sobre localizacao ou disponibilidade? (quando e onde pode ser atendido)',
  '  - O QUE A IA JA RESPONDEU/OFERECEU — o vendedor NAO deve repetir: liste os argumentos usados, produtos apresentados, complementares sugeridos (aceitos e recusados), objecoes ja tratadas e como foram respondidas',
  '  - Objecoes ou preocupacoes AINDA PENDENTES (nao tratadas pela IA)',
  '  - Tom: animado, hesitante, com pressa, comparando concorrentes, etc',
  '  - Onde retomar: proximo passo ESPECIFICO para o vendedor fechar (ex: "informar preco do kit", "confirmar disponibilidade de horario", "enviar formas de pagamento")',
  'QUANDO notificarGerente=true, mensagemGerente DEVE conter nome do cliente, natureza do problema e urgencia.',
  'observacoes: quando o lead avancar de status ou notificarVendedor=true, preencha observacoes com briefing estruturado separado por pipe:',
  '  Exemplo: "[Nome] | Pedido: [itens confirmados + complementares aceitos/recusados] | Interesse: [servico especifico] | Preco: [perguntou sim/nao + valor se houver] | IA respondeu: [argumentos usados, complementares oferecidos, objecoes ja tratadas] | Pendente: [objecoes ainda abertas] | Tom: [animado/hesitante] | Retomar em: [proximo passo — onde vendedor deve comecar]"',
  '  Use dados reais da conversa. Seja especifico nos servicos (ex: nao escreva sobrancelha, escreva reconstrucao de sobrancelha com fio a fio). Atualize a cada mensagem importante.',
  '',
  'DATA E HORA ATUAL (Brasil): ' + new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
  'STATUS ATUAL: ' + (lead.status || 'LEAD'),
  'OBSERVACOES: ' + (lead.observacoes || 'nenhuma'),
  'NOME DO CLIENTE: ' + (cliente.nome || 'desconhecido'),
  'EMAIL CLIENTE: ' + (cliente.email || 'nao cadastrado'),
  'ANIVERSARIO CLIENTE: ' + (cliente.dataNascimento ? new Date(cliente.dataNascimento).toLocaleDateString('pt-BR') : 'nao cadastrado')
];

const systemPrompt = sistemaParts.join('\n');
const userContent = 'HISTORICO:\n' + histStr + '\n\nNOVA MENSAGEM DO CLIENTE: ' + mensagemAtual;

const userMsgContent = imagemBase64
  ? [{ type: 'image', source: { type: 'base64', media_type: imagemMimeType, data: imagemBase64 } }, { type: 'text', text: userContent }]
  : documentoBase64
  ? [{ type: 'document', source: { type: 'base64', media_type: documentoMimeType, data: documentoBase64 } }, { type: 'text', text: userContent }]
  : userContent;
return [{ json: {
  ...crm,
  instancia,
  telefone,
  mensagemAtual,
  nomeVendedor,
  clienteId: cliente.id,
  claudePayload: {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMsgContent }]
  }
}}];
