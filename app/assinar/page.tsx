"use client";

import { useState } from "react";

type Ciclo = "mensal" | "anual";

const planos = [
  {
    nome: "Starter",
    descricao: "Para empresas que estão começando",
    mensal: 297,
    anual: 2370,
    anualMes: 197,
    features: [
      "1 WhatsApp conectado",
      "IA respondendo clientes 24/7",
      "Kanban de leads",
      "Follow-up automático",
      "Até 1.000 clientes",
      "30 dias grátis para testar",
    ],
    destaque: false,
    cta: "Começar agora",
  },
  {
    nome: "Pro",
    descricao: "Para empresas em crescimento",
    mensal: 497,
    anual: 3970,
    anualMes: 330,
    features: [
      "Até 2 WhatsApp conectados",
      "IA respondendo clientes 24/7",
      "Kanban de leads",
      "Follow-up automático",
      "Clientes ilimitados",
      "Campanhas em massa",
      "Analytics completo",
      "30 dias grátis para testar",
    ],
    destaque: true,
    cta: "Começar agora",
  },
  {
    nome: "Agency",
    descricao: "Para agências com múltiplas empresas",
    mensal: 997,
    anual: 7970,
    anualMes: 664,
    features: [
      "Até 5 empresas",
      "WhatsApp ilimitados",
      "IA respondendo clientes 24/7",
      "Tudo do Pro",
      "Suporte prioritário",
      "Onboarding assistido",
      "30 dias grátis para testar",
    ],
    destaque: false,
    cta: "Começar agora",
  },
];

export default function AssinarPage() {
  const [ciclo, setCiclo] = useState<Ciclo>("anual");
  const [loadingPlano, setLoadingPlano] = useState<string | null>(null);

  async function irParaCheckout(plano: string) {
    const key = `${plano}_${ciclo === "anual" ? "ANUAL" : "MENSAL"}`;
    setLoadingPlano(plano);
    try {
      const res = await fetch(`/api/assinatura/checkout?plano=${key}`);
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        window.open(
          "https://wa.me/5562985974090?text=" +
            encodeURIComponent(`Quero assinar o plano ${plano} ${ciclo} do FácilCRM`),
          "_blank"
        );
      }
    } catch {
      window.open("https://wa.me/5562985974090", "_blank");
    } finally {
      setLoadingPlano(null);
    }
  }

  return (
    <div className="min-h-full flex flex-col items-center p-6 py-12" style={{ background: "#08080e" }}>

      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
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
      <div className="text-center mb-8 max-w-xl">
        <div
          className="inline-block text-[12px] font-semibold px-3 py-1 rounded-full mb-4"
          style={{ background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.25)", color: "#f87171" }}
        >
          Período de teste encerrado
        </div>
        <h1 className="text-[28px] font-bold mb-3" style={{ color: "#f1f5f9" }}>
          Escolha seu plano para continuar
        </h1>
        <p className="text-[14px]" style={{ color: "rgba(148,163,184,.55)" }}>
          Sem cartão de crédito. Cancele quando quiser.
        </p>
      </div>

      {/* Toggle mensal / anual */}
      <div
        className="flex items-center gap-1 p-1 rounded-xl mb-10"
        style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" }}
      >
        {(["mensal", "anual"] as Ciclo[]).map((c) => (
          <button
            key={c}
            onClick={() => setCiclo(c)}
            className="relative px-5 py-2 rounded-lg text-[13px] font-semibold transition-all"
            style={{
              background: ciclo === c ? "linear-gradient(135deg, #6366f1, #38bdf8)" : "transparent",
              color: ciclo === c ? "#fff" : "rgba(148,163,184,.6)",
            }}
          >
            {c === "mensal" ? "Mensal" : "Anual"}
            {c === "anual" && (
              <span
                className="absolute -top-2.5 -right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: "#34d399", color: "#000" }}
              >
                -34%
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Planos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl">
        {planos.map((p) => {
          const preco = ciclo === "anual" ? p.anualMes : p.mensal;
          const precoExibido = `R$ ${preco.toLocaleString("pt-BR")}`;
          const chave = p.nome.toUpperCase();

          return (
            <div
              key={p.nome}
              className="rounded-2xl p-6 flex flex-col"
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

              <div className="mb-5">
                <h2 className="text-[16px] font-bold mb-1" style={{ color: "#f1f5f9" }}>{p.nome}</h2>
                <p className="text-[12px] mb-3" style={{ color: "rgba(148,163,184,.5)" }}>{p.descricao}</p>
                <div className="flex items-end gap-1">
                  <span className="text-[30px] font-bold" style={{ color: "#f1f5f9" }}>{precoExibido}</span>
                  <span className="text-[13px] mb-1.5" style={{ color: "rgba(148,163,184,.5)" }}>/mês</span>
                </div>
                {ciclo === "anual" && (
                  <p className="text-[11px] mt-1" style={{ color: "rgba(148,163,184,.4)" }}>
                    Cobrado R$ {p.anual.toLocaleString("pt-BR")}/ano · 2 meses grátis
                  </p>
                )}
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

              <button
                onClick={() => irParaCheckout(chave)}
                disabled={loadingPlano === chave}
                className={p.destaque ? "btn-primary w-full py-3 text-[14px]" : "w-full py-3 text-[14px]"}
                style={!p.destaque ? {
                  background: "rgba(255,255,255,.06)",
                  border: "1px solid rgba(255,255,255,.12)",
                  color: "#f1f5f9",
                  borderRadius: "10px",
                  fontWeight: 600,
                  cursor: "pointer",
                } : {}}
              >
                {loadingPlano === chave ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Redirecionando...
                  </span>
                ) : p.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* Garantia */}
      <div
        className="mt-10 flex items-center gap-3 px-6 py-4 rounded-2xl max-w-md text-center"
        style={{ background: "rgba(52,211,153,.06)", border: "1px solid rgba(52,211,153,.15)" }}
      >
        <svg className="w-8 h-8 flex-shrink-0" style={{ color: "#34d399" }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
        <p className="text-[13px]" style={{ color: "rgba(148,163,184,.7)" }}>
          <strong style={{ color: "#34d399" }}>30 dias grátis</strong>, sem cartão de crédito.
          Só cobramos se você decidir continuar.
        </p>
      </div>

      <p className="text-center text-[12px] mt-6" style={{ color: "rgba(148,163,184,.3)" }}>
        Dúvidas?{" "}
        <a href="https://wa.me/5562985974090" target="_blank" rel="noopener noreferrer"
          className="underline" style={{ color: "rgba(148,163,184,.5)" }}>
          Fale conosco
        </a>
      </p>
    </div>
  );
}
