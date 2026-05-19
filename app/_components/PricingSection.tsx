"use client";

import { useState } from "react";
import Link from "next/link";

type Ciclo = "mensal" | "anual";

const planos = [
  {
    nome: "Starter",
    desc: "Para empresas que estão começando",
    mensal: 297,
    anualMes: 197,
    anual: 2370,
    cor: "#6366f1",
    destaque: false,
    features: [
      "1 WhatsApp conectado",
      "IA respondendo 24/7",
      "Kanban de leads",
      "Follow-up automático",
      "Até 1.000 clientes",
      "Aniversário automático",
    ],
  },
  {
    nome: "Pro",
    desc: "Para empresas em crescimento",
    mensal: 497,
    anualMes: 330,
    anual: 3970,
    cor: "#38bdf8",
    destaque: true,
    features: [
      "Até 2 WhatsApp conectados",
      "IA respondendo 24/7",
      "Kanban de leads",
      "Follow-up automático",
      "Clientes ilimitados",
      "Campanhas em massa",
      "Analytics completo",
      "Aniversário automático",
    ],
  },
  {
    nome: "Agency",
    desc: "Para agências e múltiplas empresas",
    mensal: 997,
    anualMes: 664,
    anual: 7970,
    cor: "#a78bfa",
    destaque: false,
    features: [
      "Até 5 empresas",
      "WhatsApp ilimitados",
      "Tudo do Pro",
      "Suporte prioritário",
      "Onboarding assistido",
      "Gerente de conta",
    ],
  },
];

export function PricingSection() {
  const [ciclo, setCiclo] = useState<Ciclo>("anual");

  return (
    <section id="preços" className="px-6 py-24 relative" style={{ zIndex: 1 }}>
      <div style={{
        position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
        width: "800px", height: "400px",
        background: "radial-gradient(ellipse, rgba(99,102,241,.1) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[12px] font-bold uppercase tracking-widest mb-4" style={{ color: "#a78bfa" }}>Preços</p>
          <h2 style={{ fontSize: "clamp(26px,4vw,44px)", fontWeight: 800, letterSpacing: "-1.5px", color: "#f8fafc" }}>
            Planos simples, sem surpresas
          </h2>
          <p className="text-[14px] mt-3 mb-8" style={{ color: "rgba(148,163,184,.5)" }}>
            Comece grátis por 30 dias. Sem cartão de crédito.
          </p>

          {/* Toggle mensal/anual */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl"
            style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" }}>
            {(["mensal", "anual"] as Ciclo[]).map(c => (
              <button
                key={c}
                onClick={() => setCiclo(c)}
                className="relative px-6 py-2 rounded-lg text-[13px] font-semibold transition-all"
                style={{
                  background: ciclo === c ? "linear-gradient(135deg, #6366f1, #38bdf8)" : "transparent",
                  color: ciclo === c ? "#fff" : "rgba(148,163,184,.6)",
                  cursor: "pointer",
                  border: "none",
                }}>
                {c === "mensal" ? "Mensal" : "Anual"}
                {c === "anual" && (
                  <span className="absolute -top-2.5 -right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: "#34d399", color: "#000" }}>
                    -34%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {planos.map(p => {
            const preco = ciclo === "anual" ? p.anualMes : p.mensal;
            return (
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
                    style={{ background: `linear-gradient(135deg, ${p.cor}, ${p.cor}aa)`, color: "#fff", boxShadow: `0 0 20px ${p.cor}60` }}>
                    MAIS POPULAR
                  </div>
                )}

                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: `${p.cor}18`, border: `1px solid ${p.cor}30` }}>
                      <div className="w-3 h-3 rounded-full" style={{ background: p.cor, boxShadow: `0 0 8px ${p.cor}` }} />
                    </div>
                    <span className="text-[16px] font-bold" style={{ color: "#f1f5f9" }}>{p.nome}</span>
                  </div>
                  <p className="text-[12px] mb-4" style={{ color: "rgba(148,163,184,.5)" }}>{p.desc}</p>
                  <div className="flex items-end gap-1">
                    <span style={{ fontSize: "34px", fontWeight: 900, color: "#f8fafc", letterSpacing: "-1px" }}>
                      R$ {preco.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-[12px] mb-2" style={{ color: "rgba(148,163,184,.4)" }}>/mês</span>
                  </div>
                  {ciclo === "anual" && (
                    <p className="text-[11px] mt-1" style={{ color: "rgba(52,211,153,.6)" }}>
                      Cobrado R$ {p.anual.toLocaleString("pt-BR")}/ano · 2 meses grátis
                    </p>
                  )}
                  {ciclo === "mensal" && (
                    <p className="text-[11px] mt-1" style={{ color: "rgba(148,163,184,.35)" }}>
                      No anual: R$ {p.anualMes}/mês · economize 34%
                    </p>
                  )}
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-[13px]" style={{ color: "rgba(148,163,184,.75)" }}>
                      <svg className="w-4 h-4 flex-shrink-0" style={{ color: p.cor }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link href={`/registro?plano=${p.nome.toUpperCase()}`}
                  className="block w-full py-3 text-[13px] font-bold text-center rounded-xl transition-all"
                  style={p.destaque ? {
                    background: `linear-gradient(135deg, ${p.cor}, ${p.cor}cc)`,
                    color: "#fff",
                    boxShadow: `0 0 30px ${p.cor}50, inset 0 1px 0 rgba(255,255,255,.2)`,
                    border: `1px solid ${p.cor}80`,
                  } : {
                    background: "rgba(255,255,255,.05)",
                    border: `1px solid ${p.cor}30`,
                    color: "rgba(148,163,184,.8)",
                  }}>
                  Começar grátis — 30 dias
                </Link>
              </div>
            );
          })}
        </div>

        {/* Garantia */}
        <div className="mt-8 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl max-w-md mx-auto"
          style={{ background: "rgba(52,211,153,.05)", border: "1px solid rgba(52,211,153,.12)" }}>
          <svg className="w-5 h-5 flex-shrink-0" style={{ color: "#34d399" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <p className="text-[12.5px]" style={{ color: "rgba(148,163,184,.65)" }}>
            <strong style={{ color: "#34d399" }}>30 dias grátis</strong> · Sem cartão · Cancele quando quiser
          </p>
        </div>
      </div>
    </section>
  );
}
