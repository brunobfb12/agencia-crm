"use client";

import { useEffect, useState, useRef } from "react";
import { ScrollHint, GradientFade } from "../components/table-scroll-hint";

/* ── Typewriter phrases ──────────────────────────────────────────────── */
const AGENT_PHRASES = [
  "O que você preenche aqui é o que seu Agente vai falar para os seus clientes.",
  "Agente bem configurado vende. Agente mal configurado afasta.",
  "A qualidade do atendimento automático depende 100% do que você preenche aqui.",
  "Quanto mais rico o contexto, mais inteligente o seu Agente de IA.",
];

function TypewriterPhrases() {
  const [idx,    setIdx]    = useState(0);
  const [text,   setText]   = useState("");
  const [phase,  setPhase]  = useState<"typing" | "paused" | "deleting">("typing");
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setCursor(c => !c), 530);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const full = AGENT_PHRASES[idx];
    if (phase === "typing") {
      if (text.length < full.length) {
        const t = setTimeout(() => setText(full.slice(0, text.length + 1)), 50);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("paused"), 2400);
      return () => clearTimeout(t);
    }
    if (phase === "paused") {
      const t = setTimeout(() => setPhase("deleting"), 10);
      return () => clearTimeout(t);
    }
    // deleting
    if (text.length > 0) {
      const t = setTimeout(() => setText(full.slice(0, text.length - 1)), 22);
      return () => clearTimeout(t);
    }
    setIdx(i => (i + 1) % AGENT_PHRASES.length);
    setPhase("typing");
  }, [text, phase, idx]);

  return (
    <span>
      {text}
      <span style={{ opacity: cursor ? 1 : 0, transition: "opacity 0.1s", fontWeight: 300 }}>|</span>
    </span>
  );
}

/* ── Qualidade do Agente ─────────────────────────────────────────────── */
type QItem = { ok: boolean; msg: string; peso: "alta" | "media" | "baixa" };
type QualidadeResult = { score: number; nivel: string; cor: string; corBg: string; corBorder: string; itens: QItem[] };

function calcQualidadeAgente(
  infoCampos: Record<string, string>, nomeIA: string, tipoAtendimento: string,
  perguntasQualificacao: string, calendlyUrl: string,
  mensagemPosVenda: string, mensagemAniversario: string, mensagemIndicacao: string
): QualidadeResult {
  const prod  = (infoCampos["PRODUTOS"]     ?? "").trim();
  const preco = (infoCampos["PRECOS"]       ?? "").trim();
  const pgto  = (infoCampos["PAGAMENTO"]    ?? "").trim();
  const entrg = (infoCampos["ENTREGA"]      ?? "").trim();
  const hor   = (infoCampos["HORARIO"]      ?? "").trim();
  const difer = (infoCampos["DIFERENCIAIS"] ?? "").trim();
  const needCalendly = tipoAtendimento === "AGENDAMENTO" || tipoAtendimento === "AMBOS";

  let raw = 0; let max = 0;
  const itens: QItem[] = [];

  // PRODUTOS — peso 2.5
  max += 2.5;
  if (!prod)             { itens.push({ ok: false, msg: "Produtos/serviços não descritos — a IA não sabe o que vender", peso: "alta" }); }
  else if (prod.length < 80)  { raw += 0.8; itens.push({ ok: false, msg: "Descreva seus produtos com mais detalhes — quanto mais específico, melhor a IA atende", peso: "alta" }); }
  else if (prod.length < 200) { raw += 1.8; itens.push({ ok: true,  msg: "Produtos descritos", peso: "alta" }); }
  else                        { raw += 2.5; itens.push({ ok: true,  msg: "Catálogo de produtos bem detalhado", peso: "alta" }); }

  // PRECOS — peso 1.5
  max += 1.5;
  if (!preco)              { itens.push({ ok: false, msg: "Preços não informados — a IA não consegue responder sobre valores", peso: "alta" }); }
  else if (preco.length < 50) { raw += 0.7; itens.push({ ok: false, msg: "Detalhe mais os preços para respostas precisas", peso: "alta" }); }
  else                        { raw += 1.5; itens.push({ ok: true,  msg: "Tabela de preços informada", peso: "alta" }); }

  // PAGAMENTO — peso 0.5
  max += 0.5;
  if (!pgto) { itens.push({ ok: false, msg: "Formas de pagamento não informadas", peso: "media" }); }
  else       { raw += 0.5; itens.push({ ok: true, msg: "Formas de pagamento configuradas", peso: "media" }); }

  // ENTREGA — peso 0.5
  max += 0.5;
  if (!entrg) { itens.push({ ok: false, msg: "Entrega/frete não informado", peso: "baixa" }); }
  else        { raw += 0.5; }

  // HORARIO — peso 0.5
  max += 0.5;
  if (!hor) { itens.push({ ok: false, msg: "Horário de atendimento não informado — IA pode criar expectativas erradas", peso: "media" }); }
  else      { raw += 0.5; itens.push({ ok: true, msg: "Horário de atendimento definido", peso: "media" }); }

  // DIFERENCIAIS — peso 1.0
  max += 1.0;
  if (!difer) { itens.push({ ok: false, msg: "Diferenciais em branco — IA não consegue rebater objeções nem se destacar", peso: "media" }); }
  else        { raw += 1.0; itens.push({ ok: true, msg: "Diferenciais configurados — IA sabe como se destacar", peso: "media" }); }

  // NOME DA IA — peso 0.5
  max += 0.5;
  if (!nomeIA.trim()) { itens.push({ ok: false, msg: "Nome da IA não definido — vai se apresentar como \"assistente\"", peso: "baixa" }); }
  else                { raw += 0.5; itens.push({ ok: true, msg: `IA se apresenta como "${nomeIA}"`, peso: "baixa" }); }

  // QUALIFICACAO — peso 1.5
  max += 1.5;
  if (!perguntasQualificacao.trim())          { itens.push({ ok: false, msg: "Roteiro de qualificação vazio — IA qualifica leads de forma genérica", peso: "alta" }); }
  else if (perguntasQualificacao.length < 50) { raw += 0.7; itens.push({ ok: false, msg: "Adicione mais perguntas para qualificar leads com mais precisão", peso: "alta" }); }
  else                                        { raw += 1.5; itens.push({ ok: true,  msg: "Roteiro de qualificação configurado", peso: "alta" }); }

  // CALENDLY — peso 0.5 (só se aplica agendamento)
  if (needCalendly) {
    max += 0.5;
    if (!calendlyUrl.trim()) { itens.push({ ok: false, msg: "Link do Calendly vazio — IA não consegue agendar", peso: "alta" }); }
    else                     { raw += 0.5; itens.push({ ok: true, msg: "Link de agendamento configurado", peso: "alta" }); }
  }

  // POS-VENDA — peso 0.5
  max += 0.5;
  if (!mensagemPosVenda.trim()) { itens.push({ ok: false, msg: "Mensagem pós-venda em branco", peso: "baixa" }); }
  else                          { raw += 0.5; itens.push({ ok: true, msg: "Mensagem pós-venda personalizada", peso: "baixa" }); }

  // ANIVERSARIO — peso 0.5
  max += 0.5;
  if (!mensagemAniversario.trim()) { itens.push({ ok: false, msg: "Mensagem de aniversário em branco", peso: "baixa" }); }
  else                             { raw += 0.5; itens.push({ ok: true, msg: "Mensagem de aniversário personalizada", peso: "baixa" }); }

  // INDICACAO — peso 0.5
  max += 0.5;
  if (!mensagemIndicacao.trim()) { itens.push({ ok: false, msg: "Mensagem de indicação em branco", peso: "baixa" }); }
  else                           { raw += 0.5; itens.push({ ok: true, msg: "Mensagem de indicação configurada", peso: "baixa" }); }

  const score = Math.round((raw / max) * 100) / 10;
  let nivel: string; let cor: string; let corBg: string; let corBorder: string;
  if (score < 3)       { nivel = "Agente Inativo";    cor = "#f87171"; corBg = "rgba(248,113,113,.07)"; corBorder = "rgba(248,113,113,.2)"; }
  else if (score < 5)  { nivel = "Agente Fraco";      cor = "#fb923c"; corBg = "rgba(251,146,60,.07)";  corBorder = "rgba(251,146,60,.2)"; }
  else if (score < 7)  { nivel = "Agente Básico";     cor = "#fbbf24"; corBg = "rgba(251,191,36,.07)";  corBorder = "rgba(251,191,36,.2)"; }
  else if (score < 8.5){ nivel = "Agente Bom";        cor = "#34d399"; corBg = "rgba(52,211,153,.07)";  corBorder = "rgba(52,211,153,.2)"; }
  else                 { nivel = "Agente Excelente";  cor = "#10b981"; corBg = "rgba(16,185,129,.07)";  corBorder = "rgba(16,185,129,.2)"; }

  return { score, nivel, cor, corBg, corBorder, itens };
}

/* ── Setup Checklist ─────────────────────────────────────────────────── */
interface SetupStatus {
  informacoesOk: boolean; whatsappOk: boolean; vendedoresOk: boolean;
  clientesOk: boolean; nomeIAOk: boolean; posVendaOk: boolean;
  aniversarioOk: boolean; indicacaoOk: boolean; qualificacaoOk: boolean;
}

function SetupChecklist({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/setup").then(r => r.json()).then(d => { if (d) setStatus(d); });
  }, []);

  if (!status) return null;

  const steps = [
    { ok: true,                   label: "Conta criada e login realizado",           tab: null,        extHref: null },
    { ok: status.informacoesOk,   label: "Informações da empresa preenchidas",       tab: "empresas",  extHref: null },
    { ok: status.whatsappOk,      label: "WhatsApp conectado",                       tab: "whatsapp",  extHref: null },
    { ok: status.vendedoresOk,    label: "Pelo menos 1 vendedor cadastrado",         tab: "vendedores",extHref: null },
    ...(status.vendedoresOk ? [{ ok: false, label: "Instância do vendedor conectada", tab: "vendedores", extHref: null }] : []),
    { ok: status.clientesOk,      label: "Primeiros clientes adicionados",           tab: null,        extHref: "/dashboard/clientes" },
    { ok: status.nomeIAOk,        label: "Nome da IA configurado",                   tab: "empresas",  extHref: null },
    { ok: status.qualificacaoOk,  label: "Roteiro de qualificação da IA preenchido", tab: "empresas",  extHref: null },
    { ok: status.posVendaOk,      label: "Mensagem de pós-venda personalizada",      tab: "empresas",  extHref: null },
    { ok: status.aniversarioOk,   label: "Mensagem de aniversário personalizada",    tab: "empresas",  extHref: null },
    { ok: status.indicacaoOk,     label: "Mensagem de indicação configurada",         tab: "empresas",  extHref: null },
  ];

  const done = steps.filter(s => s.ok).length;
  const total = steps.length;
  const allDone = done === total;
  const pct = Math.round((done / total) * 100);

  if (allDone) return null;

  return (
    <div className="mb-6 rounded-2xl overflow-hidden animate-fade-up"
      style={{
        background: "linear-gradient(135deg,rgba(99,102,241,.08),rgba(79,70,229,.03))",
        border: "1px solid rgba(99,102,241,.18)",
      }}>
      {/* Header */}
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 md:p-5 text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-bold flex-shrink-0"
            style={{ background: "rgba(99,102,241,.15)", color: "#a5b4fc" }}>
            {pct}%
          </div>
          <div>
            <p className="text-[14px] font-bold" style={{ color: "var(--text)" }}>
              Configure seu CRM — {done} de {total} etapas concluídas
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--muted-2)" }}>
              Complete as etapas abaixo para ativar o atendimento automático
            </p>
          </div>
        </div>
        <svg className={`w-4 h-4 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ color: "var(--muted-3)" }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-4 md:px-5 pb-5">
          {/* Progress bar */}
          <div className="h-1.5 rounded-full mb-5 overflow-hidden" style={{ background: "var(--border)" }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: "linear-gradient(90deg,#6366f1,#818cf8)" }} />
          </div>
          {/* Steps list */}
          <div className="space-y-2">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all"
                style={{
                  background: step.ok ? "rgba(52,211,153,.04)" : "rgba(255,255,255,.02)",
                  border: `1px solid ${step.ok ? "rgba(52,211,153,.12)" : "var(--border)"}`,
                }}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={step.ok
                      ? { background: "rgba(52,211,153,.15)", border: "1.5px solid #34d399" }
                      : { background: "var(--card)", border: "1.5px solid var(--border-2)" }}>
                    {step.ok
                      ? <svg className="w-2.5 h-2.5" fill="none" stroke="#34d399" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      : <span className="text-[9px] font-bold" style={{ color: "var(--muted-3)" }}>{i + 1}</span>
                    }
                  </div>
                  <span className="text-[12.5px]" style={{ color: step.ok ? "var(--muted)" : "var(--text)", textDecoration: step.ok ? "line-through" : "none" }}>
                    {step.label}
                  </span>
                </div>
                {!step.ok && (step.tab || step.extHref) && (
                  step.extHref
                    ? <a href={step.extHref} className="flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all"
                        style={{ background: "rgba(99,102,241,.12)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,.2)", whiteSpace: "nowrap" }}>
                        Ir agora →
                      </a>
                    : <button onClick={() => onNavigate?.(step.tab!)}
                        className="flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all"
                        style={{ background: "rgba(99,102,241,.12)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,.2)", whiteSpace: "nowrap" }}>
                        Configurar →
                      </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface Me { perfil: string; empresaId: string | null; nome: string }
interface Empresa {
  id: string; nome: string; instanciaWhatsapp: string; ativa: boolean;
  informacoes: string | null; googleCalendarId: string | null;
  googleCredentialId: string | null; calendlyUrl: string | null;
  perguntasQualificacao: string | null;
  tipoAtendimento: string; nomeIA: string | null;
  mensagemPosVenda: string | null;
  mensagemAniversario: string | null;
  mensagemIndicacao: string | null;
  tagsCustomizadas: string[];
  complementaresGuia: string | null;
  perfisCliente: string | null;
  _count: { clientes: number; leads: number };
}
interface Vendedor {
  id: string; nome: string; telefone: string; ordemChamada: number;
  ativo: boolean; empresaId: string; cargo: string;
  empresa: { nome: string }; _count: { vendas: number };
}
interface Midia {
  id: string; empresaId: string; etiqueta: string; url: string | null;
  mimeType: string | null; descricaoUso: string; tipo: string; ativo: boolean; criadoEm: string;
}

const PERFIS_CLIENTE_PLACEHOLDER = `{
  "Consumidor": {
    "tom": "caloroso e simples, sem termos técnicos, emoji moderado",
    "sinais": ["quero pintar", "minha casa", "meu apartamento", "sala", "quarto", "banheiro"],
    "d2": "Oi {nome}! Como ficou a pintura? Já deu pra ver o resultado? 😊",
    "d7": "Oi {nome}! De 0 a 10, quanto você indicaria a Paredão para um amigo?",
    "d20": "Oi {nome}! Trouxemos uma dica especial sobre o produto que você comprou. Posso te mandar?",
    "d28": "Oi {nome}! Precisa retocar algum detalhe? Temos a mesma cor guardada aqui pra você!",
    "d45": "Oi {nome}! Você é um cliente especial pra gente 🎁 Preparei uma condição exclusiva na sua próxima compra.",
    "d90": "Oi {nome}! Já pensou em renovar a pintura? Tenho uma condição especial esperando por você!",
    "quebra_objecao_preco": "Entendo! Posso cobrir qualquer oferta da concorrência — me manda o valor que você encontrou que a gente analisa 😊",
    "pos_orcamento": "Oi {nome}! Recebeu nosso orçamento? Ficou alguma dúvida? 😊",
    "reativacao": "Oi {nome}! Que bom ter você de volta! Da última vez você tinha interesse em {produto}. Ainda é isso que você precisa ou mudou alguma coisa?"
  },
  "Arquiteto": {
    "tom": "profissional e técnico, foco em especificação e parceria, sem emoji excessivo",
    "sinais": ["projeto", "especificação", "cliente meu", "obra do cliente", "memorial", "arquitetura", "design"],
    "d2": "{nome}, o acabamento atendeu a especificação do projeto?",
    "d7": "{nome}, tem outro projeto em andamento? Posso ajudar com a especificação técnica.",
    "d20": "{nome}, chegou nova coleção Luztol/Coral — posso enviar as especificações para seus projetos?",
    "d28": "{nome}, orçamento prioritário para o próximo projeto quando quiser — só falar.",
    "d45": "{nome}, quero formalizar nossa parceria com condição preferencial para seus projetos.",
    "d90": "{nome}, novos produtos técnicos disponíveis. Posso enviar o catálogo atualizado?",
    "quebra_objecao_preco": "{nome}, compreendo. Nossa linha técnica garante resultado conforme especificação e laudo. Posso detalhar o diferencial técnico?",
    "pos_orcamento": "{nome}, recebeu a proposta? Alguma observação técnica ou ajuste necessário?",
    "reativacao": "{nome}, que bom retomar o contato! Você tinha interesse em {produto} para um projeto. Ainda está em andamento?"
  },
  "Construtor": {
    "tom": "direto e objetivo, foco em prazo volume e entrega, sem rodeio",
    "sinais": ["construtora", "empreitada", "obra", "m2", "metros quadrados", "contrato", "licitação", "pavimento"],
    "d2": "{nome}, a entrega foi conforme o cronograma da obra?",
    "d7": "{nome}, próxima etapa da obra já tem previsão? Posso garantir o material.",
    "d20": "{nome}, novidade em tinta de piso e impermeabilizante — ideal para obras.",
    "d28": "{nome}, próxima fase da obra já tem orçamento? Me manda a lista que priorizo.",
    "d45": "{nome}, condição especial para pedido de volume na próxima obra.",
    "d90": "{nome}, nova obra prevista? Tenho condição especial para cliente fiel.",
    "quebra_objecao_preco": "{nome}, posso cobrir qualquer oferta para volume. Me manda o valor que você encontrou.",
    "pos_orcamento": "{nome}, recebeu o orçamento? Precisa de algum ajuste no volume ou prazo de entrega?",
    "reativacao": "{nome}, que bom! Você tinha pedido orçamento para {produto}. A obra ainda está em andamento?"
  },
  "Pintor": {
    "tom": "colega de ofício, linguagem técnica, respeita o tempo dele, direto",
    "sinais": ["serviço", "cliente me pediu", "pintor", "pintura profissional", "mão de obra", "empreitei", "tinta para serviço"],
    "d2": "{nome}, rendeu bem? Cliente aprovou o acabamento?",
    "d7": "{nome}, tem serviço novo? Garanto prioridade no atendimento aqui.",
    "d20": "{nome}, lançamento técnico Luztol — vale conhecer para seus próximos serviços.",
    "d28": "{nome}, estoque ficou ok? Próximo serviço quando?",
    "d45": "{nome}, preço especial por volume mensal para você — quanto você usa por mês?",
    "d90": "{nome}, novos produtos profissionais chegaram. Posso reservar uma amostra?",
    "quebra_objecao_preco": "{nome}, para volume mensal tenho condição diferenciada. Quanto você usa por mês? A gente fecha um preço fixo.",
    "pos_orcamento": "{nome}, recebeu o orçamento? Material disponível para retirada quando precisar.",
    "reativacao": "{nome}, tudo certo? Você tinha pedido {produto} para um serviço. Ainda precisa?"
  }
}`;

const SECOES = ["PRODUTOS", "PRECOS", "PAGAMENTO", "ENTREGA", "DIFERENCIAIS", "HORARIO"] as const;
const LABELS: Record<string, string> = {
  PRODUTOS: "O que sua empresa oferece ou faz", PRECOS: "Produtos, Serviços e Preços",
  PAGAMENTO: "Formas de Pagamento", ENTREGA: "Entrega / Frete",
  DIFERENCIAIS: "Diferenciais", HORARIO: "Horário de Atendimento",
};

const FIELD_HELP: Record<string, { title: string; desc: string; examples: string[]; dica: string }> = {
  PRODUTOS: {
    title: "O que sua empresa oferece ou faz",
    desc: "Descreva o segmento e o que sua empresa faz. A IA usa isso para se apresentar e contextualizar o atendimento — não precisa listar preços aqui.",
    examples: [
      "Camisetas básicas algodão (P ao GG) · Calças jeans femininas · Conjuntos atacado",
      "Design de sobrancelha Henna 1h · Limpeza de pele 45min · Micropigmentação",
      "Purificador Hoken H2 · Refil H2 · Purificador compacto",
    ],
    dica: "Liste todos os itens principais. Quanto mais específico, mais preciso o atendimento da IA.",
  },
  PRECOS: {
    title: "Preços",
    desc: "Informe os valores dos seus produtos ou serviços. A IA vai usar esses dados para responder dúvidas sobre preço.",
    examples: [
      "Camiseta R$29,90 · kit 3 por R$79 · desconto 20% acima de 10 peças",
      "Design sobrancelha R$80 · Henna R$100 · Pacote 5 sessões R$350",
      "Purificador H2 R$1.200 · Refil R$90 · Instalação inclusa",
    ],
    dica: "Não precisa ser exato — uma faixa de preço já ajuda muito a filtrar clientes.",
  },
  PAGAMENTO: {
    title: "Formas de Pagamento",
    desc: "Liste como o cliente pode pagar. A IA vai informar isso automaticamente quando o cliente perguntar.",
    examples: [
      "PIX · Cartão débito/crédito até 12x sem juros · Dinheiro",
      "PIX com 5% desconto · Boleto atacado (mín. R$500)",
      "PIX ou cartão — parcelado até 6x",
    ],
    dica: "Se tiver desconto no PIX, mencione — é um ótimo gatilho de conversão.",
  },
  ENTREGA: {
    title: "Entrega / Frete",
    desc: "Como funciona a entrega ou retirada do produto. Evita surpresas e frustrações do cliente.",
    examples: [
      "Frete grátis acima de R$300 · Jadlog e Correios para todo Brasil",
      "Retirada na loja: Av. Rio Verde 1200, Goiânia · Entrega só região",
      "Produto digital — acesso imediato após pagamento",
    ],
    dica: "Se for serviço presencial, coloque o endereço da loja aqui.",
  },
  DIFERENCIAIS: {
    title: "Diferenciais",
    desc: "O que faz você melhor que a concorrência? A IA usa isso para convencer clientes e rebater objeções como 'tá caro' ou 'vou pensar'.",
    examples: [
      "Atacado a partir de 5 peças · nota fiscal garantida · troca sem burocracia",
      "10 anos de experiência · materiais importados · studio climatizado e exclusivo",
      "Técnico certificado Hoken · atendimento 7 dias · garantia de 1 ano",
    ],
    dica: "Seja específico. '10 anos de experiência' convence mais do que 'qualidade superior'.",
  },
  HORARIO: {
    title: "Horário de Atendimento",
    desc: "Quando você ou o estabelecimento está disponível. A IA usa isso para criar expectativas corretas nos clientes.",
    examples: [
      "Seg–Sex 9h–18h · Sáb 9h–13h · Dom fechado",
      "Ter–Sáb 8h–20h — agendamento obrigatório",
      "Atendimento 24h online · loja física seg–sex 8h–17h",
    ],
    dica: "Informe o dia de folga para evitar clientes esperando resposta no domingo.",
  },
  nomeIA: {
    title: "Nome da IA (persona)",
    desc: "A IA vai se apresentar com este nome para todos os clientes. Escolha algo que combine com a identidade da sua empresa.",
    examples: [
      "Sofia — para lojas de moda feminina ou beleza",
      "Bella — para studios e clínicas estéticas",
      "Max — para lojas de materiais ou produtos técnicos",
    ],
    dica: "Um nome humano e amigável cria mais confiança do que 'assistente virtual'.",
  },
  qualificacao: {
    title: "Roteiro de Qualificação",
    desc: "Perguntas que a IA deve fazer para entender o que o lead precisa antes de passar para o vendedor. Uma por linha.",
    examples: [
      "Você compra para revenda ou uso próprio?",
      "Qual serviço você tem interesse? (sobrancelha, cílios, pele...)",
      "Você já tem purificador em casa ou é a primeira vez?",
    ],
    dica: "Perguntas boas filtram leads desqualificados e poupam muito tempo do vendedor.",
  },
  posVenda: {
    title: "Mensagem de Pós-Venda",
    desc: "Enviada automaticamente 2 dias após uma venda ser registrada. Serve para coletar feedback e fortalecer o relacionamento.",
    examples: [
      "Oi {nome}! Como ficou o design da sobrancelha? Ficou feliz? 😊",
      "Olá {nome}! Sua encomenda chegou certinho? Tudo certo com os produtos?",
      "Oi {nome}! Já teve chance de testar o purificador? Precisando de algo, é só chamar!",
    ],
    dica: "Mensagens curtas e calorosas têm muito mais resposta. Use {nome} para personalizar.",
  },
  aniversario: {
    title: "Mensagem de Aniversário",
    desc: "Enviada automaticamente no aniversário do cliente (quando a data de nascimento estiver cadastrada).",
    examples: [
      "Feliz aniversário, {nome}! 🎂 A {empresa} te deseja um dia incrível!",
      "Parabéns, {nome}! Que tal se presentear hoje com algo especial? 😊",
      "Oi {nome}! Hoje é seu dia! Te esperamos no studio para um mimo de aniversário! 🥳",
    ],
    dica: "Inclua um desconto ou brinde — é uma ótima oportunidade de reativação do cliente.",
  },
};

/* ── Templates por segmento ──────────────────────────────────────────── */
interface Segmento {
  id: string; emoji: string; nome: string; desc: string;
  tipoAtendimento: string; nomeIA: string;
  infoCampos: Record<string, string>;
  qualificacao: string; posVenda: string; aniversario: string;
}

const SEGMENTOS: Segmento[] = [
  {
    id: "moda_atacado", emoji: "👗", nome: "Moda / Atacado",
    desc: "Loja de roupas, moda íntima, atacadista, multimarcas",
    tipoAtendimento: "ORCAMENTO", nomeIA: "Ana",
    infoCampos: {
      PRODUTOS: "Camisetas básicas e estampadas · Calças jeans femininas e masculinas · Vestidos casuais e sociais · Conjuntos femininos · Moda íntima (calcinhas, sutiãs, pijamas) · Moda plus size",
      PRECOS: "Peças avulsas a partir de R$19,90 · Kit 5 peças com 15% desconto · Pedido mínimo atacado: R$300 · Tabela completa enviada após cadastro",
      PAGAMENTO: "PIX com 5% desconto · Cartão débito/crédito até 12x sem juros · Boleto bancário (mínimo R$500)",
      ENTREGA: "Entrega para todo o Brasil via Correios e Jadlog · Frete grátis acima de R$500 · Retirada na loja disponível · Prazo de 3 a 7 dias úteis",
      DIFERENCIAIS: "Atacado a partir de 5 peças · Nota fiscal garantida · Troca sem burocracia em até 30 dias · Fotos em alta qualidade para revenda · Catálogo atualizado toda semana",
      HORARIO: "Seg–Sex 8h–18h · Sáb 8h–12h · Dom e feriados: fechado",
    },
    qualificacao: "Você compra para revenda ou uso próprio?\nQual o seu orçamento médio por pedido?\nJá trabalha com alguma marca de moda?",
    posVenda: "Oi {nome}! 😊 {ia} aqui, da {empresa}. Seu pedido chegou certinho? Tudo certo com as peças?",
    aniversario: "Parabéns, {nome}! 🎂 A {empresa} deseja um dia incrível! Aproveite e garanta algo especial hoje! 🎁",
  },
  {
    id: "estetica_beleza", emoji: "💅", nome: "Estética / Beleza",
    desc: "Studio de sobrancelhas, cílios, micropigmentação, salão",
    tipoAtendimento: "AGENDAMENTO", nomeIA: "Bella",
    infoCampos: {
      PRODUTOS: "Design de sobrancelha · Henna de sobrancelha · Micropigmentação · Extensão de cílios fio a fio · Volume russo · Limpeza de pele · Laser de sobrancelha",
      PRECOS: "Design sobrancelha R$60 · Henna R$90 · Micropigmentação R$350 · Extensão cílios fio a fio R$150 · Volume russo R$200 · Pacote mensal sobrancelha R$120",
      PAGAMENTO: "PIX · Cartão crédito até 6x · Cartão débito · Dinheiro",
      ENTREGA: "Atendimento presencial — agendamento obrigatório pelo link. Endereço enviado após confirmação.",
      DIFERENCIAIS: "10 anos de experiência · Materiais importados e certificados · Studio climatizado e exclusivo · Retoques inclusos nos primeiros 30 dias",
      HORARIO: "Ter–Sáb 8h–20h · Dom e seg: fechado · Feriados: sob consulta",
    },
    qualificacao: "Qual serviço você tem interesse? (sobrancelha, cílios, limpeza de pele...)\nJá fez algum procedimento antes?\nTem alguma alergia a cosméticos?",
    posVenda: "Oi {nome}! 😊 {ia} aqui, do {empresa}. Como ficou o resultado do seu procedimento? Ficou satisfeita?",
    aniversario: "Parabéns, {nome}! 🥳 {ia} aqui. Que tal se presentear com um mimo de aniversário? Te esperamos no studio! 💕",
  },
  {
    id: "clinica_saude", emoji: "🦷", nome: "Clínica / Saúde",
    desc: "Odontologia, fisioterapia, estética clínica, nutrição",
    tipoAtendimento: "AGENDAMENTO", nomeIA: "Sofia",
    infoCampos: {
      PRODUTOS: "Consulta inicial e avaliação gratuita · Limpeza e profilaxia · Clareamento dental · Aparelho ortodôntico (metálico e estético) · Implante dental · Tratamento de canal · Restaurações",
      PRECOS: "Consulta avaliação: gratuita · Limpeza R$150 · Clareamento R$350 · Implante a partir de R$1.800 · Aparelho mensal R$250 · Parcelamento disponível",
      PAGAMENTO: "PIX · Cartão crédito até 12x · Cartão débito · Convênios odontológicos aceitos · Financiamento disponível",
      ENTREGA: "Atendimento presencial com hora marcada. Fácil acesso e estacionamento.",
      DIFERENCIAIS: "Equipe especializada · Equipamentos digitais de última geração · Ambiente acolhedor · Avaliação gratuita · Atendimento de emergência",
      HORARIO: "Seg–Sex 8h–19h · Sáb 8h–13h · Dom: emergências",
    },
    qualificacao: "Qual tratamento ou serviço você está buscando?\nÉ sua primeira consulta conosco?\nTem convênio odontológico?",
    posVenda: "Oi {nome}! {ia} aqui. Como está se sentindo após o atendimento? Ficou com alguma dúvida?",
    aniversario: "Parabéns, {nome}! 🎂 {ia} aqui. Desejamos saúde e muitos sorrisos no seu dia! ✨",
  },
  {
    id: "automotivo", emoji: "🚗", nome: "Automotivo",
    desc: "Funilaria, pintura, estética automotiva, mecânica",
    tipoAtendimento: "ORCAMENTO", nomeIA: "Max",
    infoCampos: {
      PRODUTOS: "Funilaria e pintura completa · Polimento e vitrificação · Higienização interna · Remoção de amassados (PDR) · Insulfilm · Plotagem · Customização de veículos",
      PRECOS: "Polimento simples a partir de R$200 · Vitrificação R$500 · Higienização completa R$150 · Funilaria: orçamento por item · Plotagem: orçamento por projeto",
      PAGAMENTO: "PIX · Cartão débito e crédito até 6x · Dinheiro · Nota fiscal disponível",
      ENTREGA: "Atendimento na nossa oficina. Retirada e entrega do veículo sob consulta na região.",
      DIFERENCIAIS: "10 anos de experiência · Materiais premium · Profissionais certificados · Garantia nos serviços · Orçamento sem compromisso · Fotos antes e depois",
      HORARIO: "Seg–Sex 8h–18h · Sáb 8h–13h · Dom: fechado",
    },
    qualificacao: "Qual o serviço que você precisa?\nQual é o modelo e ano do seu veículo?\nJá tem ideia do orçamento?",
    posVenda: "Oi {nome}! {ia} aqui. Ficou satisfeito com o serviço no seu veículo? Tudo certo?",
    aniversario: "Parabéns, {nome}! 🎉 {ia} aqui. Um dia excelente e que seu carro sempre te leve longe! 🚗",
  },
  {
    id: "materiais_construcao", emoji: "🏗️", nome: "Materiais / Construção",
    desc: "Tintas, materiais de construção, ferragens, acabamentos",
    tipoAtendimento: "ORCAMENTO", nomeIA: "Carlos",
    infoCampos: {
      PRODUTOS: "Tintas imobiliárias internas e externas · Massa corrida e textura · Vernizes e seladores · Rolos, pincéis e acessórios · Impermeabilizantes · Cimento e argamassa · Porcelanatos e revestimentos",
      PRECOS: "Tinta standard 18L a partir de R$80 · Tinta premium 18L R$150 · Textura saco 25kg R$45 · Consulte nossa tabela para obras grandes",
      PAGAMENTO: "PIX com desconto · Cartão débito e crédito até 12x · Boleto para construtoras · Crediário para clientes cadastrados",
      ENTREGA: "Entrega expressa na cidade · Frete grátis em pedidos acima de R$500 · Retirada na loja disponível · Prazo 1 a 2 dias úteis",
      DIFERENCIAIS: "Melhor preço garantido · 500+ produtos em estoque · Atendimento técnico especializado · Entrega rápida · Cartão fidelidade com pontos",
      HORARIO: "Seg–Sex 7h–18h · Sáb 7h–13h · Dom: fechado",
    },
    qualificacao: "Qual o tipo de obra ou projeto?\nQual a área aproximada (m²)?\nPrecisa de nota fiscal da empresa?",
    posVenda: "Oi {nome}! {ia} aqui, da {empresa}. Como está indo a obra? Ficou satisfeito com os materiais?",
    aniversario: "Parabéns, {nome}! 🎂 A {empresa} deseja um dia especial! Aproveite nosso desconto de aniversário! 🎁",
  },
  {
    id: "cursos_educacao", emoji: "📚", nome: "Cursos / Educação",
    desc: "Cursos presenciais ou online, treinamentos, capacitação",
    tipoAtendimento: "AGENDAMENTO", nomeIA: "Júlia",
    infoCampos: {
      PRODUTOS: "Curso presencial extensão de cílios · Curso design de sobrancelha · Curso micropigmentação · Curso online em vídeo · Mentoria individual · Kit profissional para alunos",
      PRECOS: "Cursos presenciais a partir de R$497 · Cursos online R$197 · Mentoria individual R$150/hora · Pacote completo com kit R$897",
      PAGAMENTO: "PIX à vista · Cartão crédito até 12x · Parcelamento direto disponível",
      ENTREGA: "Cursos presenciais no nosso studio · Cursos online: acesso imediato após pagamento · Kit enviado pelos Correios",
      DIFERENCIAIS: "Certificado reconhecido pelo mercado · Professora com 8 anos de experiência · Material didático incluso · Suporte pós-curso · Turmas reduzidas (máx. 6 alunos)",
      HORARIO: "Turmas Sáb–Dom 8h–18h · Cursos online: acesso 24h · Matrículas seg–sex 9h–18h",
    },
    qualificacao: "Qual curso te interessa?\nJá tem experiência na área ou é iniciante?\nPrefere aula presencial ou online?",
    posVenda: "Oi {nome}! {ia} aqui. Como está sendo sua experiência com o curso? Tem alguma dúvida?",
    aniversario: "Parabéns, {nome}! 🎂 {ia} aqui. Que seu novo ano seja cheio de conquistas! 🌟",
  },
  {
    id: "purificadores", emoji: "💧", nome: "Purificadores / Produtos",
    desc: "Purificadores de água, eletrodomésticos, produtos técnicos",
    tipoAtendimento: "ORCAMENTO", nomeIA: "Daniel",
    infoCampos: {
      PRODUTOS: "Purificador de água H2 · Purificador compacto · Bebedouro de mesa · Refil H2 (6 meses) · Refil compacto · Instalação profissional · Manutenção preventiva",
      PRECOS: "Purificador H2 R$1.200 · Purificador compacto R$750 · Refil H2 R$90 · Instalação inclusa na compra · Manutenção anual R$120",
      PAGAMENTO: "PIX à vista · Cartão crédito até 12x · Boleto · Parcelamento direto",
      ENTREGA: "Entrega e instalação em domicílio · Atendemos Goiânia e região metropolitana · Frete para outros estados via transportadora",
      DIFERENCIAIS: "Técnico certificado · Atendimento 7 dias por semana · Garantia de 1 ano · Instalação no mesmo dia · Suporte técnico pós-venda",
      HORARIO: "Seg–Sex 8h–18h · Sáb 8h–13h · Emergências 24h para clientes cadastrados",
    },
    qualificacao: "Você já tem purificador em casa ou é a primeira vez?\nQual é o uso: residencial ou comercial?\nTem torneira de encaixe ou precisaria adaptação?",
    posVenda: "Oi {nome}! {ia} aqui. Seu purificador está funcionando bem? Precisa de algum suporte?",
    aniversario: "Parabéns, {nome}! 🎂 {ia} aqui. Que seu dia seja especial! 💧",
  },
  {
    id: "sobrancelhas", emoji: "🎨", nome: "Studio Sobrancelhas",
    desc: "Design, henna, micropigmentação e laser de sobrancelha",
    tipoAtendimento: "AGENDAMENTO", nomeIA: "Bella",
    infoCampos: {
      PRODUTOS: "Design de sobrancelha · Henna de sobrancelha · Micropigmentação de sobrancelha · Brow Lamination (sobrancelha fio a fio) · Laser de sobrancelha · Retoque de micropigmentação",
      PRECOS: "Design sobrancelha R$60 · Henna R$90 · Brow Lamination R$120 · Micropigmentação R$350 (retoque grátis em 30 dias) · Laser R$80/sessão · Pacote 3 sessões laser R$200",
      PAGAMENTO: "PIX · Cartão crédito até 6x · Cartão débito · Dinheiro",
      ENTREGA: "Atendimento presencial — agendamento obrigatório. Studio exclusivo com ambiente climatizado.",
      DIFERENCIAIS: "Especialista exclusiva em sobrancelhas · Materiais importados e certificados pela ANVISA · Retoque incluso até 30 dias · Atendimento personalizado para cada formato de rosto · Mais de 500 clientes atendidas",
      HORARIO: "Ter–Sáb 8h–20h · Dom e seg: fechado · Feriados: sob consulta",
    },
    qualificacao: "Qual procedimento você tem interesse? (design, henna, micropigmentação, laser...)\nJá tem sobrancelha feita ou é a primeira vez?\nTem alergia a tintas ou cosméticos?",
    posVenda: "Oi {nome}! 😊 {ia} aqui, do {empresa}. Como ficou o resultado da sua sobrancelha? Está satisfeita?",
    aniversario: "Parabéns, {nome}! 🥳 {ia} aqui. Que tal se presentear hoje? Te esperamos no studio com mimo de aniversário! 💕",
  },
  {
    id: "clinica_estetica", emoji: "✨", nome: "Clínica de Estética",
    desc: "Tratamentos faciais, corporais, skincare e estética avançada",
    tipoAtendimento: "AGENDAMENTO", nomeIA: "Sofia",
    infoCampos: {
      PRODUTOS: "Limpeza de pele profunda · Peeling químico e enzimático · Microagulhamento · Drenagem linfática · Radiofrequência facial e corporal · Criolipólise · Hidratação facial · Tratamento para acne e manchas",
      PRECOS: "Limpeza de pele R$150 · Peeling R$180 · Microagulhamento R$250/sessão · Drenagem linfática R$90/sessão · Radiofrequência R$200/sessão · Pacote 10 sessões com 20% desconto",
      PAGAMENTO: "PIX · Cartão crédito até 10x · Cartão débito · Pacotes parcelados direto com a clínica",
      ENTREGA: "Atendimento presencial com hora marcada. Clínica climatizada e equipada com tecnologia de ponta.",
      DIFERENCIAIS: "Profissional graduada e certificada · Equipamentos de última geração · Avaliação gratuita na primeira visita · Protocolo personalizado por cliente · Produtos profissionais importados",
      HORARIO: "Seg–Sex 8h–19h · Sáb 8h–14h · Dom: fechado",
    },
    qualificacao: "Qual o seu principal objetivo? (rejuvenescimento, acne, manchas, modelagem corporal...)\nJá fez algum tratamento estético antes?\nTem alguma condição de pele ou usa medicamentos contínuos?",
    posVenda: "Oi {nome}! {ia} aqui, da {empresa}. Como sua pele está reagindo ao tratamento? Ficou com alguma dúvida?",
    aniversario: "Parabéns, {nome}! 🎂 {ia} aqui. Que tal um mimo de aniversário? Temos uma surpresa especial para você! ✨",
  },
  {
    id: "moda_intima_atacado", emoji: "🩱", nome: "Moda Íntima Atacado",
    desc: "Atacado de lingerie, pijamas, beachwear e moda íntima",
    tipoAtendimento: "ORCAMENTO", nomeIA: "Ana",
    infoCampos: {
      PRODUTOS: "Calcinhas cotton, renda e microfibra · Sutiãs com e sem bojo · Conjuntos lingerie · Pijamas femininos e infantis · Camisolas e baby doll · Beachwear (biquíni e maiô) · Meia-calça e meia soquete",
      PRECOS: "Calcinha avulsa a partir de R$8 · Kit 10 peças com 12% desconto · Conjunto lingerie a partir de R$25 · Pijama R$35 · Pedido mínimo: R$300 · Tabela completa enviada via WhatsApp",
      PAGAMENTO: "PIX com 5% desconto · Boleto bancário (mínimo R$500) · Cartão crédito até 10x · Transferência bancária",
      ENTREGA: "Entrega para todo o Brasil via Correios e Jadlog · Frete grátis acima de R$800 · Prazo 3 a 7 dias úteis · Nota fiscal em todos os pedidos",
      DIFERENCIAIS: "Atacado a partir de 10 peças · Mais de 200 modelos disponíveis · Coleção renovada mensalmente · Fotos profissionais para revenda · Embalagem discreta · Troca garantida",
      HORARIO: "Seg–Sex 8h–17h · Sáb 8h–12h · Dom: fechado · Pedidos pelo WhatsApp 24h",
    },
    qualificacao: "Você é lojista, revendedor ou consumidor final?\nQual categoria mais te interessa? (calcinha, sutiã, pijama, beachwear...)\nQual o seu volume médio de compra por pedido?",
    posVenda: "Oi {nome}! 😊 {ia} aqui, da {empresa}. Seu pedido chegou certinho? Tudo certo com as peças?",
    aniversario: "Parabéns, {nome}! 🎂 A {empresa} deseja um ótimo dia! Aproveite nossa condição especial de aniversário! 🎁",
  },
  {
    id: "moda_feminina", emoji: "👒", nome: "Moda Feminina",
    desc: "Loja de roupas femininas varejo, boutique, multimarcas",
    tipoAtendimento: "ORCAMENTO", nomeIA: "Valentina",
    infoCampos: {
      PRODUTOS: "Blusas e camisetas femininas · Calças e leggings · Vestidos casuais e de festa · Saias e shorts · Macacões e conjuntos · Acessórios (bolsas, cintos, lenços) · Tamanhos P ao GGG",
      PRECOS: "Blusas a partir de R$49,90 · Vestidos R$89,90 a R$249,90 · Conjuntos R$129,90 · Bolsas R$69,90 · Desconto de 10% na segunda peça · Promoções toda semana nas redes sociais",
      PAGAMENTO: "PIX · Cartão débito e crédito até 12x sem juros · Dinheiro · Crediário próprio para clientes cadastradas",
      ENTREGA: "Entrega para todo o Brasil via Correios · Frete grátis acima de R$299 · Retirada na loja · Prazo 3 a 5 dias úteis",
      DIFERENCIAIS: "Coleções exclusivas atualizadas toda semana · Tamanhos P ao GGG · Troca em até 30 dias · Consultoria de moda gratuita · Embalagem para presente",
      HORARIO: "Seg–Sex 9h–19h · Sáb 9h–17h · Dom 10h–14h",
    },
    qualificacao: "Você prefere estilo casual, social ou festas?\nQual o seu tamanho? (P, M, G, GG, GGG)\nTem algum produto específico em mente?",
    posVenda: "Oi {nome}! 😊 {ia} aqui, da {empresa}. Seu pedido chegou? As peças ficaram do jeito que esperava?",
    aniversario: "Parabéns, {nome}! 🎂 {ia} aqui. Se presenteie hoje — temos desconto especial de aniversário para você! 🎁",
  },
  {
    id: "moda_masculina_atacado", emoji: "👔", nome: "Moda Masculina Atacado",
    desc: "Atacado de roupas masculinas, camisas, calças e conjuntos",
    tipoAtendimento: "ORCAMENTO", nomeIA: "Bruno",
    infoCampos: {
      PRODUTOS: "Camisas sociais e casuais masculinas · Calças jeans e de tecido · Bermudas e shorts · Camisetas básicas e estampadas · Conjuntos masculinos · Uniformes e profissionais · Moda fitness masculina",
      PRECOS: "Camiseta avulsa a partir de R$15 · Camisa social R$45 · Calça jeans R$55 · Kit 5 camisetas R$65 · Pedido mínimo atacado: R$400 · Tabela completa por WhatsApp",
      PAGAMENTO: "PIX com 5% desconto · Boleto (mínimo R$600) · Cartão crédito até 10x · Transferência bancária · Nota fiscal disponível",
      ENTREGA: "Entrega nacional via Correios e transportadora · Frete grátis acima de R$700 · Prazo 3 a 7 dias úteis · Embalagem profissional para revenda",
      DIFERENCIAIS: "Atacado a partir de 5 peças · Tabela especial para lojistas · Fotos e vídeos para divulgação · Coleção atualizada bimestralmente · Troca de peças com defeito garantida",
      HORARIO: "Seg–Sex 8h–18h · Sáb 8h–12h · Dom: fechado",
    },
    qualificacao: "Você é lojista, representante ou compra para uso próprio?\nQual categoria mais te interessa? (camisa, calça, camiseta...)\nQual o volume médio de compra por pedido?",
    posVenda: "Oi {nome}! {ia} aqui, da {empresa}. Seu pedido chegou certinho? Tudo certo com as peças?",
    aniversario: "Parabéns, {nome}! 🎂 A {empresa} deseja um ótimo dia! Aproveite nossa condição especial de aniversário! 🎁",
  },
  {
    id: "joias_prata", emoji: "💍", nome: "Joias em Prata 925",
    desc: "Joias, semijoias e bijuterias em prata 925 e banhadas",
    tipoAtendimento: "ORCAMENTO", nomeIA: "Luna",
    infoCampos: {
      PRODUTOS: "Anéis em prata 925 · Brincos em prata 925 (argolas, pinos, pendentes) · Colares e correntes · Pulseiras e braceletes · Pingentes · Conjuntos (colar + brinco) · Banho de ródio disponível",
      PRECOS: "Anéis a partir de R$89 · Brincos R$65 a R$180 · Colares R$120 a R$350 · Conjuntos R$180 a R$450 · Atacado a partir de 5 peças com desconto progressivo · Certificado de autenticidade incluso",
      PAGAMENTO: "PIX com 5% desconto · Cartão crédito até 12x sem juros · Cartão débito · Parcelamento direto para atacado",
      ENTREGA: "Entrega para todo o Brasil via Correios com rastreamento · Embalagem premium para presente · Frete grátis acima de R$300 · Prazo 3 a 5 dias úteis",
      DIFERENCIAIS: "Prata 925 certificada · Garantia de 6 meses contra oxidação · Embalagem presente inclusa · Personalização com nome ou data · Rodiar e polir joias antigas aceito",
      HORARIO: "Seg–Sex 9h–18h · Sáb 9h–13h · Pedidos pelo WhatsApp 24h",
    },
    qualificacao: "Você está comprando para presentear ou uso pessoal?\nTem preferência de peça? (anel, brinco, colar, pulseira...)\nPrecisa de algo personalizado com nome ou data?",
    posVenda: "Oi {nome}! {ia} aqui, da {empresa}. Sua joia chegou certinha? Ficou do jeito que esperava? 💍",
    aniversario: "Parabéns, {nome}! ✨ {ia} aqui. Que tal se presentear com uma joia especial hoje? 💍 Temos desconto de aniversário para você!",
  },
  {
    id: "joias_ouro", emoji: "🌟", nome: "Joias em Ouro",
    desc: "Joias em ouro 18k, alianças e joalheria fina",
    tipoAtendimento: "ORCAMENTO", nomeIA: "Luna",
    infoCampos: {
      PRODUTOS: "Alianças em ouro 18k (casamento e noivado) · Anéis em ouro amarelo e branco · Brincos em ouro · Colares e correntes em ouro · Pulseiras · Pingentes e berlocks · Joias com pedras naturais (diamante, rubi, esmeralda)",
      PRECOS: "Par de alianças a partir de R$800 · Anel solitário ouro 18k R$600 a R$3.000 · Brincos ouro a partir de R$350 · Colares R$500 a R$2.500 · Orçamento por grama conforme cotação do dia · Parcelamento disponível",
      PAGAMENTO: "PIX · Cartão crédito até 18x · Transferência bancária · Cheque para valores acima de R$2.000 · Nota fiscal em todos os pedidos",
      ENTREGA: "Entrega com seguro e rastreamento · Retirada na joalheria com apresentação de documento · Frete para o Brasil todo",
      DIFERENCIAIS: "Ouro 18k certificado pela ANVISA · Laudo de autenticidade incluso · Gravação personalizada gratuita · Redimensionamento e reparos · Mais de 20 anos no mercado · Atendimento VIP",
      HORARIO: "Seg–Sex 9h–18h · Sáb 9h–13h · Dom: fechado",
    },
    qualificacao: "É para presente, uso pessoal ou alianças de casamento?\nQual o tipo de peça de interesse?\nTem orçamento em mente ou prefere ver as opções?",
    posVenda: "Oi {nome}! {ia} aqui, da {empresa}. Sua joia chegou certinha? Ficou tudo como esperado? 🌟",
    aniversario: "Parabéns, {nome}! ✨ {ia} aqui. Que seu dia brilhe tanto quanto ouro! Temos uma surpresa especial para você hoje! 🎂",
  },
  {
    id: "petshop", emoji: "🐾", nome: "Petshop",
    desc: "Banho, tosa, veterinário, ração e acessórios pet",
    tipoAtendimento: "AMBOS", nomeIA: "Nina",
    infoCampos: {
      PRODUTOS: "Banho e tosa para cães e gatos · Consulta veterinária · Vacinação e vermifugação · Ração premium e super premium · Petiscos e snacks · Coleiras, guias e roupinhas · Caminhas e arranhadores · Brinquedos e acessórios",
      PRECOS: "Banho cão pequeno R$50 · Médio R$70 · Grande R$90 · Tosa higiênica + R$30 · Consulta veterinária R$120 · Vacinação V10 R$85 · Ração Royal Canin 15kg R$280 · Pacote mensal banho (4x) com 15% desconto",
      PAGAMENTO: "PIX · Cartão débito e crédito até 6x · Dinheiro · Pacotes mensais com desconto",
      ENTREGA: "Atendimento presencial na loja · Entrega de ração e acessórios na cidade para pedidos acima de R$150 · Prazo 1 a 2 dias úteis",
      DIFERENCIAIS: "Ambiente sem estresse para os pets · Veterinária residente · Produtos de primeira linha · Banho sem mistura de raças · Acompanhamento fotográfico durante o banho · Pré-agendamento online",
      HORARIO: "Seg–Sex 8h–18h · Sáb 8h–14h · Dom: emergências veterinárias",
    },
    qualificacao: "Qual o serviço que você procura? (banho, tosa, consulta, ração...)\nQual a raça e porte do seu pet?\nNome do bichinho?",
    posVenda: "Oi {nome}! {ia} aqui, do {empresa}. Como o {pet} está se sentindo depois do banho/consulta? Tudo bem? 🐾",
    aniversario: "Parabéns, {nome}! 🎂 {ia} aqui. E parabéns também ao seu pet! Temos mimo especial para quem vier hoje! 🐾",
  },
  {
    id: "farmacia", emoji: "💊", nome: "Farmácia",
    desc: "Farmácia e drogaria, perfumaria e manipulação",
    tipoAtendimento: "ORCAMENTO", nomeIA: "Clara",
    infoCampos: {
      PRODUTOS: "Medicamentos de referência, genéricos e similares · Dermocosméticos e skincare · Perfumaria · Suplementos e vitaminas · Produtos para bebê · Equipamentos de saúde (medidor de pressão, glicosímetro) · Manipulação de fórmulas (se disponível)",
      PRECOS: "Genéricos com até 40% menos que a referência · Desconto especial para aposentados e idosos · Programa fidelidade com pontos · Orçamento gratuito por WhatsApp",
      PAGAMENTO: "PIX · Cartão débito e crédito até 6x · Dinheiro · Convênios empresariais",
      ENTREGA: "Entrega na cidade em até 2 horas para medicamentos · Retirada na farmácia · Frete grátis para pedidos acima de R$80",
      DIFERENCIAIS: "Farmacêutico responsável sempre presente · Orientação gratuita sobre medicamentos · Entrega expressa em 2h · Maior variedade de genéricos · Dispensação de psicotrópicos · Plantão 24h",
      HORARIO: "Seg–Sáb 7h–22h · Dom 8h–20h · Plantão 24h para emergências",
    },
    qualificacao: "Você precisa de um medicamento específico ou está buscando algo? (vitamina, skincare, equipamento...)\nTem receita médica?\nPrecisa de entrega ou vai retirar na loja?",
    posVenda: "Oi {nome}! {ia} aqui, da {empresa}. Seu pedido chegou? Tem alguma dúvida sobre como usar o medicamento?",
    aniversario: "Parabéns, {nome}! 🎂 {ia} aqui. Saúde e felicidade para você nesse dia! Aproveite nosso desconto de aniversário! 💊",
  },
  {
    id: "outros", emoji: "🏢", nome: "Outro segmento",
    desc: "Serviços gerais, associações, e-commerce e outros",
    tipoAtendimento: "ORCAMENTO", nomeIA: "Sofia",
    infoCampos: {
      PRODUTOS: "Descreva aqui os produtos e serviços que sua empresa oferece",
      PRECOS: "Informe os valores e condições comerciais",
      PAGAMENTO: "PIX · Cartão débito e crédito · Dinheiro",
      ENTREGA: "Informe como funciona a entrega ou prestação dos serviços",
      DIFERENCIAIS: "Descreva os diferenciais e pontos fortes da sua empresa",
      HORARIO: "Seg–Sex 8h–18h · Sáb 8h–12h",
    },
    qualificacao: "O que você está buscando?\nJá conhece a empresa?\nQual o melhor horário para entrarmos em contato?",
    posVenda: "Oi {nome}! {ia} aqui. Ficou satisfeito com o nosso atendimento? Tem alguma dúvida?",
    aniversario: "Parabéns, {nome}! 🎂 {ia} aqui. Desejamos um dia muito especial! 🎉",
  },
];

function parseInfo(texto: string | null): Record<string, string> {
  const result: Record<string, string> = {};
  if (!texto) return result;
  for (const sec of SECOES) {
    const match = texto.match(new RegExp(`${sec}:([\\s\\S]*?)(?=(?:${SECOES.join("|")}):|\$)`));
    if (match) result[sec] = match[1].trim();
  }
  return result;
}
function composeInfo(campos: Record<string, string>): string {
  return SECOES.filter((s) => campos[s]?.trim()).map((s) => `${s}: ${campos[s].trim()}`).join("\n");
}

const INPUT = "w-full input-dark px-3 py-2.5 text-[13px]";

/* ── WhatsApp connection tab ──────────────────────────────────────── */
function AbaWhatsApp({ instancia, vendedoresOk, informacoesOk, onIrVendedores, onIrEmpresa }: { instancia: string; vendedoresOk: boolean; informacoesOk: boolean; onIrVendedores: () => void; onIrEmpresa: () => void }) {
  const setupOk = vendedoresOk && informacoesOk;
  const [state, setState] = useState<"loading" | "open" | "connecting" | "close" | "unknown">("loading");
  const [qrcode, setQrcode] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function checar() {
    setState("loading");
    try {
      const res = await fetch(`/api/central/conexao?instancia=${instancia}`);
      const data = await res.json();
      setState(data.state ?? "unknown");
      setQrcode(data.qrcode ?? null);
      if (data.state !== "open" && data.qrcode) {
        timerRef.current = setTimeout(checar, 15000);
      }
    } catch {
      setState("unknown");
    }
  }

  useEffect(() => {
    if (!setupOk) return;
    checar();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [instancia, setupOk]);

  const cardStyle = {
    background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px",
  };

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="p-5 rounded-2xl" style={cardStyle}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[15px] font-bold" style={{ color: "var(--text)" }}>Conexão WhatsApp</p>
            <p className="text-[12px] mt-0.5 font-mono" style={{ color: "var(--muted-2)" }}>{instancia}</p>
          </div>
          <button
            onClick={checar}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
            style={{ background: "var(--card-2)", border: "1px solid var(--border)", color: "var(--muted)" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Atualizar
          </button>
        </div>

        {!setupOk && (
          <div className="rounded-xl p-3 mb-2" style={{ background: "rgba(251,146,60,.06)", border: "1px solid rgba(251,146,60,.2)" }}>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-lg">🔒</span>
              <p className="text-[13px] font-bold" style={{ color: "#fb923c" }}>Complete o setup para liberar o QR Code</p>
            </div>
            <div className="flex flex-col gap-2">
              {!vendedoresOk && (
                <button onClick={onIrVendedores} className="flex items-center gap-2.5 rounded-lg px-3 py-2 w-full text-left transition-all"
                  style={{ background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.15)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(248,113,113,.14)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(248,113,113,.08)")}>
                  <span className="text-[16px]">👤</span>
                  <div className="flex-1">
                    <p className="text-[12px] font-semibold" style={{ color: "#f87171" }}>Cadastrar vendedor</p>
                    <p className="text-[11px]" style={{ color: "var(--muted-3)" }}>Nenhum vendedor ativo para esta empresa</p>
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: "#f87171" }}>Ir para Vendedores →</span>
                </button>
              )}
              {!informacoesOk && (
                <button onClick={onIrEmpresa} className="flex items-center gap-2.5 rounded-lg px-3 py-2 w-full text-left transition-all"
                  style={{ background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.15)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(248,113,113,.14)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(248,113,113,.08)")}>
                  <span className="text-[16px]">📋</span>
                  <div className="flex-1">
                    <p className="text-[12px] font-semibold" style={{ color: "#f87171" }}>Preencher informações da empresa</p>
                    <p className="text-[11px]" style={{ color: "var(--muted-3)" }}>A IA precisa das informações para atender</p>
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: "#f87171" }}>Ir para Empresa →</span>
                </button>
              )}
            </div>
          </div>
        )}

        {setupOk && state === "loading" && (
          <div className="flex items-center gap-3 py-6">
            <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: "#fbbf24" }} />
            <span className="text-[13px]" style={{ color: "var(--muted)" }}>Verificando conexão...</span>
          </div>
        )}

        {setupOk && state === "open" && (
          <div className="flex items-center gap-3 py-3 px-4 rounded-xl" style={{ background: "rgba(52,211,153,.08)", border: "1px solid rgba(52,211,153,.2)" }}>
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: "#34d399", boxShadow: "0 0 8px #34d399" }} />
            <div>
              <p className="text-[13px] font-semibold" style={{ color: "#34d399" }}>WhatsApp conectado</p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-2)" }}>Atendimento automático ativo</p>
            </div>
          </div>
        )}

        {setupOk && (state === "close" || state === "connecting" || state === "unknown") && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 py-3 px-4 rounded-xl" style={{ background: "rgba(251,146,60,.08)", border: "1px solid rgba(251,146,60,.2)" }}>
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: "#fb923c" }} />
              <div>
                <p className="text-[13px] font-semibold" style={{ color: "#fb923c" }}>
                  {state === "connecting" ? "Aguardando escaneamento..." : "WhatsApp desconectado"}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-2)" }}>Escaneie o QR Code abaixo com o WhatsApp Business</p>
              </div>
            </div>

            {qrcode ? (
              <div className="flex flex-col sm:flex-row gap-5 sm:items-center">
                <div className="p-3 rounded-2xl flex-shrink-0 mx-auto sm:mx-0" style={{ background: "#ffffff" }}>
                  <img src={qrcode} alt="QR Code WhatsApp" className="w-64 h-64 sm:w-52 sm:h-52 object-contain" />
                </div>
                <div className="space-y-3 text-[13px]" style={{ color: "var(--muted)" }}>
                  <p className="font-semibold" style={{ color: "var(--text)" }}>Como escanear:</p>
                  <ol className="space-y-2 list-none">
                    {[
                      "Abra o WhatsApp Business no celular",
                      'Toque em "Mais opções" (⋮) ou Configurações',
                      'Selecione "Aparelhos conectados"',
                      'Toque em "Conectar um aparelho"',
                      "Aponte a câmera para o QR Code acima",
                    ].map((step, i) => (
                      <li key={i} className="flex gap-2.5">
                        <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
                          style={{ background: "rgba(99,102,241,.15)", color: "#a5b4fc" }}>
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                  <p className="text-[11px]" style={{ color: "var(--muted-3)" }}>
                    QR Code renova automaticamente a cada 15s
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center">
                <button onClick={checar} className="btn-primary px-5 py-2.5 text-[13px] w-full sm:w-auto">
                  Gerar QR Code
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────────── */
export default function ConfiguracoesPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [aba, setAba] = useState<"empresas" | "vendedores" | "midias" | "whatsapp">("empresas");
  const tabsRef = useRef<HTMLDivElement>(null);

  const [novaEmpresa, setNovaEmpresa] = useState({ nome: "", instanciaWhatsapp: "" });
  const [novoVendedor, setNovoVendedor] = useState({ nome: "", telefone: "", empresaId: "", cargo: "VENDEDOR" });

  const [editEmpresa, setEditEmpresa] = useState<string | null>(null);
  const [infoCampos, setInfoCampos] = useState<Record<string, string>>({});
  const [calendarFields, setCalendarFields] = useState({ googleCalendarId: "", googleCredentialId: "", calendlyUrl: "" });
  const [perguntasQualificacao, setPerguntasQualificacao] = useState("");
  const [tipoAtendimento, setTipoAtendimento] = useState("AGENDAMENTO");
  const [nomeIA, setNomeIA] = useState("");
  const [mensagemPosVenda, setMensagemPosVenda] = useState("");
  const [mensagemAniversario, setMensagemAniversario] = useState("");
  const [mensagemIndicacao, setMensagemIndicacao] = useState("");
  const [tagsCustomizadas, setTagsCustomizadas] = useState<string[]>([]);
  const [novaTag, setNovaTag] = useState("");
  const [complementaresGuia, setComplementaresGuia] = useState("");
  const [perfisCliente, setPerfisCliente] = useState("");
  const [modalLogin, setModalLogin] = useState<Empresa | null>(null);
  const [loginForm, setLoginForm] = useState({ nome: "", email: "", senha: "" });
  const [criandoLogin, setCriandoLogin] = useState(false);
  const [loginMsg, setLoginMsg] = useState("");

  const [editVendedor, setEditVendedor] = useState<string | null>(null);
  const [editVendedorData, setEditVendedorData] = useState({ nome: "", telefone: "", ordemChamada: 1, cargo: "VENDEDOR" });

  const [modalTransferir, setModalTransferir] = useState<Vendedor | null>(null);
  const [transferirParaId, setTransferirParaId] = useState("");
  const [transferindo, setTransferindo] = useState(false);
  const [transferirResultado, setTransferirResultado] = useState<{ ok: boolean; msg: string } | null>(null);

  const [midias, setMidias] = useState<Midia[]>([]);
  const [midiaEmpresaId, setMidiaEmpresaId] = useState("");
  const [novaMidia, setNovaMidia] = useState({ etiqueta: "", descricaoUso: "", tipo: "imagem" });
  const [novaMidiaArquivo, setNovaMidiaArquivo] = useState<File | null>(null);
  const [carregandoMidias, setCarregandoMidias] = useState(false);

  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState("");
  const [deletandoEmpresa, setDeletandoEmpresa] = useState<Empresa | null>(null);
  const [confirmNomeEmpresa, setConfirmNomeEmpresa] = useState("");
  const [helpOpen, setHelpOpen] = useState<string | null>(null);
  const [segmentoModal, setSegmentoModal] = useState<string | null>(null); // empId being templated

  const isCentral = me?.perfil === "CENTRAL";
  const helpData = helpOpen ? FIELD_HELP[helpOpen] : null;

  function aplicarTemplate(seg: Segmento) {
    setInfoCampos(seg.infoCampos);
    setNomeIA(seg.nomeIA);
    setTipoAtendimento(seg.tipoAtendimento);
    setPerguntasQualificacao(seg.qualificacao);
    setMensagemPosVenda(seg.posVenda);
    setMensagemAniversario(seg.aniversario);
    setSegmentoModal(null);
  }

  function temConteudo() {
    return SECOES.some(s => (infoCampos[s] ?? "").trim().length > 0)
      || nomeIA.trim().length > 0
      || perguntasQualificacao.trim().length > 0;
  }

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then(setMe);
    fetch("/api/empresas").then((r) => r.json()).then((data) => {
      setEmpresas(data);
      if (data.length === 1) {
        setMidiaEmpresaId(data[0].id);
        setNovoVendedor((p) => ({ ...p, empresaId: data[0].id }));
      }
    });
    fetch("/api/vendedores?todos=true").then((r) => r.json()).then(setVendedores);
  }, []);

  useEffect(() => {
    if (me && me.perfil !== "CENTRAL" && empresas.length === 1 && !editEmpresa) {
      abrirEditEmpresa(empresas[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.perfil, empresas.length]);

  useEffect(() => {
    if (aba === "midias" && midiaEmpresaId) carregarMidias(midiaEmpresaId);
  }, [aba, midiaEmpresaId]);

  async function carregarMidias(empId: string) {
    setCarregandoMidias(true);
    const data = await fetch(`/api/midias?empresaId=${empId}`).then((r) => r.json());
    setMidias(Array.isArray(data) ? data : []);
    setCarregandoMidias(false);
  }

  function showMsg(texto: string, erro = false) {
    setMsg(erro ? `⚠ ${texto}` : texto);
    setTimeout(() => setMsg(""), 4000);
  }

  const criarEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      const res = await fetch("/api/empresas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(novaEmpresa) });
      const emp = await res.json();
      if (!res.ok) { showMsg(emp?.error ?? emp?.message ?? "Erro ao criar empresa", true); return; }
      setEmpresas((prev) => [...prev, emp]);
      setNovaEmpresa({ nome: "", instanciaWhatsapp: "" });
      showMsg("Empresa criada!");
    } catch {
      showMsg("Erro de conexão. Tente novamente.", true);
    } finally {
      setSalvando(false);
    }
  };

  const excluirEmpresa = async () => {
    if (!deletandoEmpresa) return;
    await fetch(`/api/empresas/${deletandoEmpresa.id}`, { method: "DELETE" });
    setEmpresas((prev) => prev.filter((e) => e.id !== deletandoEmpresa.id));
    setDeletandoEmpresa(null);
    setConfirmNomeEmpresa("");
    showMsg("Empresa excluída.");
  };

  const criarVendedor = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/vendedores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(novoVendedor) });
    const v = await res.json();
    setVendedores((prev) => [...prev, { ...v, empresa: empresas.find((em) => em.id === v.empresaId) ?? { nome: "" }, _count: { vendas: 0 } }]);
    setNovoVendedor((p) => ({ ...p, nome: "", telefone: "" }));
    showMsg("Vendedor criado!");
  };

  function abrirEditEmpresa(emp: Empresa) {
    // Se há conteúdo não salvo de outra empresa, confirma antes de sobrescrever
    if (editEmpresa && editEmpresa !== emp.id && temConteudo()) {
      if (!confirm("Você tem alterações não salvas. Deseja descartar e abrir a outra empresa?")) return;
    }
    setEditEmpresa(emp.id);
    setInfoCampos(parseInfo(emp.informacoes));
    setCalendarFields({ googleCalendarId: emp.googleCalendarId ?? "", googleCredentialId: emp.googleCredentialId ?? "", calendlyUrl: emp.calendlyUrl ?? "" });
    setPerguntasQualificacao(emp.perguntasQualificacao ?? "");
    setTipoAtendimento(emp.tipoAtendimento ?? "AGENDAMENTO");
    setNomeIA(emp.nomeIA ?? "");
    setMensagemPosVenda(emp.mensagemPosVenda ?? "");
    setMensagemAniversario(emp.mensagemAniversario ?? "");
    setMensagemIndicacao(emp.mensagemIndicacao ?? "Oi {nome}! Sou {ia}, da {empresa}. {indicador} me passou seu contato e disse que você pode se interessar nos nossos produtos! Gostaria de saber como posso te ajudar? 😊\n\n1️⃣ Sim, me conta mais!\n2️⃣ Agora não, me chama em 7 dias\n3️⃣ Não, obrigado(a)");
    setTagsCustomizadas(emp.tagsCustomizadas ?? []);
    setNovaTag("");
    setComplementaresGuia(emp.complementaresGuia ?? "");
    setPerfisCliente(emp.perfisCliente ?? "");
  }

  const salvarInfoEmpresa = async (empresaId: string) => {
    setSalvando(true);
    const informacoes = composeInfo(infoCampos);
    const pq = perguntasQualificacao.trim() || null;
    const mpv = mensagemPosVenda.trim() || null;
    const maniv = mensagemAniversario.trim() || null;

    // Detectar tags removidas e migrar clientes se necessário
    const empAtual = empresas.find(e => e.id === empresaId);
    const tagsRemovidas = (empAtual?.tagsCustomizadas ?? []).filter(t => !tagsCustomizadas.includes(t));
    for (const tagRemovida of tagsRemovidas) {
      const migrar = confirm(`A tag "${tagRemovida}" foi removida. Deseja removê-la também de todos os clientes que a possuem?`);
      if (migrar) {
        await fetch(`/api/empresas/${empresaId}/migrar-tags`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ de: tagRemovida, para: null }),
        });
      }
    }

    if (perfisCliente.trim()) {
      try { JSON.parse(perfisCliente.trim()); } catch {
        showMsg("Perfis de cliente: JSON inválido. Corrija antes de salvar.", true);
        setSalvando(false);
        return;
      }
    }

    const res = await fetch(`/api/empresas/${empresaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ informacoes, ...calendarFields, perguntasQualificacao: pq, tipoAtendimento, nomeIA: nomeIA.trim() || null, mensagemPosVenda: mpv, mensagemAniversario: maniv, mensagemIndicacao: mensagemIndicacao.trim() || null, tagsCustomizadas, complementaresGuia: complementaresGuia.trim() || null, perfisCliente: perfisCliente.trim() || null }),
    });

    if (!res.ok) {
      showMsg("Erro ao salvar. Tente novamente.", true);
      setSalvando(false);
      return;
    }

    // Re-busca do servidor para garantir que UI reflete o estado real
    const fresh = await fetch("/api/empresas").then(r => r.json());
    if (Array.isArray(fresh)) setEmpresas(fresh);

    setEditEmpresa(null);
    setSalvando(false);
    showMsg("Informações salvas!");
  };

  function abrirEditVendedor(v: Vendedor) {
    setEditVendedor(v.id);
    setEditVendedorData({ nome: v.nome, telefone: v.telefone, ordemChamada: v.ordemChamada, cargo: v.cargo ?? "VENDEDOR" });
  }

  const salvarVendedor = async (id: string) => {
    setSalvando(true);
    const res = await fetch(`/api/vendedores/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editVendedorData) });
    const updated = await res.json();
    setVendedores((prev) => prev.map((v) => v.id === id ? { ...v, ...updated } : v));
    setEditVendedor(null);
    setSalvando(false);
    showMsg("Vendedor atualizado!");
  };

  const toggleAtivo = async (v: Vendedor) => {
    await fetch(`/api/vendedores/${v.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ativo: !v.ativo }) });
    setVendedores((prev) => prev.map((vv) => vv.id === v.id ? { ...vv, ativo: !vv.ativo } : vv));
    showMsg(v.ativo ? "Vendedor desativado" : "Vendedor ativado");
  };

  const excluirVendedor = async (id: string, nome: string) => {
    if (!confirm(`Excluir ${nome}?`)) return;
    await fetch(`/api/vendedores/${id}`, { method: "DELETE" });
    setVendedores((prev) => prev.filter((v) => v.id !== id));
    showMsg("Vendedor excluído.");
  };

  const transferirCarteira = async () => {
    if (!modalTransferir || !transferirParaId) return;
    setTransferindo(true);
    setTransferirResultado(null);
    const res = await fetch("/api/vendedores/transferir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deVendedorId: modalTransferir.id, paraVendedorId: transferirParaId }),
    });
    const data = await res.json();
    if (data.ok) {
      setTransferirResultado({ ok: true, msg: `${data.leadsTransferidos} lead(s) transferido(s) para ${data.para}` });
    } else {
      setTransferirResultado({ ok: false, msg: data.error ?? "Erro ao transferir" });
    }
    setTransferindo(false);
  };

  const criarMidia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!midiaEmpresaId || !novaMidiaArquivo) return;
    setSalvando(true);
    const form = new FormData();
    form.append("arquivo", novaMidiaArquivo);
    form.append("etiqueta", novaMidia.etiqueta);
    form.append("descricaoUso", novaMidia.descricaoUso);
    form.append("tipo", novaMidia.tipo);
    form.append("empresaId", midiaEmpresaId);
    const res = await fetch("/api/midias/upload", { method: "POST", body: form });
    if (!res.ok) { showMsg("Erro ao enviar arquivo."); setSalvando(false); return; }
    const created = await res.json();
    setMidias((prev) => [created, ...prev]);
    setNovaMidia({ etiqueta: "", descricaoUso: "", tipo: "imagem" });
    setNovaMidiaArquivo(null);
    setSalvando(false);
    showMsg("Mídia adicionada!");
  };

  const toggleMidia = async (m: Midia) => {
    await fetch(`/api/midias/${m.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ativo: !m.ativo }) });
    setMidias((prev) => prev.map((x) => x.id === m.id ? { ...x, ativo: !m.ativo } : x));
  };

  const excluirMidia = async (id: string) => {
    if (!confirm("Excluir esta mídia?")) return;
    await fetch(`/api/midias/${id}`, { method: "DELETE" });
    setMidias((prev) => prev.filter((m) => m.id !== id));
    showMsg("Mídia excluída.");
  };

  const tabStyle = (id: string) => aba === id
    ? { background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white", border: "1px solid transparent", boxShadow: "0 4px 14px rgba(99,102,241,.3)" }
    : { background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)" };

  const TH = ({ children }: { children?: React.ReactNode }) => (
    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
      {children}
    </th>
  );

  const cardStyle = {
    background: "linear-gradient(145deg, var(--card), var(--card))",
    border: "1px solid var(--border)",
    borderRadius: "16px",
  };

  const editRowStyle = {
    background: "rgba(99,102,241,.05)",
    borderBottom: "1px solid rgba(99,102,241,.12)",
  };

  // Tabs visíveis por perfil
  const tabs = isCentral
    ? [
        { id: "empresas",   label: "Empresas" },
        { id: "vendedores", label: "Vendedores" },
        { id: "midias",     label: "Mídias da IA" },
      ]
    : [
        { id: "empresas",   label: "Minha Empresa" },
        { id: "vendedores", label: "Vendedores" },
        { id: "midias",     label: "Mídias da IA" },
        { id: "whatsapp",   label: "WhatsApp" },
      ];

  return (
    <>
    <div className="h-full overflow-y-auto" style={{ background: "var(--bg)" }}>
      <div className="p-4 md:p-8 max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full mb-3"
            style={{ background: "rgba(99,102,241,.1)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,.18)" }}>
            Sistema
          </span>
          <div>
            <h1 className="text-[28px] font-bold tracking-tight" style={{ color: "var(--text)" }}>Configurações</h1>
            <p className="text-[13px] mt-1" style={{ color: "var(--muted-2)" }}>
              {isCentral ? "Empresas, vendedores e mídias da IA" : "Configure sua empresa e equipe"}
            </p>
          </div>
          {msg && (
            <div className="mt-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-center"
              style={{ background: "rgba(52,211,153,.1)", color: "#34d399", border: "1px solid rgba(52,211,153,.2)" }}>
              {msg}
            </div>
          )}
        </div>

        {/* Onboarding checklist — only for company users */}
        {!isCentral && <SetupChecklist onNavigate={(tab) => {
          setAba(tab as "empresas" | "vendedores" | "midias" | "whatsapp");
          setTimeout(() => tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
        }} />}

        {/* Tabs */}
        <div ref={tabsRef} className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setAba(tab.id as typeof aba)}
              className="px-4 py-2 rounded-xl text-[13px] font-medium transition-all"
              style={tabStyle(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── EMPRESAS ── */}
        {aba === "empresas" && (
          <div className="space-y-4 animate-fade-up">

            {/* Formulário novo — só CENTRAL */}
            {isCentral && (
              <form onSubmit={criarEmpresa} className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl" style={cardStyle}>
                <input required placeholder="Nome da empresa" value={novaEmpresa.nome}
                  onChange={(e) => setNovaEmpresa((p) => ({ ...p, nome: e.target.value }))}
                  className={`flex-1 ${INPUT}`} />
                <input required placeholder="Instância WhatsApp (ex: ph_intima)" value={novaEmpresa.instanciaWhatsapp}
                  onChange={(e) => setNovaEmpresa((p) => ({ ...p, instanciaWhatsapp: e.target.value }))}
                  className={`flex-1 ${INPUT}`} />
                <button type="submit" disabled={salvando} className="btn-primary px-4 py-2 text-[13px] disabled:opacity-50 sm:w-auto w-full">{salvando ? "Salvando..." : "Adicionar"}</button>
              </form>
            )}

            {/* Lista de empresas como cards */}
            <div className="space-y-3">
              {empresas.map((emp) => (
                <div key={emp.id} className="rounded-2xl overflow-hidden" style={cardStyle}>

                  {/* Cabeçalho do card */}
                  <div className="p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-bold leading-tight truncate" style={{ color: "var(--text)" }}>{emp.nome}</p>
                      {isCentral && (
                        <p className="text-[11px] font-mono mt-0.5 truncate" style={{ color: "var(--muted-2)" }}>{emp.instanciaWhatsapp}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[11px]" style={{ color: "var(--muted-2)" }}>
                          {emp._count.clientes} clientes · {emp._count.leads} leads
                        </span>
                        {emp.informacoes
                          ? <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(52,211,153,.1)", color: "#34d399" }}>Info preenchida</span>
                          : <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(251,191,36,.1)", color: "#fbbf24" }}>Info vazia</span>
                        }
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => editEmpresa === emp.id ? setEditEmpresa(null) : abrirEditEmpresa(emp)}
                        className="text-[13px] px-3 py-2 rounded-xl font-semibold transition-all"
                        style={editEmpresa === emp.id
                          ? { background: "var(--card-2)", border: "1px solid var(--border-2)", color: "var(--muted)" }
                          : { background: "rgba(99,102,241,.1)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,.2)" }}>
                        {editEmpresa === emp.id ? "Fechar" : "Editar"}
                      </button>
                      {isCentral && (
                        <button onClick={() => { setModalLogin(emp); setLoginForm({ nome: "", email: "", senha: "" }); setLoginMsg(""); }}
                          className="text-[13px] px-3 py-2 rounded-xl font-semibold"
                          style={{ background: "rgba(34,211,238,.08)", color: "#22d3ee", border: "1px solid rgba(34,211,238,.2)" }}>
                          + Login
                        </button>
                      )}
                      {isCentral && (
                        <button onClick={() => { setDeletandoEmpresa(emp); setConfirmNomeEmpresa(""); }}
                          className="text-[13px] px-3 py-2 rounded-xl font-semibold"
                          style={{ background: "rgba(239,68,68,.08)", color: "#f87171", border: "1px solid rgba(239,68,68,.2)" }}>
                          Excluir
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Formulário de edição inline — sem tabela, sem scroll horizontal */}
                  {editEmpresa === emp.id && (
                    <div className="px-4 pb-5" style={{ borderTop: "1px solid var(--border)", background: "rgba(99,102,241,.02)" }}>
                      <div className="pt-4">

                        {/* Template por segmento */}
                        <div className="flex items-center justify-between mb-4 py-3 px-3.5 rounded-xl"
                          style={{ background: "rgba(99,102,241,.05)", border: "1px dashed rgba(99,102,241,.2)" }}>
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold" style={{ color: "#a5b4fc" }}>
                              Começando do zero?
                            </p>
                            <p className="text-[11px]" style={{ color: "var(--muted-3)" }}>
                              Preencha tudo automaticamente com um template do seu segmento
                            </p>
                          </div>
                          <button type="button" onClick={() => setSegmentoModal(emp.id)}
                            className="flex-shrink-0 ml-3 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all hover:opacity-80"
                            style={{ background: "rgba(99,102,241,.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,.3)", whiteSpace: "nowrap" }}>
                            Usar template →
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          {SECOES.map((sec) => (
                            <div key={sec}>
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <span className="text-[11px] font-semibold" style={{ color: "var(--muted)" }}>
                                  {LABELS[sec].toUpperCase()}
                                </span>
                                <button type="button" onClick={() => setHelpOpen(sec)}
                                  className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 transition-all hover:opacity-80"
                                  style={{ background: "rgba(99,102,241,.18)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,.3)" }}
                                  title={`Ajuda: ${LABELS[sec]}`}>
                                  ?
                                </button>
                              </div>
                              <textarea rows={3} value={infoCampos[sec] ?? ""}
                                onChange={(e) => setInfoCampos((p) => ({ ...p, [sec]: e.target.value }))}
                                placeholder={`Ex: ${sec === "PRODUTOS" ? "camisetas, calças, vestidos" : sec === "PRECOS" ? "camiseta R$29,90" : sec === "PAGAMENTO" ? "PIX, cartão 12x" : sec === "ENTREGA" ? "frete grátis acima de R$200" : sec === "DIFERENCIAIS" ? "atacado a partir de 10 peças" : "seg-sex 9h-18h"}`}
                                className={`${INPUT} resize-none`} />
                            </div>
                          ))}
                        </div>

                        <div className="pt-4 mb-4" style={{ borderTop: "1px solid var(--border)" }}>
                          <p className="text-[12px] font-semibold mb-3" style={{ color: "var(--muted)" }}>🤖 Identidade e Modo da IA</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted-2)" }}>TIPO DE ATENDIMENTO</label>
                              <select value={tipoAtendimento} onChange={e => setTipoAtendimento(e.target.value)} className={INPUT}>
                                <option value="AGENDAMENTO">Agendamento (salão, clínica, estúdio...)</option>
                                <option value="ORCAMENTO">Orçamento (loja, atacado, materiais...)</option>
                                <option value="AMBOS">Agendamento + Orçamento (petshop, clínica c/ produtos...)</option>
                              </select>
                              <p className="text-[11px] mt-1" style={{ color: "var(--muted-3)" }}>
                                {tipoAtendimento === "AGENDAMENTO" && "IA direciona para agendamento via Calendly."}
                                {tipoAtendimento === "ORCAMENTO" && "IA coleta lista de itens e envia orçamento ao vendedor."}
                                {tipoAtendimento === "AMBOS" && "IA detecta a intenção: agenda serviços e faz orçamento de produtos."}
                              </p>
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <span className="text-[11px] font-semibold" style={{ color: "var(--muted-2)" }}>NOME DA IA (persona)</span>
                                <button type="button" onClick={() => setHelpOpen("nomeIA")}
                                  className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 transition-all hover:opacity-80"
                                  style={{ background: "rgba(99,102,241,.18)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,.3)" }}>
                                  ?
                                </button>
                              </div>
                              <input value={nomeIA} onChange={e => setNomeIA(e.target.value)}
                                placeholder="Ex: Sofia, Bella, Ana..." className={INPUT} />
                              <p className="text-[11px] mt-1" style={{ color: "var(--muted-3)" }}>A IA vai se apresentar com este nome. Deixe em branco para usar "assistente".</p>
                            </div>
                          </div>
                        </div>

                        {(tipoAtendimento === "AGENDAMENTO" || tipoAtendimento === "AMBOS") && (<>
                        <div className="pt-4 mb-4" style={{ borderTop: "1px solid var(--border)" }}>
                          <p className="text-[12px] font-semibold mb-3" style={{ color: "var(--muted)" }}>📅 Calendly (opcional)</p>
                          <div className="mb-3">
                            <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted-2)" }}>LINK DO CALENDLY</label>
                            <input value={calendarFields.calendlyUrl} onChange={e => setCalendarFields(p => ({ ...p, calendlyUrl: e.target.value }))}
                              placeholder="https://calendly.com/studio-thaisy/consulta" className={INPUT} />
                            <p className="text-[11px] mt-1" style={{ color: "var(--muted-3)" }}>A IA envia este link quando o cliente pedir para agendar.</p>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted-2)" }}>URL DO WEBHOOK</label>
                            <div className="flex gap-2">
                              <input readOnly value={`https://n8n-n8n.6jgzku.easypanel.host/webhook/calendly?instancia=${emp.instanciaWhatsapp}`}
                                className={`flex-1 ${INPUT} min-w-0`} style={{ opacity: 0.6 }} />
                              <button type="button" onClick={() => navigator.clipboard.writeText(`https://n8n-n8n.6jgzku.easypanel.host/webhook/calendly?instancia=${emp.instanciaWhatsapp}`)}
                                className="px-3 py-2 rounded-xl text-[12px] font-medium flex-shrink-0"
                                style={{ background: "var(--card-2)", border: "1px solid var(--border-2)", color: "var(--text-2)" }}>
                                Copiar
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 mb-4" style={{ borderTop: "1px solid var(--border)" }}>
                          <p className="text-[12px] font-semibold mb-3" style={{ color: "var(--muted)" }}>📆 Google Calendar (opcional)</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted-2)" }}>ID DO CALENDÁRIO</label>
                              <input value={calendarFields.googleCalendarId} onChange={e => setCalendarFields(p => ({ ...p, googleCalendarId: e.target.value }))}
                                placeholder="abc123@group.calendar.google.com" className={INPUT} />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted-2)" }}>ID DA CREDENCIAL N8N</label>
                              <input value={calendarFields.googleCredentialId} onChange={e => setCalendarFields(p => ({ ...p, googleCredentialId: e.target.value }))}
                                placeholder="ex: 5" className={INPUT} />
                            </div>
                          </div>
                        </div>
                        </>)}

                        <div className="pt-4 mb-4" style={{ borderTop: "1px solid var(--border)" }}>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-[11px] font-semibold" style={{ color: "var(--muted)" }}>ROTEIRO DE QUALIFICAÇÃO DA IA</span>
                            <button type="button" onClick={() => setHelpOpen("qualificacao")}
                              className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 transition-all hover:opacity-80"
                              style={{ background: "rgba(99,102,241,.18)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,.3)" }}>
                              ?
                            </button>
                          </div>
                          <p className="text-[11px] mb-2" style={{ color: "var(--muted-3)" }}>
                            Perguntas que a IA deve fazer para qualificar leads (uma por linha)
                          </p>
                          <textarea rows={5} value={perguntasQualificacao}
                            onChange={(e) => setPerguntasQualificacao(e.target.value)}
                            placeholder={"Ex:\nQual é o seu orçamento?\nVocê já conhece nossos produtos?\nQual é o prazo para a compra?"}
                            className={`${INPUT} resize-none`} />
                        </div>

                        <div className="pt-4 mb-4" style={{ borderTop: "1px solid var(--border)" }}>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-[11px] font-semibold" style={{ color: "var(--muted)" }}>MENSAGEM DE PÓS-VENDA (automática 2 dias após venda)</span>
                            <button type="button" onClick={() => setHelpOpen("posVenda")}
                              className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 transition-all hover:opacity-80"
                              style={{ background: "rgba(99,102,241,.18)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,.3)" }}>
                              ?
                            </button>
                          </div>
                          <p className="text-[11px] mb-2" style={{ color: "var(--muted-3)" }}>
                            Use <code style={{ background: "var(--card-2)", padding: "0 4px", borderRadius: 4 }}>{"{nome}"}</code>,{" "}
                            <code style={{ background: "var(--card-2)", padding: "0 4px", borderRadius: 4 }}>{"{ia}"}</code> e{" "}
                            <code style={{ background: "var(--card-2)", padding: "0 4px", borderRadius: 4 }}>{"{empresa}"}</code>.
                            Deixe vazio para usar a mensagem padrão.
                          </p>
                          <textarea rows={3} value={mensagemPosVenda}
                            onChange={(e) => setMensagemPosVenda(e.target.value)}
                            placeholder={`Ex: Oi {nome}! 😊 {ia} aqui, do Studio. Como ficou o design da sua sobrancelha? Gostou do resultado?`}
                            className={`${INPUT} resize-none`} />
                        </div>

                        <div className="pt-4 mb-4" style={{ borderTop: "1px solid var(--border)" }}>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-[11px] font-semibold" style={{ color: "var(--muted)" }}>MENSAGEM DE ANIVERSÁRIO (automática no dia do aniversário do cliente)</span>
                            <button type="button" onClick={() => setHelpOpen("aniversario")}
                              className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 transition-all hover:opacity-80"
                              style={{ background: "rgba(99,102,241,.18)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,.3)" }}>
                              ?
                            </button>
                          </div>
                          <p className="text-[11px] mb-2" style={{ color: "var(--muted-3)" }}>
                            Mesmas variáveis disponíveis. Deixe vazio para usar a mensagem padrão.
                          </p>
                          <textarea rows={3} value={mensagemAniversario}
                            onChange={(e) => setMensagemAniversario(e.target.value)}
                            placeholder={`Ex: Oi {nome}! 🎂 {ia} aqui, da {empresa}. Feliz aniversário! Que seu dia seja incrível! 🥳`}
                            className={`${INPUT} resize-none`} />
                        </div>

                        {/* ── Mensagem de Indicação ── */}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-[13px] font-semibold" style={{ color: "var(--text-2)" }}>Mensagem de indicação</p>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(99,102,241,.12)", color: "#818cf8" }}>Sugerida pelo FácilCRM</span>
                          </div>
                          <p className="text-[11px] mb-2" style={{ color: "var(--muted-3)" }}>
                            Enviada automaticamente quando um cliente indica um amigo. Edite à vontade! Variáveis: {"{nome}"} {"{ia}"} {"{empresa}"} {"{indicador}"}
                          </p>
                          <textarea rows={4} value={mensagemIndicacao}
                            onChange={(e) => setMensagemIndicacao(e.target.value)}
                            placeholder={`Ex: Oi {nome}! Sou {ia}, da {empresa}. {indicador} me passou seu contato e disse que você pode se interessar nos nossos produtos! Gostaria de saber como posso te ajudar? 😊\n\n1️⃣ Sim, me conta mais!\n2️⃣ Agora não, me chama em 7 dias\n3️⃣ Não, obrigado(a)`}
                            className={`${INPUT} resize-none`} />
                        </div>

                        {/* ── Tags da Empresa ── */}
                        <div className="pt-4 mb-4" style={{ borderTop: "1px solid var(--border)" }}>
                          <p className="text-[11px] font-semibold mb-1" style={{ color: "var(--muted)" }}>TAGS DE CLIENTES</p>
                          <p className="text-[11px] mb-3" style={{ color: "var(--muted-3)" }}>
                            A IA aplica automaticamente durante a conversa. Operadores podem editar manualmente na página Clientes.
                          </p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {tagsCustomizadas.map((tag, idx) => {
                              const cores = ["#22d3ee","#a78bfa","#34d399","#f59e0b","#60a5fa","#10b981","#f87171","#fb923c","#e879f9","#fbbf24"];
                              const bgs = ["rgba(34,211,238,.12)","rgba(167,139,250,.12)","rgba(52,211,153,.12)","rgba(245,158,11,.12)","rgba(96,165,250,.12)","rgba(16,185,129,.12)","rgba(248,113,113,.12)","rgba(251,146,60,.12)","rgba(232,121,249,.12)","rgba(251,191,36,.12)"];
                              const cor = cores[idx % cores.length];
                              const bg = bgs[idx % bgs.length];
                              return (
                                <span key={tag} className="flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full text-[12px] font-semibold"
                                  style={{ background: bg, border: `1px solid ${cor}40`, color: cor }}>
                                  {tag}
                                  <button onClick={() => setTagsCustomizadas(prev => prev.filter(t => t !== tag))}
                                    className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] transition-all hover:opacity-70"
                                    style={{ background: `${cor}30`, color: cor }}>
                                    ×
                                  </button>
                                </span>
                              );
                            })}
                            {tagsCustomizadas.length === 0 && (
                              <p className="text-[12px]" style={{ color: "var(--muted-3)" }}>Nenhuma tag configurada ainda.</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={novaTag}
                              onChange={e => setNovaTag(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === "Enter" && novaTag.trim()) {
                                  const t = novaTag.trim();
                                  if (!tagsCustomizadas.includes(t)) setTagsCustomizadas(prev => [...prev, t]);
                                  setNovaTag("");
                                  e.preventDefault();
                                }
                              }}
                              placeholder="Nova tag... (Enter para adicionar)"
                              className={`${INPUT} flex-1`}
                              maxLength={30}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const t = novaTag.trim();
                                if (t && !tagsCustomizadas.includes(t)) setTagsCustomizadas(prev => [...prev, t]);
                                setNovaTag("");
                              }}
                              disabled={!novaTag.trim()}
                              className="px-4 py-2 rounded-xl text-[13px] font-semibold transition-all disabled:opacity-40"
                              style={{ background: "rgba(99,102,241,.15)", border: "1px solid rgba(99,102,241,.3)", color: "#a5b4fc" }}
                            >
                              + Adicionar
                            </button>
                          </div>
                        </div>

                        {/* ── Guia de Complementares ── */}
                        <div className="pt-4 mb-4" style={{ borderTop: "1px solid var(--border)" }}>
                          <p className="text-[11px] font-semibold mb-1" style={{ color: "var(--muted)" }}>GUIA DE COMPLEMENTARES DA IA</p>
                          <p className="text-[11px] mb-3" style={{ color: "var(--muted-3)" }}>
                            Instrui a IA sobre quais complementares oferecer para cada tipo de produto. Mencione o produto, quando oferecer e o argumento curto. Deixe em branco para usar o padrão genérico.
                          </p>
                          <textarea
                            rows={8}
                            value={complementaresGuia}
                            onChange={(e) => setComplementaresGuia(e.target.value)}
                            placeholder={`Ex:\nTINTAS DE PAREDE: Ofereça selador (parede nova) ou fundo preparador (esfarelamento/caiação), rolo (só consumidor), fita crepe, lixa.\nESMALTE SINTÉTICO: Aguarrás (NUNCA Thinner), rolo de espuma (obrigatório), lixa d'água.\nTEXTURA/CIMENTO QUEIMADO: Desempenadeira INOX canto arredondado (obrigatório), selador se parede nova.\nPINTOR PROFISSIONAL (lista 3+ itens): pule complementares básicos — foque em agilidade.`}
                            className={`${INPUT} resize-none font-mono text-[12px]`}
                          />
                        </div>

                        {/* ── Perfis de cliente ── */}
                        <div className="pt-4 mb-4" style={{ borderTop: "1px solid var(--border)" }}>
                          <p className="text-[11px] font-semibold mb-1" style={{ color: "var(--muted)" }}>PERFIS DE CLIENTE E MENSAGENS PERSONALIZADAS</p>
                          <p className="text-[11px] mb-3" style={{ color: "var(--muted-3)" }}>
                            JSON com perfis (Consumidor, Arquiteto, Pintor...) e mensagens d2→d90, quebra de objeção e reativação por perfil. Deixe vazio para padrão genérico.
                          </p>
                          <textarea
                            rows={10}
                            value={perfisCliente}
                            onChange={(e) => setPerfisCliente(e.target.value)}
                            placeholder={PERFIS_CLIENTE_PLACEHOLDER}
                            className={`${INPUT} resize-none font-mono text-[12px]`}
                          />
                        </div>

                        {/* ── Termômetro do Agente ── */}
                        {(() => {
                          const q = calcQualidadeAgente(
                            infoCampos, nomeIA, tipoAtendimento, perguntasQualificacao,
                            calendarFields.calendlyUrl, mensagemPosVenda, mensagemAniversario, mensagemIndicacao
                          );
                          const ruins = q.itens.filter(i => !i.ok).sort((a, b) =>
                            a.peso === "alta" ? -1 : b.peso === "alta" ? 1 : 0
                          );
                          const bons = q.itens.filter(i => i.ok);
                          return (
                            <div className="pt-4 mb-4" style={{ borderTop: "1px solid var(--border)" }}>
                              <p className="text-[12px] font-semibold mb-3" style={{ color: "var(--muted)" }}>🤖 Qualidade do Agente de IA</p>

                              {/* Typewriter warning banner */}
                              <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl mb-4"
                                style={{ background: "rgba(251,191,36,.07)", border: "1px solid rgba(251,191,36,.18)" }}>
                                <span className="text-[15px] flex-shrink-0 mt-[1px]">⚠️</span>
                                <p className="text-[12.5px] font-semibold leading-snug" style={{ color: "#fbbf24", minHeight: "1.25rem" }}>
                                  <TypewriterPhrases />
                                </p>
                              </div>

                              <div className="rounded-2xl p-4" style={{ background: q.corBg, border: `1px solid ${q.corBorder}` }}>
                                {/* Score row */}
                                <div className="flex items-center gap-4 mb-4">
                                  <div className="flex-shrink-0 text-center w-14">
                                    <div className="text-[2.2rem] font-black leading-none tabular-nums" style={{ color: q.cor }}>
                                      {q.score === 10 ? "10" : q.score.toFixed(1)}
                                    </div>
                                    <div className="text-[10px] font-semibold" style={{ color: "var(--muted-3)" }}>/10</div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-[13px] font-bold" style={{ color: q.cor }}>{q.nivel}</span>
                                      <span className="text-[10px]" style={{ color: "var(--muted-3)" }}>{bons.length}/{q.itens.length} itens OK</span>
                                    </div>
                                    <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.07)" }}>
                                      <div className="h-full rounded-full transition-all duration-700"
                                        style={{ width: `${(q.score / 10) * 100}%`, background: `linear-gradient(90deg,${q.cor}66,${q.cor})` }} />
                                    </div>
                                  </div>
                                </div>
                                {/* Feedback columns */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {ruins.length > 0 && (
                                    <div>
                                      <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: "var(--muted-3)" }}>O que falta</p>
                                      <div className="space-y-1.5">
                                        {ruins.slice(0, 5).map((item, idx) => (
                                          <div key={idx} className="flex items-start gap-1.5">
                                            <span className="flex-shrink-0 mt-[3px] text-[10px]"
                                              style={{ color: item.peso === "alta" ? "#f87171" : item.peso === "media" ? "#fbbf24" : "var(--muted-3)" }}>
                                              {item.peso === "alta" ? "▲" : item.peso === "media" ? "◆" : "◇"}
                                            </span>
                                            <span className="text-[11.5px] leading-snug" style={{ color: "var(--muted)" }}>{item.msg}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {bons.length > 0 && (
                                    <div>
                                      <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: "var(--muted-3)" }}>O que está bem</p>
                                      <div className="space-y-1.5">
                                        {bons.map((item, idx) => (
                                          <div key={idx} className="flex items-start gap-1.5">
                                            <span className="flex-shrink-0 mt-[3px] text-[10px]" style={{ color: "#34d399" }}>✓</span>
                                            <span className="text-[11.5px] leading-snug" style={{ color: "var(--muted)" }}>{item.msg}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                {/* Alert if score too low */}
                                {q.score < 5 && (
                                  <div className="mt-3 px-3 py-2.5 rounded-xl text-[11.5px] font-semibold"
                                    style={{ background: "rgba(248,113,113,.1)", color: "#f87171", border: "1px solid rgba(248,113,113,.2)" }}>
                                    ⚠️ Com esta configuração, seu Agente vai frustrar clientes com respostas genéricas. Preencha os campos marcados com ▲ antes de ativar o atendimento.
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                          <button onClick={() => salvarInfoEmpresa(emp.id)} disabled={salvando}
                            className="btn-primary px-4 py-2.5 text-[13px] disabled:opacity-50 sm:w-auto w-full">
                            {salvando ? "Salvando..." : "Salvar Informações"}
                          </button>
                          <button onClick={() => setEditEmpresa(null)}
                            className="px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all sm:w-auto w-full"
                            style={{ background: "var(--card-2)", border: "1px solid var(--border)", color: "var(--muted)" }}>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {empresas.length === 0 && (
                <div className="py-10 text-center text-[13px] rounded-2xl" style={cardStyle}>Nenhuma empresa cadastrada.</div>
              )}
            </div>
          </div>
        )}

        {/* ── MODAL EXCLUIR EMPRESA ── */}
        {deletandoEmpresa && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.7)", backdropFilter: "blur(4px)" }}>
            <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ background: "var(--card)", border: "1px solid rgba(239,68,68,.3)" }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(239,68,68,.1)" }}>
                  <svg className="w-5 h-5" fill="none" stroke="#f87171" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[15px] font-bold" style={{ color: "#f87171" }}>Excluir empresa permanentemente</p>
                  <p className="text-[12px] mt-1" style={{ color: "var(--muted-2)" }}>Esta ação <strong>não pode ser desfeita</strong>.</p>
                </div>
              </div>

              <div className="rounded-xl p-3 text-[12px] space-y-1" style={{ background: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.15)" }}>
                <p style={{ color: "var(--muted)" }}>Ao excluir <strong style={{ color: "var(--text)" }}>{deletandoEmpresa.nome}</strong>, serão apagados permanentemente:</p>
                <ul className="mt-2 space-y-0.5" style={{ color: "#f87171" }}>
                  <li>• {deletandoEmpresa._count.clientes} cliente(s) e todo o histórico de conversas</li>
                  <li>• {deletandoEmpresa._count.leads} lead(s) e vendas registradas</li>
                  <li>• Todos os vendedores, mídias e agendamentos</li>
                  <li>• Configurações da IA e do Cal.com</li>
                </ul>
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted-2)" }}>
                  CONFIRME DIGITANDO O NOME DA EMPRESA
                </label>
                <input
                  value={confirmNomeEmpresa}
                  onChange={(e) => setConfirmNomeEmpresa(e.target.value)}
                  placeholder={deletandoEmpresa.nome}
                  className={INPUT}
                  autoFocus
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={excluirEmpresa}
                  disabled={confirmNomeEmpresa !== deletandoEmpresa.nome}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all disabled:opacity-30"
                  style={{ background: confirmNomeEmpresa === deletandoEmpresa.nome ? "#dc2626" : "rgba(239,68,68,.1)", color: "white" }}>
                  Excluir tudo permanentemente
                </button>
                <button
                  onClick={() => { setDeletandoEmpresa(null); setConfirmNomeEmpresa(""); }}
                  className="px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all"
                  style={{ background: "var(--card-2)", border: "1px solid var(--border)", color: "var(--muted)" }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── VENDEDORES ── */}
        {aba === "vendedores" && (
          <div className="space-y-4 animate-fade-up">
            <form onSubmit={criarVendedor} className="flex flex-col sm:flex-row flex-wrap gap-3 p-4 rounded-2xl" style={cardStyle}>
              <input required placeholder="Nome" value={novoVendedor.nome}
                onChange={(e) => setNovoVendedor((p) => ({ ...p, nome: e.target.value }))}
                className={`flex-1 ${INPUT}`} />
              <input required placeholder="Telefone (5562999999999)" value={novoVendedor.telefone}
                onChange={(e) => setNovoVendedor((p) => ({ ...p, telefone: e.target.value }))}
                className={`flex-1 ${INPUT}`} />
              {isCentral && (
                <select required value={novoVendedor.empresaId}
                  onChange={(e) => setNovoVendedor((p) => ({ ...p, empresaId: e.target.value }))}
                  className={`flex-1 ${INPUT}`}>
                  <option value="">Selecione a empresa</option>
                  {empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
              )}
              <select value={novoVendedor.cargo}
                onChange={(e) => setNovoVendedor((p) => ({ ...p, cargo: e.target.value }))}
                className={`flex-1 ${INPUT}`}>
                <option value="VENDEDOR">Vendedor</option>
                <option value="GERENTE">Gerente</option>
              </select>
              <button type="submit" className="btn-primary px-4 py-2 text-[13px] sm:w-auto w-full">Adicionar</button>
            </form>

            {/* Lista de vendedores como cards */}
            <div className="space-y-3">
              {vendedores.map((v) => (
                <div key={v.id} className="rounded-2xl overflow-hidden" style={{ ...cardStyle, opacity: v.ativo ? 1 : 0.6 }}>

                  {/* Cabeçalho do card */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[15px] font-bold leading-tight" style={{ color: "var(--text)" }}>{v.nome}</p>
                          <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                            style={v.ativo
                              ? { background: "rgba(52,211,153,.1)", color: "#34d399" }
                              : { background: "var(--card-2)", color: "var(--muted-2)" }}>
                            {v.ativo ? "Ativo" : "Inativo"}
                          </span>
                          {(v.cargo ?? "VENDEDOR") === "GERENTE" && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: "rgba(168,85,247,.1)", color: "#c084fc" }}>
                              Gerente
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] font-mono mt-1" style={{ color: "var(--muted-2)" }}>{v.telefone}</p>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap text-[11px]" style={{ color: "var(--muted-3)" }}>
                          {isCentral && <span>{v.empresa.nome}</span>}
                          <span>Ordem #{v.ordemChamada}</span>
                        </div>
                      </div>
                    </div>

                    {/* Botões de ação em grade 2×2 no mobile */}
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                      <button onClick={() => editVendedor === v.id ? setEditVendedor(null) : abrirEditVendedor(v)}
                        className="text-[12px] px-3 py-2 rounded-xl font-semibold transition-all text-center"
                        style={editVendedor === v.id
                          ? { background: "var(--card-2)", border: "1px solid var(--border-2)", color: "var(--muted)" }
                          : { background: "rgba(99,102,241,.08)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,.15)" }}>
                        {editVendedor === v.id ? "Fechar" : "Editar"}
                      </button>
                      <button onClick={() => toggleAtivo(v)}
                        className="text-[12px] px-3 py-2 rounded-xl font-semibold transition-all text-center"
                        style={v.ativo
                          ? { background: "rgba(251,191,36,.08)", color: "#fbbf24", border: "1px solid rgba(251,191,36,.15)" }
                          : { background: "rgba(52,211,153,.08)", color: "#34d399", border: "1px solid rgba(52,211,153,.15)" }}>
                        {v.ativo ? "Desativar" : "Ativar"}
                      </button>
                      <button onClick={() => { setModalTransferir(v); setTransferirParaId(""); setTransferirResultado(null); }}
                        className="text-[12px] px-3 py-2 rounded-xl font-semibold transition-all text-center"
                        style={{ background: "rgba(251,146,60,.08)", color: "#fb923c", border: "1px solid rgba(251,146,60,.15)" }}>
                        Transferir
                      </button>
                      <button onClick={() => excluirVendedor(v.id, v.nome)}
                        className="text-[12px] px-3 py-2 rounded-xl font-semibold transition-all text-center"
                        style={{ background: "rgba(248,113,113,.08)", color: "#f87171", border: "1px solid rgba(248,113,113,.15)" }}>
                        Excluir
                      </button>
                    </div>
                  </div>

                  {/* Formulário de edição inline */}
                  {editVendedor === v.id && (
                    <div className="px-4 pb-4" style={{ borderTop: "1px solid var(--border)", background: "rgba(99,102,241,.02)" }}>
                      <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>NOME</label>
                          <input value={editVendedorData.nome}
                            onChange={(e) => setEditVendedorData((p) => ({ ...p, nome: e.target.value }))}
                            className={INPUT} />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>TELEFONE</label>
                          <input value={editVendedorData.telefone}
                            onChange={(e) => setEditVendedorData((p) => ({ ...p, telefone: e.target.value }))}
                            className={INPUT} />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>ORDEM</label>
                          <input type="number" min={1} value={editVendedorData.ordemChamada}
                            onChange={(e) => setEditVendedorData((p) => ({ ...p, ordemChamada: Number(e.target.value) }))}
                            className={INPUT} />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>CARGO</label>
                          <select value={editVendedorData.cargo}
                            onChange={(e) => setEditVendedorData((p) => ({ ...p, cargo: e.target.value }))}
                            className={INPUT}>
                            <option value="VENDEDOR">Vendedor</option>
                            <option value="GERENTE">Gerente</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 mt-4">
                        <button onClick={() => salvarVendedor(v.id)} disabled={salvando}
                          className="btn-primary px-4 py-2.5 text-[13px] disabled:opacity-50 sm:w-auto w-full">
                          {salvando ? "Salvando..." : "Salvar"}
                        </button>
                        <button onClick={() => setEditVendedor(null)}
                          className="px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all sm:w-auto w-full"
                          style={{ background: "var(--card-2)", border: "1px solid var(--border)", color: "var(--muted)" }}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {vendedores.length === 0 && (
                <div className="py-10 text-center text-[13px] rounded-2xl" style={cardStyle}>Nenhum vendedor cadastrado.</div>
              )}
            </div>
          </div>
        )}

        {/* ── MÍDIAS ── */}
        {aba === "midias" && (
          <div className="space-y-4 animate-fade-up">
            <div className="px-4 py-3 rounded-xl text-[12.5px]"
              style={{ background: "rgba(99,102,241,.07)", border: "1px solid rgba(99,102,241,.15)", color: "#a5b4fc" }}>
              <strong>Mídias da IA</strong> — arquivos que a IA pode enviar automaticamente durante o atendimento. Cada mídia tem uma <em>etiqueta</em> e uma <em>descrição de uso</em> que instrui a IA quando enviar.
            </div>

            {empresas.length > 1 && (
              <div className="flex items-center gap-3">
                <label className="text-[13px] font-semibold" style={{ color: "var(--muted)" }}>Empresa:</label>
                <select value={midiaEmpresaId} onChange={(e) => setMidiaEmpresaId(e.target.value)} className="input-dark px-3 py-2 text-[13px]">
                  <option value="">Selecione uma empresa</option>
                  {empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
              </div>
            )}

            {midiaEmpresaId && (
              <>
                <form onSubmit={criarMidia} className="p-5 rounded-2xl space-y-4" style={cardStyle}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>Adicionar nova mídia</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>ETIQUETA</label>
                      <input required placeholder="ex: Catálogo Verão 2026" value={novaMidia.etiqueta}
                        onChange={(e) => setNovaMidia((p) => ({ ...p, etiqueta: e.target.value }))} className={INPUT} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>TIPO</label>
                      <select value={novaMidia.tipo} onChange={(e) => setNovaMidia((p) => ({ ...p, tipo: e.target.value }))} className={INPUT}>
                        <option value="imagem">Imagem (JPG, PNG)</option>
                        <option value="documento">Documento (PDF)</option>
                        <option value="video">Vídeo</option>
                        <option value="audio">Áudio</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>ARQUIVO</label>
                    <label className="flex flex-col items-center justify-center w-full py-6 rounded-xl cursor-pointer transition-all"
                      style={{
                        border: novaMidiaArquivo ? "1px solid rgba(52,211,153,.4)" : "1px dashed var(--border)",
                        background: novaMidiaArquivo ? "rgba(52,211,153,.05)" : "var(--card-2)",
                      }}>
                      <input type="file" accept="image/*,application/pdf,video/*,audio/*" className="hidden"
                        onChange={(e) => setNovaMidiaArquivo(e.target.files?.[0] ?? null)} />
                      {novaMidiaArquivo ? (
                        <div className="text-center">
                          <p className="text-[13px] font-semibold" style={{ color: "#34d399" }}>{novaMidiaArquivo.name}</p>
                          <p className="text-[11px] mt-1" style={{ color: "var(--muted-3)" }}>
                            {(novaMidiaArquivo.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"
                            style={{ color: "var(--muted-3)" }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                          </svg>
                          <p className="text-[13px]" style={{ color: "var(--muted)" }}>Clique para selecionar o arquivo</p>
                          <p className="text-[11px] mt-1" style={{ color: "var(--muted-3)" }}>JPG, PNG, PDF, MP4 · até 10 MB</p>
                        </div>
                      )}
                    </label>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>QUANDO A IA DEVE ENVIAR</label>
                    <input required placeholder="ex: quando o cliente pedir o catálogo ou perguntar sobre produtos" value={novaMidia.descricaoUso}
                      onChange={(e) => setNovaMidia((p) => ({ ...p, descricaoUso: e.target.value }))} className={INPUT} />
                  </div>
                  <button type="submit" disabled={salvando || !novaMidiaArquivo} className="btn-primary px-4 py-2.5 text-[13px] disabled:opacity-50 w-full sm:w-auto">
                    {salvando ? "Enviando arquivo..." : "Adicionar Mídia"}
                  </button>
                </form>

                {/* Lista de mídias como cards */}
                {carregandoMidias ? (
                  <div className="space-y-2">
                    {[1,2,3].map(i => <div key={i} className="shimmer h-16 rounded-2xl" />)}
                  </div>
                ) : midias.length === 0 ? (
                  <div className="py-10 text-center text-[13px] rounded-2xl" style={cardStyle}>
                    Nenhuma mídia cadastrada para esta empresa.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {midias.map((m) => (
                      <div key={m.id} className="p-4 rounded-2xl" style={{ ...cardStyle, opacity: m.ativo ? 1 : 0.55 }}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <p className="text-[14px] font-bold" style={{ color: "var(--text)" }}>{m.etiqueta}</p>
                              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium capitalize"
                                style={{ background: "rgba(99,102,241,.1)", color: "#a5b4fc" }}>
                                {m.tipo}
                              </span>
                              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                                style={m.ativo
                                  ? { background: "rgba(52,211,153,.1)", color: "#34d399" }
                                  : { background: "var(--card-2)", color: "var(--muted-2)" }}>
                                {m.ativo ? "Ativa" : "Inativa"}
                              </span>
                            </div>
                            {m.url ? (
                              <a href={m.url} target="_blank" rel="noopener noreferrer"
                                className="text-[11px] truncate block hover:underline mb-1"
                                style={{ color: "#60a5fa" }}>{m.url}</a>
                            ) : (
                              <span className="text-[11px] font-mono" style={{ color: "#a5b4fc" }}>
                                {m.mimeType || "arquivo"}
                              </span>
                            )}
                            <p className="text-[12px] mt-1" style={{ color: "var(--muted-2)" }}>{m.descricaoUso}</p>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                            <button onClick={() => toggleMidia(m)}
                              className="text-[12px] px-3 py-1.5 rounded-xl font-semibold text-center"
                              style={m.ativo
                                ? { background: "rgba(251,191,36,.08)", color: "#fbbf24", border: "1px solid rgba(251,191,36,.15)" }
                                : { background: "rgba(52,211,153,.08)", color: "#34d399", border: "1px solid rgba(52,211,153,.15)" }}>
                              {m.ativo ? "Desativar" : "Ativar"}
                            </button>
                            <button onClick={() => excluirMidia(m.id)}
                              className="text-[12px] px-3 py-1.5 rounded-xl font-semibold text-center"
                              style={{ background: "rgba(248,113,113,.08)", color: "#f87171", border: "1px solid rgba(248,113,113,.15)" }}>
                              Excluir
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── WHATSAPP (só EMPRESA) ── */}
        {aba === "whatsapp" && !isCentral && empresas[0] && (
          <AbaWhatsApp
            instancia={empresas[0].instanciaWhatsapp}
            vendedoresOk={vendedores.filter(v => v.ativo && v.empresaId === empresas[0].id).length > 0}
            informacoesOk={!!empresas[0].informacoes?.trim()}
            onIrVendedores={() => setAba("vendedores")}
            onIrEmpresa={() => setAba("empresas")}
          />
        )}

      </div>
    </div>

    {/* Segmento template modal */}
    {segmentoModal && (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,.85)", backdropFilter: "blur(10px)" }}
        onClick={() => setSegmentoModal(null)}>
        <div className="w-full max-w-lg rounded-2xl overflow-hidden animate-fade-up"
          style={{ background: "var(--modal)", border: "1px solid var(--border-2)", boxShadow: "0 32px 80px rgba(0,0,0,.6)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
          onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className="px-5 py-4 flex items-start justify-between gap-3 flex-shrink-0"
            style={{ borderBottom: "1px solid var(--border)" }}>
            <div>
              <h3 className="font-bold text-[16px]" style={{ color: "var(--text)" }}>
                Escolha o segmento da empresa
              </h3>
              <p className="text-[12px] mt-0.5" style={{ color: "var(--muted-3)" }}>
                Preenche todos os campos com conteúdo pronto para editar
              </p>
              {temConteudo() && (
                <div className="mt-2 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold inline-flex items-center gap-1.5"
                  style={{ background: "rgba(251,191,36,.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,.2)" }}>
                  ⚠️ Os campos já preenchidos serão substituídos
                </div>
              )}
            </div>
            <button onClick={() => setSegmentoModal(null)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px] flex-shrink-0 transition-all hover:opacity-70"
              style={{ background: "var(--card-2)", color: "var(--muted-2)", border: "1px solid var(--border)" }}>
              ✕
            </button>
          </div>

          {/* Segment grid */}
          <div className="p-5 overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              {SEGMENTOS.map((seg) => (
                <button key={seg.id} type="button"
                  onClick={() => aplicarTemplate(seg)}
                  className="p-4 rounded-2xl text-left transition-all group"
                  style={{ background: "var(--card)", border: "1px solid var(--border)", cursor: "pointer" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(99,102,241,.4)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,.06)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.background = "var(--card)"; }}>
                  <div className="text-2xl mb-2">{seg.emoji}</div>
                  <p className="text-[13px] font-bold mb-0.5" style={{ color: "var(--text)" }}>{seg.nome}</p>
                  <p className="text-[11px] leading-snug" style={{ color: "var(--muted-3)" }}>{seg.desc}</p>
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: seg.tipoAtendimento === "AGENDAMENTO" ? "rgba(99,102,241,.12)" : seg.tipoAtendimento === "ORCAMENTO" ? "rgba(34,211,238,.1)" : "rgba(52,211,153,.1)", color: seg.tipoAtendimento === "AGENDAMENTO" ? "#a5b4fc" : seg.tipoAtendimento === "ORCAMENTO" ? "#22d3ee" : "#34d399" }}>
                      {seg.tipoAtendimento === "AGENDAMENTO" ? "Agendamento" : seg.tipoAtendimento === "ORCAMENTO" ? "Orçamento" : "Ambos"}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--muted-3)" }}>IA: {seg.nomeIA}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Help modal — "?" buttons */}
    {helpData && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,.8)", backdropFilter: "blur(8px)" }}
        onClick={() => setHelpOpen(null)}>
        <div className="w-full max-w-md rounded-2xl overflow-hidden animate-fade-up"
          style={{ background: "var(--modal)", border: "1px solid var(--border-2)", boxShadow: "0 32px 80px rgba(0,0,0,.55)" }}
          onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
            <h3 className="font-bold text-[15px]" style={{ color: "var(--text)" }}>{helpData.title}</h3>
            <button onClick={() => setHelpOpen(null)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px] transition-all hover:opacity-70"
              style={{ background: "var(--card-2)", color: "var(--muted-2)", border: "1px solid var(--border)" }}>
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="px-5 py-4 space-y-4">
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--muted-2)" }}>{helpData.desc}</p>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-2.5" style={{ color: "var(--muted-3)" }}>
                Exemplos práticos
              </p>
              <div className="space-y-2">
                {helpData.examples.map((ex, i) => (
                  <div key={i} className="px-3 py-2.5 rounded-xl text-[12.5px] leading-snug"
                    style={{ background: "rgba(99,102,241,.06)", border: "1px solid rgba(99,102,241,.13)", color: "var(--muted)" }}>
                    &ldquo;{ex}&rdquo;
                  </div>
                ))}
              </div>
            </div>

            <div className="px-3.5 py-3 rounded-xl text-[12px] leading-snug"
              style={{ background: "rgba(251,191,36,.07)", border: "1px solid rgba(251,191,36,.15)", color: "#fbbf24" }}>
              💡 {helpData.dica}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3.5 text-center" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-[12px]" style={{ color: "var(--muted-3)" }}>
              Ainda com dúvida?{" "}
              <a href="mailto:suporte@ocrmfacil.com.br" className="font-semibold transition-colors hover:opacity-80"
                style={{ color: "#a5b4fc" }}>
                Falar com suporte →
              </a>
            </p>
          </div>
        </div>
      </div>
    )}

    {/* Modal Criar Login */}
    {modalLogin && (
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "var(--overlay)", backdropFilter: "blur(8px)" }}>
        <div className="w-full max-w-sm rounded-2xl overflow-hidden animate-fade-up"
          style={{ background: "var(--bg)", border: "1px solid var(--border-2)", boxShadow: "0 32px 80px rgba(0,0,0,.4)" }}>
          <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
            <h3 className="text-[16px] font-bold" style={{ color: "var(--text)" }}>Criar Acesso</h3>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--muted-2)" }}>{modalLogin.nome}</p>
          </div>
          <div className="px-6 py-5 space-y-3">
            <div>
              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>NOME DO RESPONSÁVEL</label>
              <input type="text" value={loginForm.nome} onChange={e => setLoginForm(f => ({ ...f, nome: e.target.value }))}
                placeholder="Nome completo" className={`w-full ${INPUT} `} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>E-MAIL DE ACESSO</label>
              <input type="email" value={loginForm.email} onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@empresa.com" className={`w-full ${INPUT}`} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>SENHA</label>
              <input type="text" value={loginForm.senha} onChange={e => setLoginForm(f => ({ ...f, senha: e.target.value }))}
                placeholder="Senha de acesso" className={`w-full ${INPUT}`} />
            </div>
            {loginMsg && (
              <p className="text-[12px] px-3 py-2 rounded-xl" style={{
                background: loginMsg.startsWith("✅") ? "rgba(52,211,153,.1)" : "rgba(248,113,113,.1)",
                color: loginMsg.startsWith("✅") ? "#34d399" : "#f87171",
                border: `1px solid ${loginMsg.startsWith("✅") ? "rgba(52,211,153,.2)" : "rgba(248,113,113,.2)"}`,
              }}>{loginMsg}</p>
            )}
          </div>
          <div className="px-6 py-4 flex gap-3 justify-end" style={{ borderTop: "1px solid var(--border)" }}>
            <button onClick={() => setModalLogin(null)} className="px-4 py-2 rounded-xl text-[13px] font-medium"
              style={{ background: "var(--input)", border: "1px solid var(--border-2)", color: "var(--text-2)" }}>
              Fechar
            </button>
            <button disabled={criandoLogin || !loginForm.nome || !loginForm.email || !loginForm.senha}
              onClick={async () => {
                setCriandoLogin(true);
                setLoginMsg("");
                const res = await fetch("/api/usuarios", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ nome: loginForm.nome, email: loginForm.email, senha: loginForm.senha, empresaId: modalLogin.id }),
                });
                const data = await res.json();
                if (res.ok) {
                  setLoginMsg("✅ Login criado! E-mail: " + loginForm.email);
                  setLoginForm({ nome: "", email: "", senha: "" });
                } else {
                  setLoginMsg("Erro: " + (data.error ?? "Tente novamente"));
                }
                setCriandoLogin(false);
              }}
              className="btn-primary px-5 py-2 text-[13px] disabled:opacity-40">
              {criandoLogin ? "Criando..." : "Criar Login"}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Modal Transferir Carteira */}

    {modalTransferir && (
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "var(--overlay)", backdropFilter: "blur(8px)" }}>
        <div className="w-full max-w-md rounded-2xl overflow-hidden animate-fade-up"
          style={{ background: "var(--bg)", border: "1px solid var(--border-2)", boxShadow: "0 32px 80px rgba(0,0,0,.4)" }}>
          <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
            <h3 className="text-[16px] font-bold" style={{ color: "var(--text)" }}>Transferir Carteira</h3>
            <p className="text-[12px] mt-1" style={{ color: "var(--muted-2)" }}>
              Todos os leads de <strong>{modalTransferir.nome}</strong> serão reatribuídos ao vendedor selecionado.
            </p>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>TRANSFERIR PARA</label>
              <select
                value={transferirParaId}
                onChange={(e) => setTransferirParaId(e.target.value)}
                className="w-full input-dark px-3 py-2.5 text-[13px]"
              >
                <option value="">Selecione o vendedor destino</option>
                {vendedores
                  .filter((v) => v.id !== modalTransferir.id && v.empresaId === modalTransferir.empresaId)
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nome} {!v.ativo ? "(inativo)" : ""}
                    </option>
                  ))}
              </select>
            </div>
            {transferirResultado && (
              <div className="rounded-xl px-4 py-3 text-[12px]"
                style={{
                  background: transferirResultado.ok ? "rgba(52,211,153,.1)" : "rgba(248,113,113,.1)",
                  border: `1px solid ${transferirResultado.ok ? "rgba(52,211,153,.2)" : "rgba(248,113,113,.2)"}`,
                  color: transferirResultado.ok ? "#34d399" : "#f87171",
                }}>
                {transferirResultado.msg}
              </div>
            )}
          </div>
          <div className="px-6 py-4 flex gap-3 justify-end" style={{ borderTop: "1px solid var(--border)" }}>
            <button
              onClick={() => { setModalTransferir(null); setTransferirResultado(null); }}
              className="px-4 py-2 rounded-xl text-[13px] font-medium"
              style={{ background: "var(--input)", border: "1px solid var(--border-2)", color: "var(--text-2)" }}>
              {transferirResultado?.ok ? "Fechar" : "Cancelar"}
            </button>
            {!transferirResultado?.ok && (
              <button
                onClick={transferirCarteira}
                disabled={!transferirParaId || transferindo}
                className="px-5 py-2 rounded-xl text-[13px] font-semibold disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, rgba(251,146,60,.8), rgba(234,88,12,.8))", color: "white" }}>
                {transferindo ? "Transferindo..." : "Confirmar Transferência"}
              </button>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
