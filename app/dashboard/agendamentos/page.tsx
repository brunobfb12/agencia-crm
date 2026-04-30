"use client";

import { useEffect, useState } from "react";

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

const TIPOS: Record<string, { label: string; cor: string; emoji: string }> = {
  FOLLOW_UP:   { label: "Follow-up",   cor: "bg-cyan-100 text-cyan-700",     emoji: "📞" },
  POS_VENDA:   { label: "Pós-Venda",   cor: "bg-purple-100 text-purple-700", emoji: "🤝" },
  REATIVACAO:  { label: "Reativação",  cor: "bg-orange-100 text-orange-700", emoji: "🔄" },
  CONSULTA:    { label: "Consulta",    cor: "bg-blue-100 text-blue-700",     emoji: "📅" },
  ANIVERSARIO: { label: "Aniversário", cor: "bg-pink-100 text-pink-700",     emoji: "🎂" },
  TAREFA:      { label: "Tarefa",      cor: "bg-gray-100 text-gray-700",     emoji: "✅" },
};

function dataLocal(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function isHoje(iso: string) {
  const d = new Date(iso);
  const h = new Date();
  return d.getDate() === h.getDate() && d.getMonth() === h.getMonth() && d.getFullYear() === h.getFullYear();
}

function isSemana(iso: string) {
  const d = new Date(iso);
  const h = new Date();
  const diff = (d.getTime() - h.getTime()) / 86400000;
  return diff >= 0 && diff <= 7;
}

export default function AgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<"hoje" | "semana" | "todos" | "concluidos">("hoje");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [buscaCliente, setBuscaCliente] = useState("");
  const [form, setForm] = useState({ clienteId: "", clienteNome: "", tipo: "FOLLOW_UP", data: "", hora: "", notas: "" });
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState("");

  const carregar = (status = "PENDENTE") => {
    setLoading(true);
    fetch(`/api/agendamentos?status=${status}`)
      .then(r => r.json())
      .then(d => { setAgendamentos(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  useEffect(() => {
    if (aba === "concluidos") carregar("CONCLUIDO");
    else carregar("PENDENTE");
  }, [aba]);

  useEffect(() => {
    if (!buscaCliente.trim()) { setClientes([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/clientes?busca=${encodeURIComponent(buscaCliente)}`)
        .then(r => r.json()).then(setClientes);
    }, 300);
    return () => clearTimeout(t);
  }, [buscaCliente]);

  const concluir = async (id: string) => {
    await fetch(`/api/agendamentos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CONCLUIDO" }),
    });
    setAgendamentos(prev => prev.filter(a => a.id !== id));
  };

  const cancelar = async (id: string) => {
    if (!confirm("Cancelar este agendamento?")) return;
    await fetch(`/api/agendamentos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELADO" }),
    });
    setAgendamentos(prev => prev.filter(a => a.id !== id));
  };

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clienteId) { setMsg("Selecione um cliente"); return; }
    setSalvando(true);
    const res = await fetch("/api/agendamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clienteId: form.clienteId,
        tipo: form.tipo,
        dataAgendada: form.data,
        hora: form.hora || null,
        notas: form.notas || null,
      }),
    });
    setSalvando(false);
    if (res.ok) {
      setMostrarForm(false);
      setForm({ clienteId: "", clienteNome: "", tipo: "FOLLOW_UP", data: "", hora: "", notas: "" });
      setBuscaCliente("");
      carregar();
      setMsg("Agendamento criado!");
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const filtrados = agendamentos.filter(a => {
    if (aba === "hoje") return isHoje(a.dataAgendada);
    if (aba === "semana") return isSemana(a.dataAgendada);
    return true;
  });

  const hoje = agendamentos.filter(a => isHoje(a.dataAgendada)).length;
  const semana = agendamentos.filter(a => isSemana(a.dataAgendada)).length;

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Agendamentos</h2>
            <p className="text-sm text-gray-500 mt-1">Follow-ups, consultas, aniversários e lembretes</p>
          </div>
          <div className="flex items-center gap-3">
            {msg && <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">{msg}</span>}
            <button
              onClick={() => setMostrarForm(v => !v)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              {mostrarForm ? "Fechar" : "+ Novo Agendamento"}
            </button>
          </div>
        </div>

        {mostrarForm && (
          <form onSubmit={criar} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Novo Agendamento</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Cliente *</label>
                {form.clienteId ? (
                  <div className="flex items-center gap-2">
                    <span className="flex-1 border border-green-300 bg-green-50 rounded-lg px-3 py-2 text-sm text-green-800 font-medium">{form.clienteNome}</span>
                    <button type="button" onClick={() => { setForm(p => ({ ...p, clienteId: "", clienteNome: "" })); setBuscaCliente(""); }}
                      className="text-xs text-gray-400 hover:text-red-500">Trocar</button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      value={buscaCliente}
                      onChange={e => setBuscaCliente(e.target.value)}
                      placeholder="Buscar por nome ou telefone..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {clientes.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {clientes.map(c => (
                          <button key={c.id} type="button"
                            onClick={() => { setForm(p => ({ ...p, clienteId: c.id, clienteNome: c.nome ?? c.telefone })); setClientes([]); setBuscaCliente(""); }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-0">
                            <span className="font-medium">{c.nome ?? "—"}</span>
                            <span className="text-gray-400 ml-2">{c.telefone}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tipo *</label>
                <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {Object.entries(TIPOS).map(([v, t]) => (
                    <option key={v} value={v}>{t.emoji} {t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Data *</label>
                <input type="date" value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Horário</label>
                <input type="time" value={form.hora} onChange={e => setForm(p => ({ ...p, hora: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
                <input value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))}
                  placeholder="Ex: cliente pediu para ligar às 14h"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {form.tipo === "CONSULTA" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                <strong>Google Calendar:</strong> Se configurado em Configurações, este agendamento será sincronizado automaticamente com o calendário da empresa.
              </div>
            )}

            <div className="flex gap-2">
              <button type="submit" disabled={salvando || !form.clienteId}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {salvando ? "Salvando..." : "Criar Agendamento"}
              </button>
              <button type="button" onClick={() => setMostrarForm(false)}
                className="bg-white border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm hover:bg-gray-50">
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div className="flex gap-2 mb-6">
          {([
            { id: "hoje", label: `Hoje${hoje > 0 ? ` (${hoje})` : ""}` },
            { id: "semana", label: `Esta semana${semana > 0 ? ` (${semana})` : ""}` },
            { id: "todos", label: "Todos" },
            { id: "concluidos", label: "Concluídos" },
          ] as const).map(tab => (
            <button key={tab.id} onClick={() => setAba(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${aba === tab.id ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm">Carregando...</p>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">📅</div>
            <p className="text-sm">
              {aba === "hoje" ? "Nenhum agendamento para hoje." :
               aba === "semana" ? "Nenhum agendamento esta semana." :
               "Nenhum agendamento encontrado."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtrados.map(a => {
              const t = TIPOS[a.tipo] ?? { label: a.tipo, cor: "bg-gray-100 text-gray-700", emoji: "📌" };
              const data = new Date(a.dataAgendada);
              const atrasado = aba !== "concluidos" && data < new Date() && !isHoje(a.dataAgendada);
              const temCalendario = a.cliente.empresa.googleCalendarId;
              return (
                <div key={a.id}
                  className={`bg-white rounded-xl border p-4 flex items-start gap-4 ${atrasado ? "border-red-200 bg-red-50" : "border-gray-200"}`}>
                  <div className="flex-shrink-0 text-center w-14 pt-1">
                    <div className="text-2xl font-bold text-gray-900 leading-none">{data.getDate()}</div>
                    <div className="text-xs text-gray-500 uppercase">{data.toLocaleString("pt-BR", { month: "short" })}</div>
                    {a.hora && <div className="text-xs text-blue-600 font-medium mt-1">{a.hora}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.cor}`}>{t.emoji} {t.label}</span>
                      {atrasado && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Atrasado</span>}
                      {temCalendario && a.googleEventId && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">📆 Google Calendar</span>}
                      {temCalendario && !a.googleEventId && a.tipo === "CONSULTA" && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">⏳ Aguardando sync</span>}
                    </div>
                    <p className="font-medium text-gray-900 text-sm">{a.cliente.nome ?? a.cliente.telefone}</p>
                    <p className="text-xs text-gray-500">{a.cliente.empresa.nome} · {a.cliente.telefone}</p>
                    {a.notas && <p className="text-xs text-gray-400 mt-1 italic">"{a.notas}"</p>}
                  </div>
                  {aba !== "concluidos" && (
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <button onClick={() => concluir(a.id)}
                        className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg">
                        Concluir
                      </button>
                      <button onClick={() => cancelar(a.id)}
                        className="text-xs bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 px-3 py-1.5 rounded-lg">
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
