"use client";

import { useEffect, useState } from "react";

interface Empresa {
  id: string;
  nome: string;
  instanciaWhatsapp: string;
  ativa: boolean;
  _count: { clientes: number; leads: number };
}

interface Vendedor {
  id: string;
  nome: string;
  telefone: string;
  ordemChamada: number;
  empresa: { nome: string };
  _count: { vendas: number };
}

export default function ConfiguracoesPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [aba, setAba] = useState<"empresas" | "vendedores">("empresas");

  const [novaEmpresa, setNovaEmpresa] = useState({ nome: "", instanciaWhatsapp: "" });
  const [novoVendedor, setNovoVendedor] = useState({ nome: "", telefone: "", empresaId: "" });

  useEffect(() => {
    fetch("/api/empresas").then((r) => r.json()).then(setEmpresas);
    fetch("/api/vendedores").then((r) => r.json()).then(setVendedores);
  }, []);

  const criarEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/empresas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novaEmpresa),
    });
    const emp = await res.json();
    setEmpresas((prev) => [...prev, emp]);
    setNovaEmpresa({ nome: "", instanciaWhatsapp: "" });
  };

  const criarVendedor = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/vendedores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novoVendedor),
    });
    const v = await res.json();
    setVendedores((prev) => [...prev, { ...v, empresa: empresas.find((em) => em.id === v.empresaId) ?? { nome: "" }, _count: { vendas: 0 } }]);
    setNovoVendedor({ nome: "", telefone: "", empresaId: "" });
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Configurações</h2>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setAba("empresas")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            aba === "empresas" ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Empresas
        </button>
        <button
          onClick={() => setAba("vendedores")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            aba === "vendedores" ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Vendedores
        </button>
      </div>

      {aba === "empresas" && (
        <div className="space-y-4">
          <form onSubmit={criarEmpresa} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3">
            <input
              required
              placeholder="Nome da empresa"
              value={novaEmpresa.nome}
              onChange={(e) => setNovaEmpresa((p) => ({ ...p, nome: e.target.value }))}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              required
              placeholder="Instância WhatsApp (ex: ph_intima)"
              value={novaEmpresa.instanciaWhatsapp}
              onChange={(e) => setNovaEmpresa((p) => ({ ...p, instanciaWhatsapp: e.target.value }))}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
              Adicionar
            </button>
          </form>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Empresa</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Instância</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Clientes</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Leads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {empresas.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{e.nome}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{e.instanciaWhatsapp}</td>
                    <td className="px-4 py-3 text-gray-600">{e._count.clientes}</td>
                    <td className="px-4 py-3 text-gray-600">{e._count.leads}</td>
                  </tr>
                ))}
                {empresas.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">Nenhuma empresa cadastrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {aba === "vendedores" && (
        <div className="space-y-4">
          <form onSubmit={criarVendedor} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3">
            <input
              required
              placeholder="Nome do vendedor"
              value={novoVendedor.nome}
              onChange={(e) => setNovoVendedor((p) => ({ ...p, nome: e.target.value }))}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              required
              placeholder="Telefone (ex: 5511999999999)"
              value={novoVendedor.telefone}
              onChange={(e) => setNovoVendedor((p) => ({ ...p, telefone: e.target.value }))}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              required
              value={novoVendedor.empresaId}
              onChange={(e) => setNovoVendedor((p) => ({ ...p, empresaId: e.target.value }))}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione a empresa</option>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>{e.nome}</option>
              ))}
            </select>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
              Adicionar
            </button>
          </form>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Vendedor</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Telefone</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Empresa</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Ordem</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Vendas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vendedores.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{v.nome}</td>
                    <td className="px-4 py-3 text-gray-500">{v.telefone}</td>
                    <td className="px-4 py-3 text-gray-600">{v.empresa.nome}</td>
                    <td className="px-4 py-3 text-gray-600">#{v.ordemChamada}</td>
                    <td className="px-4 py-3 text-gray-600">{v._count.vendas}</td>
                  </tr>
                ))}
                {vendedores.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Nenhum vendedor cadastrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
