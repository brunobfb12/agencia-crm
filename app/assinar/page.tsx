"use client";

import Link from "next/link";

const planos = [
  {
    nome: "Starter",
    preco: "R$ 97",
    periodo: "/mês",
    descricao: "Para empresas que estão começando",
    features: [
      "1 WhatsApp conectado",
      "IA respondendo 24/7",
      "Kanban de leads",
      "Follow-up automático",
      "Até 500 clientes",
    ],
    destaque: false,
    cta: "Assinar Starter",
  },
  {
    nome: "Pro",
    preco: "R$ 197",
    periodo: "/mês",
    descricao: "Para empresas em crescimento",
    features: [
      "Até 2 WhatsApp conectados",
      "IA respondendo 24/7",
      "Kanban de leads",
      "Follow-up automático",
      "Clientes ilimitados",
      "Campanhas em massa",
      "Analytics completo",
    ],
    destaque: true,
    cta: "Assinar Pro",
  },
  {
    nome: "Agency",
    preco: "R$ 497",
    periodo: "/mês",
    descricao: "Para agências e múltiplas empresas",
    features: [
      "Até 5 empresas",
      "WhatsApp ilimitados",
      "IA respondendo 24/7",
      "Tudo do Pro",
      "Suporte prioritário",
      "Onboarding assistido",
    ],
    destaque: false,
    cta: "Assinar Agency",
  },
];

export default function AssinarPage() {
  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 py-12" style={{ background: "#08080e" }}>

      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #6366f1, #38bdf8)", boxShadow: "0 4px 14px rgba(99,102,241,.5)" }}
        >
          <svg className="w-[18px] h-[18px] text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
            <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/>
          </svg>
        </div>
        <span className="text-[20px] font-bold gradient-text">FácilCRM</span>
      </div>

      {/* Header */}
      <div className="text-center mb-10 max-w-xl">
        <div
          className="inline-block text-[12px] font-semibold px-3 py-1 rounded-full mb-4"
          style={{ background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.25)", color: "#f87171" }}
        >
          Período de teste encerrado
        </div>
        <h1 className="text-[30px] font-bold mb-3" style={{ color: "#f1f5f9" }}>
          Escolha seu plano para continuar
        </h1>
        <p className="text-[14px]" style={{ color: "rgba(148,163,184,.55)" }}>
          Continue usando o FácilCRM com IA respondendo seus clientes 24/7.
          Cancele quando quiser.
        </p>
      </div>

      {/* Planos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl">
        {planos.map((p) => (
          <div
            key={p.nome}
            className="rounded-2xl p-6 flex flex-col"
            style={{
              background: p.destaque
                ? "linear-gradient(145deg, rgba(99,102,241,.15), rgba(56,189,248,.08))"
                : "linear-gradient(145deg, rgba(255,255,255,.05), rgba(255,255,255,.02))",
              border: p.destaque
                ? "1px solid rgba(99,102,241,.4)"
                : "1px solid rgba(255,255,255,.08)",
              boxShadow: p.destaque ? "0 0 40px rgba(99,102,241,.15)" : "none",
              position: "relative",
            }}
          >
            {p.destaque && (
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold px-3 py-1 rounded-full"
                style={{ background: "linear-gradient(90deg, #6366f1, #38bdf8)", color: "#fff" }}
              >
                MAIS POPULAR
              </div>
            )}

            <div className="mb-5">
              <h2 className="text-[16px] font-bold mb-1" style={{ color: "#f1f5f9" }}>{p.nome}</h2>
              <p className="text-[12px] mb-3" style={{ color: "rgba(148,163,184,.5)" }}>{p.descricao}</p>
              <div className="flex items-end gap-1">
                <span className="text-[32px] font-bold" style={{ color: "#f1f5f9" }}>{p.preco}</span>
                <span className="text-[13px] mb-1.5" style={{ color: "rgba(148,163,184,.5)" }}>{p.periodo}</span>
              </div>
            </div>

            <ul className="space-y-2.5 flex-1 mb-6">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-[13px]" style={{ color: "rgba(148,163,184,.8)" }}>
                  <svg className="w-4 h-4 flex-shrink-0" style={{ color: "#34d399" }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>

            <a
              href={`https://wa.me/5562985974090?text=${encodeURIComponent(`Olá! Quero assinar o plano ${p.nome} do FácilCRM.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={p.destaque ? "btn-primary w-full py-3 text-[14px] text-center block" : "btn-secondary w-full py-3 text-[14px] text-center block"}
              style={!p.destaque ? {
                background: "rgba(255,255,255,.06)",
                border: "1px solid rgba(255,255,255,.12)",
                color: "#f1f5f9",
                borderRadius: "10px",
                fontWeight: 600,
                cursor: "pointer",
              } : {}}
            >
              {p.cta}
            </a>
          </div>
        ))}
      </div>

      <p className="text-center text-[12px] mt-8" style={{ color: "rgba(148,163,184,.3)" }}>
        Dúvidas?{" "}
        <a
          href="https://wa.me/5562985974090"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
          style={{ color: "rgba(148,163,184,.5)" }}
        >
          Fale conosco
        </a>
      </p>
    </div>
  );
}
