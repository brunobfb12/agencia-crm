"use client";

import { useEffect, useState } from "react";

interface Empresa {
  id: string;
  nome: string;
  instanciaWhatsapp: string;
  ativa: boolean;
  informacoes: string | null;
  _count: { clientes: number; leads: number };
}

interface Vendedor {
  id: string;
  nome: string;
  telefone: string;
  ordemChamada: number;
  ativo: boolean;
  empresaId: string;
  empresa: { nome: string };
  _count: { vendas: number };
}

const SECOES = ["PRODUTOS", "PRECOS", "PAGAMENTO", "ENTREGA", "DIFERENCIAIS", "HORARIO"] as const;
const LABELS: Record<string, string> = {
  PRODUTOS: "Produtos / Serviços",
  PRECOS: "Preços",
  PAGAMENTO: "Formas de Pagamento",
  ENTREGA: "Entrega / Frete",
  DIFERENCIAIS: "Diferenciais",
  HORARIO: "Horário de Atendimento",
};

function parseInfo(texto: string | null): Record<string, string> {
  const result: Record<string, string> = {};
  if (!texto) return result;
  for (const sec of SECOES) {
    const match = texto.match(new RegExp(`${sec}:([\\s\\S]*?)(?=(?:${SECOES.join("|")}):|\$)`));
    if (match) result[sec] = match[1].trim();
  }
  return result;
}

function composeInfo(campos: Record<string, string>): string {
  return SECOES
    .filter((s) => campos[s]?.trim())
    .map((s) => `${s}: ${campos[s].trim()}`)
    .join("\n");
}

export default function ConfiguracoesPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [aba, setAba] = useState<"empresas" | "vendedores">("empresas");

  const [novaEmpresa, setNovaEmpresa] = useState({ nome: "", instanciaWhatsapp: "" });
  const [novoVendedor, setNovoVendedor] = useState({ nome: "", telefone: "", empresaId: "" });

  const [editEmpresa, setEditEmpresa] = useState<string | null>(null);
  const [infoCampos, setInfoCampos] = useState<Record<string, string>>({});

  const [editVendedor, setEditVendedor] = useState<string | null>(null);
  const [editVendedorData, setEditVendedorData] = useState({ nome: "", telefone: "", ordemChamada: 1 });

  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/empresas").then((r) => r.json()).then(setEmpresas);
    fetch("/api/vendedores?todos=true").then((r) => r.json()).then(setVendedores);
  }, []);

  function showMsg(texto: string) {
    setMsg(texto);
    setTimeout(() => setMsg(""), 3000);
  }

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
    showMsg("Empresa criada!");
  };

  const criarVendedor = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/vendedores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novoVendedor),
    });
    const v = await res.json();
    setVendedores((prev) => [
      ...prev,
      { ...v, empresa: empresas.find((em) => em.id === v.empresaId) ?? { nome: "" }, _count: { vendas: 0 } },
    ]);
    setNovoVendedor({ nome: "", telefone: "", empresaId: "" });
    showMsg("Vendedor criado!");
  };

  function abrirEditEmpresa(emp: Empresa) {
    setEditEmpresa(emp.id);
    setInfoCampos(parseInfo(emp.informacoes));
  }

  const salvarInfoEmpresa = async (empresaId: string) => {
    setSalvando(true);
    const informacoes = composeInfo(infoCampos);
    await fetch(`/api/empresas/${empresaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ informacoes }),
    });
    setEmpresas((prev) => prev.map((e) => e.id === empresaId ? { ...e, informacoes } : e));
    setEditEmpresa(null);
    setSalvando(false);
    showMsg("Informações salvas!");
  };

  function abrirEditVendedor(v: Vendedor) {
    setEditVendedor(v.id);
    setEditVendedorData({ nome: v.nome, telefone: v.telefone, ordemChamada: v.ordemChamada });
  }

  const salvarVendedor = async (id: string) => {
    setSalvando(true);
    const res = await fetch(`/api/vendedores/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editVendedorData),
    });
    const updated = await res.json();
    setVendedores((prev) => prev.map((v) => v.id === id ? { ...v, ...updated } : v));
    setEditVendedor(null);
    setSalvando(false);
    showMsg("Vendedor atualizado!");
  };

  const toggleAtivo = async (v: Vendedor) => {
    await fetch(`/api/vendedores/${v.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !v.ativo }),
    });
    setVendedores((prev) => prev.map((vv) => vv.id === v.id ? { ...vv, ativo: !vv.ativo } : vv));
    showMsg(v.ativo ? "Vendedor desativado" : "Vendedor ativado");
  };

  const excluirVendedor = async (id: string, nome: string) => {
    if (!confirm(`Excluir ${nome}? Os leads atribuídos a ele ficarão sem vendedor.`)) return;
    await fetch(`/api/vendedores/${id}`, { method: "DELETE" });
    setVendedores((prev) => prev.filter((v) => v.id !== id));
    showMsg("Vendedor excluído.");
  };

  return (
    <div className="h-full overflow-y-auto"><div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Configurações</h2>
        {msg && (
          <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">{msg}</span>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {(["empresas", "vendedores"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setAba(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              aba === tab ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab === "empresas" ? "Empresas" : "Vendedores"}
          </button>
        ))}
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
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Info</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {empresas.map((emp) => (
                  <>
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{emp.nome}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{emp.instanciaWhatsapp}</td>
                      <td className="px-4 py-3 text-gray-600">{emp._count.clientes}</td>
                      <td className="px-4 py-3">
                        {emp.informacoes ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Preenchida</span>
                        ) : (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Vazia</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => editEmpresa === emp.id ? setEditEmpresa(null) : abrirEditEmpresa(emp)}
                          className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-lg font-medium"
                        >
                          {editEmpresa === emp.id ? "Fechar" : "Editar Info"}
                        </button>
                      </td>
                    </tr>
                    {editEmpresa === emp.id && (
                      <tr key={`${emp.id}-edit`}>
                        <td colSpan={5} className="px-4 py-4 bg-blue-50">
                          <div className="grid grid-cols-2 gap-4">
                            {SECOES.map((sec) => (
                              <div key={sec}>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">{LABELS[sec]}</label>
                                <textarea
                                  rows={3}
                                  value={infoCampos[sec] ?? ""}
                                  onChange={(e) => setInfoCampos((p) => ({ ...p, [sec]: e.target.value }))}
                                  placeholder={`Ex: ${sec === "PRODUTOS" ? "camisetas, calças, vestidos" : sec === "PRECOS" ? "camiseta R$29,90" : sec === "PAGAMENTO" ? "PIX, cartão 12x" : sec === "ENTREGA" ? "frete grátis acima de R$200" : sec === "DIFERENCIAIS" ? "atacado a partir de 10 peças" : "seg-sex 9h-18h"}`}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 flex gap-2">
                            <button
                              onClick={() => salvarInfoEmpresa(emp.id)}
                              disabled={salvando}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                            >
                              {salvando ? "Salvando..." : "Salvar Informações"}
                            </button>
                            <button
                              onClick={() => setEditEmpresa(null)}
                              className="bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
                            >
                              Cancelar
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {empresas.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Nenhuma empresa cadastrada.</td></tr>
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
              placeholder="Nome"
              value={novoVendedor.nome}
              onChange={(e) => setNovoVendedor((p) => ({ ...p, nome: e.target.value }))}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              required
              placeholder="Telefone (5562999999999)"
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
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vendedores.map((v) => (
                  <>
                    <tr key={v.id} className={`hover:bg-gray-50 ${!v.ativo ? "opacity-50" : ""}`}>
                      <td className="px-4 py-3 font-medium">{v.nome}</td>
                      <td className="px-4 py-3 text-gray-500">{v.telefone}</td>
                      <td className="px-4 py-3 text-gray-600">{v.empresa.nome}</td>
                      <td className="px-4 py-3 text-gray-600">#{v.ordemChamada}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${v.ativo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {v.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => editVendedor === v.id ? setEditVendedor(null) : abrirEditVendedor(v)}
                            className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded font-medium"
                          >
                            {editVendedor === v.id ? "Fechar" : "Editar"}
                          </button>
                          <button
                            onClick={() => toggleAtivo(v)}
                            className={`text-xs px-2 py-1 rounded font-medium ${v.ativo ? "bg-yellow-50 text-yellow-600 hover:bg-yellow-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
                          >
                            {v.ativo ? "Desativar" : "Ativar"}
                          </button>
                          <button
                            onClick={() => excluirVendedor(v.id, v.nome)}
                            className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded font-medium"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                    {editVendedor === v.id && (
                      <tr key={`${v.id}-edit`}>
                        <td colSpan={6} className="px-4 py-4 bg-blue-50">
                          <div className="flex gap-3 items-end">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Nome</label>
                              <input
                                value={editVendedorData.nome}
                                onChange={(e) => setEditVendedorData((p) => ({ ...p, nome: e.target.value }))}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Telefone</label>
                              <input
                                value={editVendedorData.telefone}
                                onChange={(e) => setEditVendedorData((p) => ({ ...p, telefone: e.target.value }))}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Ordem</label>
                              <input
                                type="number"
                                min={1}
                                value={editVendedorData.ordemChamada}
                                onChange={(e) => setEditVendedorData((p) => ({ ...p, ordemChamada: Number(e.target.value) }))}
                                className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <button
                              onClick={() => salvarVendedor(v.id)}
                              disabled={salvando}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                            >
                              Salvar
                            </button>
                            <button
                              onClick={() => setEditVendedor(null)}
                              className="bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
                            >
                              Cancelar
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {vendedores.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Nenhum vendedor cadastrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
  </div>
}
