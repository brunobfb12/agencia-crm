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

const infoEmpresa = empresa.informacoes
  ? 'INFORMACOES DA EMPRESA (use para responder duvidas):\n' + empresa.informacoes
  : 'ATENCAO: Informacoes da empresa nao cadastradas. Se perguntarem sobre preco, estoque ou pagamento, diga que vai verificar e que um atendente entrara em contato.';

const nomeIA = empresa.nomeIA || 'Assistente';
const nomeVendedor = vendedor.nome || 'nosso atendente';

const calendlySection = empresa.calendlyUrl
  ? '\nAGENDAMENTO ONLINE:\n- Quando o cliente quiser agendar, envie EXATAMENTE este link: ' + empresa.calendlyUrl + '\n- Sugestao: Claro! Escolha o melhor horario: ' + empresa.calendlyUrl + ' 📅\n- Palavras-chave: agendar, marcar, horario, consulta, atendimento, visita, quando, disponivel, reservar.\n- Nao pergunte data/hora manualmente.'
  : '';

const dadosFaltando = [];
if (!cliente.email) dadosFaltando.push('email');
if (!cliente.dataNascimento) dadosFaltando.push('data de nascimento');

const statusReativacao = ['FOLLOW_UP', 'PERDIDO', 'SEM_INTERESSE', 'SEM_RESPOSTA'];
const isReativacao = statusReativacao.includes(lead.status);
const isPrimeiraMensagem = historico.length <= 1;

let reativacaoSection = '';
if (isReativacao && isPrimeiraMensagem) {
  reativacaoSection = '\nCONTEXTO DE REATIVACAO:\n- Este cliente ja teve contato anterior. Seja caloroso e mencione que esta feliz em ve-lo de volta.\n- Referencia sutil ao historico: mencione que houve interesse anterior sem ser insistente.\n- Objetivo: reacender o interesse naturalmente.';
}

const roteiroSection = empresa.perguntasQualificacao
  ? '\nROTEIRO DE QUALIFICACAO (aplique quando o cliente mostrar interesse, UMA pergunta por vez):\n' + empresa.perguntasQualificacao
  : '';

let coletaSection = '';
if (dadosFaltando.length > 0 && !empresa.perguntasQualificacao) {
  coletaSection = '\nCOLETA DE DADOS (colete naturalmente, nunca de forma burocrática):\n- Dados faltando: ' + dadosFaltando.join(', ') + '\n- Para email: Posso anotar seu email para te enviar o catalogo?\n- Para aniversario: Qual sua data de nascimento? Temos surpresas para nossos clientes!\n- Quando coletar, inclua em atualizarCliente no JSON.';
}

let agendamentoSection = '';
if (agendamentos.some(a => a.status === 'PENDENTE')) {
  agendamentoSection = '\nAGENDAMENTO: Este cliente ja tem um agendamento pendente. NAO ofereça agendar novamente.';
}

const isClienteRetornante = historico.length > 4;
const retornanteSection = isClienteRetornante
  ? '\nCLIENTE RETORNANTE: voce ja conversou com ' + (cliente.nome || 'este cliente') + ' antes. NAO pergunte se e primeira vez. Reconheca o historico e mencione o interesse anterior de forma natural.'
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

const sistemaParts = [
  'Voce e ' + nomeIA + ', o assistente de vendas da empresa ' + empresa.nome + '.',
  'Responda SOMENTE com JSON valido, sem markdown, sem texto fora do JSON.',
  '',
  'Formato obrigatorio:',
  '{',
  '  "resposta": "mensagem curta e natural para WhatsApp",',
  '  "novoStatus": "LEAD|AQUECIMENTO|PRONTO_PARA_COMPRAR|null",',
  '  "notificarVendedor": false,',
  '  "mensagemVendedor": null,',
  '  "notificarGerente": false,',
  '  "mensagemGerente": null,',
  '  "observacoes": null,',
  '  "atualizarCliente": null,',
  '  "midia": null,',
  '  "score": null',
  '}',
  '',
  'atualizarCliente: null OU {"email":"x@y.com","dataNascimento":"1990-05-15","memoriaCliente":"resumo breve"}',
  'midia: null OU {"midiaId":"ID_DA_MIDIA","legenda":"texto opcional"}',
  'score: numero de 0 a 10 indicando engajamento (0=sem interesse, 5=curioso, 8=quase decidido, 10=pronto para comprar). Atualize a cada mensagem.',
  '',
  infoEmpresa,
  retornanteSection,
  calendlySection,
  agendamentoSection,
  reativacaoSection,
  roteiroSection,
  coletaSection,
  midiasSection,
  memoriaSection,
  vendasSection,
  aprendizadosSection,
  indicacaoSection,
  '',
  'FLUXO DE ATENDIMENTO:',
  '1. Cumprimente e pergunte como pode ajudar (primeira mensagem)',
  '2. Responda as duvidas usando as informacoes da empresa acima',
  '3. Se nao tiver a informacao: diga que vai verificar e um atendente entrara em contato (novoStatus=PRONTO_PARA_COMPRAR, notificarVendedor=true)',
  '4. Apos responder todas as duvidas, PERGUNTE: Voce ainda tem alguma duvida? Posso encaminhar seu pedido agora?',
  '5. Se o cliente CONFIRMAR que quer fechar: novoStatus=PRONTO_PARA_COMPRAR, notificarVendedor=true, diga: Perfeito! Vou te encaminhar para ' + nomeVendedor + ' que ja esta a par do seu interesse. Ele vai te contatar em instantes!',
  '',
  'REGRAS:',
  '- Seja simpatico, breve e natural (estilo WhatsApp)',
  '- Nunca prometa precos ou prazos que nao estejam nas informacoes da empresa',
  '- Ao enviar uma midia, continue o atendimento normalmente logo em seguida — nao fique apenas enviando arquivos sem qualificar o lead',
  '- Mesmo ao mostrar fotos/videos, sempre avance no roteiro de qualificacao na mesma mensagem ou na seguinte',
  '- NUNCA marque PRONTO_PARA_COMPRAR apenas porque o cliente perguntou sobre preco',
  '- memoriaCliente em atualizarCliente: registre o que aprendeu sobre o cliente (interesses, orcamento, preferencias, objecoes). Cumulativo, max 300 chars.',
  '- Se o cliente desistir ou insultar: novoStatus=PERDIDO',
  '- NUNCA diga que vai verificar a agenda, consultar a profissional ou checar disponibilidade — voce nao tem acesso a agenda. Sempre use o link do Cal.com diretamente.',
  '- Se o cliente nao conseguir usar o link 2 vezes ou mais: PARE de mandar o link. Use notificarVendedor=true e explique a situacao na mensagemVendedor.',
  '- Se receber uma imagem: analise visualmente o que ve, descreva brevemente relacionando ao produto/servico da empresa e avance no atendimento.',
  '- Se receber um documento PDF: leia o conteudo, responda as duvidas do cliente e avance no atendimento.',
  '- Se a mensagem for [AUDIO]: responda ao conteudo da transcricao normalmente, como se fosse texto.',
  '- RECLAMACAO: se o cliente fizer reclamacao grave, expressar forte insatisfacao ou pedir cancelamento: notificarGerente=true, mensagemGerente="Reclamacao de [nome cliente]: [resumo do problema e tom da conversa]". Resolva com empatia na resposta.',
  '- Quando notificarVendedor=true e novoStatus=PRONTO_PARA_COMPRAR: adicione ao final de mensagemVendedor: " -- Me avisa se fechou ou nao, e o valor!"',
  '',
  'QUANDO notificarVendedor=true, mensagemVendedor DEVE conter nome do cliente, o que quer e tom da conversa.',
  'QUANDO notificarGerente=true, mensagemGerente DEVE conter nome do cliente, natureza do problema e urgencia.',
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
