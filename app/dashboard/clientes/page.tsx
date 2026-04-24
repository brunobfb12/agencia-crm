"use client";

import { useEffect, useState } from "react";

interface Cliente {
  id: string;
  nome: string | null;
  telefone: string;
  tags: string[];
  criadoEm: string;
  empresa: { nome: string };
  leads: { status: string }[];
}

const statusLabels: Record<string, string> = {
  LEAD: "Lead",
  AQUECIMENTO: "Aquecimento",
  PRONTO_PARA_COMPRAR: "Pronto p/ Comprar",
  NEGOCIACAO: "Negociação",
  VENDA_REALIZADA: "Venda",
  POS_VENDA: "Pós-Venda",
  FOLLOW_UP: "Follow-up",
  PERDIDO: "Perdido",
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (busca) params.set("busca", busca);
    fetch(`/api/clientes?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setClientes(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [busca]);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clientes</h2>
          <p className="text-gray-500 text-sm mt-1">{clientes.length} clientes cadastrados</p>
        </div>
        <input
          type="text"
          placeholder="Buscar por nome ou telefone..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Carregando...</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Cliente</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Telefone</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Empresa</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clientes.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {c.nome ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.telefone}</td>
                  <td className="px-4 py-3 text-gray-600">{c.empresa.nome}</td>
                  <td className="px-4 py-3">
                    {c.leads[0] ? (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {statusLabels[c.leads[0].status] ?? c.leads[0].status}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(c.criadoEm).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
              {clientes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    Nenhum cliente cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
