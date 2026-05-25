"use client";

import { useEffect, useState } from "react";

/* ── Anti-spam typewriter ────────────────────────────────────────────── */
const ANTISPAM_PHRASES = [
  "Disparar para centenas de contatos de uma vez é a forma mais rápida de ter seu número banido pelo WhatsApp.",
  "Um número banido perde TUDO — histórico de conversas, leads, relacionamento. Não existe recuperação.",
  "O FácilCRM usa API Oficial. Mas o volume e o conteúdo da campanha são sua responsabilidade.",
  "20 leads bem qualificados convertem muito mais do que 500 disparos para contatos frios.",
];

function AntiSpamWarning() {
  const [idx,   setIdx]   = useState(0);
  const [text,  setText]  = useState("");
  const [phase, setPhase] = useState<"typing" | "paused" | "deleting">("typing");
  const [cur,   setCur]   = useState(true);

  useEffect(() => {
    const t = setInterval(() => setCur(c => !c), 530);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const full = ANTISPAM_PHRASES[idx];
    if (phase === "typing") {
      if (text.length < full.length) {
        const t = setTimeout(() => setText(full.slice(0, text.length + 1)), 38);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("paused"), 3200);
      return () => clearTimeout(t);
    }
    if (phase === "paused") {
      const t = setTimeout(() => setPhase("deleting"), 10);
      return () => clearTimeout(t);
    }
    if (text.length > 0) {
      const t = setTimeout(() => setText(full.slice(0, text.length - 1)), 18);
      return () => clearTimeout(t);
    }
    setIdx(i => (i + 1) % ANTISPAM_PHRASES.length);
    setPhase("typing");
  }, [text, phase, idx]);

  return (
    <div className="flex items-start gap-2.5 px-4 py-3.5 rounded-xl mb-6"
      style={{ background: "rgba(248,113,113,.07)", border: "1px solid rgba(248,113,113,.2)" }}>
      <span className="text-[16px] flex-shrink-0 mt-[1px]">🚨</span>
      <p className="text-[12.5px] font-semibold leading-snug" style={{ color: "#f87171", minHeight: "1.4rem" }}>
        {text}
        <span style={{ opacity: cur ? 1 : 0, fontWeight: 300 }}>|</span>
      </p>
    </div>
  );
}

/* ── Compliance validation ───────────────────────────────────────────── */
interface ComplianceIssue {
  nivel: "BLOQUEADO" | "AVISO";
  codigo: string;
  titulo: string;
  descricao: string;
  correcao: string;
}

function validarCampanha(totalLeads: number, mensagem: string): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];

  // Volume crítico — hard block
  if (totalLeads > 150) {
    issues.push({
      nivel: "BLOQUEADO",
      codigo: "VOLUME_CRITICO",
      titulo: `Volume crítico: ${totalLeads} leads`,
      descricao: "Acima de 150 mensagens em uma campanha há risco real de bloqueio pelo WhatsApp, mesmo com intervalos. O número pode ser banido permanentemente.",
      correcao: "Reduza o público para no máximo 150 leads. Divida em campanhas separadas com intervalo de 24h entre cada uma.",
    });
  } else if (totalLeads > 50) {
    // Volume alto — aviso
    issues.push({
      nivel: "AVISO",
      codigo: "VOLUME_ALTO",
      titulo: `Volume alto: ${totalLeads} leads`,
      descricao: "Acima de 50 mensagens numa campanha o risco de sinalização começa a crescer, especialmente se vários contatos não interagirem.",
      correcao: "Prefira campanhas menores e mais segmentadas. Se quiser continuar, marque que entende os riscos.",
    });
  }

  // Link externo — aviso
  if (/https?:\/\/|bit\.ly|wa\.me\//i.test(mensagem)) {
    issues.push({
      nivel: "AVISO",
      codigo: "LINK_EXTERNO",
      titulo: "Mensagem contém link externo",
      descricao: "Links em disparos em massa são um dos principais gatilhos de bloqueio do WhatsApp. O algoritmo identifica e penaliza.",
      correcao: "Remova o link. Peça ao cliente para responder 'SIM' ou 'quero' e então envie o link individualmente na conversa.",
    });
  }

  // Mensagem muito curta — aviso
  if (mensagem.trim().length > 0 && mensagem.trim().length < 20) {
    issues.push({
      nivel: "AVISO",
      codigo: "MENSAGEM_CURTA",
      titulo: "Mensagem muito curta",
      descricao: "Mensagens com menos de 20 caracteres parecem spam para o algoritmo. Conversas naturais são mais longas.",
      correcao: "Escreva pelo menos 2 frases. Seja natural, como se estivesse falando com um conhecido.",
    });
  }

  // Sem personalização para muitos leads — aviso
  if (totalLeads > 10 && mensagem.trim().length > 0 && !mensagem.includes("{nome}")) {
    issues.push({
      nivel: "AVISO",
      codigo: "SEM_PERSONALIZACAO",
      titulo: "Mensagem sem personalização",
      descricao: "Mensagens idênticas para muitos contatos aumentam o risco de denúncias de spam. Use {nome} para personalizar.",
      correcao: "Adicione {nome} na mensagem. Ex: 'Oi {nome}! Tenho uma novidade para você...'",
    });
  }

  // Mensagem com palavras de alta rejeição — aviso
  const palavrasRisco = /\b(grátis|gratuito|promoção|oferta imperdível|clique aqui|acesse agora|ganhe|prêmio|sorteio)\b/i;
  if (palavrasRisco.test(mensagem)) {
    issues.push({
      nivel: "AVISO",
      codigo: "PALAVRAS_RISCO",
      titulo: "Palavras com alto risco de rejeição",
      descricao: "Termos como 'grátis', 'promoção' e 'clique aqui' são associados a spam pelo WhatsApp e podem aumentar denúncias.",
      correcao: "Substitua por linguagem conversacional. Ex: 'tenho algo especial' no lugar de 'promoção imperdível'.",
    });
  }

  return issues;
}

/* ── Types ───────────────────────────────────────────────────────────── */
interface Campanha {
  id: string; empresaId: string; nomeEmpresa: string;
  mensagem: string; tipo: string; status: string;
  criadoEm: string; total: number; enviados: number;
  pendentes: number; erros: number;
}
interface Regra { tipo: string; diasInativo: number; ativo: boolean; mensagem: string; }
interface LeadSimples { id: string; status: string; cliente: { nome: string | null; optOutCampanhas?: boolean }; }

const TIPO_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  MANUAL:             { label: "Manual",       color: "#a5b4fc", bg: "rgba(99,102,241,.1)" },
  AUTO_SEM_RESPOSTA:  { label: "Sem Resposta", color: "#fbbf24", bg: "rgba(251,191,36,.1)" },
  AUTO_AQUECIMENTO:   { label: "Aquecimento",  color: "#fb923c", bg: "rgba(251,146,60,.1)" },
  AUTO_POS_VENDA:     { label: "Pós-Venda",    color: "#c084fc", bg: "rgba(192,132,252,.1)" },
  AUTO_FOLLOW_UP:     { label: "Follow-up",    color: "#22d3ee", bg: "rgba(34,211,238,.1)" },
};

const REGRA_LABELS: Record<string, string> = {
  AUTO_SEM_RESPOSTA: "Leads Sem Resposta",
  AUTO_AQUECIMENTO:  "Leads em Aquecimento",
  AUTO_POS_VENDA:    "Pós-Venda",
  AUTO_FOLLOW_UP:    "Follow-up",
};

const STATUS_ALVO = [
  { value: "LEAD",                label: "Lead Novo",           color: "#94a3b8" },
  { value: "AQUECIMENTO",         label: "Aquecimento",         color: "#fb923c" },
  { value: "PRONTO_PARA_COMPRAR", label: "Pronto para Comprar", color: "#fbbf24" },
  { value: "AGENDADO",            label: "Agendado",            color: "#22d3ee" },
  { value: "NEGOCIACAO",          label: "Negociação",          color: "#a78bfa" },
  { value: "VENDA_REALIZADA",     label: "Venda Realizada",     color: "#34d399" },
  { value: "POS_VENDA",           label: "Pós-Venda",           color: "#c084fc" },
  { value: "FOLLOW_UP",           label: "Follow-up",           color: "#60a5fa" },
];

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}

/* ── Page ────────────────────────────────────────────────────────────── */
export default function CampanhasPage() {
  const [aba, setAba] = useState<"historico" | "regras">("historico");
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [regras, setRegras] = useState<Regra[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvandoRegras, setSalvandoRegras] = useState(false);
  const [regrasEmpresaId, setRegrasEmpresaId] = useState("");
  const [msg, setMsg] = useState("");
  const [isCentral, setIsCentral] = useState(false);
  const [meEmpresaId, setMeEmpresaId] = useState("");
  const [empresas, setEmpresas] = useState<{ id: string; nome: string }[]>([]);
  const [filtroEmpresa, setFiltroEmpresa] = useState("");

  // Nova campanha
  const [novaOpen, setNovaOpen] = useState(false);
  const [novaEmpresaId, setNovaEmpresaId] = useState("");
  const [statusSelecionados, setStatusSelecionados] = useState<string[]>(["LEAD", "AQUECIMENTO"]);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [leadsDisponiveis, setLeadsDisponiveis] = useState<LeadSimples[]>([]);
  const [carregandoLeads, setCarregandoLeads] = useState(false);
  const [criandoCampanha, setCriandoCampanha] = useState(false);
  const [cienteRiscos, setCienteRiscos] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then((me) => {
      if (me?.perfil === "CENTRAL") {
        setIsCentral(true);
        fetch("/api/empresas").then(r => r.json()).then((list) => {
          setEmpresas(list);
          if (list.length > 0) {
            setNovaEmpresaId(list[0].id);
            setRegrasEmpresaId(list[0].id);
          }
        }).catch(() => {});
      } else if (me?.empresaId) {
        setMeEmpresaId(me.empresaId);
        setNovaEmpresaId(me.empresaId);
        setRegrasEmpresaId(me.empresaId);
        // EMPRESA carrega suas próprias regras
        fetch(`/api/campanhas/regras?empresaId=${me.empresaId}`)
          .then(r => r.json()).then((d) => { if (Array.isArray(d)) setRegras(d); });
      }
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtroEmpresa) params.set("empresaId", filtroEmpresa);
    fetch(`/api/campanhas?${params}`)
      .then(r => r.json())
      .then(d => { setCampanhas(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filtroEmpresa]);

  useEffect(() => {
    if (!novaOpen || !novaEmpresaId) { setLeadsDisponiveis([]); return; }
    setCarregandoLeads(true);
    const params = new URLSearchParams();
    if (isCentral) params.set("empresaId", novaEmpresaId);
    fetch(`/api/leads?${params}`)
      .then(r => r.json())
      .then((d: LeadSimples[]) => setLeadsDisponiveis(Array.isArray(d) ? d : []))
      .catch(() => setLeadsDisponiveis([]))
      .finally(() => setCarregandoLeads(false));
  }, [novaOpen, novaEmpresaId, isCentral]);

  // Reset ciente when leads or message change
  useEffect(() => { setCienteRiscos(false); }, [statusSelecionados, novaMensagem, novaEmpresaId]);

  // Recarregar regras quando empresa muda (CENTRAL)
  useEffect(() => {
    if (!isCentral || !regrasEmpresaId) return;
    fetch(`/api/campanhas/regras?empresaId=${regrasEmpresaId}`)
      .then(r => r.json()).then((d) => { if (Array.isArray(d)) setRegras(d); });
  }, [isCentral, regrasEmpresaId]);

  const leadsAtivos  = leadsDisponiveis.filter(l => !l.cliente.optOutCampanhas);
  const leadsAlvo    = leadsAtivos.filter(l => statusSelecionados.includes(l.status));
  const optOutCount  = leadsDisponiveis.filter(l => l.cliente.optOutCampanhas && statusSelecionados.includes(l.status)).length;
  const contaPorStatus = (s: string) => leadsAtivos.filter(l => l.status === s).length;
  const toggleStatus = (s: string) =>
    setStatusSelecionados(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const issues = validarCampanha(leadsAlvo.length, novaMensagem);
  const bloqueios = issues.filter(i => i.nivel === "BLOQUEADO");
  const avisos    = issues.filter(i => i.nivel === "AVISO");
  const temBloqueio = bloqueios.length > 0;
  const temAviso    = avisos.length > 0 && !temBloqueio;
  const podeLancar  = !temBloqueio && (!temAviso || cienteRiscos) && leadsAlvo.length > 0 && novaMensagem.trim().length >= 5;

  const showMsg = (texto: string) => { setMsg(texto); setTimeout(() => setMsg(""), 4000); };

  const salvarRegras = async () => {
    const empId = regrasEmpresaId || meEmpresaId;
    if (!empId) return;
    setSalvandoRegras(true);
    await fetch(`/api/campanhas/regras?empresaId=${empId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(regras) });
    setSalvandoRegras(false);
    showMsg("Regras salvas!");
  };

  const criarCampanha = async () => {
    if (!podeLancar) return;
    setCriandoCampanha(true);
    const res = await fetch("/api/campanhas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        empresaId: novaEmpresaId || meEmpresaId,
        mensagem: novaMensagem.trim(),
        leadIds: leadsAlvo.map(l => l.id),
      }),
    });
    const data = await res.json();
    setCriandoCampanha(false);
    if (data.ok) {
      setNovaOpen(false);
      setNovaMensagem("");
      setStatusSelecionados(["LEAD", "AQUECIMENTO"]);
      setCienteRiscos(false);
      showMsg(`Campanha criada — ${data.total} mensagens na fila`);
      const params = new URLSearchParams();
      if (filtroEmpresa) params.set("empresaId", filtroEmpresa);
      fetch(`/api/campanhas?${params}`).then(r => r.json()).then(d => setCampanhas(Array.isArray(d) ? d : []));
    } else {
      showMsg(data.error ?? "Erro ao criar campanha");
    }
  };

  const totalEnviados  = campanhas.reduce((s, c) => s + c.enviados,  0);
  const totalPendentes = campanhas.reduce((s, c) => s + c.pendentes, 0);

  const tabStyle = (id: string) => aba === id
    ? { background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white", border: "1px solid transparent" }
    : { background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)" };

  const cardStyle = { background: "linear-gradient(145deg, var(--card), var(--card))", border: "1px solid var(--border)", borderRadius: "16px" };

  return (
    <div className="h-full overflow-y-auto" style={{ background: "var(--bg)" }}>
      <div className="p-4 md:p-8 max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6 animate-fade-up">
          <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full mb-3"
            style={{ background: "rgba(99,102,241,.1)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,.18)" }}>
            Automação
          </span>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-[28px] font-bold tracking-tight" style={{ color: "var(--text)" }}>Campanhas</h1>
              <p className="text-[13px] mt-1" style={{ color: "var(--muted-2)" }}>
                Follow-ups automáticos e disparos manuais com espaçamento anti-spam
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {msg && (
                <span className="text-[12px] px-3 py-1.5 rounded-full font-semibold"
                  style={{ background: "rgba(52,211,153,.1)", color: "#34d399", border: "1px solid rgba(52,211,153,.2)" }}>
                  {msg}
                </span>
              )}
              <button onClick={() => setNovaOpen(o => !o)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
                style={novaOpen
                  ? { background: "var(--card-2)", border: "1px solid var(--border-2)", color: "var(--muted)" }
                  : { background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "white", boxShadow: "0 4px 14px rgba(99,102,241,.3)" }}>
                {novaOpen ? "✕ Fechar" : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Nova Campanha
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── BANNER ANTI-SPAM (sempre visível) ── */}
        <AntiSpamWarning />

        {/* ── POLÍTICA ANTI-SPAM ── */}
        <div className="mb-6 p-4 rounded-2xl"
          style={{ background: "rgba(248,113,113,.04)", border: "1px solid rgba(248,113,113,.12)" }}>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: "#f87171" }}>
            Política Anti-Spam do FácilCRM
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              { icon: "⏱", texto: "Intervalo de 30 a 90 segundos entre cada mensagem — configurado no N8N para proteger seu número." },
              { icon: "🔢", texto: "Máximo recomendado: 50 leads por campanha. Acima de 150 a campanha é bloqueada automaticamente." },
              { icon: "📋", texto: "API Oficial do WhatsApp (Evolution API v2.3.7) — nenhuma engenharia reversa, sem risco de ban técnico." },
              { icon: "⚖️", texto: "Você é responsável pelo conteúdo. Mensagens enganosas, promessas falsas ou assédio violam os Termos do WhatsApp." },
            ].map((item, i) => (
              <div key={i} className="flex gap-2.5 px-3 py-2 rounded-xl"
                style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(248,113,113,.1)" }}>
                <span className="text-[14px] flex-shrink-0">{item.icon}</span>
                <p className="text-[11.5px] leading-snug" style={{ color: "var(--muted-2)" }}>{item.texto}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── FORMULÁRIO NOVA CAMPANHA ── */}
        {novaOpen && (
          <div className="mb-6 rounded-2xl overflow-hidden animate-fade-up"
            style={{ background: "rgba(99,102,241,.04)", border: "1px solid rgba(99,102,241,.2)" }}>

            <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(99,102,241,.12)" }}>
              <p className="text-[15px] font-bold" style={{ color: "var(--text)" }}>Nova campanha manual</p>
              <p className="text-[12px] mt-0.5" style={{ color: "var(--muted-3)" }}>
                Selecione o público-alvo, escreva a mensagem e dispare com segurança
              </p>
            </div>

            <div className="p-5 space-y-5">

              {/* Empresa (CENTRAL) */}
              {isCentral && empresas.length > 1 && (
                <div>
                  <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>EMPRESA</label>
                  <select value={novaEmpresaId} onChange={e => setNovaEmpresaId(e.target.value)}
                    className="input-dark px-3 py-2.5 text-[13px] w-full sm:w-auto min-w-[220px]">
                    {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                  </select>
                </div>
              )}

              {/* Público-alvo */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-semibold" style={{ color: "var(--muted)" }}>PÚBLICO-ALVO</label>
                  {carregandoLeads && <span className="text-[11px]" style={{ color: "var(--muted-3)" }}>Carregando leads...</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {STATUS_ALVO.map(s => {
                    const count = contaPorStatus(s.value);
                    const sel = statusSelecionados.includes(s.value);
                    return (
                      <button key={s.value} type="button" onClick={() => toggleStatus(s.value)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
                        style={sel
                          ? { background: `${s.color}22`, border: `1px solid ${s.color}66`, color: s.color }
                          : { background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted-3)" }}>
                        {s.label}
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ background: sel ? `${s.color}33` : "var(--card-2)", color: sel ? s.color : "var(--muted-3)" }}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Contagem */}
                {!carregandoLeads && (
                  <div className="mt-3 space-y-1.5">
                    <div className="px-3.5 py-2.5 rounded-xl flex items-center gap-2"
                      style={leadsAlvo.length > 0
                        ? leadsAlvo.length > 50
                          ? { background: "rgba(251,191,36,.07)", border: "1px solid rgba(251,191,36,.2)" }
                          : { background: "rgba(52,211,153,.07)", border: "1px solid rgba(52,211,153,.2)" }
                        : { background: "var(--card-2)", border: "1px solid var(--border)" }}>
                      <span className="text-[20px] font-black tabular-nums"
                        style={{ color: leadsAlvo.length === 0 ? "var(--muted-3)" : leadsAlvo.length > 50 ? "#fbbf24" : "#34d399" }}>
                        {leadsAlvo.length}
                      </span>
                      <span className="text-[12px]" style={{ color: leadsAlvo.length > 0 ? "var(--muted)" : "var(--muted-3)" }}>
                        {leadsAlvo.length === 0 && statusSelecionados.length === 0 && "Selecione pelo menos um status"}
                        {leadsAlvo.length === 0 && statusSelecionados.length > 0 && "Nenhum lead nos status selecionados"}
                        {leadsAlvo.length > 0 && leadsAlvo.length <= 50 && `lead${leadsAlvo.length !== 1 ? "s" : ""} serão atingidos ✓`}
                        {leadsAlvo.length > 50 && leadsAlvo.length <= 150 && `leads — volume alto, prossiga com atenção`}
                        {leadsAlvo.length > 150 && `leads — volume BLOQUEADO (máx. 150)`}
                      </span>
                    </div>
                    {optOutCount > 0 && (
                      <div className="px-3 py-2 rounded-xl flex items-center gap-2"
                        style={{ background: "rgba(248,113,113,.06)", border: "1px solid rgba(248,113,113,.15)" }}>
                        <span className="text-[12px]">🚫</span>
                        <span className="text-[11.5px]" style={{ color: "#fca5a5" }}>
                          <strong>{optOutCount}</strong> cliente{optOutCount !== 1 ? "s" : ""} excluído{optOutCount !== 1 ? "s" : ""} automaticamente — opt-out LGPD (solicitaram não receber mensagens)
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Mensagem */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold" style={{ color: "var(--muted)" }}>MENSAGEM</label>
                  <span className="text-[11px]" style={{ color: "var(--muted-3)" }}>
                    Use{" "}
                    <code style={{ background: "var(--card-2)", padding: "0 4px", borderRadius: 4, color: "#a5b4fc" }}>{"{nome}"}</code>
                    {" "}para personalizar
                  </span>
                </div>
                <textarea rows={4} value={novaMensagem}
                  onChange={e => setNovaMensagem(e.target.value)}
                  placeholder={`Ex: Oi {nome}! Tenho uma novidade especial para você essa semana. Posso te contar mais?`}
                  className="w-full input-dark px-3 py-2.5 text-[13px] resize-none" />
                <p className="text-[11px] mt-1" style={{ color: "var(--muted-3)" }}>
                  ⏱ Intervalo de 30 a 90 segundos entre cada mensagem (configurado no N8N — proteção anti-ban).
                </p>
              </div>

              {/* ── Compliance issues ── */}
              {(bloqueios.length > 0 || avisos.length > 0) && novaMensagem.trim().length > 0 && (
                <div className="space-y-2.5">
                  {[...bloqueios, ...avisos].map(issue => (
                    <div key={issue.codigo} className="rounded-xl p-3.5"
                      style={issue.nivel === "BLOQUEADO"
                        ? { background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)" }
                        : { background: "rgba(251,191,36,.07)", border: "1px solid rgba(251,191,36,.2)" }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[13px]">{issue.nivel === "BLOQUEADO" ? "🚫" : "⚠️"}</span>
                        <span className="text-[13px] font-bold"
                          style={{ color: issue.nivel === "BLOQUEADO" ? "#f87171" : "#fbbf24" }}>
                          {issue.nivel === "BLOQUEADO" ? "BLOQUEADO — " : "Atenção — "}{issue.titulo}
                        </span>
                      </div>
                      <p className="text-[12px] mb-1.5 pl-5" style={{ color: "var(--muted-2)" }}>{issue.descricao}</p>
                      <p className="text-[11.5px] font-semibold pl-5"
                        style={{ color: issue.nivel === "BLOQUEADO" ? "#fca5a5" : "#fde68a" }}>
                        ✏️ Como corrigir: {issue.correcao}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Checkbox ciente — só aparece se tem aviso mas não bloqueio */}
              {temAviso && novaMensagem.trim().length > 0 && (
                <label className="flex items-start gap-3 cursor-pointer px-3.5 py-3 rounded-xl transition-all"
                  style={{
                    background: cienteRiscos ? "rgba(251,191,36,.08)" : "rgba(255,255,255,.02)",
                    border: `1px solid ${cienteRiscos ? "rgba(251,191,36,.3)" : "var(--border)"}`,
                  }}>
                  <input type="checkbox" checked={cienteRiscos} onChange={e => setCienteRiscos(e.target.checked)}
                    className="mt-0.5 flex-shrink-0 accent-yellow-400 w-4 h-4" />
                  <span className="text-[12px] leading-snug" style={{ color: "var(--muted)" }}>
                    <strong style={{ color: "#fbbf24" }}>Entendo os riscos acima</strong> e assumo a responsabilidade pelo disparo. Confirmo que o conteúdo é adequado, os contatos aceitaram receber mensagens e o volume está dentro do razoável para minha operação.
                  </span>
                </label>
              )}

              {/* Botões */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button onClick={criarCampanha} disabled={!podeLancar || criandoCampanha}
                  className="btn-primary px-5 py-2.5 text-[13px] disabled:opacity-40 sm:w-auto w-full">
                  {criandoCampanha ? "Criando..." :
                   temBloqueio ? "🚫 Corrija os problemas acima" :
                   temAviso && !cienteRiscos ? "⚠️ Confirme que entende os riscos" :
                   leadsAlvo.length === 0 ? "Selecione leads para disparar" :
                   `Disparar para ${leadsAlvo.length} lead${leadsAlvo.length !== 1 ? "s" : ""} →`}
                </button>
                <button onClick={() => setNovaOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all sm:w-auto w-full"
                  style={{ background: "var(--card-2)", border: "1px solid var(--border)", color: "var(--muted)" }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { value: campanhas.length, label: "Campanhas criadas", color: "#a5b4fc", bg: "rgba(99,102,241,.12)", border: "rgba(99,102,241,.2)" },
            { value: totalEnviados,    label: "Mensagens enviadas", color: "#34d399", bg: "rgba(52,211,153,.12)", border: "rgba(52,211,153,.2)" },
            { value: totalPendentes,   label: "Na fila agora",      color: "#fb923c", bg: "rgba(251,146,60,.12)", border: "rgba(251,146,60,.2)" },
          ].map((m, i) => (
            <div key={i} className="bento-card p-5" style={{ background: m.bg, borderColor: m.border }}>
              <div className="text-[30px] font-bold leading-none mb-1" style={{ color: m.color }}>{m.value}</div>
              <div className="text-[12px]" style={{ color: "var(--muted-2)" }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs + filtro */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button onClick={() => setAba("historico")} className="px-4 py-2 rounded-xl text-[13px] font-medium transition-all" style={tabStyle("historico")}>
            Histórico
          </button>
          <button onClick={() => setAba("regras")} className="px-4 py-2 rounded-xl text-[13px] font-medium transition-all" style={tabStyle("regras")}>
            Regras Automáticas
          </button>
          {empresas.length > 1 && (
            <select value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)}
              className="input-dark px-3 py-2 text-[13px] rounded-xl ml-auto">
              <option value="">Todas as empresas</option>
              {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          )}
        </div>

        {/* HISTÓRICO */}
        {aba === "historico" && (
          <div className="animate-fade-up">
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="shimmer h-20 rounded-2xl" />)}</div>
            ) : campanhas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: "var(--muted-3)" }}>
                <div className="text-5xl">📨</div>
                <p className="text-[13px]">Nenhuma campanha disparada ainda.</p>
                <button onClick={() => setNovaOpen(true)}
                  className="text-[12px] px-4 py-2 rounded-xl font-semibold mt-1"
                  style={{ background: "rgba(99,102,241,.1)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,.2)" }}>
                  Criar primeira campanha →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {campanhas.map((c, idx) => {
                  const tipo = TIPO_LABELS[c.tipo] ?? { label: c.tipo, color: "#94a3b8", bg: "rgba(148,163,184,.1)" };
                  const pct = c.total > 0 ? Math.round((c.enviados / c.total) * 100) : 0;
                  return (
                    <div key={c.id} className="rounded-2xl p-4 animate-fade-up"
                      style={{ ...cardStyle, animationDelay: `${idx * 40}ms` }}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold"
                              style={{ background: tipo.bg, color: tipo.color }}>
                              {tipo.label}
                            </span>
                            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold"
                              style={c.status === "CONCLUIDA"
                                ? { background: "rgba(52,211,153,.1)", color: "#34d399" }
                                : c.status === "ATIVA"
                                ? { background: "rgba(251,146,60,.1)", color: "#fb923c" }
                                : { background: "var(--card-2)", color: "var(--muted-2)" }}>
                              {c.status === "CONCLUIDA" ? "Concluída" : c.status === "ATIVA" ? "Em andamento" : "Pausada"}
                            </span>
                            <span className="text-[11px]" style={{ color: "var(--muted-3)" }}>{c.nomeEmpresa}</span>
                            <span className="text-[11px]" style={{ color: "var(--muted-3)" }}>{timeAgo(c.criadoEm)}</span>
                          </div>
                          <p className="text-[13px] truncate mb-2" style={{ color: "var(--muted)" }}>&quot;{c.mensagem}&quot;</p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--card-2)" }}>
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${pct}%`, background: "linear-gradient(90deg, #6366f1, #34d399)" }} />
                            </div>
                            <span className="text-[11px] font-semibold shrink-0" style={{ color: "var(--muted)" }}>
                              {c.enviados}/{c.total}
                              {c.erros > 0 && <span style={{ color: "#f87171" }}> · {c.erros} erros</span>}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* REGRAS */}
        {aba === "regras" && (
          <div className="space-y-4 animate-fade-up">

            {/* Seletor de empresa — só CENTRAL */}
            {isCentral && empresas.length > 0 && (
              <div>
                <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>EMPRESA</label>
                <select value={regrasEmpresaId} onChange={e => setRegrasEmpresaId(e.target.value)}
                  className="input-dark px-3 py-2.5 text-[13px] w-full sm:w-auto min-w-[220px]">
                  {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
              </div>
            )}

            <div className="px-4 py-3 rounded-xl text-[12.5px]"
              style={{ background: "rgba(251,191,36,.06)", border: "1px solid rgba(251,191,36,.15)", color: "#fbbf24" }}>
              ⚡ Estas regras rodam automaticamente todo dia às 8h. O N8N verifica leads inativos e cria campanhas automaticamente.
            </div>
            <div className="space-y-3">
              {regras.map((r, i) => (
                <div key={r.tipo} className="p-5 rounded-2xl" style={cardStyle}>
                  <div className="flex items-start gap-4">
                    <button onClick={() => setRegras(prev => prev.map((x, j) => j === i ? { ...x, ativo: !x.ativo } : x))}
                      className="flex-shrink-0 mt-0.5 w-10 h-6 rounded-full transition-all relative"
                      style={{ background: r.ativo ? "rgba(52,211,153,.3)" : "var(--border-2)", border: r.ativo ? "1px solid rgba(52,211,153,.4)" : "1px solid var(--border-2)" }}>
                      <div className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                        style={{ left: r.ativo ? "18px" : "2px", background: r.ativo ? "#34d399" : "var(--muted-3)" }} />
                    </button>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold" style={{ color: r.ativo ? "var(--text)" : "var(--muted-3)" }}>
                          {REGRA_LABELS[r.tipo] ?? r.tipo}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full"
                          style={{ background: "var(--card-2)", color: "var(--muted-2)" }}>
                          após {r.diasInativo} dias inativo
                        </span>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold mb-1" style={{ color: "var(--muted-2)" }}>DIAS INATIVO</label>
                        <input type="number" min={1} value={r.diasInativo}
                          onChange={e => setRegras(prev => prev.map((x, j) => j === i ? { ...x, diasInativo: Number(e.target.value) } : x))}
                          className="input-dark px-3 py-2 text-[13px] w-24" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold mb-1" style={{ color: "var(--muted-2)" }}>MENSAGEM</label>
                        <textarea rows={2} value={r.mensagem}
                          onChange={e => setRegras(prev => prev.map((x, j) => j === i ? { ...x, mensagem: e.target.value } : x))}
                          className="w-full input-dark px-3 py-2 text-[13px] resize-none" />
                        <p className="text-[11px] mt-1" style={{ color: "var(--muted-3)" }}>
                          Use {"{nome}"} para personalizar com o nome do cliente.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={salvarRegras} disabled={salvandoRegras}
              className="btn-primary px-6 py-2.5 text-[13px] disabled:opacity-50">
              {salvandoRegras ? "Salvando..." : "Salvar Regras"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
