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

const statusLabels: Record<string, string> = {
  LEAD: "Novos Leads",
  AQUECIMENTO: "Aquecimento",
  PRONTO_PARA_COMPRAR: "Pronto p/ Comprar",
  NEGOCIACAO: "Em Negociação",
  VENDA_REALIZADA: "Venda Realizada",
  POS_VENDA: "Pós-Venda",
  FOLLOW_UP: "Follow-up",
  PERDIDO: "Perdidos",
};

const statusColors: Record<string, string> = {
  LEAD: "bg-gray-100 text-gray-700",
  AQUECIMENTO: "bg-orange-100 text-orange-700",
  PRONTO_PARA_COMPRAR: "bg-yellow-100 text-yellow-700",
  NEGOCIACAO: "bg-blue-100 text-blue-700",
  VENDA_REALIZADA: "bg-green-100 text-green-700",
  POS_VENDA: "bg-purple-100 text-purple-700",
  FOLLOW_UP: "bg-cyan-100 text-cyan-700",
  PERDIDO: "bg-red-100 text-red-700",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Carregando...
      </div>
    );
  }

  const cards = [
    { label: "Total de Clientes", value: stats?.totalClientes ?? 0, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Leads Ativos", value: stats?.leadsAtivos ?? 0, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Vendas Realizadas", value: stats?.vendasRealizadas ?? 0, color: "text-green-600", bg: "bg-green-50" },
    { label: "Agendamentos Pendentes", value: stats?.agendamentosPendentes ?? 0, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Visão Geral</h2>
        <p className="text-gray-500 text-sm mt-1">Resumo de todas as empresas</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className={`${card.bg} rounded-xl p-5`}>
            <p className="text-sm text-gray-600 font-medium">{card.label}</p>
            <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          Funil de Leads
        </h3>
        {stats?.leadsPorStatus && stats.leadsPorStatus.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {stats.leadsPorStatus.map((item) => (
              <span
                key={item.status}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  statusColors[item.status] ?? "bg-gray-100 text-gray-700"
                }`}
              >
                {statusLabels[item.status] ?? item.status}: {item._count.status}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">
            Nenhum lead cadastrado ainda. Conecte os WhatsApps das empresas para começar.
          </p>
        )}
      </div>
    </div>
  );
}
