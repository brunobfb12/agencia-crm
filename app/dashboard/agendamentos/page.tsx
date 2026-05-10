"use client";

import { useEffect, useRef, useState } from "react";

interface Cliente { id: string; nome: string | null; telefone: string }
interface Agendamento {
  id: string;
  tipo: string;
  dataAgendada: string;
  hora: string | null;
  notas: string | null;
  status: string;
  googleEventId: string | null;
  cliente: {
    nome: string | null;
    telefone: string;
    empresa: { nome: string; instanciaWhatsapp: string; googleCalendarId: string | null };
  };
}

const TIPOS: Record<string, { label: string; bg: string; color: string; emoji: string }> = {
  FOLLOW_UP:   { label: "Follow-up",   bg: "rgba(34,211,238,.1)",   color: "#22d3ee", emoji: "📞" },
  POS_VENDA:   { label: "Pós-Venda",   bg: "rgba(192,132,252,.1)",  color: "#c084fc", emoji: "🤝" },
  REATIVACAO:  { label: "Reativação",  bg: "rgba(251,146,60,.1)",   color: "#fb923c", emoji: "🔄" },
  CONSULTA:    { label: "Consulta",    bg: "rgba(96,165,250,.1)",   color: "#60a5fa", emoji: "📅" },
  ANIVERSARIO: { label: "Aniversário", bg: "rgba(244,114,182,.1)",  color: "#f472b6", emoji: "🎂" },
  TAREFA:      { label: "Tarefa",      bg: "rgba(148,163,184,.1)",  color: "#94a3b8", emoji: "✅" },
};

function isHoje(iso: string) {
  const d = new Date(iso), h = new Date();
  return d.getDate() === h.getDate() && d.getMonth() === h.getMonth() && d.getFullYear() === h.getFullYear();
}
function isSemana(iso: string) {
  const diff = (new Date(iso).getTime() - Date.now()) / 86400000;
  return diff >= 0 && diff <= 7;
}

interface Empresa { id: string; nome: string }

export default function AgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<"hoje" | "semana" | "todos" | "concluidos">("hoje");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [buscaCliente, setBuscaCliente] = useState("");
  const [form, setForm] = useState({ clienteId: "", clienteNome: "", tipo: "FOLLOW_UP", data: "", hora: "", notas: "" });
  const [salvando, setSalvando] = useState(false);
  const salvandoRef = useRef(false);
  const [msg, setMsg] = useState("");
  const [isCentral, setIsCentral] = useState(false);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [filtroEmpresa, setFiltroEmpresa] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(me => {
      if (me?.perfil === "CENTRAL") {
        setIsCentral(true);
        fetch("/api/empresas").then(r => r.json()).then(setEmpresas);
      }
    });
  }, []);

  const carregar = (status = "PENDENTE", empresaId = filtroEmpresa) => {
    setLoading(true);
    const params = new URLSearchParams({ status });
    if (empresaId) params.set("empresaId", empresaId);
    fetch(`/api/agendamentos?${params}`)
      .then(r => r.json())
      .then(d => { setAgendamentos(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);
  useEffect(() => {
    if (aba === "concluidos") carregar("CONCLUIDO");
    else carregar("PENDENTE");
  }, [aba, filtroEmpresa]);

  useEffect(() => {
    if (!buscaCliente.trim()) { setClientes([]); return; }
    const t = setTimeout(() => {
      const params = new URLSearchParams({ busca: buscaCliente });
      if (filtroEmpresa) params.set("empresaId", filtroEmpresa);
      fetch(`/api/clientes?${params}`).then(r => r.json()).then(setClientes);
    }, 300);
    return () => clearTimeout(t);
  }, [buscaCliente, filtroEmpresa]);

  const concluir = async (id: string) => {
    await fetch(`/api/agendamentos/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "CONCLUIDO" }) });
    setAgendamentos(prev => prev.filter(a => a.id !== id));
  };

  const cancelar = async (id: string) => {
    if (!confirm("Cancelar este agendamento?")) return;
    await fetch(`/api/agendamentos/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "CANCELADO" }) });
    setAgendamentos(prev => prev.filter(a => a.id !== id));
  };

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salvandoRef.current) return;
    if (!form.clienteId) { setMsg("Selecione um cliente"); return; }
    salvandoRef.current = true;
    setSalvando(true);
    try {
      const res = await fetch("/api/agendamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId: form.clienteId, tipo: form.tipo, dataAgendada: form.data, hora: form.hora || null, notas: form.notas || null }),
      });
      if (res.ok) {
        setMostrarForm(false);
        setForm({ clienteId: "", clienteNome: "", tipo: "FOLLOW_UP", data: "", hora: "", notas: "" });
        setBuscaCliente("");
        carregar();
        setMsg("Agendamento criado!");
        setTimeout(() => setMsg(""), 3000);
      }
    } finally {
      salvandoRef.current = false;
      setSalvando(false);
    }
  };

  const filtrados = agendamentos.filter(a => {
    if (aba === "hoje") return isHoje(a.dataAgendada);
    if (aba === "semana") return isSemana(a.dataAgendada);
    return true;
  });

  const hoje = agendamentos.filter(a => isHoje(a.dataAgendada)).length;
  const semana = agendamentos.filter(a => isSemana(a.dataAgendada)).length;

  const tabStyle = (id: string) => aba === id
    ? { background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white", border: "1px solid transparent" }
    : { background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)" };

  return (
    <div className="h-full overflow-y-auto" style={{ background: "var(--bg)" }}>
      <div className="p-4 md:p-8 max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <span
            className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full mb-3"
            style={{ background: "rgba(99,102,241,.1)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,.18)" }}
          >
            Agenda
          </span>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-[28px] font-bold tracking-tight" style={{ color: "var(--text)" }}>Agendamentos</h1>
              <p className="text-[13px] mt-1" style={{ color: "var(--muted-2)" }}>
                Follow-ups, consultas, aniversários e lembretes
              </p>
            </div>
            <div className="flex items-center gap-3">
              {msg && (
                <span className="text-[12px] px-3 py-1.5 rounded-full font-semibold"
                  style={{ background: "rgba(52,211,153,.1)", color: "#34d399", border: "1px solid rgba(52,211,153,.2)" }}>
                  {msg}
                </span>
              )}
              {isCentral && (
                <select value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)} className="input-dark px-3 py-2 text-[13px]">
                  <option value="">Todas as empresas</option>
                  {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
              )}
              <button
                onClick={() => setMostrarForm(v => !v)}
                className="btn-primary px-4 py-2 text-[13px]"
              >
                {mostrarForm ? "Fechar" : "+ Novo"}
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        {mostrarForm && (
          <div
            className="rounded-2xl p-5 mb-6 animate-fade-up"
            style={{
              background: "linear-gradient(145deg, var(--card-2), var(--card))",
              border: "1px solid var(--card-3)",
              boxShadow: "0 16px 48px rgba(0,0,0,.4)",
            }}
          >
            <h3 className="text-[15px] font-semibold mb-4" style={{ color: "var(--text)" }}>Novo Agendamento</h3>
            <form onSubmit={criar} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>CLIENTE *</label>
                  {form.clienteId ? (
                    <div className="flex items-center gap-2">
                      <span
                        className="flex-1 px-3 py-2.5 rounded-xl text-[13px] font-medium"
                        style={{ background: "rgba(52,211,153,.08)", border: "1px solid rgba(52,211,153,.2)", color: "#34d399" }}
                      >
                        {form.clienteNome}
                      </span>
                      <button type="button" onClick={() => { setForm(p => ({ ...p, clienteId: "", clienteNome: "" })); setBuscaCliente(""); }}
                        className="text-[12px] transition-colors" style={{ color: "var(--muted-3)" }}
                        onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                        onMouseLeave={e => e.currentTarget.style.color = "var(--muted-3)"}
                      >
                        Trocar
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input value={buscaCliente} onChange={e => setBuscaCliente(e.target.value)}
                        placeholder="Buscar por nome ou telefone..." className="w-full input-dark px-3 py-2.5 text-[13px]" />
                      {clientes.length > 0 && (
                        <div
                          className="absolute z-10 w-full mt-1 rounded-xl overflow-hidden"
                          style={{ background: "#0d0b1f", border: "1px solid var(--border-2)", boxShadow: "0 16px 48px rgba(0,0,0,.6)" }}
                        >
                          {clientes.map(c => (
                            <button key={c.id} type="button"
                              onClick={() => { setForm(p => ({ ...p, clienteId: c.id, clienteNome: c.nome ?? c.telefone })); setClientes([]); setBuscaCliente(""); }}
                              className="w-full text-left px-4 py-2.5 text-[13px] transition-colors"
                              style={{ borderBottom: "1px solid var(--border)", color: "var(--text-2)" }}
                              onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,.1)"}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >
                              <span className="font-medium">{c.nome ?? "—"}</span>
                              <span className="ml-2 text-[12px]" style={{ color: "var(--muted-2)" }}>{c.telefone}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>TIPO *</label>
                  <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))} required
                    className="w-full input-dark px-3 py-2.5 text-[13px]">
                    {Object.entries(TIPOS).map(([v, t]) => (
                      <option key={v} value={v}>{t.emoji} {t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>DATA *</label>
                  <input type="date" value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} required
                    className="w-full input-dark px-3 py-2.5 text-[13px]" />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>HORÁRIO</label>
                  <input type="time" value={form.hora} onChange={e => setForm(p => ({ ...p, hora: e.target.value }))}
                    className="w-full input-dark px-3 py-2.5 text-[13px]" />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>OBSERVAÇÕES</label>
                  <input value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))}
                    placeholder="Ex: cliente pediu para ligar às 14h"
                    className="w-full input-dark px-3 py-2.5 text-[13px]" />
                </div>
              </div>

              {form.tipo === "CONSULTA" && (
                <div
                  className="rounded-xl px-4 py-3 text-[12px]"
                  style={{ background: "rgba(96,165,250,.06)", border: "1px solid rgba(96,165,250,.15)", color: "#60a5fa" }}
                >
                  <strong>Google Calendar:</strong> Se configurado, este agendamento será sincronizado automaticamente.
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={salvando || !form.clienteId} className="btn-primary px-5 py-2.5 text-[13px] disabled:opacity-40">
                  {salvando ? "Salvando..." : "Criar Agendamento"}
                </button>
                <button type="button" onClick={() => setMostrarForm(false)}
                  className="px-5 py-2.5 rounded-xl text-[13px] font-medium transition-all"
                  style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)" }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {([
            { id: "hoje", label: `Hoje${hoje > 0 ? ` (${hoje})` : ""}` },
            { id: "semana", label: `Esta semana${semana > 0 ? ` (${semana})` : ""}` },
            { id: "todos", label: "Todos" },
            { id: "concluidos", label: "Concluídos" },
          ] as const).map(tab => (
            <button key={tab.id} onClick={() => setAba(tab.id)}
              className="px-4 py-2 rounded-xl text-[13px] font-medium transition-all"
              style={tabStyle(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="shimmer h-20 rounded-2xl" />)}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: "var(--muted-3)" }}>
            <div className="text-5xl">📅</div>
            <p className="text-[13px]">
              {aba === "hoje" ? "Nenhum agendamento para hoje." :
               aba === "semana" ? "Nenhum agendamento esta semana." :
               "Nenhum agendamento encontrado."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtrados.map((a, idx) => {
              const t = TIPOS[a.tipo] ?? { label: a.tipo, bg: "rgba(148,163,184,.1)", color: "#94a3b8", emoji: "📌" };
              const data = new Date(a.dataAgendada);
              const atrasado = aba !== "concluidos" && data < new Date() && !isHoje(a.dataAgendada);
              const temCalendario = a.cliente.empresa.googleCalendarId;
              return (
                <div
                  key={a.id}
                  className="rounded-2xl p-4 flex items-start gap-4 animate-fade-up"
                  style={{
                    background: atrasado
                      ? "linear-gradient(145deg, rgba(248,113,113,.07), rgba(248,113,113,.03))"
                      : "linear-gradient(145deg, var(--input), var(--card))",
                    border: atrasado ? "1px solid rgba(248,113,113,.2)" : "1px solid var(--border)",
                    animationDelay: `${idx * 40}ms`,
                  }}
                >
                  {/* Date block */}
                  <div
                    className="flex-shrink-0 text-center w-14 pt-1 rounded-xl py-2"
                    style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                  >
                    <div className="text-[22px] font-bold leading-none" style={{ color: "var(--text)" }}>{data.getDate()}</div>
                    <div className="text-[10px] font-semibold uppercase mt-0.5" style={{ color: "var(--muted-2)" }}>
                      {data.toLocaleString("pt-BR", { month: "short" })}
                    </div>
                    {a.hora && <div className="text-[11px] font-semibold mt-1" style={{ color: "#60a5fa" }}>{a.hora}</div>}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                        style={{ background: t.bg, color: t.color }}>
                        {t.emoji} {t.label}
                      </span>
                      {atrasado && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                          style={{ background: "rgba(248,113,113,.1)", color: "#f87171" }}>Atrasado</span>
                      )}
                      {temCalendario && a.googleEventId && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                          style={{ background: "rgba(52,211,153,.1)", color: "#34d399" }}>📆 Google Calendar</span>
                      )}
                      {temCalendario && !a.googleEventId && a.tipo === "CONSULTA" && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                          style={{ background: "rgba(251,191,36,.1)", color: "#fbbf24" }}>⏳ Aguardando sync</span>
                      )}
                    </div>
                    <p className="font-semibold text-[14px]" style={{ color: "var(--text)" }}>
                      {a.cliente.nome ?? a.cliente.telefone}
                    </p>
                    <p className="text-[12px] mt-0.5" style={{ color: "var(--muted-2)" }}>
                      {a.cliente.empresa.nome} · {a.cliente.telefone}
                    </p>
                    {a.notas && (
                      <p className="text-[12px] mt-1 italic" style={{ color: "var(--muted-3)" }}>"{a.notas}"</p>
                    )}
                  </div>

                  {/* Actions */}
                  {aba !== "concluidos" && (
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <button onClick={() => concluir(a.id)}
                        className="text-[12px] px-3 py-1.5 rounded-lg font-semibold transition-all"
                        style={{ background: "rgba(52,211,153,.12)", color: "#34d399", border: "1px solid rgba(52,211,153,.2)" }}>
                        Concluir
                      </button>
                      <button onClick={() => cancelar(a.id)}
                        className="text-[12px] px-3 py-1.5 rounded-lg font-medium transition-all"
                        style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)" }}>
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
