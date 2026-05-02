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

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  LEAD:                { bg: "rgba(148,163,184,.1)",  color: "#94a3b8", label: "Lead" },
  AQUECIMENTO:         { bg: "rgba(251,146,60,.1)",   color: "#fb923c", label: "Aquecimento" },
  PRONTO_PARA_COMPRAR: { bg: "rgba(251,191,36,.1)",   color: "#fbbf24", label: "Pronto p/ Comprar" },
  NEGOCIACAO:          { bg: "rgba(96,165,250,.1)",   color: "#60a5fa", label: "Negociação" },
  VENDA_REALIZADA:     { bg: "rgba(52,211,153,.1)",   color: "#34d399", label: "Venda" },
  POS_VENDA:           { bg: "rgba(192,132,252,.1)",  color: "#c084fc", label: "Pós-Venda" },
  FOLLOW_UP:           { bg: "rgba(34,211,238,.1)",   color: "#22d3ee", label: "Follow-up" },
  PERDIDO:             { bg: "rgba(248,113,113,.1)",  color: "#f87171", label: "Perdido" },
  SEM_INTERESSE:       { bg: "rgba(251,113,133,.1)",  color: "#fb7185", label: "Sem Interesse" },
  SEM_RESPOSTA:        { bg: "rgba(251,191,36,.1)",   color: "#fbbf24", label: "Sem Resposta" },
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
  const [importResult, setImportResult] = useState<{ ok: boolean; importados: number; ignorados: number; erros: string[] } | null>(null);
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

  const TH = ({ children }: { children: React.ReactNode }) => (
    <th
      className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide"
      style={{ color: "rgba(148,163,184,.5)" }}
    >
      {children}
    </th>
  );

  return (
    <div className="h-full overflow-y-auto" style={{ background: "#08080e" }}>
      <div className="p-8 max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <span
            className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full mb-3"
            style={{ background: "rgba(99,102,241,.1)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,.18)" }}
          >
            CRM
          </span>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-[28px] font-bold tracking-tight" style={{ color: "#f1f5f9" }}>Clientes</h1>
              <p className="text-[13px] mt-1" style={{ color: "rgba(148,163,184,.5)" }}>
                {clientes.length} clientes cadastrados
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setModalImport(true); setImportResult(null); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all"
                style={{
                  background: "rgba(52,211,153,.1)",
                  border: "1px solid rgba(52,211,153,.25)",
                  color: "#34d399",
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Importar CSV
              </button>
              <input
                type="text"
                placeholder="Buscar por nome ou telefone..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="input-dark px-4 py-2 text-[13px] w-64"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="shimmer h-12 rounded-xl" />
            ))}
          </div>
        ) : (
          <div
            className="bento-card overflow-hidden animate-fade-up"
            style={{ animationDelay: "80ms" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,.06)", background: "rgba(255,255,255,.02)" }}>
                  <TH>Cliente</TH>
                  <TH>Telefone</TH>
                  <TH>E-mail</TH>
                  <TH>Empresa</TH>
                  <TH>Status</TH>
                  <TH>Cadastro</TH>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c, idx) => (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: idx < clientes.length - 1 ? "1px solid rgba(255,255,255,.04)" : "none",
                      transition: "background .15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,.03)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-4 py-3 font-semibold text-[13px]" style={{ color: "#f1f5f9" }}>
                      {c.nome ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-mono" style={{ color: "rgba(148,163,184,.8)" }}>
                      {c.telefone}
                    </td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: "rgba(148,163,184,.55)" }}>
                      {c.email ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: "rgba(148,163,184,.7)" }}>
                      {c.empresa.nome}
                    </td>
                    <td className="px-4 py-3">
                      {c.leads[0] ? (() => {
                        const badge = STATUS_BADGE[c.leads[0].status];
                        return (
                          <span
                            className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                            style={{ background: badge?.bg ?? "rgba(148,163,184,.1)", color: badge?.color ?? "#94a3b8" }}
                          >
                            {badge?.label ?? c.leads[0].status}
                          </span>
                        );
                      })() : (
                        <span style={{ color: "rgba(148,163,184,.3)", fontSize: "12px" }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: "rgba(148,163,184,.4)" }}>
                      {new Date(c.criadoEm).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
                {clientes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3" style={{ color: "rgba(148,163,184,.3)" }}>
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm8 10v-2a4 4 0 00-3-3.87M23 21v-2a4 4 0 00-3-3.87" />
                        </svg>
                        <p className="text-[13px]">Nenhum cliente cadastrado. Importe um CSV para começar.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Importar CSV */}
      {modalImport && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(0,0,0,.7)", backdropFilter: "blur(8px)" }}>
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden animate-fade-up"
            style={{
              background: "linear-gradient(145deg, rgba(255,255,255,.07), rgba(255,255,255,.03))",
              border: "1px solid rgba(255,255,255,.1)",
              boxShadow: "0 32px 80px rgba(0,0,0,.7)",
            }}
          >
            {/* Header */}
            <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,.07)" }}>
              <h3 className="text-[16px] font-bold" style={{ color: "#f1f5f9" }}>Importar Clientes via CSV</h3>
              <div
                className="mt-4 rounded-xl p-4 space-y-2 text-[12px]"
                style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.06)" }}
              >
                <p className="font-semibold mb-2" style={{ color: "rgba(148,163,184,.8)" }}>Colunas aceitas:</p>
                {[
                  { col: "telefone", obrig: true,  uso: "Identifica o cliente — obrigatório. Ex: 5511999998888" },
                  { col: "nome",     obrig: false, uso: "Nome exibido no CRM e usado pela IA" },
                  { col: "email",    obrig: false, uso: "Armazenado no cadastro para contato futuro" },
                  { col: "data_nascimento", obrig: false, uso: "Gera parabéns automático no aniversário" },
                  { col: "ultima_compra",   obrig: false, uso: "Vai para observações do lead" },
                  { col: "valor",           obrig: false, uso: "Valor da última compra" },
                  { col: "observacoes",     obrig: false, uso: "Nota livre sobre o cliente" },
                ].map(({ col, obrig, uso }) => (
                  <div key={col} className="flex gap-2">
                    <span className="shrink-0 font-mono font-semibold" style={{ color: obrig ? "#60a5fa" : "rgba(148,163,184,.6)" }}>
                      {col}{obrig && " *"}
                    </span>
                    <span style={{ color: "rgba(148,163,184,.4)" }}>— {uso}</span>
                  </div>
                ))}
                <p className="pt-2" style={{ color: "rgba(148,163,184,.35)", borderTop: "1px solid rgba(255,255,255,.05)" }}>
                  * obrigatório · Separador: vírgula · Data: DD/MM/AAAA
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "rgba(148,163,184,.7)" }}>
                  EMPRESA *
                </label>
                <select
                  value={importEmpresa}
                  onChange={(e) => setImportEmpresa(e.target.value)}
                  className="w-full input-dark px-3 py-2.5 text-[13px]"
                >
                  <option value="">Selecione a empresa</option>
                  {empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "rgba(148,163,184,.7)" }}>
                  ARQUIVO CSV *
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                  className="w-full input-dark px-3 py-2.5 text-[13px]"
                />
                {importFile && (
                  <p className="text-[11px] mt-1.5" style={{ color: "rgba(148,163,184,.4)" }}>{importFile.name}</p>
                )}
              </div>

              {importResult && (
                <div
                  className="rounded-xl px-4 py-3 text-[13px]"
                  style={importResult.ok
                    ? { background: "rgba(52,211,153,.08)", border: "1px solid rgba(52,211,153,.2)" }
                    : { background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.2)" }
                  }
                >
                  {importResult.ok ? (
                    <>
                      <p className="font-semibold" style={{ color: "#34d399" }}>
                        {importResult.importados} clientes importados, {importResult.ignorados} ignorados
                      </p>
                      {importResult.erros.length > 0 && (
                        <ul className="mt-1 space-y-0.5 text-[11px]" style={{ color: "#f87171" }}>
                          {importResult.erros.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                      )}
                    </>
                  ) : (
                    <p style={{ color: "#f87171" }}>Erro na importação.</p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex gap-3 justify-end" style={{ borderTop: "1px solid rgba(255,255,255,.07)" }}>
              <button
                onClick={() => { setModalImport(false); setImportFile(null); setImportResult(null); }}
                className="px-4 py-2 rounded-xl text-[13px] font-medium transition-all"
                style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", color: "#e2e8f0" }}
              >
                Fechar
              </button>
              <button
                onClick={importar}
                disabled={!importFile || !importEmpresa || importando}
                className="px-5 py-2 rounded-xl text-[13px] font-semibold disabled:opacity-40 transition-all"
                style={{
                  background: "linear-gradient(135deg, rgba(52,211,153,.8), rgba(16,185,129,.8))",
                  color: "white",
                  boxShadow: "0 4px 14px rgba(52,211,153,.25)",
                }}
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
