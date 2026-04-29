"use client";

import { useEffect, useState } from "react";

interface Agendamento {
  id: string;
  tipo: string;
  dataAgendada: string;
  notas: string | null;
  status: string;
  cliente: {
    nome: string | null;
    telefone: string;
    empresa: { nome: string; instanciaWhatsapp: string };
  };
}

const tipoLabels: Record<string, string> = {
  FOLLOW_UP: "Follow-up",
  POS_VENDA: "Pós-Venda",
  REATIVACAO: "Reativação",
};

const tipoColors: Record<string, string> = {
  FOLLOW_UP: "bg-cyan-100 text-cyan-700",
  POS_VENDA: "bg-purple-100 text-purple-700",
  REATIVACAO: "bg-orange-100 text-orange-700",
};

export default function AgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agendamentos")
      .then((r) => r.json())
      .then((data) => {
        setAgendamentos(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const concluir = async (id: string) => {
    await fetch(`/api/agendamentos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CONCLUIDO" }),
    });
    setAgendamentos((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="h-full overflow-y-auto"><div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Agendamentos</h2>
        <p className="text-gray-500 text-sm mt-1">
          {agendamentos.length} agendamentos pendentes
        </p>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Carregando...</p>
      ) : (
        <div className="space-y-3">
          {agendamentos.map((a) => {
            const data = new Date(a.dataAgendada);
            const hoje = new Date();
            const atrasado = data < hoje;
            return (
              <div
                key={a.id}
                className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${
                  atrasado ? "border-red-300 bg-red-50" : "border-gray-200"
                }`}
              >
                <div className="flex-shrink-0 text-center w-14">
                  <p className="text-2xl font-bold text-gray-900">
                    {data.getDate()}
                  </p>
                  <p className="text-xs text-gray-500 uppercase">
                    {data.toLocaleString("pt-BR", { month: "short" })}
                  </p>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        tipoColors[a.tipo] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {tipoLabels[a.tipo] ?? a.tipo}
                    </span>
                    {atrasado && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        Atrasado
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-gray-900 text-sm">
                    {a.cliente.nome ?? a.cliente.telefone}
                  </p>
                  <p className="text-xs text-gray-500">
                    {a.cliente.empresa.nome} · {a.cliente.telefone}
                  </p>
                  {a.notas && (
                    <p className="text-xs text-gray-400 mt-1">{a.notas}</p>
                  )}
                </div>
                <button
                  onClick={() => concluir(a.id)}
                  className="flex-shrink-0 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  Concluir
                </button>
              </div>
            );
          })}
          {agendamentos.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              Nenhum agendamento pendente. 🎉
            </div>
          )}
        </div>
      )}
    </div>
  );
  </div>
}
