"use client";

import { useEffect, useState } from "react";

interface Lead {
  id: string;
  status: string;
  score: number;
  observacoes: string | null;
  vendedorId: string | null;
  atualizadoEm: string;
  cliente: { nome: string | null; telefone: string };
  empresa: { nome: string };
}

interface Vendedor {
  id: string;
  nome: string;
  empresa: { nome: string };
}

const colunas = [
  { status: "LEAD",                label: "Novos Leads",      hex: "#9ca3af" },
  { status: "AQUECIMENTO",         label: "Aquecimento",      hex: "#fb923c" },
  { status: "PRONTO_PARA_COMPRAR", label: "Pronto p/ Comprar",hex: "#fbbf24" },
  { status: "NEGOCIACAO",          label: "Em Negociação",    hex: "#60a5fa" },
  { status: "VENDA_REALIZADA",     label: "Venda Realizada",  hex: "#34d399" },
  { status: "POS_VENDA",           label: "Pós-Venda",        hex: "#c084fc" },
  { status: "FOLLOW_UP",           label: "Follow-up",        hex: "#22d3ee" },
  { status: "SEM_RESPOSTA",        label: "Sem Resposta",     hex: "#fbbf24" },
  { status: "SEM_INTERESSE",       label: "Sem Interesse",    hex: "#fb7185" },
];

const todasOpcoes = [
  ...colunas,
  { status: "PERDIDO", label: "Perdido", hex: "#f87171" },
];

function fireLabel(score: number) {
  if (score === 0)   return { emoji: "·", label: "Sem score" };
  if (score < 25)    return { emoji: "🔥", label: "Morno" };
  if (score < 50)    return { emoji: "🔥🔥", label: "Quente" };
  if (score < 75)    return { emoji: "🔥🔥🔥", label: "Muito quente" };
  return             { emoji: "🔥🔥🔥🔥", label: "Em chamas!" };
}

function fireColor(score: number) {
  if (score === 0) return "#374151";
  if (score < 25)  return "#d97706";
  if (score < 50)  return "#f59e0b";
  if (score < 75)  return "#f97316";
  return "#ef4444";
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [editForm, setEditForm] = useState({ status: "", observacoes: "", score: 0, vendedorId: "" });
  const [salvando, setSalvando] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/leads").then((r) => r.json()),
      fetch("/api/vendedores?todos=true").then((r) => r.json()),
    ])
      .then(([leadsData, vendedoresData]) => {
        setLeads(leadsData);
        setVendedores(vendedoresData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const moverLead = async (id: string, novoStatus: string) => {
    if (leads.find((l) => l.id === id)?.status === novoStatus) return;
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus }),
    });
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: novoStatus } : l)));
  };

  const excluirLead = async () => {
    if (!editLead) return;
    setSalvando(true);
    await fetch(`/api/leads/${editLead.id}`, { method: "DELETE" });
    setLeads((prev) => prev.filter((l) => l.id !== editLead.id));
    setEditLead(null);
    setConfirmandoExclusao(false);
    setSalvando(false);
  };

  const abrirEdit = (lead: Lead) => {
    setEditLead(lead);
    setConfirmandoExclusao(false);
    setEditForm({ status: lead.status, observacoes: lead.observacoes ?? "", score: lead.score, vendedorId: lead.vendedorId ?? "" });
  };

  const salvarEdit = async () => {
    if (!editLead) return;
    setSalvando(true);
    const res = await fetch(`/api/leads/${editLead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: editForm.status, observacoes: editForm.observacoes, score: Number(editForm.score), vendedorId: editForm.vendedorId || null }),
    });
    const updated = await res.json();
    setLeads((prev) => prev.map((l) => (l.id === editLead.id ? { ...l, ...updated } : l)));
    setEditLead(null);
    setSalvando(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: "#08080e", color: "#64748b" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Carregando leads...</span>
        </div>
      </div>
    );
  }

  const fc = fireColor(editForm.score);
  const fl = fireLabel(editForm.score);

  return (
    <div className="h-full overflow-y-auto" style={{ background: "#08080e" }}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 animate-fade-up">
          <h2 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>Leads</h2>
          <p className="text-sm mt-1" style={{ color: "rgba(148,163,184,.55)" }}>
            {leads.length} leads · Arraste os cards para mover entre colunas
          </p>
        </div>

        {/* Kanban */}
        <div className="flex gap-3 overflow-x-auto pb-4">
          {colunas.map((col) => {
            const leadsColuna = leads.filter((l) => l.status === col.status);
            const isOver = dragOverCol === col.status;
            return (
              <div
                key={col.status}
                className="flex-shrink-0 w-60"
                onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.status); }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={() => {
                  if (draggedId) moverLead(draggedId, col.status);
                  setDraggedId(null);
                  setDragOverCol(null);
                }}
              >
                {/* Column header */}
                <div
                  className="rounded-xl px-3 py-2.5 mb-2 flex justify-between items-center"
                  style={{
                    background: isOver
                      ? `${col.hex}18`
                      : "rgba(255,255,255,.04)",
                    borderTop: `2px solid ${col.hex}`,
                    border: isOver ? `1px solid ${col.hex}55` : "1px solid rgba(255,255,255,.07)",
                    borderTopWidth: "2px",
                  }}
                >
                  <span className="text-[12px] font-semibold" style={{ color: col.hex }}>
                    {col.label}
                  </span>
                  <span
                    className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: `${col.hex}22`, color: col.hex }}
                  >
                    {leadsColuna.length}
                  </span>
                </div>

                {/* Cards */}
                <div
                  className="space-y-2 min-h-[60px] rounded-xl p-1 transition-all"
                  style={{
                    background: isOver ? `${col.hex}08` : "transparent",
                    outline: isOver ? `1.5px dashed ${col.hex}55` : "none",
                  }}
                >
                  {leadsColuna.map((lead) => {
                    const sc = fireColor(lead.score);
                    const fl2 = fireLabel(lead.score);
                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={() => setDraggedId(lead.id)}
                        onDragEnd={() => { setDraggedId(null); setDragOverCol(null); }}
                        className="rounded-xl p-3 cursor-grab active:cursor-grabbing select-none transition-all glass-hover"
                        style={{
                          background: "rgba(255,255,255,.04)",
                          border: "1px solid rgba(255,255,255,.07)",
                          opacity: draggedId === lead.id ? 0.3 : 1,
                        }}
                      >
                        <div className="flex justify-between items-start gap-1">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[13px] leading-tight truncate" style={{ color: "#f1f5f9" }}>
                              {lead.cliente.nome ?? lead.cliente.telefone}
                            </p>
                            {lead.cliente.nome && (
                              <p className="text-[11px] truncate mt-0.5" style={{ color: "rgba(148,163,184,.5)" }}>
                                {lead.cliente.telefone}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); abrirEdit(lead); }}
                            className="text-[15px] flex-shrink-0 opacity-40 hover:opacity-100 transition-opacity"
                            title="Editar lead"
                          >
                            ✏️
                          </button>
                        </div>

                        <p className="text-[11px] mt-1 truncate" style={{ color: "rgba(148,163,184,.45)" }}>
                          {lead.empresa.nome}
                        </p>

                        {lead.observacoes && (
                          <p className="text-[11px] mt-1.5 line-clamp-2 leading-tight" style={{ color: "rgba(148,163,184,.55)" }}>
                            {lead.observacoes}
                          </p>
                        )}

                        {lead.score > 0 && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <div
                              className="flex-1 h-1.5 rounded-full"
                              style={{ background: "rgba(255,255,255,.08)" }}
                            >
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${lead.score}%`,
                                  background: `linear-gradient(90deg, ${sc}, ${sc}bb)`,
                                  boxShadow: `0 0 6px ${sc}88`,
                                }}
                              />
                            </div>
                            <span className="text-[10px]">{fl2.emoji}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {leadsColuna.length === 0 && (
                    <div
                      className="text-center py-8 text-[11px] rounded-xl border border-dashed transition-all"
                      style={{
                        borderColor: isOver ? `${col.hex}66` : "rgba(255,255,255,.07)",
                        color: isOver ? col.hex : "rgba(148,163,184,.25)",
                        background: isOver ? `${col.hex}06` : "transparent",
                      }}
                    >
                      {isOver ? "Soltar aqui" : "Nenhum lead"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit modal */}
      {editLead && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: "rgba(0,0,0,.75)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="w-full max-w-md rounded-2xl overflow-hidden animate-fade-up"
            style={{
              background: "linear-gradient(145deg, #13131f, #0d0d18)",
              border: "1px solid rgba(255,255,255,.1)",
              boxShadow: "0 24px 80px rgba(0,0,0,.7)",
            }}
          >
            {/* Modal header */}
            <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,.07)" }}>
              <h3 className="font-bold text-[15px]" style={{ color: "#f1f5f9" }}>Editar Lead</h3>
              <p className="text-[12px] mt-0.5" style={{ color: "rgba(148,163,184,.55)" }}>
                {editLead.cliente.nome ?? editLead.cliente.telefone} · {editLead.empresa.nome}
              </p>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Status */}
              <div>
                <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "rgba(148,163,184,.7)" }}>
                  STATUS
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                  className="w-full input-dark px-3 py-2.5 text-[13px]"
                >
                  {todasOpcoes.map((c) => (
                    <option key={c.status} value={c.status}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Score fire bar */}
              <div>
                <label className="block text-[11px] font-semibold mb-2" style={{ color: "rgba(148,163,184,.7)" }}>
                  SCORE DO LEAD
                </label>
                <div
                  className="rounded-xl p-3"
                  style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)" }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl w-16 text-center leading-none">{fl.emoji}</span>
                    <div className="flex-1">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={editForm.score}
                        onChange={(e) => setEditForm((p) => ({ ...p, score: Number(e.target.value) }))}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(90deg, ${fc} ${editForm.score}%, rgba(255,255,255,.1) ${editForm.score}%)`,
                          accentColor: fc,
                        }}
                      />
                    </div>
                    <span
                      className="text-[15px] font-bold w-8 text-right tabular-nums"
                      style={{ color: fc }}
                    >
                      {editForm.score}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] px-1" style={{ color: "rgba(148,163,184,.35)" }}>
                    <span>Frio</span>
                    <span className="font-medium" style={{ color: fc }}>{fl.label}</span>
                    <span>Em chamas</span>
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "rgba(148,163,184,.7)" }}>
                  OBSERVAÇÕES
                </label>
                <textarea
                  rows={3}
                  value={editForm.observacoes}
                  onChange={(e) => setEditForm((p) => ({ ...p, observacoes: e.target.value }))}
                  placeholder="Notas sobre este lead..."
                  className="w-full input-dark px-3 py-2.5 text-[13px] resize-none"
                />
              </div>

              {/* Vendedor */}
              <div>
                <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "rgba(148,163,184,.7)" }}>
                  VENDEDOR
                </label>
                <select
                  value={editForm.vendedorId}
                  onChange={(e) => setEditForm((p) => ({ ...p, vendedorId: e.target.value }))}
                  className="w-full input-dark px-3 py-2.5 text-[13px]"
                >
                  <option value="">Sem vendedor</option>
                  {vendedores.map((v) => (
                    <option key={v.id} value={v.id}>{v.nome} ({v.empresa.nome})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modal footer */}
            <div
              className="px-5 py-4 flex gap-2 justify-between items-center"
              style={{ borderTop: "1px solid rgba(255,255,255,.07)" }}
            >
              <div>
                {!confirmandoExclusao ? (
                  <button
                    onClick={() => setConfirmandoExclusao(true)}
                    className="text-[12px] transition-colors"
                    style={{ color: "rgba(248,113,113,.6)" }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#f87171")}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(248,113,113,.6)")}
                  >
                    Excluir lead
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium" style={{ color: "#f87171" }}>Confirmar?</span>
                    <button
                      onClick={excluirLead}
                      disabled={salvando}
                      className="text-[11px] font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
                      style={{ background: "rgba(239,68,68,.15)", color: "#f87171", border: "1px solid rgba(239,68,68,.3)" }}
                    >
                      Excluir
                    </button>
                    <button
                      onClick={() => setConfirmandoExclusao(false)}
                      className="text-[11px]"
                      style={{ color: "rgba(148,163,184,.5)" }}
                    >
                      Não
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setEditLead(null); setConfirmandoExclusao(false); }}
                  className="px-4 py-2 rounded-xl text-[13px] font-medium transition-all"
                  style={{
                    background: "rgba(255,255,255,.06)",
                    border: "1px solid rgba(255,255,255,.1)",
                    color: "#94a3b8",
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarEdit}
                  disabled={salvando}
                  className="btn-primary px-4 py-2 text-[13px] disabled:opacity-50"
                >
                  {salvando ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
