import { redirect } from "next/navigation";
import { getUsuarioLogado } from "@/lib/auth";
import Link from "next/link";

export default async function Home() {
  const usuario = await getUsuarioLogado();
  if (usuario) redirect("/dashboard");
  return <LandingPage />;
}

/* ── Mockup do Dashboard ────────────────────────────────────────────── */
function DashboardMockup() {
  return (
    <div className="relative w-full max-w-5xl mx-auto" style={{ perspective: "1200px" }}>
      {/* Glow atrás do mockup */}
      <div style={{
        position: "absolute", inset: "-60px", borderRadius: "40px",
        background: "radial-gradient(ellipse at 50% 60%, rgba(99,102,241,.35) 0%, rgba(56,189,248,.15) 40%, transparent 70%)",
        filter: "blur(40px)", pointerEvents: "none", zIndex: 0,
      }} />

      <div className="relative rounded-2xl overflow-hidden" style={{
        background: "linear-gradient(160deg, #0f0e1a 0%, #090812 100%)",
        border: "1px solid rgba(99,102,241,.3)",
        boxShadow: "0 0 0 1px rgba(255,255,255,.06), 0 50px 100px rgba(0,0,0,.8)",
        transform: "rotateX(4deg)",
        zIndex: 1,
      }}>
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-5 py-3.5" style={{ background: "rgba(255,255,255,.03)", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
          <div className="flex gap-1.5">
            {["#ef4444","#f59e0b","#22c55e"].map(c => <div key={c} className="w-3 h-3 rounded-full" style={{ background: c, opacity: .65 }} />)}
          </div>
          <div className="flex-1 mx-6 py-1 px-3 rounded-md text-[11px] text-center max-w-[260px] mx-auto"
            style={{ background: "rgba(255,255,255,.05)", color: "rgba(148,163,184,.4)" }}>
            ocrmfacil.com.br/dashboard/leads
          </div>
        </div>

        {/* App layout */}
        <div className="flex" style={{ minHeight: "320px" }}>
          {/* Sidebar */}
          <div className="w-12 flex flex-col items-center py-4 gap-3" style={{ borderRight: "1px solid rgba(255,255,255,.05)" }}>
            {["📊","👥","💬","📅","📣","⚙️"].map((icon, i) => (
              <div key={i} className="w-8 h-8 rounded-xl flex items-center justify-center text-[14px]"
                style={{ background: i === 1 ? "rgba(99,102,241,.2)" : "transparent", border: i === 1 ? "1px solid rgba(99,102,241,.3)" : "none" }}>
                {icon}
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[13px] font-bold" style={{ color: "#f1f5f9" }}>Pipeline de Leads</h3>
                <p className="text-[11px]" style={{ color: "rgba(148,163,184,.4)" }}>23 leads ativos • IA respondendo agora</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(52,211,153,.08)", border: "1px solid rgba(52,211,153,.2)" }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#34d399", boxShadow: "0 0 6px #34d399" }} />
                <span className="text-[11px] font-semibold" style={{ color: "#34d399" }}>IA Ativa</span>
              </div>
            </div>

            {/* Kanban columns */}
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
              ].map((col) => (
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

            {/* Live notification */}
            <div className="mt-4 flex items-start gap-3 px-3 py-2.5 rounded-xl"
              style={{ background: "rgba(99,102,241,.07)", border: "1px solid rgba(99,102,241,.15)" }}>
              <div className="w-5 h-5 rounded-lg flex-shrink-0 flex items-center justify-center text-[11px]"
                style={{ background: "rgba(99,102,241,.2)", marginTop: "1px" }}>🤖</div>
              <div>
                <span className="text-[11px] font-semibold" style={{ color: "#a5b4fc" }}>IA respondeu agora · </span>
                <span className="text-[11px]" style={{ color: "rgba(148,163,184,.65)" }}>
                  "Olá João! Sim, fazemos esse serviço. Posso te enviar o orçamento agora mesmo?"
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

/* ── Landing Page ───────────────────────────────────────────────────── */
function LandingPage() {
  const features = [
    { color: "#6366f1", glow: "rgba(99,102,241,.4)", icon: "💬",
      title: "IA responde 24/7", desc: "Qualifica, tira dúvidas, envia catálogo e agenda — tudo sozinha. Sem depender de ninguém." },
    { color: "#38bdf8", glow: "rgba(56,189,248,.4)", icon: "📊",
      title: "Kanban de Leads", desc: "Pipeline completo com arrastar e soltar. Veja onde cada lead está e o que falta para fechar." },
    { color: "#34d399", glow: "rgba(52,211,153,.4)", icon: "🔁",
      title: "Follow-up Automático", desc: "Sistema lembra e manda mensagem no momento certo. Zero leads esquecidos." },
    { color: "#f59e0b", glow: "rgba(245,158,11,.4)", icon: "🎂",
      title: "Aniversário Automático", desc: "Parabeniza o cliente no dia certo com mensagem personalizada. Fidelização zero esforço." },
    { color: "#ec4899", glow: "rgba(236,72,153,.4)", icon: "📣",
      title: "Campanhas em Massa", desc: "Envie promoções para toda a base via WhatsApp com poucos cliques." },
    { color: "#a78bfa", glow: "rgba(167,139,250,.4)", icon: "📈",
      title: "Analytics Completo", desc: "Faturamento, conversão e ranking de vendedores. Tudo em tempo real." },
  ];

  const planos = [
    { nome: "Starter", preco: "R$ 197", desc: "Para empresas que estão começando",
      features: ["1 WhatsApp", "IA 24/7", "Até 1.000 clientes", "Follow-up automático"], destaque: false, cor: "#6366f1" },
    { nome: "Pro", preco: "R$ 330", desc: "Para empresas em crescimento",
      features: ["2 WhatsApp", "IA 24/7", "Clientes ilimitados", "Campanhas em massa", "Analytics"], destaque: true, cor: "#38bdf8" },
    { nome: "Agency", preco: "R$ 664", desc: "Para agências e múltiplas empresas",
      features: ["5 empresas", "WhatsApp ilimitados", "Tudo do Pro", "Suporte prioritário"], destaque: false, cor: "#a78bfa" },
  ];

  return (
    <div style={{ background: "#06060a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", overflowX: "hidden" }}>

      {/* ── NOISE TEXTURE OVERLAY ───────────────────────────────────── */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
        opacity: 0.4,
      }} />

      {/* ── NAV ─────────────────────────────────────────────────────── */}
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
          {["Funcionalidades","Preços","FAQ"].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} className="text-[13px] transition-colors"
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

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="relative px-6 pt-24 pb-16 flex flex-col items-center text-center" style={{ zIndex: 1 }}>
        {/* Blob gradients */}
        <div style={{ position:"absolute",top:"-150px",left:"50%",transform:"translateX(-50%)",
          width:"1000px",height:"700px",
          background:"radial-gradient(ellipse at 50% 40%, rgba(99,102,241,.18) 0%, rgba(56,189,248,.08) 40%, transparent 70%)",
          pointerEvents:"none" }} />
        <div style={{ position:"absolute",top:"100px",left:"-100px",width:"500px",height:"500px",
          background:"radial-gradient(ellipse, rgba(139,92,246,.08) 0%, transparent 70%)",pointerEvents:"none" }} />
        <div style={{ position:"absolute",top:"100px",right:"-100px",width:"500px",height:"500px",
          background:"radial-gradient(ellipse, rgba(56,189,248,.07) 0%, transparent 70%)",pointerEvents:"none" }} />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-semibold mb-8"
          style={{ background:"rgba(99,102,241,.1)", border:"1px solid rgba(99,102,241,.2)", color:"#a5b4fc",
            boxShadow:"inset 0 1px 0 rgba(255,255,255,.08)" }}>
          <span style={{ width:6,height:6,borderRadius:"50%",background:"#818cf8",display:"inline-block",
            boxShadow:"0 0 10px #818cf8" }} />
          IA + WhatsApp + CRM — sem custo de contratação
        </div>

        {/* Headline */}
        <h1 style={{ fontSize:"clamp(36px,7vw,80px)", fontWeight:900, lineHeight:1.0,
          letterSpacing:"-3px", marginBottom:"28px", maxWidth:"900px" }}>
          <span style={{ color:"#f8fafc" }}>Sua empresa atendendo</span>
          <br />
          <span style={{
            background:"linear-gradient(135deg, #818cf8 0%, #38bdf8 50%, #34d399 100%)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          }}>clientes 24h no WhatsApp</span>
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
          <Link href="/registro"
            className="text-[15px] font-bold px-10 py-4 rounded-2xl transition-all"
            style={{
              background:"linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              color:"#fff",
              boxShadow:"0 0 0 1px rgba(99,102,241,.5), 0 0 40px rgba(99,102,241,.4), inset 0 1px 0 rgba(255,255,255,.2)",
              letterSpacing:"-0.3px",
            }}>
            Começar 30 dias grátis →
          </Link>
          <Link href="/login"
            className="text-[14px] font-semibold px-8 py-4 rounded-2xl transition-all"
            style={{
              background:"rgba(255,255,255,.04)",
              color:"rgba(148,163,184,.8)",
              border:"1px solid rgba(255,255,255,.1)",
              boxShadow:"inset 0 1px 0 rgba(255,255,255,.05)",
            }}>
            Já tenho conta
          </Link>
        </div>
        <p className="text-[12px]" style={{ color:"rgba(148,163,184,.35)" }}>
          Sem cartão de crédito · Cancele quando quiser
        </p>

        {/* Stats */}
        <div className="flex gap-8 mt-14 mb-20">
          {[
            { num:"24/7", label:"Atendimento", color:"#818cf8" },
            { num:"30s", label:"Resposta média", color:"#67e8f9" },
            { num:"10×", label:"Mais leads", color:"#34d399" },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-[28px] font-black" style={{ color:s.color, textShadow:`0 0 20px ${s.color}` }}>{s.num}</div>
              <div className="text-[11px] mt-0.5" style={{ color:"rgba(148,163,184,.4)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Dashboard mockup */}
        <DashboardMockup />
      </section>

      {/* ── FUNCIONALIDADES ─────────────────────────────────────────── */}
      <section id="funcionalidades" className="px-6 py-24 relative" style={{ zIndex:1 }}>
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
                {/* Icon */}
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

      {/* ── COMO FUNCIONA ───────────────────────────────────────────── */}
      <section className="px-6 py-24 relative" style={{ background:"rgba(255,255,255,.015)", zIndex:1 }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[12px] font-bold uppercase tracking-widest mb-4" style={{ color:"#38bdf8" }}>Simples assim</p>
            <h2 style={{ fontSize:"clamp(26px,4vw,44px)", fontWeight:800, letterSpacing:"-1.5px", color:"#f8fafc" }}>
              Do cadastro ao atendimento automático<br />em menos de 5 minutos
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

      {/* ── PREÇOS ──────────────────────────────────────────────────── */}
      <section id="preços" className="px-6 py-24 relative" style={{ zIndex:1 }}>
        <div style={{ position:"absolute",top:"20%",left:"50%",transform:"translateX(-50%)",
          width:"800px",height:"400px",
          background:"radial-gradient(ellipse, rgba(99,102,241,.1) 0%, transparent 70%)",pointerEvents:"none" }} />
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[12px] font-bold uppercase tracking-widest mb-4" style={{ color:"#a78bfa" }}>Preços</p>
            <h2 style={{ fontSize:"clamp(26px,4vw,44px)", fontWeight:800, letterSpacing:"-1.5px", color:"#f8fafc" }}>
              Planos simples, sem surpresas
            </h2>
            <p className="text-[14px] mt-3" style={{ color:"rgba(148,163,184,.5)" }}>
              Comece grátis por 30 dias. Sem cartão de crédito.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {planos.map(p => (
              <div key={p.nome} className="relative p-6 rounded-2xl flex flex-col"
                style={{
                  background: p.destaque
                    ? `linear-gradient(145deg, ${p.cor}18, ${p.cor}08)`
                    : "linear-gradient(145deg, rgba(255,255,255,.04), rgba(255,255,255,.01))",
                  border: `1px solid ${p.cor}${p.destaque ? "50" : "20"}`,
                  boxShadow: p.destaque ? `0 0 60px ${p.cor}20` : "none",
                }}>
                {p.destaque && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold px-4 py-1 rounded-full whitespace-nowrap"
                    style={{ background:`linear-gradient(135deg, ${p.cor}, ${p.cor}aa)`, color:"#fff",
                      boxShadow:`0 0 20px ${p.cor}60` }}>
                    MAIS POPULAR
                  </div>
                )}
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background:`${p.cor}18`, border:`1px solid ${p.cor}30` }}>
                      <div className="w-3 h-3 rounded-full" style={{ background:p.cor, boxShadow:`0 0 8px ${p.cor}` }} />
                    </div>
                    <span className="text-[15px] font-bold" style={{ color:"#f1f5f9" }}>{p.nome}</span>
                  </div>
                  <p className="text-[12px] mb-3" style={{ color:"rgba(148,163,184,.5)" }}>{p.desc}</p>
                  <div className="flex items-end gap-1">
                    <span style={{ fontSize:"34px", fontWeight:900, color:"#f8fafc", letterSpacing:"-1px" }}>{p.preco}</span>
                    <span className="text-[12px] mb-2" style={{ color:"rgba(148,163,184,.4)" }}>/mês no anual</span>
                  </div>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-[13px]" style={{ color:"rgba(148,163,184,.75)" }}>
                      <svg className="w-4 h-4 flex-shrink-0" style={{ color:p.cor }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={`/registro?plano=${p.nome.toUpperCase()}`}
                  className="block w-full py-3 text-[13px] font-bold text-center rounded-xl transition-all"
                  style={p.destaque ? {
                    background:`linear-gradient(135deg, ${p.cor}, ${p.cor}cc)`,
                    color:"#fff",
                    boxShadow:`0 0 30px ${p.cor}50, inset 0 1px 0 rgba(255,255,255,.2)`,
                    border:`1px solid ${p.cor}80`,
                  } : {
                    background:"rgba(255,255,255,.05)",
                    border:`1px solid ${p.cor}30`,
                    color:"rgba(148,163,184,.8)",
                  }}>
                  Começar grátis — 30 dias
                </Link>
              </div>
            ))}
          </div>

          {/* Garantia */}
          <div className="mt-8 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl max-w-md mx-auto"
            style={{ background:"rgba(52,211,153,.05)", border:"1px solid rgba(52,211,153,.12)" }}>
            <svg className="w-5 h-5 flex-shrink-0" style={{ color:"#34d399" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
            </svg>
            <p className="text-[12.5px]" style={{ color:"rgba(148,163,184,.65)" }}>
              <strong style={{ color:"#34d399" }}>30 dias grátis</strong> · Sem cartão · Cancele quando quiser
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────── */}
      <section id="faq" className="px-6 py-24 relative" style={{ background:"rgba(255,255,255,.015)", zIndex:1 }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[12px] font-bold uppercase tracking-widest mb-4" style={{ color:"#6366f1" }}>FAQ</p>
            <h2 style={{ fontSize:"clamp(24px,3.5vw,38px)", fontWeight:800, letterSpacing:"-1px", color:"#f8fafc" }}>
              Perguntas frequentes
            </h2>
          </div>
          <div className="space-y-3">
            {[
              { q:"Preciso de cartão para testar?", a:"Não. 30 dias grátis sem cartão de crédito. Só cobramos se você decidir continuar." },
              { q:"Funciona com qualquer WhatsApp?", a:"Sim. Conectamos via QR Code — qualquer número WhatsApp normal ou Business." },
              { q:"A IA responde sobre meus produtos?", a:"Sim. Você cadastra produtos, preços e horários. A IA usa essas informações para responder com precisão." },
              { q:"Posso cancelar quando quiser?", a:"Sim, sem multa, sem burocracia. Cancele pelo próprio sistema." },
            ].map(f => (
              <div key={f.q} className="p-5 rounded-2xl"
                style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)",
                  boxShadow:"inset 0 1px 0 rgba(255,255,255,.04)" }}>
                <h3 className="text-[14px] font-semibold mb-2" style={{ color:"#f1f5f9" }}>{f.q}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color:"rgba(148,163,184,.6)" }}>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────────── */}
      <section className="px-6 py-32 text-center relative overflow-hidden" style={{ zIndex:1 }}>
        <div style={{ position:"absolute",inset:0,
          background:"radial-gradient(ellipse 60% 70% at 50% 50%, rgba(99,102,241,.2) 0%, rgba(56,189,248,.08) 50%, transparent 75%)",
          pointerEvents:"none" }} />
        {/* Decorative stars */}
        {[["10%","20%"],["85%","15%"],["5%","80%"],["92%","75%"],["50%","5%"]].map(([l,t],i) => (
          <div key={i} style={{ position:"absolute",left:l,top:t,width:"4px",height:"4px",borderRadius:"50%",
            background:"rgba(165,180,252,.4)",boxShadow:"0 0 8px rgba(165,180,252,.6)",pointerEvents:"none" }} />
        ))}
        <p className="text-[12px] font-bold uppercase tracking-widest mb-6 relative" style={{ color:"#6366f1" }}>
          Comece hoje
        </p>
        <h2 className="relative" style={{ fontSize:"clamp(28px,5vw,60px)", fontWeight:900,
          letterSpacing:"-2px", marginBottom:"20px", lineHeight:1.05 }}>
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
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 relative" style={{ zIndex:1, borderTop:"1px solid rgba(255,255,255,.06)" }}>
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
