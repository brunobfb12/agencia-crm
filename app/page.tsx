import { redirect } from "next/navigation";
import { getUsuarioLogado } from "@/lib/auth";
import Link from "next/link";

export default async function Home() {
  const usuario = await getUsuarioLogado();
  if (usuario) redirect("/dashboard");
  return <LandingPage />;
}

/* ── Dashboard Mockup ───────────────────────────────────────────────── */
function DashboardMockup() {
  const leads = [
    { nome: "Maria Silva", empresa: "Boutique Rosa", status: "LEAD", score: 72, tempo: "2min" },
    { nome: "João Pereira", empresa: "Auto Center JP", status: "AQUECIMENTO", score: 85, tempo: "5min" },
    { nome: "Ana Costa", empresa: "Studio Beauty", status: "NEGOCIACAO", score: 91, tempo: "1min" },
  ];
  const colunas = ["Lead", "Aquecimento", "Negociação", "Venda"];

  return (
    <div
      className="relative w-full max-w-4xl mx-auto rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(145deg, rgba(13,11,31,.95), rgba(10,9,22,.98))",
        border: "1px solid rgba(99,102,241,.25)",
        boxShadow: "0 40px 120px rgba(0,0,0,.7), 0 0 0 1px rgba(99,102,241,.1), inset 0 1px 0 rgba(255,255,255,.05)",
      }}
    >
      {/* Window bar */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ background: "rgba(255,255,255,.03)", borderBottom: "1px solid rgba(255,255,255,.06)" }}
      >
        <div className="flex gap-1.5">
          {["#ef4444","#f59e0b","#22c55e"].map((c) => (
            <div key={c} className="w-3 h-3 rounded-full" style={{ background: c, opacity: .7 }} />
          ))}
        </div>
        <div
          className="flex-1 mx-4 px-3 py-1 rounded-md text-[11px] text-center"
          style={{ background: "rgba(255,255,255,.04)", color: "rgba(148,163,184,.4)" }}
        >
          ocrmfacil.com.br/dashboard
        </div>
      </div>

      {/* Top bar */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ background: "rgba(255,255,255,.02)", borderBottom: "1px solid rgba(255,255,255,.04)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg" style={{ background: "linear-gradient(135deg,#6366f1,#38bdf8)" }} />
          <span className="text-[12px] font-bold gradient-text">FácilCRM</span>
        </div>
        <div className="flex items-center gap-3">
          {["Analytics","Leads","Conversas","Clientes"].map((item) => (
            <span key={item} className="text-[11px]" style={{ color: item === "Leads" ? "#a5b4fc" : "rgba(148,163,184,.4)" }}>
              {item}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: "#34d399", boxShadow: "0 0 6px #34d399" }} />
          <span className="text-[11px]" style={{ color: "#34d399" }}>IA Ativa</span>
        </div>
      </div>

      {/* Kanban */}
      <div className="p-4">
        <div className="flex gap-3 mb-3">
          <span className="text-[12px] font-bold" style={{ color: "#f1f5f9" }}>Pipeline de Leads</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,.15)", color: "#a5b4fc" }}>23 leads ativos</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {colunas.map((col, ci) => (
            <div key={col}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "rgba(148,163,184,.5)" }}>{col}</span>
                <span className="text-[10px] font-bold px-1.5 rounded" style={{ background: "rgba(255,255,255,.06)", color: "rgba(148,163,184,.6)" }}>
                  {[12, 8, 5, 3][ci]}
                </span>
              </div>
              <div className="space-y-2">
                {leads.filter((_, i) => i % 4 === ci % 3 || (ci === 0 && i === 0) || (ci === 1 && i === 1) || (ci === 2 && i === 2)).slice(0, ci === 3 ? 1 : 2).map((l, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl"
                    style={{
                      background: ci === 2 ? "linear-gradient(145deg,rgba(99,102,241,.12),rgba(56,189,248,.06))" : "rgba(255,255,255,.04)",
                      border: ci === 2 ? "1px solid rgba(99,102,241,.2)" : "1px solid rgba(255,255,255,.06)",
                    }}
                  >
                    <div className="text-[11px] font-semibold mb-0.5" style={{ color: "#f1f5f9" }}>{l.nome}</div>
                    <div className="text-[10px]" style={{ color: "rgba(148,163,184,.5)" }}>{l.empresa}</div>
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-1">
                        <div className="w-10 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.08)" }}>
                          <div className="h-full rounded-full" style={{ width: `${l.score}%`, background: l.score > 88 ? "#34d399" : "#818cf8" }} />
                        </div>
                        <span className="text-[9px]" style={{ color: "rgba(148,163,184,.4)" }}>{l.score}</span>
                      </div>
                      <span className="text-[9px]" style={{ color: "rgba(148,163,184,.35)" }}>{l.tempo}</span>
                    </div>
                  </div>
                ))}
                {ci === 0 && (
                  <div className="p-2.5 rounded-xl" style={{ background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.05)" }}>
                    <div className="text-[11px] font-semibold mb-0.5" style={{ color: "#f1f5f9" }}>Pedro Alves</div>
                    <div className="text-[10px]" style={{ color: "rgba(148,163,184,.5)" }}>Loja do Pedro</div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: "#818cf8" }} />
                      <span className="text-[9px]" style={{ color: "#818cf8" }}>IA respondendo</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Live message ticker */}
        <div
          className="mt-4 flex items-center gap-3 px-3 py-2.5 rounded-xl"
          style={{ background: "rgba(52,211,153,.06)", border: "1px solid rgba(52,211,153,.12)" }}
        >
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#34d399", boxShadow: "0 0 8px #34d399", animation: "pulse 2s infinite" }} />
          <span className="text-[11px]" style={{ color: "rgba(148,163,184,.7)" }}>
            <strong style={{ color: "#34d399" }}>IA respondeu agora:</strong> "Olá Maria! Temos sim o modelo que você perguntou, posso te enviar o catálogo?"
          </span>
          <span className="text-[10px] flex-shrink-0" style={{ color: "rgba(148,163,184,.3)" }}>agora</span>
        </div>
      </div>
    </div>
  );
}

/* ── Landing Page ───────────────────────────────────────────────────── */
function LandingPage() {
  const features = [
    { icon: "💬", title: "IA responde 24/7", desc: "Qualifica, tira dúvidas, envia catálogo e agenda tudo sozinha. Sem depender de ninguém." },
    { icon: "📊", title: "Kanban de Leads", desc: "Pipeline completo com arrastar e soltar. Veja onde cada lead está e o que falta para fechar." },
    { icon: "🔁", title: "Follow-up Automático", desc: "Sistema lembra e manda mensagem no momento certo. Zero leads esquecidos." },
    { icon: "🎂", title: "Aniversário Automático", desc: "Mensagem de parabéns personalizada no dia do cliente. Fidelização no piloto automático." },
    { icon: "📣", title: "Campanhas em Massa", desc: "Envie promoções para toda a base via WhatsApp com poucos cliques." },
    { icon: "📈", title: "Analytics Completo", desc: "Faturamento, taxa de conversão, ranking de vendedores. Tudo em tempo real." },
  ];

  const planos = [
    { nome: "Starter", preco: "R$ 197", periodo: "/mês no anual", features: ["1 WhatsApp", "IA 24/7", "Até 1.000 clientes", "Follow-up automático"], destaque: false },
    { nome: "Pro", preco: "R$ 330", periodo: "/mês no anual", features: ["2 WhatsApp", "IA 24/7", "Clientes ilimitados", "Campanhas", "Analytics"], destaque: true },
    { nome: "Agency", preco: "R$ 664", periodo: "/mês no anual", features: ["5 empresas", "WhatsApp ilimitados", "Tudo do Pro", "Suporte prioritário"], destaque: false },
  ];

  const faqs = [
    { q: "Preciso de cartão de crédito para testar?", a: "Não. Os 30 dias são totalmente gratuitos, sem cartão. Só cobramos se você decidir continuar." },
    { q: "Funciona com qualquer número de WhatsApp?", a: "Sim. Conectamos qualquer número via QR Code — WhatsApp normal ou Business." },
    { q: "A IA responde sobre meus produtos?", a: "Sim. Você cadastra produtos, preços, horários e formas de pagamento. A IA usa esses dados." },
    { q: "Posso cancelar quando quiser?", a: "Sim, sem multa e sem burocracia. Cancele pelo próprio sistema a qualquer momento." },
  ];

  return (
    <div style={{ background: "#08080e", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", overflowX: "hidden" }}>

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: "rgba(8,8,14,.9)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6366f1, #38bdf8)", boxShadow: "0 4px 14px rgba(99,102,241,.5)" }}>
            <svg className="w-[15px] h-[15px] text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/>
            </svg>
          </div>
          <span className="text-[17px] font-bold gradient-text">FácilCRM</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-[13px] font-medium px-4 py-2 rounded-lg"
            style={{ color: "rgba(148,163,184,.6)" }}>Entrar</Link>
          <Link href="/registro" className="btn-primary text-[13px] px-5 py-2">Testar grátis</Link>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="relative px-6 pt-20 pb-10 flex flex-col items-center text-center overflow-hidden">
        {/* background glows */}
        <div style={{ position:"absolute",top:"-100px",left:"50%",transform:"translateX(-50%)",width:"900px",height:"600px",
          background:"radial-gradient(ellipse, rgba(99,102,241,.2) 0%, transparent 65%)", pointerEvents:"none" }} />
        <div style={{ position:"absolute",top:"200px",left:"10%",width:"300px",height:"300px",
          background:"radial-gradient(ellipse, rgba(56,189,248,.08) 0%, transparent 70%)", pointerEvents:"none" }} />
        <div style={{ position:"absolute",top:"200px",right:"10%",width:"300px",height:"300px",
          background:"radial-gradient(ellipse, rgba(139,92,246,.08) 0%, transparent 70%)", pointerEvents:"none" }} />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-semibold mb-6 relative"
          style={{ background:"rgba(99,102,241,.1)", border:"1px solid rgba(99,102,241,.25)", color:"#a5b4fc" }}>
          <span style={{ width:6,height:6,borderRadius:"50%",background:"#818cf8",display:"inline-block",
            boxShadow:"0 0 8px #818cf8" }} />
          IA + WhatsApp + CRM — tudo em um só lugar
        </div>

        <h1 className="text-[42px] sm:text-[64px] font-black leading-none mb-6 max-w-4xl relative"
          style={{ letterSpacing:"-2.5px" }}>
          <span style={{ color:"#f1f5f9" }}>Sua empresa atendendo</span><br />
          <span className="gradient-text">clientes 24h no WhatsApp</span><br />
          <span style={{ color:"#f1f5f9" }}>sem contratar ninguém</span>
        </h1>

        <p className="text-[17px] leading-relaxed mb-10 max-w-lg relative"
          style={{ color:"rgba(148,163,184,.65)" }}>
          IA que responde, qualifica leads e agenda reuniões.
          CRM que organiza e dispara follow-ups.
          Conecta em 5 minutos.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16 relative">
          <Link href="/registro"
            className="btn-primary text-[15px] px-10 py-4 font-bold"
            style={{ boxShadow:"0 0 40px rgba(99,102,241,.4)" }}>
            Começar 30 dias grátis →
          </Link>
          <div className="flex items-center gap-2 text-[12px]" style={{ color:"rgba(148,163,184,.45)" }}>
            <svg className="w-4 h-4" style={{ color:"#34d399" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Sem cartão · Sem contrato · Cancele quando quiser
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="w-full relative">
          <div style={{ position:"absolute",top:"-40px",left:"50%",transform:"translateX(-50%)",
            width:"80%",height:"200px",
            background:"radial-gradient(ellipse, rgba(99,102,241,.15) 0%, transparent 70%)",
            pointerEvents:"none" }} />
          <DashboardMockup />
        </div>
      </section>

      {/* ── STATS BAR ───────────────────────────────────────────────── */}
      <section className="px-6 py-12">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-6">
          {[
            { num:"24/7", label:"Atendimento automático", color:"#a5b4fc" },
            { num:"< 30s", label:"Tempo médio de resposta", color:"#67e8f9" },
            { num:"10×", label:"Mais leads qualificados", color:"#34d399" },
          ].map((s) => (
            <div key={s.label} className="text-center p-5 rounded-2xl"
              style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.06)" }}>
              <div className="text-[32px] font-black mb-1" style={{ color:s.color }}>{s.num}</div>
              <div className="text-[12px]" style={{ color:"rgba(148,163,184,.5)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMO FUNCIONA ───────────────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-[30px] sm:text-[38px] font-bold mb-3" style={{ color:"#f1f5f9", letterSpacing:"-1px" }}>
              Do cadastro ao atendimento automático<br />em menos de 5 minutos
            </h2>
            <p className="text-[14px]" style={{ color:"rgba(148,163,184,.5)" }}>Sem configuração técnica. Sem código.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { num:"01", icon:"🖊️", title:"Crie sua conta", desc:"Cadastro em 2 minutos sem cartão. 30 dias grátis liberados na hora." },
              { num:"02", icon:"📱", title:"Conecte o WhatsApp", desc:"Escaneie o QR Code. Em 60 segundos seu número está ativo e a IA online." },
              { num:"03", icon:"🤖", title:"IA começa a atender", desc:"Cadastre seus produtos e horários. A IA já responde seus clientes automaticamente." },
            ].map((s, i) => (
              <div key={s.num} className="relative p-6 rounded-2xl"
                style={{
                  background:"linear-gradient(145deg, rgba(99,102,241,.08), rgba(56,189,248,.04))",
                  border:"1px solid rgba(99,102,241,.15)",
                }}>
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 -right-4 z-10 text-[20px]"
                    style={{ color:"rgba(99,102,241,.3)" }}>→</div>
                )}
                <div className="text-[11px] font-black mb-3 tracking-widest" style={{ color:"rgba(99,102,241,.5)" }}>{s.num}</div>
                <div className="text-[26px] mb-3">{s.icon}</div>
                <h3 className="text-[15px] font-bold mb-2" style={{ color:"#f1f5f9" }}>{s.title}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color:"rgba(148,163,184,.6)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────── */}
      <section className="px-6 py-16" style={{ background:"rgba(255,255,255,.015)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-[30px] sm:text-[38px] font-bold mb-3" style={{ color:"#f1f5f9", letterSpacing:"-1px" }}>
              Tudo que você precisa para{" "}
              <span className="gradient-text">vender mais</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div key={f.title} className="p-5 rounded-2xl group"
                style={{
                  background:"linear-gradient(145deg, rgba(255,255,255,.05), rgba(255,255,255,.02))",
                  border:"1px solid rgba(255,255,255,.07)",
                  transition:"border-color .2s, box-shadow .2s",
                }}>
                <div className="text-[30px] mb-3">{f.icon}</div>
                <h3 className="text-[14px] font-bold mb-1.5" style={{ color:"#f1f5f9" }}>{f.title}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color:"rgba(148,163,184,.6)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PREÇOS ──────────────────────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-[30px] sm:text-[38px] font-bold mb-3" style={{ color:"#f1f5f9", letterSpacing:"-1px" }}>
              Planos simples, sem surpresas
            </h2>
            <p className="text-[14px] mb-6" style={{ color:"rgba(148,163,184,.5)" }}>
              Comece grátis. Pague só se gostar.
            </p>
            <div className="inline-flex items-center gap-1 px-1 py-1 rounded-xl"
              style={{ background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.08)" }}>
              <span className="px-4 py-1.5 rounded-lg text-[12px] font-semibold"
                style={{ background:"linear-gradient(135deg, #6366f1, #38bdf8)", color:"#fff" }}>
                Anual — 2 meses grátis
              </span>
              <span className="px-4 py-1.5 text-[12px]" style={{ color:"rgba(148,163,184,.5)" }}>Mensal</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {planos.map((p) => (
              <div key={p.nome} className="rounded-2xl p-6 flex flex-col"
                style={{
                  background: p.destaque ? "linear-gradient(145deg, rgba(99,102,241,.15), rgba(56,189,248,.08))" : "linear-gradient(145deg, rgba(255,255,255,.05), rgba(255,255,255,.02))",
                  border: p.destaque ? "1px solid rgba(99,102,241,.4)" : "1px solid rgba(255,255,255,.08)",
                  boxShadow: p.destaque ? "0 0 50px rgba(99,102,241,.2)" : "none",
                  position:"relative",
                }}>
                {p.destaque && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap"
                    style={{ background:"linear-gradient(90deg, #6366f1, #38bdf8)", color:"#fff" }}>
                    MAIS POPULAR
                  </div>
                )}
                <div className="mb-4">
                  <div className="text-[15px] font-bold mb-2" style={{ color:"#f1f5f9" }}>{p.nome}</div>
                  <div className="flex items-end gap-1">
                    <span className="text-[32px] font-black" style={{ color:"#f1f5f9" }}>{p.preco}</span>
                    <span className="text-[12px] mb-1.5" style={{ color:"rgba(148,163,184,.5)" }}>{p.periodo}</span>
                  </div>
                </div>
                <ul className="space-y-2 flex-1 mb-5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[13px]" style={{ color:"rgba(148,163,184,.75)" }}>
                      <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color:"#34d399" }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={`/registro?plano=${p.nome.toUpperCase()}`}
                  className={p.destaque ? "btn-primary w-full py-3 text-[13px] text-center block" : "block w-full py-3 text-[13px] text-center font-semibold rounded-xl transition-all"}
                  style={!p.destaque ? { background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.12)", color:"#f1f5f9" } : {}}>
                  Começar grátis — 30 dias
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────── */}
      <section className="px-6 py-16" style={{ background:"rgba(255,255,255,.015)" }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-[28px] font-bold text-center mb-10" style={{ color:"#f1f5f9" }}>
            Perguntas frequentes
          </h2>
          <div className="space-y-3">
            {faqs.map((f) => (
              <div key={f.q} className="p-5 rounded-2xl"
                style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)" }}>
                <h3 className="text-[14px] font-semibold mb-2" style={{ color:"#f1f5f9" }}>{f.q}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color:"rgba(148,163,184,.6)" }}>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────────── */}
      <section className="px-6 py-24 text-center relative overflow-hidden">
        <div style={{ position:"absolute",inset:0,
          background:"radial-gradient(ellipse 70% 60% at 50% 50%, rgba(99,102,241,.15) 0%, transparent 70%)",
          pointerEvents:"none" }} />
        <h2 className="text-[32px] sm:text-[48px] font-black mb-4 max-w-2xl mx-auto relative"
          style={{ color:"#f1f5f9", letterSpacing:"-1.5px" }}>
          Pronto para vender mais<br />
          <span className="gradient-text">sem trabalhar mais?</span>
        </h2>
        <p className="text-[15px] mb-10 relative" style={{ color:"rgba(148,163,184,.55)" }}>
          30 dias grátis. Sem cartão. Cancele quando quiser.
        </p>
        <Link href="/registro"
          className="btn-primary text-[16px] px-12 py-4 font-bold relative"
          style={{ boxShadow:"0 0 60px rgba(99,102,241,.5)" }}>
          Começar agora — é grátis →
        </Link>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ borderTop:"1px solid rgba(255,255,255,.06)" }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background:"linear-gradient(135deg, #6366f1, #38bdf8)" }}>
            <svg className="w-[11px] h-[11px] text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/>
            </svg>
          </div>
          <span className="text-[13px] font-semibold gradient-text">FácilCRM</span>
        </div>
        <div className="flex gap-6 text-[12px]">
          <Link href="/login" style={{ color:"rgba(148,163,184,.4)" }}>Entrar</Link>
          <Link href="/registro" style={{ color:"rgba(148,163,184,.4)" }}>Cadastro grátis</Link>
          <a href="https://wa.me/5562985974090" target="_blank" rel="noopener noreferrer"
            style={{ color:"rgba(148,163,184,.4)" }}>Suporte</a>
        </div>
        <p className="text-[11px]" style={{ color:"rgba(148,163,184,.25)" }}>
          © {new Date().getFullYear()} FácilCRM · Powered by Claude AI
        </p>
      </footer>
    </div>
  );
}
