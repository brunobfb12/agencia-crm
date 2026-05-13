import { redirect } from "next/navigation";
import { getUsuarioLogado } from "@/lib/auth";
import Link from "next/link";

export default async function Home() {
  const usuario = await getUsuarioLogado();
  if (usuario) redirect("/dashboard");

  return <LandingPage />;
}

/* ── Dados ─────────────────────────────────────────────────────────── */
const features = [
  {
    icon: "💬",
    title: "IA responde no WhatsApp 24/7",
    desc: "Seu atendimento nunca para. A IA responde dúvidas, qualifica leads e agenda reuniões enquanto você dorme.",
  },
  {
    icon: "📊",
    title: "Kanban de Leads",
    desc: "Visualize todo o pipeline de vendas em um só lugar. Arraste e solte leads entre etapas com um clique.",
  },
  {
    icon: "🔁",
    title: "Follow-up Automático",
    desc: "Nunca mais esqueça de um cliente. O sistema envia follow-ups automáticos no momento certo.",
  },
  {
    icon: "🎂",
    title: "Aniversário Automático",
    desc: "Parabenize clientes no aniversário com mensagem personalizada. Fidelização no piloto automático.",
  },
  {
    icon: "📣",
    title: "Campanhas em Massa",
    desc: "Envie ofertas e promoções para toda a base de clientes com poucos cliques. Sem bloqueios.",
  },
  {
    icon: "📈",
    title: "Analytics Completo",
    desc: "Saiba exatamente quanto cada vendedor fatura, a taxa de conversão e onde os leads estão travando.",
  },
];

const steps = [
  {
    num: "01",
    title: "Crie sua conta grátis",
    desc: "Cadastro em 2 minutos, sem cartão de crédito. Você ganha 30 dias para testar tudo.",
  },
  {
    num: "02",
    title: "Conecte seu WhatsApp",
    desc: "Escaneie o QR Code dentro do sistema. Em menos de 1 minuto seu número está ativo.",
  },
  {
    num: "03",
    title: "A IA começa a atender",
    desc: "Configure as informações da sua empresa e a IA já sabe responder seus clientes automaticamente.",
  },
];

const depoimentos = [
  {
    nome: "Ph Íntima",
    cargo: "Moda Íntima Atacado",
    texto: "Antes perdíamos clientes que mandavam mensagem fora do horário. Agora a IA responde na hora e marca a visita.",
  },
  {
    nome: "Opus Automotivo",
    cargo: "Estúdio Automotivo",
    texto: "Os orçamentos chegam qualificados. A IA já filtra quem realmente quer o serviço antes de chegar pra gente.",
  },
  {
    nome: "Hoken",
    cargo: "Purificadores e Refil",
    texto: "Triplicamos o volume de atendimentos sem contratar ninguém. O follow-up automático virou rotina.",
  },
];

const faqs = [
  {
    q: "Preciso de cartão de crédito para testar?",
    a: "Não. Os 30 dias de teste são totalmente gratuitos e sem necessidade de cartão. Só pedimos pagamento se você decidir continuar.",
  },
  {
    q: "Funciona com meu número de WhatsApp normal?",
    a: "Sim. Conectamos qualquer número WhatsApp ou WhatsApp Business via QR Code. Sem precisar de API oficial.",
  },
  {
    q: "A IA consegue responder sobre meus produtos?",
    a: "Sim. Você cadastra as informações da sua empresa — produtos, preços, horários, formas de pagamento — e a IA usa esses dados para responder com precisão.",
  },
  {
    q: "O que acontece depois dos 30 dias?",
    a: "Você escolhe um plano e insere o pagamento. Se não quiser continuar, sua conta fica pausada e você não é cobrado.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim, sem multa e sem burocracia. Cancele quando quiser pelo próprio sistema.",
  },
];

/* ── Componente principal ───────────────────────────────────────────── */
function LandingPage() {
  return (
    <div style={{ background: "#08080e", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          background: "rgba(8,8,14,.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,.06)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6366f1, #38bdf8)", boxShadow: "0 4px 12px rgba(99,102,241,.45)" }}
          >
            <svg className="w-[16px] h-[16px] text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/>
            </svg>
          </div>
          <span className="text-[17px] font-bold gradient-text">FácilCRM</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-[13px] font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ color: "rgba(148,163,184,.7)" }}
          >
            Entrar
          </Link>
          <Link
            href="/registro"
            className="btn-primary text-[13px] px-5 py-2"
          >
            Testar grátis
          </Link>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center text-center px-6 pt-24 pb-20" style={{ position: "relative", overflow: "hidden" }}>
        {/* glow */}
        <div style={{
          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          width: "600px", height: "400px",
          background: "radial-gradient(ellipse, rgba(99,102,241,.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-semibold mb-6"
          style={{ background: "rgba(99,102,241,.12)", border: "1px solid rgba(99,102,241,.25)", color: "#a5b4fc" }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#818cf8", display: "inline-block" }} />
          IA + WhatsApp + CRM em um só lugar
        </div>

        <h1
          className="text-[40px] sm:text-[56px] font-black leading-tight mb-6 max-w-3xl"
          style={{ color: "#f1f5f9", letterSpacing: "-1.5px" }}
        >
          Sua empresa atendendo{" "}
          <span className="gradient-text">clientes 24h</span>{" "}
          no WhatsApp — sem contratar ninguém
        </h1>

        <p
          className="text-[16px] sm:text-[18px] leading-relaxed mb-10 max-w-xl"
          style={{ color: "rgba(148,163,184,.7)" }}
        >
          IA que responde, qualifica e agenda. CRM que organiza leads e dispara follow-ups.
          Tudo integrado ao seu WhatsApp em menos de 5 minutos.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/registro"
            className="btn-primary text-[15px] px-8 py-3.5"
          >
            Começar 30 dias grátis →
          </Link>
          <p className="text-[12px]" style={{ color: "rgba(148,163,184,.4)" }}>
            Sem cartão de crédito · Cancele quando quiser
          </p>
        </div>

        {/* stats */}
        <div className="flex gap-10 mt-16">
          {[
            { num: "24/7", label: "Atendimento automático" },
            { num: "30s",  label: "Tempo médio de resposta" },
            { num: "10×",  label: "Mais leads qualificados" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-[26px] font-black gradient-text">{s.num}</div>
              <div className="text-[11px] mt-0.5" style={{ color: "rgba(148,163,184,.45)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMO FUNCIONA ───────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-[28px] sm:text-[34px] font-bold mb-3" style={{ color: "#f1f5f9" }}>
              Do cadastro ao atendimento automático<br />em menos de 5 minutos
            </h2>
            <p className="text-[14px]" style={{ color: "rgba(148,163,184,.5)" }}>
              Sem configuração técnica. Sem código. Só escanear um QR Code.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <div
                key={s.num}
                className="p-6 rounded-2xl"
                style={{
                  background: "linear-gradient(145deg, rgba(255,255,255,.05), rgba(255,255,255,.02))",
                  border: "1px solid rgba(255,255,255,.07)",
                  position: "relative",
                }}
              >
                {i < steps.length - 1 && (
                  <div
                    className="hidden md:block absolute top-10 -right-3 z-10 text-[18px]"
                    style={{ color: "rgba(148,163,184,.2)" }}
                  >→</div>
                )}
                <div className="text-[32px] font-black mb-3 gradient-text opacity-40">{s.num}</div>
                <h3 className="text-[15px] font-bold mb-2" style={{ color: "#f1f5f9" }}>{s.title}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: "rgba(148,163,184,.6)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────── */}
      <section className="px-6 py-20" style={{ background: "rgba(255,255,255,.015)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-[28px] sm:text-[34px] font-bold mb-3" style={{ color: "#f1f5f9" }}>
              Tudo que sua empresa precisa para<br />
              <span className="gradient-text">vender mais sem trabalhar mais</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-5 rounded-2xl"
                style={{
                  background: "linear-gradient(145deg, rgba(255,255,255,.05), rgba(255,255,255,.02))",
                  border: "1px solid rgba(255,255,255,.07)",
                }}
              >
                <div className="text-[28px] mb-3">{f.icon}</div>
                <h3 className="text-[14px] font-bold mb-1.5" style={{ color: "#f1f5f9" }}>{f.title}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: "rgba(148,163,184,.6)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ─────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-[28px] sm:text-[34px] font-bold mb-3" style={{ color: "#f1f5f9" }}>
              Empresas que já transformaram<br />seu atendimento
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {depoimentos.map((d) => (
              <div
                key={d.nome}
                className="p-6 rounded-2xl"
                style={{
                  background: "linear-gradient(145deg, rgba(99,102,241,.08), rgba(56,189,248,.04))",
                  border: "1px solid rgba(99,102,241,.15)",
                }}
              >
                <div className="text-[22px] mb-3" style={{ color: "#818cf8" }}>"</div>
                <p className="text-[13px] leading-relaxed mb-4" style={{ color: "rgba(148,163,184,.8)" }}>
                  {d.texto}
                </p>
                <div>
                  <div className="text-[13px] font-bold" style={{ color: "#f1f5f9" }}>{d.nome}</div>
                  <div className="text-[11px]" style={{ color: "rgba(148,163,184,.4)" }}>{d.cargo}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PREÇOS ──────────────────────────────────────────────────── */}
      <section className="px-6 py-20" style={{ background: "rgba(255,255,255,.015)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-[28px] sm:text-[34px] font-bold mb-3" style={{ color: "#f1f5f9" }}>
            Planos simples, sem surpresas
          </h2>
          <p className="text-[14px] mb-10" style={{ color: "rgba(148,163,184,.5)" }}>
            Comece grátis por 30 dias. Sem cartão de crédito.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { nome: "Starter", preco: "R$ 197", periodo: "/mês no anual", features: ["1 WhatsApp", "IA 24/7", "Até 1.000 clientes", "Follow-up automático"], destaque: false },
              { nome: "Pro", preco: "R$ 330", periodo: "/mês no anual", features: ["2 WhatsApp", "IA 24/7", "Clientes ilimitados", "Campanhas em massa", "Analytics completo"], destaque: true },
              { nome: "Agency", preco: "R$ 664", periodo: "/mês no anual", features: ["5 empresas", "WhatsApp ilimitados", "Tudo do Pro", "Suporte prioritário"], destaque: false },
            ].map((p) => (
              <div
                key={p.nome}
                className="p-6 rounded-2xl flex flex-col"
                style={{
                  background: p.destaque
                    ? "linear-gradient(145deg, rgba(99,102,241,.15), rgba(56,189,248,.08))"
                    : "linear-gradient(145deg, rgba(255,255,255,.05), rgba(255,255,255,.02))",
                  border: p.destaque ? "1px solid rgba(99,102,241,.4)" : "1px solid rgba(255,255,255,.08)",
                  boxShadow: p.destaque ? "0 0 40px rgba(99,102,241,.15)" : "none",
                  position: "relative",
                }}
              >
                {p.destaque && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap"
                    style={{ background: "linear-gradient(90deg, #6366f1, #38bdf8)", color: "#fff" }}
                  >
                    MAIS POPULAR
                  </div>
                )}
                <div className="mb-4">
                  <div className="text-[15px] font-bold mb-2" style={{ color: "#f1f5f9" }}>{p.nome}</div>
                  <div className="flex items-end gap-1">
                    <span className="text-[28px] font-black" style={{ color: "#f1f5f9" }}>{p.preco}</span>
                    <span className="text-[12px] mb-1" style={{ color: "rgba(148,163,184,.5)" }}>{p.periodo}</span>
                  </div>
                </div>
                <ul className="space-y-2 flex-1 mb-5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[12.5px]" style={{ color: "rgba(148,163,184,.75)" }}>
                      <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#34d399" }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/registro"
                  className={p.destaque ? "btn-primary w-full py-2.5 text-[13px] text-center block" : "block w-full py-2.5 text-[13px] text-center font-semibold rounded-xl transition-all"}
                  style={!p.destaque ? {
                    background: "rgba(255,255,255,.06)",
                    border: "1px solid rgba(255,255,255,.12)",
                    color: "#f1f5f9",
                  } : {}}
                >
                  Começar grátis
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-[28px] font-bold text-center mb-12" style={{ color: "#f1f5f9" }}>
            Perguntas frequentes
          </h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <div
                key={f.q}
                className="p-5 rounded-2xl"
                style={{
                  background: "linear-gradient(145deg, rgba(255,255,255,.04), rgba(255,255,255,.02))",
                  border: "1px solid rgba(255,255,255,.07)",
                }}
              >
                <h3 className="text-[14px] font-semibold mb-2" style={{ color: "#f1f5f9" }}>{f.q}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: "rgba(148,163,184,.6)" }}>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────────── */}
      <section
        className="px-6 py-24 text-center"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(99,102,241,.12) 0%, transparent 70%)",
        }}
      >
        <h2 className="text-[30px] sm:text-[42px] font-black mb-4 max-w-2xl mx-auto" style={{ color: "#f1f5f9", letterSpacing: "-1px" }}>
          Pronto para atender clientes<br />
          <span className="gradient-text">24h no WhatsApp?</span>
        </h2>
        <p className="text-[15px] mb-10" style={{ color: "rgba(148,163,184,.6)" }}>
          Teste grátis por 30 dias. Sem cartão. Cancele quando quiser.
        </p>
        <Link href="/registro" className="btn-primary text-[15px] px-10 py-4">
          Começar agora — é grátis →
        </Link>
        <p className="text-[12px] mt-4" style={{ color: "rgba(148,163,184,.3)" }}>
          Mais de 10 empresas já usam o FácilCRM
        </p>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer
        className="px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ borderTop: "1px solid rgba(255,255,255,.06)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6366f1, #38bdf8)" }}
          >
            <svg className="w-[12px] h-[12px] text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/>
            </svg>
          </div>
          <span className="text-[13px] font-semibold gradient-text">FácilCRM</span>
        </div>
        <div className="flex gap-6 text-[12px]" style={{ color: "rgba(148,163,184,.4)" }}>
          <Link href="/login" style={{ color: "rgba(148,163,184,.4)" }}>Entrar</Link>
          <Link href="/registro" style={{ color: "rgba(148,163,184,.4)" }}>Cadastro</Link>
          <a href="https://wa.me/5562985974090" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(148,163,184,.4)" }}>Suporte</a>
        </div>
        <p className="text-[11px]" style={{ color: "rgba(148,163,184,.25)" }}>
          © {new Date().getFullYear()} FácilCRM · Powered by Claude AI
        </p>
      </footer>

    </div>
  );
}
