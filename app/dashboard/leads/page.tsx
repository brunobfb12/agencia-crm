"use client";

import { useEffect, useState } from "react";

interface Lead {
  id: string;
  status: string;
  score: number;
  observacoes: string | null;
  atualizadoEm: string;
  cliente: { nome: string | null; telefone: string };
  empresa: { nome: string; instanciaWhatsapp: string };
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

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leads")
      .then((r) => r.json())
      .then((data) => {
        setLeads(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const moverLead = async (id: string, novoStatus: string) => {
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus }),
    });
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: novoStatus } : l))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Carregando leads...
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Leads</h2>
        <p className="text-gray-500 text-sm mt-1">
          {leads.length} leads · Funil de vendas
        </p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {colunas.map((col) => {
          const leadsColuna = leads.filter((l) => l.status === col.status);
          return (
            <div key={col.status} className="flex-shrink-0 w-64">
              <div className={`border-t-4 ${col.cor} bg-gray-50 rounded-lg p-3 mb-2`}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">
                    {col.label}
                  </span>
                  <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                    {leadsColuna.length}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {leadsColuna.map((lead) => (
                  <div
                    key={lead.id}
                    className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm"
                  >
                    <p className="font-medium text-sm text-gray-900">
                      {lead.cliente.nome ?? lead.cliente.telefone}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {lead.empresa.nome}
                    </p>
                    {lead.observacoes && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {lead.observacoes}
                      </p>
                    )}
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {colunas
                        .filter((c) => c.status !== lead.status)
                        .slice(0, 2)
                        .map((c) => (
                          <button
                            key={c.status}
                            onClick={() => moverLead(lead.id, c.status)}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-0.5 rounded transition-colors"
                          >
                            → {c.label.split(" ")[0]}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
                {leadsColuna.length === 0 && (
                  <div className="text-center py-6 text-gray-400 text-xs bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    Nenhum lead aqui
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
