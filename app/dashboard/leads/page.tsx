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
  { status: "LEAD", label: "Novos Leads", cor: "border-gray-400" },
  { status: "AQUECIMENTO", label: "Aquecimento", cor: "border-orange-400" },
  { status: "PRONTO_PARA_COMPRAR", label: "Pronto p/ Comprar", cor: "border-yellow-400" },
  { status: "NEGOCIACAO", label: "Em Negociação", cor: "border-blue-400" },
  { status: "VENDA_REALIZADA", label: "Venda Realizada", cor: "border-green-400" },
  { status: "POS_VENDA", label: "Pós-Venda", cor: "border-purple-400" },
  { status: "FOLLOW_UP", label: "Follow-up", cor: "border-cyan-400" },
];

const todasOpcoes = [...colunas, { status: "PERDIDO", label: "Perdido", cor: "border-red-400" }];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [editForm, setEditForm] = useState({ status: "", observacoes: "", score: 0, vendedorId: "" });
  const [salvando, setSalvando] = useState(false);

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

  const abrirEdit = (lead: Lead) => {
    setEditLead(lead);
    setEditForm({
      status: lead.status,
      observacoes: lead.observacoes ?? "",
      score: lead.score,
      vendedorId: lead.vendedorId ?? "",
    });
  };

  const salvarEdit = async () => {
    if (!editLead) return;
    setSalvando(true);
    const res = await fetch(`/api/leads/${editLead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: editForm.status,
        observacoes: editForm.observacoes,
        score: Number(editForm.score),
        vendedorId: editForm.vendedorId || null,
      }),
    });
    const updated = await res.json();
    setLeads((prev) => prev.map((l) => (l.id === editLead.id ? { ...l, ...updated } : l)));
    setEditLead(null);
    setSalvando(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-gray-500">Carregando leads...</div>;
  }

  return (
    <>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Leads</h2>
          <p className="text-gray-500 text-sm mt-1">
            {leads.length} leads · Arraste os cards para mover entre colunas
          </p>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4">
          {colunas.map((col) => {
            const leadsColuna = leads.filter((l) => l.status === col.status);
            const isOver = dragOverCol === col.status;
            return (
              <div
                key={col.status}
                className="flex-shrink-0 w-64"
                onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.status); }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={() => {
                  if (draggedId) moverLead(draggedId, col.status);
                  setDraggedId(null);
                  setDragOverCol(null);
                }}
              >
                <div className={`border-t-4 ${col.cor} ${isOver ? "bg-blue-50" : "bg-gray-50"} rounded-lg p-3 mb-2 transition-colors`}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                    <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                      {leadsColuna.length}
                    </span>
                  </div>
                </div>

                <div className={`space-y-2 min-h-16 rounded-lg p-1 transition-colors ${isOver ? "bg-blue-50/60 ring-2 ring-blue-300 ring-dashed" : ""}`}>
                  {leadsColuna.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={() => setDraggedId(lead.id)}
                      onDragEnd={() => { setDraggedId(null); setDragOverCol(null); }}
                      className={`bg-white rounded-lg border border-gray-200 p-3 shadow-sm cursor-grab active:cursor-grabbing select-none transition-opacity ${
                        draggedId === lead.id ? "opacity-30" : "opacity-100"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <p className="font-medium text-sm text-gray-900 leading-tight flex-1 min-w-0 truncate">
                          {lead.cliente.nome ?? lead.cliente.telefone}
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); abrirEdit(lead); }}
                          className="text-gray-300 hover:text-blue-500 flex-shrink-0 text-base leading-none transition-colors"
                          title="Editar lead"
                        >
                          ✏️
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{lead.empresa.nome}</p>
                      {lead.observacoes && (
                        <p className="text-xs text-gray-400 mt-1.5 line-clamp-2 leading-tight">
                          {lead.observacoes}
                        </p>
                      )}
                      {lead.score > 0 && (
                        <div className="mt-1.5">
                          <span className="text-xs text-amber-500 font-medium">★ {lead.score}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {leadsColuna.length === 0 && (
                    <div
                      className={`text-center py-8 text-xs rounded-lg border border-dashed transition-colors ${
                        isOver ? "border-blue-400 text-blue-400 bg-blue-50" : "border-gray-200 text-gray-300"
                      }`}
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

      {editLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Editar Lead</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {editLead.cliente.nome ?? editLead.cliente.telefone} · {editLead.empresa.nome}
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {todasOpcoes.map((c) => (
                    <option key={c.status} value={c.status}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Observações</label>
                <textarea
                  rows={3}
                  value={editForm.observacoes}
                  onChange={(e) => setEditForm((p) => ({ ...p, observacoes: e.target.value }))}
                  placeholder="Notas sobre este lead..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Score (0–100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editForm.score}
                    onChange={(e) => setEditForm((p) => ({ ...p, score: Number(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Vendedor</label>
                  <select
                    value={editForm.vendedorId}
                    onChange={(e) => setEditForm((p) => ({ ...p, vendedorId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sem vendedor</option>
                    {vendedores.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nome} ({v.empresa.nome})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-2 justify-end">
              <button
                onClick={() => setEditLead(null)}
                className="bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={salvarEdit}
                disabled={salvando}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
