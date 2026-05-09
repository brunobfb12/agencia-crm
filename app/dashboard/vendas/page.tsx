"use client";

import { useEffect, useState } from "react";

interface VendaRecente {
  id: string;
  clienteNome: string;
  vendedorNome: string;
  valor: number | null;
  descricao: string | null;
  criadoEm: string;
}

interface RankingItem {
  nome: string;
  totalVendas: number;
  faturamento: number;
}

interface VendasData {
  totalFaturado: number;
  totalVendas: number;
  ticketMedio: number;
  taxaConversao: number;
  rankingVendedores: RankingItem[];
  vendasRecentes: VendaRecente[];
}

type Periodo = "hoje" | "semana" | "mes" | "ano" | "custom";

const PERIODOS: { key: Periodo; label: string }[] = [
  { key: "hoje",   label: "Hoje"         },
  { key: "semana", label: "7 dias"       },
  { key: "mes",    label: "Este mês"     },
  { key: "ano",    label: "Este ano"     },
  { key: "custom", label: "Personalizado" },
];

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function VendasPage() {
  const [periodo, setPeriodo]   = useState<Periodo>("mes");
  const [dataInicio, setInicio] = useState(() => {
    const d = new Date(); d.setDate(1); return toInputDate(d);
  });
  const [dataFim, setFim]       = useState(() => toInputDate(new Date()));
  const [data, setData]         = useState<VendasData | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (periodo === "custom" && (!dataInicio || !dataFim)) return;
    setLoading(true);
    const url = periodo === "custom"
      ? `/api/dashboard/vendas?de=${dataInicio}&ate=${dataFim}`
      : `/api/dashboard/vendas?periodo=${periodo}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [periodo, dataInicio, dataFim]);

  const cards = [
    {
      label: "Total Faturado",
      value: data ? fmt(data.totalFaturado) : "—",
      gradient: "linear-gradient(135deg, rgba(52,211,153,.12), rgba(16,185,129,.04))",
      border: "rgba(52,211,153,.2)",
      color: "#34d399",
      bg: "rgba(52,211,153,.1)",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Vendas Fechadas",
      value: data ? String(data.totalVendas) : "—",
      gradient: "linear-gradient(135deg, rgba(99,102,241,.12), rgba(79,70,229,.04))",
      border: "rgba(99,102,241,.2)",
      color: "#818cf8",
      bg: "rgba(99,102,241,.1)",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
    },
    {
      label: "Ticket Médio",
      value: data ? fmt(data.ticketMedio) : "—",
      gradient: "linear-gradient(135deg, rgba(251,191,36,.12), rgba(245,158,11,.04))",
      border: "rgba(251,191,36,.2)",
      color: "#fbbf24",
      bg: "rgba(251,191,36,.1)",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      label: "Taxa de Conversão",
      value: data ? `${data.taxaConversao.toFixed(1)}%` : "—",
      gradient: "linear-gradient(135deg, rgba(251,146,60,.12), rgba(245,101,1,.04))",
      border: "rgba(251,146,60,.2)",
      color: "#fb923c",
      bg: "rgba(251,146,60,.1)",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

  const btnStyle = (active: boolean) =>
    active
      ? { background: "rgba(52,211,153,.15)", color: "#34d399", border: "1px solid rgba(52,211,153,.3)" }
      : { background: "var(--card)", color: "var(--muted)", border: "1px solid var(--border)" };

  const inputStyle: React.CSSProperties = {
    background: "var(--card-2)",
    border: "1px solid var(--border-2)",
    color: "var(--text)",
    borderRadius: "8px",
    padding: "4px 10px",
    fontSize: "12.5px",
    outline: "none",
  };

  return (
    <div className="h-full overflow-y-auto" style={{ background: "var(--bg)" }}>
      <div className="p-8 max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <span
            className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full mb-3"
            style={{ background: "rgba(52,211,153,.1)", color: "#34d399", border: "1px solid rgba(52,211,153,.18)" }}
          >
            Desempenho
          </span>
          <h1 className="text-[28px] font-bold tracking-tight" style={{ color: "var(--text)" }}>Vendas</h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--muted-2)" }}>
            Faturamento, conversão e ranking de vendedores
          </p>
        </div>

        {/* Period filter */}
        <div className="flex flex-wrap items-center gap-2 mb-6 animate-fade-up">
          {PERIODOS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriodo(p.key)}
              className="px-4 py-1.5 rounded-full text-[12.5px] font-semibold transition-all"
              style={btnStyle(periodo === p.key)}
            >
              {p.label}
            </button>
          ))}

          {/* Date pickers — shown only when "Personalizado" is selected */}
          {periodo === "custom" && (
            <div className="flex items-center gap-2 ml-1 animate-fade-up">
              <input
                type="date"
                value={dataInicio}
                max={dataFim}
                onChange={(e) => setInicio(e.target.value)}
                style={inputStyle}
              />
              <span className="text-[12px]" style={{ color: "var(--muted-3)" }}>até</span>
              <input
                type="date"
                value={dataFim}
                min={dataInicio}
                max={toInputDate(new Date())}
                onChange={(e) => setFim(e.target.value)}
                style={inputStyle}
              />
            </div>
          )}
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {cards.map((card, i) => (
            <div
              key={card.label}
              className="bento-card p-5 animate-fade-up"
              style={{ background: card.gradient, borderColor: card.border, animationDelay: `${i * 55}ms` }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                style={{ background: card.bg, color: card.color }}
              >
                {card.icon}
              </div>
              {loading ? (
                <div className="shimmer h-8 w-20 rounded-lg" />
              ) : (
                <div className="text-[22px] font-bold tracking-tight leading-none" style={{ color: card.color }}>
                  {card.value}
                </div>
              )}
              <p className="text-[11.5px] font-medium mt-1.5" style={{ color: "var(--muted)" }}>
                {card.label}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Ranking de vendedores */}
          <div className="bento-card p-6 animate-fade-up" style={{ animationDelay: "220ms" }}>
            <h2 className="text-[15px] font-semibold mb-4" style={{ color: "var(--text)" }}>
              Ranking de Vendedores
            </h2>
            {loading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="shimmer h-14 rounded-xl" />)}</div>
            ) : !data?.rankingVendedores.length ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2" style={{ color: "var(--muted-3)" }}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <p className="text-[13px]">Nenhuma venda no período</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.rankingVendedores.map((v, i) => (
                  <div key={v.nome} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--card-2)" }}>
                    <span
                      className="text-[13px] font-bold w-5 text-center flex-shrink-0"
                      style={{ color: i === 0 ? "#fbbf24" : i === 1 ? "#94a3b8" : "var(--muted-3)" }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate" style={{ color: "var(--text)" }}>{v.nome}</p>
                      <p className="text-[11px]" style={{ color: "var(--muted-2)" }}>
                        {v.totalVendas} venda{v.totalVendas !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <span className="text-[13px] font-bold flex-shrink-0" style={{ color: "#34d399" }}>
                      {fmt(v.faturamento)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vendas recentes */}
          <div className="bento-card p-6 animate-fade-up" style={{ animationDelay: "275ms" }}>
            <h2 className="text-[15px] font-semibold mb-4" style={{ color: "var(--text)" }}>
              Vendas Recentes
            </h2>
            {loading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="shimmer h-16 rounded-xl" />)}</div>
            ) : !data?.vendasRecentes.length ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2" style={{ color: "var(--muted-3)" }}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-[13px]">Nenhuma venda no período</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[360px]">
                {data.vendasRecentes.map((v) => (
                  <div key={v.id} className="p-3 rounded-xl" style={{ background: "var(--card-2)" }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold truncate" style={{ color: "var(--text)" }}>
                          {v.clienteNome}
                        </p>
                        <p className="text-[11px]" style={{ color: "var(--muted-2)" }}>
                          {v.vendedorNome} · {new Date(v.criadoEm).toLocaleDateString("pt-BR")}
                        </p>
                        {v.descricao && (
                          <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--muted-3)" }}>
                            {v.descricao}
                          </p>
                        )}
                      </div>
                      {v.valor != null ? (
                        <span className="text-[13px] font-bold flex-shrink-0" style={{ color: "#34d399" }}>
                          {fmt(v.valor)}
                        </span>
                      ) : (
                        <span className="text-[11px] flex-shrink-0" style={{ color: "var(--muted-3)" }}>
                          s/ valor
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
