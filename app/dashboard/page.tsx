"use client";

import { useEffect, useState } from "react";

interface Stats {
  totalClientes: number;
  totalLeads: number;
  leadsAtivos: number;
  vendasRealizadas: number;
  agendamentosPendentes: number;
  leadsPorStatus: { status: string; _count: { status: number } }[];
}

const STATUS_META: Record<string, { label: string; color: string; glow: string; bar: string }> = {
  LEAD:                { label: "Novos Leads",      color: "#94a3b8", glow: "rgba(148,163,184,.3)",  bar: "#475569" },
  AQUECIMENTO:         { label: "Aquecimento",       color: "#fb923c", glow: "rgba(251,146,60,.3)",   bar: "#ea580c" },
  PRONTO_PARA_COMPRAR: { label: "Pronto p/ Comprar", color: "#fbbf24", glow: "rgba(251,191,36,.3)",   bar: "#d97706" },
  NEGOCIACAO:          { label: "Em Negociação",     color: "#60a5fa", glow: "rgba(96,165,250,.3)",   bar: "#2563eb" },
  VENDA_REALIZADA:     { label: "Venda Realizada",   color: "#34d399", glow: "rgba(52,211,153,.3)",   bar: "#059669" },
  POS_VENDA:           { label: "Pós-Venda",         color: "#c084fc", glow: "rgba(192,132,252,.3)",  bar: "#9333ea" },
  FOLLOW_UP:           { label: "Follow-up",         color: "#22d3ee", glow: "rgba(34,211,238,.3)",   bar: "#0891b2" },
  SEM_RESPOSTA:        { label: "Sem Resposta",      color: "#fbbf24", glow: "rgba(251,191,36,.25)",  bar: "#92400e" },
  SEM_INTERESSE:       { label: "Sem Interesse",     color: "#fb7185", glow: "rgba(251,113,133,.25)", bar: "#be123c" },
  PERDIDO:             { label: "Perdidos",          color: "#f87171", glow: "rgba(248,113,113,.3)",  bar: "#dc2626" },
};

const METRIC_CARDS = [
  {
    key: "totalClientes",
    label: "Total de Clientes",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm8 10v-2a4 4 0 00-3-3.87M23 21v-2a4 4 0 00-3-3.87" />
      </svg>
    ),
    gradient: "linear-gradient(135deg, rgba(96,165,250,.12), rgba(59,130,246,.04))",
    border: "rgba(96,165,250,.2)",
    iconColor: "#60a5fa",
    iconBg: "rgba(96,165,250,.1)",
  },
  {
    key: "leadsAtivos",
    label: "Leads Ativos",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    gradient: "linear-gradient(135deg, rgba(251,146,60,.12), rgba(245,101,1,.04))",
    border: "rgba(251,146,60,.2)",
    iconColor: "#fb923c",
    iconBg: "rgba(251,146,60,.1)",
  },
  {
    key: "vendasRealizadas",
    label: "Vendas Realizadas",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    gradient: "linear-gradient(135deg, rgba(52,211,153,.12), rgba(16,185,129,.04))",
    border: "rgba(52,211,153,.2)",
    iconColor: "#34d399",
    iconBg: "rgba(52,211,153,.1)",
  },
  {
    key: "agendamentosPendentes",
    label: "Agendamentos",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
    gradient: "linear-gradient(135deg, rgba(192,132,252,.12), rgba(147,51,234,.04))",
    border: "rgba(192,132,252,.2)",
    iconColor: "#c084fc",
    iconBg: "rgba(192,132,252,.1)",
  },
];

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const steps = 24;
    const inc = value / steps;
    let curr = 0;
    const iv = setInterval(() => {
      curr += inc;
      if (curr >= value) { setDisplay(value); clearInterval(iv); }
      else setDisplay(Math.floor(curr));
    }, 28);
    return () => clearInterval(iv);
  }, [value]);
  return <>{display.toLocaleString("pt-BR")}</>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const maxCount = stats?.leadsPorStatus
    ? Math.max(...stats.leadsPorStatus.map((x) => x._count.status), 1)
    : 1;

  return (
    <div className="h-full overflow-y-auto" style={{ background: "#08080e" }}>
      <div className="p-8 max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <span
            className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full mb-3"
            style={{ background: "rgba(99,102,241,.1)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,.18)" }}
          >
            Visão Geral
          </span>
          <h1 className="text-[28px] font-bold tracking-tight" style={{ color: "#f1f5f9" }}>
            Painel de Controle
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "rgba(148,163,184,.55)" }}>
            Resumo em tempo real de todas as empresas
          </p>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {METRIC_CARDS.map((card, i) => {
            const value = stats ? (stats[card.key as keyof Stats] as number) : 0;
            return (
              <div
                key={card.key}
                className="bento-card p-5 animate-fade-up"
                style={{
                  background: card.gradient,
                  borderColor: card.border,
                  animationDelay: `${i * 55}ms`,
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: card.iconBg, color: card.iconColor }}
                  >
                    {card.icon}
                  </div>
                </div>
                {loading ? (
                  <div className="shimmer h-8 w-14 rounded-lg mb-1" />
                ) : (
                  <div
                    className="text-[30px] font-bold tracking-tight leading-none"
                    style={{ color: card.iconColor }}
                  >
                    <AnimatedNumber value={value} />
                  </div>
                )}
                <p className="text-[11.5px] font-medium mt-1.5" style={{ color: "rgba(148,163,184,.65)" }}>
                  {card.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Funil */}
        <div className="bento-card p-6 animate-fade-up" style={{ animationDelay: "220ms" }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[15px] font-semibold" style={{ color: "#f1f5f9" }}>Funil de Leads</h2>
              <p className="text-[12px] mt-0.5" style={{ color: "rgba(148,163,184,.45)" }}>Distribuição por status</p>
            </div>
            {stats?.totalLeads ? (
              <span
                className="text-[11.5px] font-semibold px-3 py-1 rounded-full"
                style={{ background: "rgba(99,102,241,.1)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,.18)" }}
              >
                {stats.totalLeads} total
              </span>
            ) : null}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[85, 70, 55, 40, 60].map((w, i) => (
                <div key={i} className="shimmer h-8 rounded-xl" style={{ width: `${w}%` }} />
              ))}
            </div>
          ) : stats?.leadsPorStatus?.length ? (
            <div className="space-y-2">
              {[...stats.leadsPorStatus]
                .sort((a, b) => b._count.status - a._count.status)
                .map((item, idx) => {
                  const meta = STATUS_META[item.status];
                  const pct = Math.round((item._count.status / maxCount) * 100);
                  return (
                    <div key={item.status} className="flex items-center gap-3 animate-fade-up" style={{ animationDelay: `${idx * 35}ms` }}>
                      <span
                        className="text-[11.5px] font-semibold shrink-0 w-[148px]"
                        style={{ color: meta?.color ?? "#94a3b8" }}
                      >
                        {meta?.label ?? item.status}
                      </span>
                      <div className="flex-1 h-7 rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,.04)" }}>
                        <div
                          className="h-full rounded-xl flex items-center px-3"
                          style={{
                            width: `${Math.max(pct, 6)}%`,
                            background: `linear-gradient(90deg, ${meta?.bar ?? "#475569"}, ${meta?.color ?? "#94a3b8"})`,
                            boxShadow: `0 0 10px ${meta?.glow ?? "rgba(148,163,184,.2)"}`,
                            transition: "width .8s cubic-bezier(.34,1.2,.64,1)",
                          }}
                        >
                          <span className="text-[11px] font-bold" style={{ color: "rgba(255,255,255,.9)" }}>
                            {item._count.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-3" style={{ color: "rgba(148,163,184,.3)" }}>
              <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-[13px]">Nenhum lead ainda. Conecte os WhatsApps para começar.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
