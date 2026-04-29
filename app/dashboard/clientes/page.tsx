"use client";

import { useEffect, useState, useRef } from "react";

interface Cliente {
  id: string;
  nome: string | null;
  telefone: string;
  email: string | null;
  tags: string[];
  criadoEm: string;
  empresa: { nome: string };
  leads: { status: string }[];
}

interface Empresa {
  id: string;
  nome: string;
}

const statusLabels: Record<string, string> = {
  LEAD: "Lead", AQUECIMENTO: "Aquecimento", PRONTO_PARA_COMPRAR: "Pronto p/ Comprar",
  NEGOCIACAO: "Negociação", VENDA_REALIZADA: "Venda", POS_VENDA: "Pós-Venda",
  FOLLOW_UP: "Follow-up", PERDIDO: "Perdido",
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalImport, setModalImport] = useState(false);
  const [importEmpresa, setImportEmpresa] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importando, setImportando] = useState(false);
  const [importResult, setImportResult] = useState<{ importados: number; ignorados: number; erros: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/empresas").then((r) => r.json()).then(setEmpresas);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (busca) params.set("busca", busca);
    setLoading(true);
    fetch(`/api/clientes?${params}`)
      .then((r) => r.json())
      .then((data) => { setClientes(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [busca]);

  const importar = async () => {
    if (!importFile || !importEmpresa) return;
    setImportando(true);
    setImportResult(null);
    const fd = new FormData();
    fd.append("arquivo", importFile);
    fd.append("empresaId", importEmpresa);
    const res = await fetch("/api/clientes/import", { method: "POST", body: fd });
    const data = await res.json();
    setImportResult(data);
    setImportando(false);
    if (data.ok) {
      fetch(`/api/clientes`).then((r) => r.json()).then(setClientes);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clientes</h2>
          <p className="text-gray-500 text-sm mt-1">{clientes.length} clientes cadastrados</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setModalImport(true); setImportResult(null); }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
          >
            Importar CSV
          </button>
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
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
                <th className="text-left px-4 py-3 font-semibold text-gray-600">E-mail</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Empresa</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clientes.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.nome ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{c.telefone}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{c.email ?? "—"}</td>
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
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Nenhum cliente cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Importar Clientes via CSV</h3>
              <p className="text-xs text-gray-500 mt-1">
                Colunas reconhecidas: <strong>nome, telefone, email, data_nascimento, ultima_compra, valor, observacoes</strong>
              </p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Empresa *</label>
                <select
                  value={importEmpresa}
                  onChange={(e) => setImportEmpresa(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione a empresa</option>
                  {empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Arquivo CSV *</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {importFile && <p className="text-xs text-gray-400 mt-1">{importFile.name}</p>}
              </div>

              {importResult && (
                <div className={`rounded-lg p-3 text-sm ${importResult.ok ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                  {importResult.ok ? (
                    <>
                      <p className="font-medium text-green-700">
                        {importResult.importados} clientes importados, {importResult.ignorados} ignorados
                      </p>
                      {importResult.erros.length > 0 && (
                        <ul className="mt-1 text-xs text-red-600 space-y-0.5">
                          {importResult.erros.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                      )}
                    </>
                  ) : (
                    <p className="text-red-700">Erro na importação.</p>
                  )}
                </div>
              )}
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-2 justify-end">
              <button
                onClick={() => { setModalImport(false); setImportFile(null); setImportResult(null); }}
                className="bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Fechar
              </button>
              <button
                onClick={importar}
                disabled={!importFile || !importEmpresa || importando}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {importando ? "Importando..." : "Importar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
