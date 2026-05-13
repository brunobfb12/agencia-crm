"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from "recharts";

/* ── Types ───────────────────────────────────────────────────────────── */
interface Kpis {
  totalLeads: number; vendasRealizadas: number;
  taxaConversao: number; receitaTotal: number; ticketMedio: number;
}
interface FunilItem  { status: string; label: string; count: number; hex: string; }
interface MesItem    { mes: string; vendas: number; receita: number; }
interface Vendedor   { nome: string; leads: number; vendas: number; receita: number; conversao: number; }
interface Analytics  { kpis: Kpis; funil: FunilItem[]; vendasPorMes: MesItem[]; ranking: Vendedor[]; }

/* ── Helpers ─────────────────────────────────────────────────────────── */
function fmt(v: number) { return v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
function fmtR(v: number) {
  if (v >= 1000) return `R$ ${(v / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`;
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/* ── Animated counter ────────────────────────────────────────────────── */
function useCounter(target: number, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    const steps = 30; const inc = target / steps; let cur = 0;
    const iv = setInterval(() => {
      cur += inc;
      if (cur >= target) { setVal(target); clearInterval(iv); } else setVal(Math.floor(cur));
    }, duration / steps);
    return () => clearInterval(iv);
  }, [target, duration]);
  return val;
}

/* ── KPI card ────────────────────────────────────────────────────────── */
function KpiCard({ label, value, sub, icon, gradient, border, iconColor, iconBg, prefix = "", suffix = "", delay = 0 }: {
  label: string; value: number; sub?: string; icon: React.ReactNode;
  gradient: string; border: string; iconColor: string; iconBg: string;
  prefix?: string; suffix?: string; delay?: number;
}) {
  const animated = useCounter(value);
  const display = prefix + fmt(animated) + suffix;

  return (
    <div
      className="rounded-2xl p-5 animate-fade-up flex flex-col gap-4"
      style={{ background: gradient, border: `1px solid ${border}`, animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: iconBg, color: iconColor }}>
          {icon}
        </div>
        {sub && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(255,255,255,.06)", color: "var(--muted)" }}>
            {sub}
          </span>
        )}
      </div>
      <div>
        <div className="text-[28px] font-bold tracking-tight leading-none" style={{ color: iconColor }}>
          {display}
        </div>
        <div className="text-[12px] mt-1.5 font-medium" style={{ color: "var(--muted)" }}>{label}</div>
      </div>
    </div>
  );
}

/* ── Custom tooltip ──────────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label, money = false }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; money?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2.5 shadow-xl"
      style={{ background: "rgba(15,15,25,.95)", border: "1px solid rgba(255,255,255,.10)", backdropFilter: "blur(12px)" }}>
      <p className="text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
            {money ? fmtR(p.value) : fmt(p.value)}
          </span>
          <span className="text-[11px]" style={{ color: "var(--muted-2)" }}>{p.name}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Period selector ─────────────────────────────────────────────────── */
const PERIODOS = [
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "90d", label: "90 dias" },
  { key: "all", label: "Tudo" },
];

/* ── Main page ───────────────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const [data, setData]       = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState("30d");

  const load = useCallback((p: string) => {
    setLoading(true);
    fetch(`/api/analytics?periodo=${p}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(periodo); }, [periodo, load]);

  const k = data?.kpis;
  const maxFunil = data ? Math.max(...data.funil.map(f => f.count), 1) : 1;

  return (
    <div className="h-full overflow-y-auto" style={{ background: "var(--bg)" }}>
      <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-fade-up">
          <div>
            <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full mb-2"
              style={{ background: "rgba(99,102,241,.1)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,.18)" }}>
              Analytics
            </span>
            <h1 className="text-[26px] font-bold tracking-tight" style={{ color: "var(--text)" }}>
              Painel de Performance
            </h1>
            <p className="text-[13px] mt-0.5" style={{ color: "var(--muted-2)" }}>
              Métricas e análises de conversão
            </p>
          </div>

          {/* Period pills */}
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            {PERIODOS.map(p => (
              <button key={p.key} onClick={() => setPeriodo(p.key)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
                style={periodo === p.key
                  ? { background: "rgba(99,102,241,.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,.3)" }
                  : { color: "var(--muted)", border: "1px solid transparent" }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          <KpiCard label="Total de Leads" value={k?.totalLeads ?? 0} delay={0}
            gradient="linear-gradient(135deg,rgba(96,165,250,.1),rgba(59,130,246,.03))"
            border="rgba(96,165,250,.18)" iconColor="#60a5fa" iconBg="rgba(96,165,250,.1)"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5.196-3.796M9 11a4 4 0 100-8 4 4 0 000 8zm0 2c-5 0-8 2.239-8 5v2h16v-2c0-2.761-3-5-8-5zm9-4a3 3 0 110-6 3 3 0 010 6z" /></svg>}
          />
          <KpiCard label="Vendas Realizadas" value={k?.vendasRealizadas ?? 0} delay={60}
            gradient="linear-gradient(135deg,rgba(52,211,153,.1),rgba(16,185,129,.03))"
            border="rgba(52,211,153,.18)" iconColor="#34d399" iconBg="rgba(52,211,153,.1)"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <KpiCard label="Taxa de Conversão" value={Math.round(k?.taxaConversao ?? 0)} suffix="%" delay={120}
            gradient="linear-gradient(135deg,rgba(251,146,60,.1),rgba(245,101,1,.03))"
            border="rgba(251,146,60,.18)" iconColor="#fb923c" iconBg="rgba(251,146,60,.1)"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          />
          <KpiCard label="Receita Total" value={Math.round(k?.receitaTotal ?? 0)} prefix="R$ " delay={180}
            gradient="linear-gradient(135deg,rgba(192,132,252,.1),rgba(147,51,234,.03))"
            border="rgba(192,132,252,.18)" iconColor="#c084fc" iconBg="rgba(192,132,252,.1)"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <KpiCard label="Ticket Médio" value={Math.round(k?.ticketMedio ?? 0)} prefix="R$ " delay={240}
            gradient="linear-gradient(135deg,rgba(34,211,238,.1),rgba(6,182,212,.03))"
            border="rgba(34,211,238,.18)" iconColor="#22d3ee" iconBg="rgba(34,211,238,.1)"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" /></svg>}
          />
        </div>

        {/* ── Charts row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Vendas por mês — AreaChart */}
          <div className="lg:col-span-2 rounded-2xl p-6 animate-fade-up"
            style={{ background: "var(--card)", border: "1px solid var(--border)", animationDelay: "300ms" }}>
            <div className="mb-5">
              <h2 className="text-[14px] font-semibold" style={{ color: "var(--text)" }}>Evolução de Vendas</h2>
              <p className="text-[11.5px] mt-0.5" style={{ color: "var(--muted-3)" }}>Últimos 6 meses</p>
            </div>
            {loading ? (
              <div className="shimmer h-48 rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data?.vendasPorMes ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradVendas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fill: "rgba(148,163,184,.5)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(148,163,184,.5)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="vendas" name="Vendas" stroke="#6366f1" strokeWidth={2}
                    fill="url(#gradVendas)" dot={{ fill: "#6366f1", r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  <Area type="monotone" dataKey="receita" name="Receita (R$)" stroke="#34d399" strokeWidth={2}
                    fill="url(#gradReceita)" dot={{ fill: "#34d399", r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Distribuição por status — Donut */}
          <div className="rounded-2xl p-6 animate-fade-up"
            style={{ background: "var(--card)", border: "1px solid var(--border)", animationDelay: "360ms" }}>
            <div className="mb-5">
              <h2 className="text-[14px] font-semibold" style={{ color: "var(--text)" }}>Distribuição</h2>
              <p className="text-[11.5px] mt-0.5" style={{ color: "var(--muted-3)" }}>Leads por status</p>
            </div>
            {loading ? (
              <div className="shimmer h-48 rounded-xl" />
            ) : data?.funil.length ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={data.funil} cx="50%" cy="50%" innerRadius={45} outerRadius={72}
                      dataKey="count" nameKey="label" paddingAngle={2} strokeWidth={0}>
                      {data.funil.map((f, i) => <Cell key={i} fill={f.hex} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [fmt(v), ""]} contentStyle={{
                      background: "rgba(15,15,25,.95)", border: "1px solid rgba(255,255,255,.1)",
                      borderRadius: 12, fontSize: 12,
                    }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                  {data.funil.slice(0, 6).map((f, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: f.hex }} />
                        <span className="text-[11px]" style={{ color: "var(--muted)" }}>{f.label}</span>
                      </div>
                      <span className="text-[11px] font-semibold" style={{ color: "var(--text-2)" }}>{fmt(f.count)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 gap-2" style={{ color: "var(--muted-3)" }}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 8v4l2 2" />
                </svg>
                <p className="text-[12px]">Sem dados</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Funil horizontal ── */}
        <div className="rounded-2xl p-6 animate-fade-up"
          style={{ background: "var(--card)", border: "1px solid var(--border)", animationDelay: "420ms" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[14px] font-semibold" style={{ color: "var(--text)" }}>Funil de Conversão</h2>
              <p className="text-[11.5px] mt-0.5" style={{ color: "var(--muted-3)" }}>Volume de leads por etapa</p>
            </div>
            {data?.kpis.totalLeads ? (
              <span className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full"
                style={{ background: "rgba(99,102,241,.1)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,.18)" }}>
                {fmt(data.kpis.totalLeads)} leads
              </span>
            ) : null}
          </div>

          {loading ? (
            <div className="space-y-2.5">
              {[90, 75, 60, 45, 55, 35, 25].map((w, i) => (
                <div key={i} className="shimmer h-8 rounded-xl" style={{ width: `${w}%` }} />
              ))}
            </div>
          ) : data?.funil.length ? (
            <div className="space-y-2">
              {data.funil.map((f, i) => {
                const pct = Math.round((f.count / maxFunil) * 100);
                return (
                  <div key={i} className="flex items-center gap-3 animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                    <span className="text-[11px] font-semibold shrink-0 w-[110px] sm:w-[150px] truncate"
                      style={{ color: f.hex }}>{f.label}</span>
                    <div className="flex-1 h-7 rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,.04)" }}>
                      <div className="h-full rounded-xl flex items-center px-3 transition-all duration-700"
                        style={{ width: `${Math.max(pct, 4)}%`, background: `linear-gradient(90deg,${f.hex}99,${f.hex})`, boxShadow: `0 0 12px ${f.hex}44` }}>
                        <span className="text-[11px] font-bold" style={{ color: "rgba(255,255,255,.9)" }}>{fmt(f.count)}</span>
                      </div>
                    </div>
                    <span className="text-[11px] w-8 text-right shrink-0 font-medium" style={{ color: "var(--muted-3)" }}>
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[13px] py-8 text-center" style={{ color: "var(--muted-3)" }}>Nenhum lead cadastrado.</p>
          )}
        </div>

        {/* ── Ranking vendedores ── */}
        {(data?.ranking.length ?? 0) > 0 && (
          <div className="rounded-2xl p-4 md:p-6 animate-fade-up"
            style={{ background: "var(--card)", border: "1px solid var(--border)", animationDelay: "480ms" }}>
            <div className="mb-4">
              <h2 className="text-[14px] font-semibold" style={{ color: "var(--text)" }}>Ranking de Vendedores</h2>
              <p className="text-[11.5px] mt-0.5" style={{ color: "var(--muted-3)" }}>Performance no período selecionado</p>
            </div>

            {/* Mobile: cards stacked */}
            <div className="flex flex-col gap-3 sm:hidden">
              {data!.ranking.map((v, i) => (
                <div key={i} className="rounded-xl p-3.5 flex items-center gap-3"
                  style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--border)" }}>
                  <span className="w-7 h-7 rounded-xl flex items-center justify-center text-[12px] font-bold flex-shrink-0"
                    style={{ background: i === 0 ? "rgba(251,191,36,.15)" : i === 1 ? "rgba(148,163,184,.1)" : "rgba(251,146,60,.1)", color: i === 0 ? "#fbbf24" : i === 1 ? "#94a3b8" : "#fb923c" }}>
                    {i + 1}
                  </span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#6366f1,#38bdf8)", color: "white" }}>
                    {v.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate" style={{ color: "var(--text-2)" }}>{v.nome}</div>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-[11px]" style={{ color: "var(--muted-3)" }}>{fmt(v.leads)} leads</span>
                      <span className="text-[11px] font-semibold" style={{ color: "#34d399" }}>{fmt(v.vendas)} vendas</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[12px] font-bold" style={{ color: "#c084fc" }}>{fmtR(v.receita)}</div>
                    <div className="text-[11px] font-semibold" style={{ color: "#a5b4fc" }}>{v.conversao.toFixed(0)}%</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["#","Vendedor","Leads","Vendas","Receita","Conversão"].map(h => (
                      <th key={h} className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: "var(--muted-3)", paddingRight: 16 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data!.ranking.map((v, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,.03)" }}>
                      <td className="py-3 pr-4">
                        <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold"
                          style={{ background: i === 0 ? "rgba(251,191,36,.15)" : i === 1 ? "rgba(148,163,184,.1)" : "rgba(251,146,60,.1)", color: i === 0 ? "#fbbf24" : i === 1 ? "#94a3b8" : "#fb923c" }}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                            style={{ background: "linear-gradient(135deg,#6366f1,#38bdf8)", color: "white" }}>
                            {v.nome.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[13px] font-medium" style={{ color: "var(--text-2)" }}>{v.nome}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-[13px]" style={{ color: "var(--muted)" }}>{fmt(v.leads)}</td>
                      <td className="py-3 pr-4"><span className="text-[13px] font-semibold" style={{ color: "#34d399" }}>{fmt(v.vendas)}</span></td>
                      <td className="py-3 pr-4 text-[13px] font-semibold" style={{ color: "#c084fc" }}>{fmtR(v.receita)}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden max-w-[60px]" style={{ background: "rgba(255,255,255,.06)" }}>
                            <div className="h-full rounded-full" style={{ width: `${Math.min(v.conversao, 100)}%`, background: "linear-gradient(90deg,#6366f1,#a5b4fc)" }} />
                          </div>
                          <span className="text-[12px] font-semibold" style={{ color: "#a5b4fc" }}>{v.conversao.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Vendas por mês — bar chart alternativo ── */}
        {(data?.vendasPorMes.some(m => m.receita > 0)) && (
          <div className="rounded-2xl p-6 animate-fade-up"
            style={{ background: "var(--card)", border: "1px solid var(--border)", animationDelay: "540ms" }}>
            <div className="mb-5">
              <h2 className="text-[14px] font-semibold" style={{ color: "var(--text)" }}>Receita por Mês</h2>
              <p className="text-[11.5px] mt-0.5" style={{ color: "var(--muted-3)" }}>Valor total de vendas</p>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data!.vendasPorMes} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: "rgba(148,163,184,.5)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(148,163,184,.5)", fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip content={<ChartTooltip money />} />
                <Bar dataKey="receita" name="Receita" fill="#6366f1" radius={[6, 6, 0, 0]}>
                  {data!.vendasPorMes.map((_, i) => (
                    <Cell key={i}
                      fill={`rgba(99,102,241,${0.4 + (i / (data!.vendasPorMes.length - 1 || 1)) * 0.6})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>
    </div>
  );
}
