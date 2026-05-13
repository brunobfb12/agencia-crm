"use client";

import { useEffect, useState, useRef } from "react";
import { ScrollHint, GradientFade } from "../components/table-scroll-hint";

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

interface Vendedor {
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

const formVazio = { nome: "", telefone: "", email: "", dataNascimento: "", empresaId: "", vendedorId: "" };

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);

  // modal CSV
  const [modalImport, setModalImport] = useState(false);
  const [importEmpresa, setImportEmpresa] = useState("");
  const [importVendedores, setImportVendedores] = useState<Vendedor[]>([]);
  const [importVendedorId, setImportVendedorId] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importando, setImportando] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: boolean; importados: number; ignorados: number; erros: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // modal novo cliente
  const [modalNovo, setModalNovo] = useState(false);
  const [novoForm, setNovoForm] = useState(formVazio);
  const [novoVendedores, setNovoVendedores] = useState<Vendedor[]>([]);
  const [salvandoNovo, setSalvandoNovo] = useState(false);
  const [novoErro, setNovoErro] = useState("");

  // modal iniciar conversa
  const [modalAtivar, setModalAtivar] = useState<Cliente | null>(null);
  const [msgInicial, setMsgInicial] = useState("");
  const [ativando, setAtivando] = useState(false);
  const [ativarResultado, setAtivarResultado] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    fetch("/api/empresas").then((r) => r.json()).then((data) => {
      setEmpresas(data);
      if (data.length === 1) setNovoForm((f) => ({ ...f, empresaId: data[0].id }));
    });
  }, []);

  useEffect(() => {
    if (!novoForm.empresaId) { setNovoVendedores([]); return; }
    fetch(`/api/vendedores?empresaId=${novoForm.empresaId}`).then(r => r.json()).then(setNovoVendedores);
  }, [novoForm.empresaId]);

  useEffect(() => {
    if (!importEmpresa) { setImportVendedores([]); setImportVendedorId(""); return; }
    fetch(`/api/vendedores?empresaId=${importEmpresa}`).then(r => r.json()).then(setImportVendedores);
    setImportVendedorId("");
  }, [importEmpresa]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (busca) params.set("busca", busca);
    setLoading(true);
    fetch(`/api/clientes?${params}`)
      .then((r) => r.json())
      .then((data) => { setClientes(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [busca]);

  const salvarNovo = async () => {
    if (!novoForm.telefone || !novoForm.empresaId) {
      setNovoErro("Telefone e empresa são obrigatórios.");
      return;
    }
    setSalvandoNovo(true);
    setNovoErro("");
    const res = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: novoForm.nome || null,
        telefone: novoForm.telefone,
        email: novoForm.email || undefined,
        dataNascimento: novoForm.dataNascimento || undefined,
        empresaId: novoForm.empresaId,
        ...(novoForm.vendedorId && { vendedorId: novoForm.vendedorId }),
      }),
    });
    if (res.ok) {
      setModalNovo(false);
      setNovoForm(formVazio);
      if (empresas.length === 1) setNovoForm((f) => ({ ...f, empresaId: empresas[0].id }));
      fetch("/api/clientes").then((r) => r.json()).then(setClientes);
    } else {
      const d = await res.json();
      setNovoErro(d.error ?? "Erro ao salvar cliente.");
    }
    setSalvandoNovo(false);
  };

  const importar = async () => {
    if (!importFile || !importEmpresa) return;
    setImportando(true);
    setImportResult(null);
    const fd = new FormData();
    fd.append("arquivo", importFile);
    fd.append("empresaId", importEmpresa);
    if (importVendedorId) fd.append("vendedorId", importVendedorId);
    const res = await fetch("/api/clientes/import", { method: "POST", body: fd });
    const data = await res.json();
    setImportResult(data);
    setImportando(false);
    if (data.ok) {
      fetch(`/api/clientes`).then((r) => r.json()).then(setClientes);
    }
  };

  const ativarLead = async () => {
    if (!modalAtivar) return;
    setAtivando(true);
    setAtivarResultado(null);
    const res = await fetch("/api/leads/ativar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clienteId: modalAtivar.id, mensagemInicial: msgInicial || undefined }),
    });
    const data = await res.json();
    setAtivarResultado({ ok: data.ok, msg: data.ok ? `Mensagem enviada: "${data.mensagem}"` : (data.error ?? "Erro ao enviar") });
    setAtivando(false);
    if (data.ok) fetch("/api/clientes").then(r => r.json()).then(setClientes);
  };

  const TH = ({ children }: { children: React.ReactNode }) => (
    <th
      className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide"
      style={{ color: "var(--muted-2)" }}
    >
      {children}
    </th>
  );

  return (
    <div className="h-full overflow-y-auto" style={{ background: "var(--bg)" }}>
      <div className="p-4 md:p-8 max-w-6xl mx-auto">

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
              <h1 className="text-[28px] font-bold tracking-tight" style={{ color: "var(--text)" }}>Clientes</h1>
              <p className="text-[13px] mt-1" style={{ color: "var(--muted-2)" }}>
                {clientes.length} clientes cadastrados
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setModalNovo(true); setNovoErro(""); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all"
                style={{
                  background: "rgba(99,102,241,.15)",
                  border: "1px solid rgba(99,102,241,.3)",
                  color: "#a5b4fc",
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Novo Cliente
              </button>
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
          <>
            <ScrollHint />
            <div className="relative">
              <GradientFade />
              <div
                className="bento-card overflow-x-auto animate-fade-up"
                style={{ animationDelay: "80ms" }}
              >
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--card)" }}>
                  <TH>Cliente</TH>
                  <TH>Telefone</TH>
                  <TH>E-mail</TH>
                  <TH>Empresa</TH>
                  <TH>Status</TH>
                  <TH>Cadastro</TH>
                  <TH>{" "}</TH>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c, idx) => (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: idx < clientes.length - 1 ? "1px solid var(--card)" : "none",
                      transition: "background .15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--card)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-4 py-3 font-semibold text-[13px]" style={{ color: "var(--text)" }}>
                      {c.nome ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-mono" style={{ color: "var(--muted)" }}>
                      {c.telefone}
                    </td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: "var(--muted-2)" }}>
                      {c.email ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: "var(--muted)" }}>
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
                        <span style={{ color: "var(--muted-3)", fontSize: "12px" }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: "var(--muted-3)" }}>
                      {new Date(c.criadoEm).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setModalAtivar(c); setMsgInicial(""); setAtivarResultado(null); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                        style={{ background: "rgba(99,102,241,.12)", border: "1px solid rgba(99,102,241,.25)", color: "#a5b4fc" }}
                        title="Enviar primeira mensagem e ativar lead"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Ativar
                      </button>
                    </td>
                  </tr>
                ))}
                {clientes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3" style={{ color: "var(--muted-3)" }}>
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
            </div>
          </>
        )}
      </div>

      {/* Modal Novo Cliente */}
      {modalNovo && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "var(--overlay)", backdropFilter: "blur(8px)" }}>
          <div
            className="w-full max-w-md rounded-2xl overflow-hidden animate-fade-up"
            style={{ background: "var(--bg)", border: "1px solid var(--border-2)", boxShadow: "0 32px 80px rgba(0,0,0,.4)" }}
          >
            <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="text-[16px] font-bold" style={{ color: "var(--text)" }}>Novo Cliente</h3>
              <p className="text-[12px] mt-0.5" style={{ color: "var(--muted-2)" }}>Preencha os dados do cliente manualmente</p>
            </div>

            <div className="px-6 py-5 space-y-4">
              {empresas.length > 1 && (
                <div>
                  <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>EMPRESA *</label>
                  <select
                    value={novoForm.empresaId}
                    onChange={(e) => setNovoForm((f) => ({ ...f, empresaId: e.target.value, vendedorId: "" }))}
                    className="w-full input-dark px-3 py-2.5 text-[13px]"
                  >
                    <option value="">Selecione a empresa</option>
                    {empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                  </select>
                </div>
              )}

              {novoVendedores.length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>VENDEDOR RESPONSÁVEL</label>
                  <select
                    value={novoForm.vendedorId}
                    onChange={(e) => setNovoForm((f) => ({ ...f, vendedorId: e.target.value }))}
                    className="w-full input-dark px-3 py-2.5 text-[13px]"
                  >
                    <option value="">Sem vendedor (atribuir depois)</option>
                    {novoVendedores.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>NOME</label>
                  <input
                    type="text"
                    placeholder="Nome do cliente"
                    value={novoForm.nome}
                    onChange={(e) => setNovoForm((f) => ({ ...f, nome: e.target.value }))}
                    className="w-full input-dark px-3 py-2.5 text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>TELEFONE *</label>
                  <input
                    type="text"
                    placeholder="5562999998888 (55 + DDD + número)"
                    value={novoForm.telefone}
                    onChange={(e) => setNovoForm((f) => ({ ...f, telefone: e.target.value }))}
                    className="w-full input-dark px-3 py-2.5 text-[13px] font-mono"
                  />
                  <p className="text-[11px] mt-1" style={{ color: "var(--muted-3)" }}>
                    55 = Brasil · DDD (2 dígitos) · número (8 ou 9 dígitos)
                  </p>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>E-MAIL</label>
                  <input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={novoForm.email}
                    onChange={(e) => setNovoForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full input-dark px-3 py-2.5 text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>NASCIMENTO</label>
                  <input
                    type="date"
                    value={novoForm.dataNascimento}
                    onChange={(e) => setNovoForm((f) => ({ ...f, dataNascimento: e.target.value }))}
                    className="w-full input-dark px-3 py-2.5 text-[13px]"
                  />
                </div>
              </div>

              {novoErro && (
                <p className="text-[12px] px-3 py-2 rounded-lg" style={{ background: "rgba(248,113,113,.1)", color: "#f87171", border: "1px solid rgba(248,113,113,.2)" }}>
                  {novoErro}
                </p>
              )}
            </div>

            <div className="px-6 py-4 flex gap-3 justify-end" style={{ borderTop: "1px solid var(--border)" }}>
              <button
                onClick={() => { setModalNovo(false); setNovoForm(formVazio); if (empresas.length === 1) setNovoForm((f) => ({ ...f, empresaId: empresas[0].id })); }}
                className="px-4 py-2 rounded-xl text-[13px] font-medium transition-all"
                style={{ background: "var(--input)", border: "1px solid var(--border-2)", color: "var(--text-2)" }}
              >
                Cancelar
              </button>
              <button
                onClick={salvarNovo}
                disabled={salvandoNovo}
                className="btn-primary px-5 py-2 text-[13px] disabled:opacity-40"
              >
                {salvandoNovo ? "Salvando..." : "Salvar Cliente"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Importar CSV */}
      {modalImport && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "var(--overlay)", backdropFilter: "blur(8px)" }}>
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden animate-fade-up"
            style={{
              background: "var(--modal)",
              border: "1px solid var(--border-2)",
              boxShadow: "0 24px 60px var(--shadow), 0 8px 20px var(--shadow)",
            }}
          >
            {/* Header */}
            <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="text-[16px] font-bold" style={{ color: "var(--text)" }}>Importar Clientes via CSV</h3>
              <div
                className="mt-4 rounded-xl p-4 space-y-2 text-[12px]"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <p className="font-semibold mb-2" style={{ color: "var(--muted)" }}>Colunas aceitas:</p>
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
                    <span className="shrink-0 font-mono font-semibold" style={{ color: obrig ? "#60a5fa" : "var(--muted)" }}>
                      {col}{obrig && " *"}
                    </span>
                    <span style={{ color: "var(--muted-3)" }}>— {uso}</span>
                  </div>
                ))}
                <p className="pt-2" style={{ color: "var(--muted-3)", borderTop: "1px solid var(--border)" }}>
                  * obrigatório · Separador: vírgula · Data: DD/MM/AAAA
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>
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

              {importVendedores.length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>
                    VENDEDOR RESPONSÁVEL
                  </label>
                  <select
                    value={importVendedorId}
                    onChange={(e) => setImportVendedorId(e.target.value)}
                    className="w-full input-dark px-3 py-2.5 text-[13px]"
                  >
                    <option value="">Sem vendedor (atribuir depois)</option>
                    {importVendedores.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>
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
                  <p className="text-[11px] mt-1.5" style={{ color: "var(--muted-3)" }}>{importFile.name}</p>
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
            <div className="px-6 py-4 flex gap-3 justify-end" style={{ borderTop: "1px solid var(--border)" }}>
              <button
                onClick={() => { setModalImport(false); setImportFile(null); setImportResult(null); setImportVendedorId(""); setImportVendedores([]); setImportEmpresa(""); }}
                className="px-4 py-2 rounded-xl text-[13px] font-medium transition-all"
                style={{ background: "var(--input)", border: "1px solid var(--border-2)", color: "var(--text-2)" }}
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

      {/* Modal Iniciar Conversa */}
      {modalAtivar && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "var(--overlay)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden animate-fade-up" style={{ background: "var(--modal)", border: "1px solid var(--border-2)", boxShadow: "0 24px 60px var(--shadow), 0 8px 20px var(--shadow)" }}>
            <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="text-[16px] font-bold" style={{ color: "var(--text)" }}>Iniciar Conversa</h3>
              <p className="text-[12px] mt-1" style={{ color: "var(--muted-2)" }}>
                Envia a primeira mensagem para <strong>{modalAtivar.nome ?? modalAtivar.telefone}</strong> via WhatsApp e coloca no funil.
              </p>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>MENSAGEM INICIAL (opcional)</label>
                <textarea
                  rows={3}
                  value={msgInicial}
                  onChange={e => setMsgInicial(e.target.value)}
                  placeholder="Deixe em branco para usar a saudação padrão da empresa..."
                  className="w-full input-dark px-3 py-2.5 text-[13px] resize-none"
                />
                <p className="text-[11px] mt-1" style={{ color: "var(--muted-3)" }}>
                  Empresa: {modalAtivar.empresa.nome}
                </p>
              </div>
              {ativarResultado && (
                <div className="rounded-xl px-4 py-3 text-[12px]" style={{ background: ativarResultado.ok ? "rgba(52,211,153,.1)" : "rgba(248,113,113,.1)", border: `1px solid ${ativarResultado.ok ? "rgba(52,211,153,.2)" : "rgba(248,113,113,.2)"}`, color: ativarResultado.ok ? "#34d399" : "#f87171" }}>
                  {ativarResultado.msg}
                </div>
              )}
            </div>
            <div className="px-6 py-4 flex gap-3 justify-end" style={{ borderTop: "1px solid var(--border)" }}>
              <button onClick={() => { setModalAtivar(null); setAtivarResultado(null); }} className="px-4 py-2 rounded-xl text-[13px] font-medium" style={{ background: "var(--input)", border: "1px solid var(--border-2)", color: "var(--text-2)" }}>
                {ativarResultado?.ok ? "Fechar" : "Cancelar"}
              </button>
              {!ativarResultado?.ok && (
                <button onClick={ativarLead} disabled={ativando} className="btn-primary px-5 py-2 text-[13px] disabled:opacity-40">
                  {ativando ? "Enviando..." : "Enviar Mensagem"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
