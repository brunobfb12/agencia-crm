import { redirect } from "next/navigation";
import { getUsuarioLogado } from "@/lib/auth";
import Link from "next/link";
import { PricingSection } from "./_components/PricingSection";

export default async function Home() {
  const usuario = await getUsuarioLogado();
  if (usuario) redirect("/dashboard");
  return <LandingPage />;
}

/* ── Dashboard Mockup ────────────────────────────────────────────────── */
function DashboardMockup() {
  return (
    <div className="relative w-full max-w-5xl mx-auto" style={{ perspective: "1200px" }}>
      <div style={{
        position: "absolute", inset: "-60px", borderRadius: "40px",
        background: "radial-gradient(ellipse at 50% 60%, rgba(99,102,241,.35) 0%, rgba(56,189,248,.15) 40%, transparent 70%)",
        filter: "blur(40px)", pointerEvents: "none", zIndex: 0,
      }} />
      <div className="relative rounded-2xl overflow-hidden" style={{
        background: "linear-gradient(160deg, #0f0e1a 0%, #090812 100%)",
        border: "1px solid rgba(99,102,241,.3)",
        boxShadow: "0 0 0 1px rgba(255,255,255,.06), 0 50px 100px rgba(0,0,0,.8)",
        transform: "rotateX(4deg)", zIndex: 1,
      }}>
        <div className="flex items-center gap-2 px-5 py-3.5" style={{ background: "rgba(255,255,255,.03)", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
          <div className="flex gap-1.5">
            {["#ef4444","#f59e0b","#22c55e"].map(c => <div key={c} className="w-3 h-3 rounded-full" style={{ background: c, opacity: .65 }} />)}
          </div>
          <div className="flex-1 mx-6 py-1 px-3 rounded-md text-[11px] text-center max-w-[260px] mx-auto"
            style={{ background: "rgba(255,255,255,.05)", color: "rgba(148,163,184,.4)" }}>
            ocrmfacil.com.br/dashboard/leads
          </div>
        </div>
        <div className="flex" style={{ minHeight: "320px" }}>
          <div className="w-12 flex flex-col items-center py-4 gap-3" style={{ borderRight: "1px solid rgba(255,255,255,.05)" }}>
            {["📊","👥","💬","📅","📣","⚙️"].map((icon, i) => (
              <div key={i} className="w-8 h-8 rounded-xl flex items-center justify-center text-[14px]"
                style={{ background: i === 1 ? "rgba(99,102,241,.2)" : "transparent", border: i === 1 ? "1px solid rgba(99,102,241,.3)" : "none" }}>
                {icon}
              </div>
            ))}
          </div>
          <div className="flex-1 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[13px] font-bold" style={{ color: "#f1f5f9" }}>Pipeline de Leads</h3>
                <p className="text-[11px]" style={{ color: "rgba(148,163,184,.4)" }}>23 leads ativos · IA respondendo agora</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(52,211,153,.08)", border: "1px solid rgba(52,211,153,.2)" }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#34d399", boxShadow: "0 0 6px #34d399" }} />
                <span className="text-[11px] font-semibold" style={{ color: "#34d399" }}>IA Ativa</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Lead", cor: "#6366f1", count: 12, leads: [
                  { nome: "Maria Silva", tag: "Moda", score: 68 },
                  { nome: "João Pedro", tag: "Auto", score: 74, ia: true },
                ]},
                { label: "Aquecimento", cor: "#f59e0b", count: 8, leads: [
                  { nome: "Ana Costa", tag: "Beauty", score: 82 },
                  { nome: "Carlos Lima", tag: "Tech", score: 79 },
                ]},
                { label: "Negociação", cor: "#38bdf8", count: 5, leads: [
                  { nome: "Paula Ramos", tag: "Saúde", score: 91, hot: true },
                ]},
                { label: "Fechado", cor: "#34d399", count: 3, leads: [
                  { nome: "Ricardo N.", tag: "Varejo", score: 100, won: true },
                ]},
              ].map(col => (
                <div key={col.label}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: col.cor }} />
                      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(148,163,184,.5)" }}>{col.label}</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: "rgba(255,255,255,.06)", color: "rgba(148,163,184,.5)" }}>{col.count}</span>
                  </div>
                  <div className="space-y-2">
                    {col.leads.map((l, i) => (
                      <div key={i} className="p-2.5 rounded-xl"
                        style={{
                          background: (l as {hot?:boolean}).hot ? "linear-gradient(145deg,rgba(56,189,248,.12),rgba(99,102,241,.08))" : "rgba(255,255,255,.04)",
                          border: (l as {hot?:boolean}).hot ? "1px solid rgba(56,189,248,.25)" : "1px solid rgba(255,255,255,.06)",
                        }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-semibold" style={{ color: "#f1f5f9" }}>{l.nome}</span>
                          {(l as {won?:boolean}).won && <span className="text-[9px]">🏆</span>}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md" style={{ background: "rgba(255,255,255,.06)", color: "rgba(148,163,184,.5)" }}>{l.tag}</span>
                          <div className="flex items-center gap-1">
                            <div className="w-8 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.08)" }}>
                              <div className="h-full rounded-full" style={{ width: `${l.score}%`, background: l.score >= 90 ? "#34d399" : col.cor }} />
                            </div>
                          </div>
                        </div>
                        {(l as {ia?:boolean}).ia && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#818cf8" }} />
                            <span className="text-[9px]" style={{ color: "#818cf8" }}>IA respondendo...</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-start gap-3 px-3 py-2.5 rounded-xl"
              style={{ background: "rgba(99,102,241,.07)", border: "1px solid rgba(99,102,241,.15)" }}>
              <div className="w-5 h-5 rounded-lg flex-shrink-0 flex items-center justify-center text-[11px]"
                style={{ background: "rgba(99,102,241,.2)", marginTop: "1px" }}>🤖</div>
              <div>
                <span className="text-[11px] font-semibold" style={{ color: "#a5b4fc" }}>IA respondeu agora · </span>
                <span className="text-[11px]" style={{ color: "rgba(148,163,184,.65)" }}>
                  &quot;Olá João! Sim, fazemos esse serviço. Posso te enviar o orçamento agora mesmo?&quot;
                </span>
              </div>
              <span className="text-[10px] flex-shrink-0" style={{ color: "rgba(148,163,184,.3)" }}>2s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Landing Page ─────────────────────────────────────────────────────── */
function LandingPage() {
  const features = [
    { color: "#6366f1", glow: "rgba(99,102,241,.4)", icon: "💬",
      title: "IA responde 24/7", desc: "Qualifica, tira dúvidas, envia catálogo e agenda — tudo sozinha. Sem depender de ninguém." },
    { color: "#38bdf8", glow: "rgba(56,189,248,.4)", icon: "📊",
      title: "Kanban de Leads", desc: "Pipeline completo com arrastar e soltar. Veja onde cada lead está e o que falta para fechar." },
    { color: "#34d399", glow: "rgba(52,211,153,.4)", icon: "🔁",
      title: "Follow-up Automático", desc: "Sistema lembra e manda mensagem no momento certo. Zero leads esquecidos." },
    { color: "#f59e0b", glow: "rgba(245,158,11,.4)", icon: "🎂",
      title: "Aniversário Automático", desc: "Parabeniza o cliente no dia certo com mensagem personalizada. Fidelização no piloto automático." },
    { color: "#ec4899", glow: "rgba(236,72,153,.4)", icon: "📣",
      title: "Campanhas em Massa", desc: "Envie promoções para toda a base via WhatsApp com poucos cliques." },
    { color: "#a78bfa", glow: "rgba(167,139,250,.4)", icon: "📈",
      title: "Analytics Completo", desc: "Faturamento, conversão e ranking de vendedores. Tudo em tempo real." },
  ];

  const nichos = [
    { icon: "💄", nome: "Moda e Beleza", ex: "Boutiques, salões, studios de sobrancelhas" },
    { icon: "🦷", nome: "Clínicas e Saúde", ex: "Odontologia, estética, psicologia" },
    { icon: "🚗", nome: "Automotivo", ex: "Officinas, estúdios, concessionárias" },
    { icon: "🎓", nome: "Cursos e Educação", ex: "Escolas, cursos online, coaches" },
    { icon: "🏠", nome: "Serviços e Reformas", ex: "Tintas, construção, decoração" },
    { icon: "🛒", nome: "Varejo e E-commerce", ex: "Lojas físicas, atacado, distribuidoras" },
  ];

  const depoimentos = [
    {
      nome: "Rafaela M.",
      cargo: "Dona — Studio de Sobrancelhas",
      texto: "Antes eu perdia cliente por não responder rápido. Agora a IA responde em segundos, já manda o link de agendamento e o cliente agenda sozinho. Minha agenda encheu em 2 semanas.",
      cor: "#ec4899",
    },
    {
      nome: "Marcelo T.",
      cargo: "Gestor — Loja de Tintas",
      texto: "Nosso WhatsApp recebia 80 mensagens por dia e o vendedor não dava conta. Com o FácilCRM a IA filtra, responde e só passa pro vendedor quem está quente. Subimos 40% na conversão.",
      cor: "#38bdf8",
    },
    {
      nome: "Carla S.",
      cargo: "Diretora — Clínica Odontológica",
      texto: "O follow-up automático recuperou pacientes que tinham sumido há meses. O sistema manda a mensagem certa na hora certa — parece mágica. Recomendo demais.",
      cor: "#34d399",
    },
  ];

  const faqs = [
    { q: "Preciso de cartão de crédito para testar?", a: "Não. 30 dias grátis sem cartão. Só cobramos se você decidir continuar após o período de teste." },
    { q: "Funciona com qualquer WhatsApp?", a: "Sim. Conectamos via QR Code — qualquer número WhatsApp normal ou Business. Em 60 segundos a IA está online." },
    { q: "A IA responde sobre meus produtos?", a: "Sim. Você cadastra produtos, preços, horários e diferenciais. A IA usa essas informações para responder com precisão e nunca inventar." },
    { q: "O que acontece se o cliente fizer uma pergunta que a IA não sabe?", a: "A IA avisa o vendedor responsável via WhatsApp com o contexto da conversa. Você nunca fica sem resposta." },
    { q: "Posso cancelar quando quiser?", a: "Sim, sem multa, sem burocracia. Cancele pelo próprio sistema em qualquer momento." },
    { q: "Tem limite de mensagens?", a: "Não. Todas as mensagens recebidas e enviadas pela IA são ilimitadas nos planos Starter, Pro e Agency." },
  ];

  return (
    <div style={{ background: "#06060a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", overflowX: "hidden" }}>

      {/* Noise texture */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
        opacity: 0.4,
      }} />

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-4"
        style={{ background: "rgba(6,6,10,.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6366f1, #38bdf8)", boxShadow: "0 0 20px rgba(99,102,241,.5)" }}>
            <svg className="w-[15px] h-[15px] text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/>
            </svg>
          </div>
          <span className="text-[17px] font-bold" style={{ background: "linear-gradient(135deg,#a5b4fc,#67e8f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>FácilCRM</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {[["Funcionalidades","#funcionalidades"],["Preços","#preços"],["FAQ","#faq"]].map(([item, href]) => (
            <a key={item} href={href} className="text-[13px] transition-colors"
              style={{ color: "rgba(148,163,184,.5)" }}>{item}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-[13px] font-medium px-4 py-2 rounded-xl transition-all"
            style={{ color: "rgba(148,163,184,.6)", border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.04)" }}>
            Entrar
          </Link>
          <Link href="/registro" className="text-[13px] font-semibold px-5 py-2 rounded-xl transition-all"
            style={{
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              color: "#fff",
              boxShadow: "0 0 20px rgba(99,102,241,.4), inset 0 1px 0 rgba(255,255,255,.15)",
              border: "1px solid rgba(99,102,241,.5)",
            }}>
            Testar grátis
          </Link>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative px-6 pt-24 pb-16 flex flex-col items-center text-center" style={{ zIndex: 1 }}>
        <div style={{ position:"absolute",top:"-150px",left:"50%",transform:"translateX(-50%)",width:"1000px",height:"700px",
          background:"radial-gradient(ellipse at 50% 40%, rgba(99,102,241,.18) 0%, rgba(56,189,248,.08) 40%, transparent 70%)",pointerEvents:"none" }} />
        <div style={{ position:"absolute",top:"100px",left:"-100px",width:"500px",height:"500px",
          background:"radial-gradient(ellipse, rgba(139,92,246,.08) 0%, transparent 70%)",pointerEvents:"none" }} />
        <div style={{ position:"absolute",top:"100px",right:"-100px",width:"500px",height:"500px",
          background:"radial-gradient(ellipse, rgba(56,189,248,.07) 0%, transparent 70%)",pointerEvents:"none" }} />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-semibold mb-8"
          style={{ background:"rgba(99,102,241,.1)", border:"1px solid rgba(99,102,241,.2)", color:"#a5b4fc",
            boxShadow:"inset 0 1px 0 rgba(255,255,255,.08)" }}>
          <span style={{ width:6,height:6,borderRadius:"50%",background:"#818cf8",display:"inline-block",boxShadow:"0 0 10px #818cf8" }} />
          IA com memória do cliente · Follow-up automático · Agendamento online
        </div>

        {/* Headline */}
        <h1 style={{ fontSize:"clamp(36px,7vw,80px)", fontWeight:900, lineHeight:1.0, letterSpacing:"-3px", marginBottom:"28px", maxWidth:"900px" }}>
          <span style={{ color:"#f8fafc" }}>Sua empresa atendendo</span>
          <br />
          <span style={{ background:"linear-gradient(135deg, #818cf8 0%, #38bdf8 50%, #34d399 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            clientes 24h no WhatsApp
          </span>
          <br />
          <span style={{ color:"#f8fafc" }}>sem contratar ninguém</span>
        </h1>

        <p className="text-[17px] sm:text-[19px] leading-relaxed mb-10 max-w-xl"
          style={{ color:"rgba(148,163,184,.65)", fontWeight:400 }}>
          IA que responde, qualifica e agenda.
          CRM que organiza leads e dispara follow-ups.
          Tudo no seu WhatsApp em menos de 5 minutos.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <Link href="/registro" className="text-[15px] font-bold px-10 py-4 rounded-2xl transition-all"
            style={{
              background:"linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              color:"#fff",
              boxShadow:"0 0 0 1px rgba(99,102,241,.5), 0 0 40px rgba(99,102,241,.4), inset 0 1px 0 rgba(255,255,255,.2)",
              letterSpacing:"-0.3px",
            }}>
            Começar 30 dias grátis →
          </Link>
          <Link href="/login" className="text-[14px] font-semibold px-8 py-4 rounded-2xl transition-all"
            style={{ background:"rgba(255,255,255,.04)", color:"rgba(148,163,184,.8)", border:"1px solid rgba(255,255,255,.1)" }}>
            Já tenho conta
          </Link>
        </div>
        <p className="text-[12px]" style={{ color:"rgba(148,163,184,.35)" }}>
          Sem cartão de crédito · Cancele quando quiser
        </p>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 sm:gap-12 mt-14 mb-20">
          {[
            { num:"24/7", label:"Atendimento ativo", color:"#818cf8" },
            { num:"< 30s", label:"Tempo de resposta", color:"#67e8f9" },
            { num:"10×", label:"Mais leads convertidos", color:"#34d399" },
            { num:"0", label:"Funcionários extras", color:"#f59e0b" },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-[28px] font-black" style={{ color:s.color, textShadow:`0 0 20px ${s.color}` }}>{s.num}</div>
              <div className="text-[11px] mt-0.5" style={{ color:"rgba(148,163,184,.4)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <DashboardMockup />
      </section>

      {/* ── BARRA DE NICHOS ─────────────────────────────────────────────── */}
      <div className="px-6 py-5 relative" style={{ background:"rgba(255,255,255,.02)", borderTop:"1px solid rgba(255,255,255,.05)", borderBottom:"1px solid rgba(255,255,255,.05)", zIndex:1 }}>
        <p className="text-center text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color:"rgba(148,163,184,.3)" }}>
          Usado por empresas de
        </p>
        <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
          {["Moda e Beleza","Clínicas","Automotivo","Cursos","Varejo","Tintas & Reformas","Odontologia","Studios"].map(n => (
            <span key={n} className="text-[12px] px-3 py-1.5 rounded-full"
              style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", color:"rgba(148,163,184,.5)" }}>
              {n}
            </span>
          ))}
        </div>
      </div>

      {/* ── PROBLEMA → SOLUÇÃO ──────────────────────────────────────────── */}
      <section className="px-6 py-24 relative" style={{ zIndex:1 }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[12px] font-bold uppercase tracking-widest mb-4" style={{ color:"#ef4444" }}>O problema</p>
            <h2 style={{ fontSize:"clamp(26px,4vw,44px)", fontWeight:800, letterSpacing:"-1.5px", color:"#f8fafc", lineHeight:1.1 }}>
              Quantas vendas você perde{" "}
              <span style={{ color:"#ef4444" }}>por dia</span>?
            </h2>
            <p className="text-[15px] mt-4 max-w-xl mx-auto" style={{ color:"rgba(148,163,184,.55)" }}>
              Cada mensagem sem resposta rápida é um lead que vai para o concorrente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Antes */}
            <div className="p-6 rounded-2xl" style={{ background:"rgba(239,68,68,.05)", border:"1px solid rgba(239,68,68,.15)" }}>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[12px]"
                  style={{ background:"rgba(239,68,68,.2)", border:"1px solid rgba(239,68,68,.3)" }}>✗</div>
                <span className="text-[13px] font-bold" style={{ color:"#ef4444" }}>Sem o FácilCRM</span>
              </div>
              <ul className="space-y-3">
                {[
                  "Cliente manda mensagem e fica horas sem resposta",
                  "Vendedor esquece de fazer follow-up, perde a venda",
                  "Não sabe quantos leads estão em cada etapa do funil",
                  "Nunca lembra de parabenizar clientes no aniversário",
                  "Promoções enviadas manualmente, uma por uma",
                  "Não tem dados para saber o que está funcionando",
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px]" style={{ color:"rgba(148,163,184,.55)" }}>
                    <span style={{ color:"rgba(239,68,68,.5)", flexShrink:0, marginTop:"1px" }}>×</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Depois */}
            <div className="p-6 rounded-2xl" style={{ background:"rgba(52,211,153,.05)", border:"1px solid rgba(52,211,153,.15)" }}>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[12px]"
                  style={{ background:"rgba(52,211,153,.2)", border:"1px solid rgba(52,211,153,.3)" }}>✓</div>
                <span className="text-[13px] font-bold" style={{ color:"#34d399" }}>Com o FácilCRM</span>
              </div>
              <ul className="space-y-3">
                {[
                  "IA responde em menos de 30 segundos, 24 horas por dia",
                  "Follow-up automático na data certa — zero leads esquecidos",
                  "Kanban visual com todos os leads organizados por etapa",
                  "Parabéns automático no aniversário de cada cliente",
                  "Campanhas disparadas para centenas de clientes em 1 clique",
                  "Dashboard com conversão, faturamento e ranking de vendedores",
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px]" style={{ color:"rgba(148,163,184,.75)" }}>
                    <span style={{ color:"#34d399", flexShrink:0, marginTop:"1px" }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── FUNCIONALIDADES ─────────────────────────────────────────────── */}
      <section id="funcionalidades" className="px-6 py-24 relative" style={{ background:"rgba(255,255,255,.015)", zIndex:1 }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[12px] font-bold uppercase tracking-widest mb-4" style={{ color:"#6366f1" }}>Funcionalidades</p>
            <h2 style={{ fontSize:"clamp(28px,4vw,48px)", fontWeight:800, letterSpacing:"-1.5px", color:"#f8fafc", lineHeight:1.1 }}>
              Tudo que você precisa para{" "}
              <span style={{ background:"linear-gradient(135deg,#818cf8,#38bdf8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                vender mais
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(f => (
              <div key={f.title} className="group p-6 rounded-2xl transition-all duration-300"
                style={{
                  background:"linear-gradient(145deg, rgba(255,255,255,.04) 0%, rgba(255,255,255,.01) 100%)",
                  border:"1px solid rgba(255,255,255,.07)",
                  borderTop:`1px solid ${f.color}44`,
                }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[20px] mb-4"
                  style={{ background:`${f.color}18`, boxShadow:`0 0 20px ${f.glow}30` }}>
                  {f.icon}
                </div>
                <h3 className="text-[15px] font-bold mb-2" style={{ color:"#f1f5f9" }}>{f.title}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color:"rgba(148,163,184,.6)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ───────────────────────────────────────────────── */}
      <section className="px-6 py-24 relative" style={{ zIndex:1 }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[12px] font-bold uppercase tracking-widest mb-4" style={{ color:"#38bdf8" }}>Simples assim</p>
            <h2 style={{ fontSize:"clamp(26px,4vw,44px)", fontWeight:800, letterSpacing:"-1.5px", color:"#f8fafc" }}>
              Do cadastro ao atendimento automático
              <br />em menos de 5 minutos
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num:"01", emoji:"🖊️", title:"Crie sua conta", desc:"2 minutos, sem cartão. 30 dias grátis na hora.", cor:"#6366f1" },
              { num:"02", emoji:"📱", title:"Conecte o WhatsApp", desc:"Escaneie o QR Code. Em 60 segundos a IA está online.", cor:"#38bdf8" },
              { num:"03", emoji:"🤖", title:"A IA começa a atender", desc:"Cadastre seus produtos e horários. Pronto, já está respondendo.", cor:"#34d399" },
            ].map((s, i) => (
              <div key={s.num} className="relative p-6 rounded-2xl"
                style={{ background:`linear-gradient(145deg, ${s.cor}10, ${s.cor}05)`, border:`1px solid ${s.cor}25` }}>
                {i < 2 && <div className="hidden md:block absolute top-8 -right-3 z-10 text-[18px]" style={{ color:`${s.cor}50` }}>→</div>}
                <span className="text-[11px] font-black tracking-widest" style={{ color:`${s.cor}80` }}>{s.num}</span>
                <div className="text-[32px] my-3">{s.emoji}</div>
                <h3 className="text-[15px] font-bold mb-2" style={{ color:"#f1f5f9" }}>{s.title}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color:"rgba(148,163,184,.6)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARA QUEM É ─────────────────────────────────────────────────── */}
      <section className="px-6 py-24 relative" style={{ background:"rgba(255,255,255,.015)", zIndex:1 }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[12px] font-bold uppercase tracking-widest mb-4" style={{ color:"#f59e0b" }}>Para quem é</p>
            <h2 style={{ fontSize:"clamp(26px,4vw,44px)", fontWeight:800, letterSpacing:"-1.5px", color:"#f8fafc" }}>
              Funciona para qualquer empresa que{" "}
              <span style={{ background:"linear-gradient(135deg,#f59e0b,#ef4444)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                vende pelo WhatsApp
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {nichos.map(n => (
              <div key={n.nome} className="p-5 rounded-2xl"
                style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.07)" }}>
                <div className="text-[28px] mb-3">{n.icon}</div>
                <h3 className="text-[14px] font-bold mb-1" style={{ color:"#f1f5f9" }}>{n.nome}</h3>
                <p className="text-[12px]" style={{ color:"rgba(148,163,184,.45)" }}>{n.ex}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ─────────────────────────────────────────────────── */}
      <section className="px-6 py-24 relative" style={{ zIndex:1 }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[12px] font-bold uppercase tracking-widest mb-4" style={{ color:"#a78bfa" }}>Depoimentos</p>
            <h2 style={{ fontSize:"clamp(26px,4vw,44px)", fontWeight:800, letterSpacing:"-1.5px", color:"#f8fafc" }}>
              Quem usa, não volta atrás
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {depoimentos.map(d => (
              <div key={d.nome} className="p-6 rounded-2xl flex flex-col"
                style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.07)", borderTop:`1px solid ${d.cor}33` }}>
                <div className="flex mb-3 gap-0.5">
                  {Array(5).fill(0).map((_, i) => (
                    <svg key={i} className="w-4 h-4" style={{ color:"#f59e0b" }} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                </div>
                <p className="text-[13px] leading-relaxed flex-1 mb-5" style={{ color:"rgba(148,163,184,.7)" }}>
                  &quot;{d.texto}&quot;
                </p>
                <div>
                  <p className="text-[13px] font-bold" style={{ color:"#f1f5f9" }}>{d.nome}</p>
                  <p className="text-[11px]" style={{ color:"rgba(148,163,184,.4)" }}>{d.cargo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PREÇOS (client component) ────────────────────────────────────── */}
      <div style={{ background:"rgba(255,255,255,.015)" }}>
        <PricingSection />
      </div>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="px-6 py-24 relative" style={{ zIndex:1 }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[12px] font-bold uppercase tracking-widest mb-4" style={{ color:"#6366f1" }}>FAQ</p>
            <h2 style={{ fontSize:"clamp(24px,3.5vw,38px)", fontWeight:800, letterSpacing:"-1px", color:"#f8fafc" }}>
              Perguntas frequentes
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map(f => (
              <div key={f.q} className="p-5 rounded-2xl"
                style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", boxShadow:"inset 0 1px 0 rgba(255,255,255,.04)" }}>
                <h3 className="text-[14px] font-semibold mb-2" style={{ color:"#f1f5f9" }}>{f.q}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color:"rgba(148,163,184,.6)" }}>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────────── */}
      <section className="px-6 py-32 text-center relative overflow-hidden" style={{ zIndex:1 }}>
        <div style={{ position:"absolute",inset:0,
          background:"radial-gradient(ellipse 60% 70% at 50% 50%, rgba(99,102,241,.2) 0%, rgba(56,189,248,.08) 50%, transparent 75%)",
          pointerEvents:"none" }} />
        {[["10%","20%"],["85%","15%"],["5%","80%"],["92%","75%"],["50%","5%"]].map(([l,t],i) => (
          <div key={i} style={{ position:"absolute",left:l,top:t,width:"4px",height:"4px",borderRadius:"50%",
            background:"rgba(165,180,252,.4)",boxShadow:"0 0 8px rgba(165,180,252,.6)",pointerEvents:"none" }} />
        ))}
        <p className="text-[12px] font-bold uppercase tracking-widest mb-6 relative" style={{ color:"#6366f1" }}>
          Comece hoje
        </p>
        <h2 className="relative" style={{ fontSize:"clamp(28px,5vw,60px)", fontWeight:900, letterSpacing:"-2px", marginBottom:"20px", lineHeight:1.05 }}>
          <span style={{ color:"#f8fafc" }}>Pronto para vender mais</span><br />
          <span style={{ background:"linear-gradient(135deg,#818cf8,#38bdf8,#34d399)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            sem trabalhar mais?
          </span>
        </h2>
        <p className="text-[16px] mb-12 relative" style={{ color:"rgba(148,163,184,.55)" }}>
          30 dias grátis. Sem cartão. Cancele quando quiser.
        </p>
        <Link href="/registro" className="relative inline-block text-[16px] font-bold px-14 py-5 rounded-2xl transition-all"
          style={{
            background:"linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
            color:"#fff",
            boxShadow:"0 0 0 1px rgba(99,102,241,.5), 0 0 60px rgba(99,102,241,.5), inset 0 1px 0 rgba(255,255,255,.2)",
            letterSpacing:"-0.3px",
          }}>
          Começar agora — é grátis →
        </Link>

        <div className="mt-10 flex flex-wrap justify-center gap-6">
          {["✓ Sem cartão de crédito","✓ 30 dias grátis","✓ Cancele quando quiser","✓ Setup em 5 minutos"].map(item => (
            <span key={item} className="text-[13px]" style={{ color:"rgba(148,163,184,.4)" }}>{item}</span>
          ))}
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 relative"
        style={{ zIndex:1, borderTop:"1px solid rgba(255,255,255,.06)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background:"linear-gradient(135deg,#6366f1,#38bdf8)", boxShadow:"0 0 12px rgba(99,102,241,.4)" }}>
            <svg className="w-[13px] h-[13px] text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/>
            </svg>
          </div>
          <span className="text-[14px] font-bold" style={{ background:"linear-gradient(135deg,#a5b4fc,#67e8f9)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>FácilCRM</span>
        </div>
        <div className="flex gap-6">
          {[["Entrar","/login"],["Cadastro","/registro"],["Suporte","https://wa.me/5562985974090"]].map(([label,href]) => (
            <Link key={label} href={href} className="text-[12px] transition-colors"
              style={{ color:"rgba(148,163,184,.4)" }}>{label}</Link>
          ))}
        </div>
        <p className="text-[11px]" style={{ color:"rgba(148,163,184,.2)" }}>
          © {new Date().getFullYear()} FácilCRM · Powered by Claude AI
        </p>
      </footer>
    </div>
  );
}
