"use client";

import { useEffect, useState, useRef } from "react";
import { ScrollHint, GradientFade } from "../components/table-scroll-hint";

interface Me { perfil: string; empresaId: string | null; nome: string }
interface Empresa {
  id: string; nome: string; instanciaWhatsapp: string; ativa: boolean;
  informacoes: string | null; googleCalendarId: string | null;
  googleCredentialId: string | null; calendlyUrl: string | null;
  perguntasQualificacao: string | null;
  _count: { clientes: number; leads: number };
}
interface Vendedor {
  id: string; nome: string; telefone: string; ordemChamada: number;
  ativo: boolean; empresaId: string;
  empresa: { nome: string }; _count: { vendas: number };
}
interface Midia {
  id: string; empresaId: string; etiqueta: string; url: string | null;
  mimeType: string | null; descricaoUso: string; tipo: string; ativo: boolean; criadoEm: string;
}

const SECOES = ["PRODUTOS", "PRECOS", "PAGAMENTO", "ENTREGA", "DIFERENCIAIS", "HORARIO"] as const;
const LABELS: Record<string, string> = {
  PRODUTOS: "Produtos / Serviços", PRECOS: "Preços",
  PAGAMENTO: "Formas de Pagamento", ENTREGA: "Entrega / Frete",
  DIFERENCIAIS: "Diferenciais", HORARIO: "Horário de Atendimento",
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
  return SECOES.filter((s) => campos[s]?.trim()).map((s) => `${s}: ${campos[s].trim()}`).join("\n");
}

const INPUT = "w-full input-dark px-3 py-2.5 text-[13px]";

/* ── WhatsApp connection tab ──────────────────────────────────────── */
function AbaWhatsApp({ instancia }: { instancia: string }) {
  const [state, setState] = useState<"loading" | "open" | "connecting" | "close" | "unknown">("loading");
  const [qrcode, setQrcode] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function checar() {
    setState("loading");
    try {
      const res = await fetch(`/api/central/conexao?instancia=${instancia}`);
      const data = await res.json();
      setState(data.state ?? "unknown");
      setQrcode(data.qrcode ?? null);
      if (data.state !== "open" && data.qrcode) {
        timerRef.current = setTimeout(checar, 15000);
      }
    } catch {
      setState("unknown");
    }
  }

  useEffect(() => {
    checar();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [instancia]);

  const cardStyle = {
    background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px",
  };

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="p-5 rounded-2xl" style={cardStyle}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[15px] font-bold" style={{ color: "var(--text)" }}>Conexão WhatsApp</p>
            <p className="text-[12px] mt-0.5 font-mono" style={{ color: "var(--muted-2)" }}>{instancia}</p>
          </div>
          <button
            onClick={checar}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
            style={{ background: "var(--card-2)", border: "1px solid var(--border)", color: "var(--muted)" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Atualizar
          </button>
        </div>

        {state === "loading" && (
          <div className="flex items-center gap-3 py-6">
            <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: "#fbbf24" }} />
            <span className="text-[13px]" style={{ color: "var(--muted)" }}>Verificando conexão...</span>
          </div>
        )}

        {state === "open" && (
          <div className="flex items-center gap-3 py-3 px-4 rounded-xl" style={{ background: "rgba(52,211,153,.08)", border: "1px solid rgba(52,211,153,.2)" }}>
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: "#34d399", boxShadow: "0 0 8px #34d399" }} />
            <div>
              <p className="text-[13px] font-semibold" style={{ color: "#34d399" }}>WhatsApp conectado</p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-2)" }}>Atendimento automático ativo</p>
            </div>
          </div>
        )}

        {(state === "close" || state === "connecting" || state === "unknown") && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 py-3 px-4 rounded-xl" style={{ background: "rgba(251,146,60,.08)", border: "1px solid rgba(251,146,60,.2)" }}>
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: "#fb923c" }} />
              <div>
                <p className="text-[13px] font-semibold" style={{ color: "#fb923c" }}>
                  {state === "connecting" ? "Aguardando escaneamento..." : "WhatsApp desconectado"}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-2)" }}>Escaneie o QR Code abaixo com o WhatsApp Business</p>
              </div>
            </div>

            {qrcode ? (
              <div className="flex flex-col sm:flex-row gap-5 items-center">
                <div className="p-3 rounded-2xl flex-shrink-0" style={{ background: "#ffffff" }}>
                  <img src={qrcode} alt="QR Code WhatsApp" className="w-52 h-52 object-contain" />
                </div>
                <div className="space-y-3 text-[13px]" style={{ color: "var(--muted)" }}>
                  <p className="font-semibold" style={{ color: "var(--text)" }}>Como escanear:</p>
                  <ol className="space-y-2 list-none">
                    {[
                      "Abra o WhatsApp Business no celular",
                      'Toque em "Mais opções" (⋮) ou Configurações',
                      'Selecione "Aparelhos conectados"',
                      'Toque em "Conectar um aparelho"',
                      "Aponte a câmera para o QR Code ao lado",
                    ].map((step, i) => (
                      <li key={i} className="flex gap-2.5">
                        <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
                          style={{ background: "rgba(99,102,241,.15)", color: "#a5b4fc" }}>
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                  <p className="text-[11px]" style={{ color: "var(--muted-3)" }}>
                    QR Code renova automaticamente a cada 15s
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center">
                <button onClick={checar} className="btn-primary px-5 py-2.5 text-[13px]">
                  Gerar QR Code
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────────── */
export default function ConfiguracoesPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [aba, setAba] = useState<"empresas" | "vendedores" | "midias" | "whatsapp">("empresas");

  const [novaEmpresa, setNovaEmpresa] = useState({ nome: "", instanciaWhatsapp: "" });
  const [novoVendedor, setNovoVendedor] = useState({ nome: "", telefone: "", empresaId: "" });

  const [editEmpresa, setEditEmpresa] = useState<string | null>(null);
  const [infoCampos, setInfoCampos] = useState<Record<string, string>>({});
  const [calendarFields, setCalendarFields] = useState({ googleCalendarId: "", googleCredentialId: "", calendlyUrl: "" });
  const [perguntasQualificacao, setPerguntasQualificacao] = useState("");

  const [editVendedor, setEditVendedor] = useState<string | null>(null);
  const [editVendedorData, setEditVendedorData] = useState({ nome: "", telefone: "", ordemChamada: 1 });

  const [midias, setMidias] = useState<Midia[]>([]);
  const [midiaEmpresaId, setMidiaEmpresaId] = useState("");
  const [novaMidia, setNovaMidia] = useState({ etiqueta: "", descricaoUso: "", tipo: "imagem" });
  const [novaMidiaArquivo, setNovaMidiaArquivo] = useState<File | null>(null);
  const [carregandoMidias, setCarregandoMidias] = useState(false);

  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState("");

  const isCentral = me?.perfil === "CENTRAL";

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then(setMe);
    fetch("/api/empresas").then((r) => r.json()).then((data) => {
      setEmpresas(data);
      if (data.length === 1) {
        setMidiaEmpresaId(data[0].id);
        setNovoVendedor((p) => ({ ...p, empresaId: data[0].id }));
      }
    });
    fetch("/api/vendedores?todos=true").then((r) => r.json()).then(setVendedores);
  }, []);

  useEffect(() => {
    if (aba === "midias" && midiaEmpresaId) carregarMidias(midiaEmpresaId);
  }, [aba, midiaEmpresaId]);

  async function carregarMidias(empId: string) {
    setCarregandoMidias(true);
    const data = await fetch(`/api/midias?empresaId=${empId}`).then((r) => r.json());
    setMidias(Array.isArray(data) ? data : []);
    setCarregandoMidias(false);
  }

  function showMsg(texto: string) {
    setMsg(texto);
    setTimeout(() => setMsg(""), 3000);
  }

  const criarEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/empresas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(novaEmpresa) });
    const emp = await res.json();
    setEmpresas((prev) => [...prev, emp]);
    setNovaEmpresa({ nome: "", instanciaWhatsapp: "" });
    showMsg("Empresa criada!");
  };

  const criarVendedor = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/vendedores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(novoVendedor) });
    const v = await res.json();
    setVendedores((prev) => [...prev, { ...v, empresa: empresas.find((em) => em.id === v.empresaId) ?? { nome: "" }, _count: { vendas: 0 } }]);
    setNovoVendedor((p) => ({ ...p, nome: "", telefone: "" }));
    showMsg("Vendedor criado!");
  };

  function abrirEditEmpresa(emp: Empresa) {
    setEditEmpresa(emp.id);
    setInfoCampos(parseInfo(emp.informacoes));
    setCalendarFields({ googleCalendarId: emp.googleCalendarId ?? "", googleCredentialId: emp.googleCredentialId ?? "", calendlyUrl: emp.calendlyUrl ?? "" });
    setPerguntasQualificacao(emp.perguntasQualificacao ?? "");
  }

  const salvarInfoEmpresa = async (empresaId: string) => {
    setSalvando(true);
    const informacoes = composeInfo(infoCampos);
    const pq = perguntasQualificacao.trim() || null;
    await fetch(`/api/empresas/${empresaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ informacoes, ...calendarFields, perguntasQualificacao: pq }),
    });
    setEmpresas((prev) => prev.map((e) => e.id === empresaId ? { ...e, informacoes, ...calendarFields, perguntasQualificacao: pq } : e));
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
    const res = await fetch(`/api/vendedores/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editVendedorData) });
    const updated = await res.json();
    setVendedores((prev) => prev.map((v) => v.id === id ? { ...v, ...updated } : v));
    setEditVendedor(null);
    setSalvando(false);
    showMsg("Vendedor atualizado!");
  };

  const toggleAtivo = async (v: Vendedor) => {
    await fetch(`/api/vendedores/${v.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ativo: !v.ativo }) });
    setVendedores((prev) => prev.map((vv) => vv.id === v.id ? { ...vv, ativo: !vv.ativo } : vv));
    showMsg(v.ativo ? "Vendedor desativado" : "Vendedor ativado");
  };

  const excluirVendedor = async (id: string, nome: string) => {
    if (!confirm(`Excluir ${nome}?`)) return;
    await fetch(`/api/vendedores/${id}`, { method: "DELETE" });
    setVendedores((prev) => prev.filter((v) => v.id !== id));
    showMsg("Vendedor excluído.");
  };

  const criarMidia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!midiaEmpresaId || !novaMidiaArquivo) return;
    setSalvando(true);
    const form = new FormData();
    form.append("arquivo", novaMidiaArquivo);
    form.append("etiqueta", novaMidia.etiqueta);
    form.append("descricaoUso", novaMidia.descricaoUso);
    form.append("tipo", novaMidia.tipo);
    form.append("empresaId", midiaEmpresaId);
    const res = await fetch("/api/midias/upload", { method: "POST", body: form });
    if (!res.ok) { showMsg("Erro ao enviar arquivo."); setSalvando(false); return; }
    const created = await res.json();
    setMidias((prev) => [created, ...prev]);
    setNovaMidia({ etiqueta: "", descricaoUso: "", tipo: "imagem" });
    setNovaMidiaArquivo(null);
    setSalvando(false);
    showMsg("Mídia adicionada!");
  };

  const toggleMidia = async (m: Midia) => {
    await fetch(`/api/midias/${m.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ativo: !m.ativo }) });
    setMidias((prev) => prev.map((x) => x.id === m.id ? { ...x, ativo: !m.ativo } : x));
  };

  const excluirMidia = async (id: string) => {
    if (!confirm("Excluir esta mídia?")) return;
    await fetch(`/api/midias/${id}`, { method: "DELETE" });
    setMidias((prev) => prev.filter((m) => m.id !== id));
    showMsg("Mídia excluída.");
  };

  const tabStyle = (id: string) => aba === id
    ? { background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white", border: "1px solid transparent", boxShadow: "0 4px 14px rgba(99,102,241,.3)" }
    : { background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)" };

  const TH = ({ children }: { children?: React.ReactNode }) => (
    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
      {children}
    </th>
  );

  const cardStyle = {
    background: "linear-gradient(145deg, var(--card), var(--card))",
    border: "1px solid var(--border)",
    borderRadius: "16px",
  };

  const editRowStyle = {
    background: "rgba(99,102,241,.05)",
    borderBottom: "1px solid rgba(99,102,241,.12)",
  };

  // Tabs visíveis por perfil
  const tabs = isCentral
    ? [
        { id: "empresas",   label: "Empresas" },
        { id: "vendedores", label: "Vendedores" },
        { id: "midias",     label: "Mídias da IA" },
      ]
    : [
        { id: "empresas",   label: "Minha Empresa" },
        { id: "vendedores", label: "Vendedores" },
        { id: "midias",     label: "Mídias da IA" },
        { id: "whatsapp",   label: "WhatsApp" },
      ];

  return (
    <div className="h-full overflow-y-auto" style={{ background: "var(--bg)" }}>
      <div className="p-4 md:p-8 max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full mb-3"
            style={{ background: "rgba(99,102,241,.1)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,.18)" }}>
            Sistema
          </span>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[28px] font-bold tracking-tight" style={{ color: "var(--text)" }}>Configurações</h1>
              <p className="text-[13px] mt-1" style={{ color: "var(--muted-2)" }}>
                {isCentral ? "Empresas, vendedores e mídias da IA" : "Configure sua empresa e equipe"}
              </p>
            </div>
            {msg && (
              <span className="text-[12px] px-3 py-1.5 rounded-full font-semibold"
                style={{ background: "rgba(52,211,153,.1)", color: "#34d399", border: "1px solid rgba(52,211,153,.2)" }}>
                {msg}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setAba(tab.id as typeof aba)}
              className="px-4 py-2 rounded-xl text-[13px] font-medium transition-all"
              style={tabStyle(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── EMPRESAS ── */}
        {aba === "empresas" && (
          <div className="space-y-4 animate-fade-up">

            {/* Formulário novo — só CENTRAL */}
            {isCentral && (
              <form onSubmit={criarEmpresa} className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl" style={cardStyle}>
                <input required placeholder="Nome da empresa" value={novaEmpresa.nome}
                  onChange={(e) => setNovaEmpresa((p) => ({ ...p, nome: e.target.value }))}
                  className={`flex-1 ${INPUT}`} />
                <input required placeholder="Instância WhatsApp (ex: ph_intima)" value={novaEmpresa.instanciaWhatsapp}
                  onChange={(e) => setNovaEmpresa((p) => ({ ...p, instanciaWhatsapp: e.target.value }))}
                  className={`flex-1 ${INPUT}`} />
                <button type="submit" className="btn-primary px-4 py-2 text-[13px]">Adicionar</button>
              </form>
            )}

            <ScrollHint />
            <div className="relative">
              <GradientFade />
              <div className="rounded-2xl overflow-x-auto" style={cardStyle}>
                <table className="w-full text-[13px] min-w-[520px]">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--card)" }}>
                      <TH>Empresa</TH>
                      {isCentral && <TH>Instância</TH>}
                      <TH>Clientes</TH><TH>Info</TH><TH></TH>
                    </tr>
                  </thead>
                  <tbody>
                    {empresas.map((emp) => (
                      <>
                        <tr key={emp.id} style={{ borderBottom: "1px solid var(--card)" }}
                          onMouseEnter={e => e.currentTarget.style.background = "var(--card)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <td className="px-4 py-3 font-semibold" style={{ color: "var(--text)" }}>{emp.nome}</td>
                          {isCentral && (
                            <td className="px-4 py-3 font-mono text-[12px]" style={{ color: "var(--muted-2)" }}>{emp.instanciaWhatsapp}</td>
                          )}
                          <td className="px-4 py-3" style={{ color: "var(--muted)" }}>{emp._count.clientes}</td>
                          <td className="px-4 py-3">
                            {emp.informacoes
                              ? <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(52,211,153,.1)", color: "#34d399" }}>Preenchida</span>
                              : <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(251,191,36,.1)", color: "#fbbf24" }}>Vazia</span>
                            }
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => editEmpresa === emp.id ? setEditEmpresa(null) : abrirEditEmpresa(emp)}
                              className="text-[12px] px-3 py-1 rounded-lg font-semibold transition-all"
                              style={{ background: "rgba(99,102,241,.1)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,.2)" }}>
                              {editEmpresa === emp.id ? "Fechar" : "Editar Info"}
                            </button>
                          </td>
                        </tr>
                        {editEmpresa === emp.id && (
                          <tr key={`${emp.id}-edit`}>
                            <td colSpan={isCentral ? 5 : 4} className="px-5 py-5" style={editRowStyle}>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                {SECOES.map((sec) => (
                                  <div key={sec}>
                                    <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>
                                      {LABELS[sec].toUpperCase()}
                                    </label>
                                    <textarea rows={3} value={infoCampos[sec] ?? ""}
                                      onChange={(e) => setInfoCampos((p) => ({ ...p, [sec]: e.target.value }))}
                                      placeholder={`Ex: ${sec === "PRODUTOS" ? "camisetas, calças, vestidos" : sec === "PRECOS" ? "camiseta R$29,90" : sec === "PAGAMENTO" ? "PIX, cartão 12x" : sec === "ENTREGA" ? "frete grátis acima de R$200" : sec === "DIFERENCIAIS" ? "atacado a partir de 10 peças" : "seg-sex 9h-18h"}`}
                                      className={`${INPUT} resize-none`} />
                                  </div>
                                ))}
                              </div>

                              <div className="pt-4 mb-4" style={{ borderTop: "1px solid var(--border)" }}>
                                <p className="text-[12px] font-semibold mb-3" style={{ color: "var(--muted)" }}>📅 Calendly (opcional)</p>
                                <div className="mb-3">
                                  <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted-2)" }}>LINK DO CALENDLY</label>
                                  <input value={calendarFields.calendlyUrl} onChange={e => setCalendarFields(p => ({ ...p, calendlyUrl: e.target.value }))}
                                    placeholder="https://calendly.com/studio-thaisy/consulta" className={INPUT} />
                                  <p className="text-[11px] mt-1" style={{ color: "var(--muted-3)" }}>A IA envia este link quando o cliente pedir para agendar.</p>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted-2)" }}>URL DO WEBHOOK</label>
                                  <div className="flex gap-2">
                                    <input readOnly value={`https://n8n-n8n.6jgzku.easypanel.host/webhook/calendly?instancia=${emp.instanciaWhatsapp}`}
                                      className={`flex-1 ${INPUT}`} style={{ opacity: 0.6 }} />
                                    <button type="button" onClick={() => navigator.clipboard.writeText(`https://n8n-n8n.6jgzku.easypanel.host/webhook/calendly?instancia=${emp.instanciaWhatsapp}`)}
                                      className="px-3 py-2 rounded-xl text-[12px] font-medium transition-all"
                                      style={{ background: "var(--card-2)", border: "1px solid var(--border-2)", color: "var(--text-2)" }}>
                                      Copiar
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <div className="pt-4 mb-4" style={{ borderTop: "1px solid var(--border)" }}>
                                <p className="text-[12px] font-semibold mb-3" style={{ color: "var(--muted)" }}>📆 Google Calendar (opcional)</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted-2)" }}>ID DO CALENDÁRIO</label>
                                    <input value={calendarFields.googleCalendarId} onChange={e => setCalendarFields(p => ({ ...p, googleCalendarId: e.target.value }))}
                                      placeholder="abc123@group.calendar.google.com" className={INPUT} />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted-2)" }}>ID DA CREDENCIAL N8N</label>
                                    <input value={calendarFields.googleCredentialId} onChange={e => setCalendarFields(p => ({ ...p, googleCredentialId: e.target.value }))}
                                      placeholder="ex: 5" className={INPUT} />
                                  </div>
                                </div>
                              </div>

                              <div className="pt-4 mb-4" style={{ borderTop: "1px solid var(--border)" }}>
                                <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>
                                  ROTEIRO DE QUALIFICAÇÃO DA IA
                                </label>
                                <p className="text-[11px] mb-2" style={{ color: "var(--muted-3)" }}>
                                  Perguntas que a IA deve fazer para qualificar leads (uma por linha)
                                </p>
                                <textarea rows={5} value={perguntasQualificacao}
                                  onChange={(e) => setPerguntasQualificacao(e.target.value)}
                                  placeholder={"Ex:\nQual é o seu orçamento?\nVocê já conhece nossos produtos?\nQual é o prazo para a compra?"}
                                  className={`${INPUT} resize-none`} />
                              </div>

                              <div className="flex gap-2">
                                <button onClick={() => salvarInfoEmpresa(emp.id)} disabled={salvando}
                                  className="btn-primary px-4 py-2 text-[13px] disabled:opacity-50">
                                  {salvando ? "Salvando..." : "Salvar Informações"}
                                </button>
                                <button onClick={() => setEditEmpresa(null)}
                                  className="px-4 py-2 rounded-xl text-[13px] font-medium transition-all"
                                  style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)" }}>
                                  Cancelar
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                    {empresas.length === 0 && (
                      <tr><td colSpan={isCentral ? 5 : 4} className="px-4 py-10 text-center text-[13px]" style={{ color: "var(--muted-3)" }}>Nenhuma empresa cadastrada.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── VENDEDORES ── */}
        {aba === "vendedores" && (
          <div className="space-y-4 animate-fade-up">
            <form onSubmit={criarVendedor} className="flex flex-col sm:flex-row flex-wrap gap-3 p-4 rounded-2xl" style={cardStyle}>
              <input required placeholder="Nome" value={novoVendedor.nome}
                onChange={(e) => setNovoVendedor((p) => ({ ...p, nome: e.target.value }))}
                className={`flex-1 ${INPUT}`} />
              <input required placeholder="Telefone (5562999999999)" value={novoVendedor.telefone}
                onChange={(e) => setNovoVendedor((p) => ({ ...p, telefone: e.target.value }))}
                className={`flex-1 ${INPUT}`} />
              {isCentral && (
                <select required value={novoVendedor.empresaId}
                  onChange={(e) => setNovoVendedor((p) => ({ ...p, empresaId: e.target.value }))}
                  className={`flex-1 ${INPUT}`}>
                  <option value="">Selecione a empresa</option>
                  {empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
              )}
              <button type="submit" className="btn-primary px-4 py-2 text-[13px]">Adicionar</button>
            </form>

            <ScrollHint />
            <div className="relative">
              <GradientFade />
              <div className="rounded-2xl overflow-x-auto" style={cardStyle}>
                <table className="w-full text-[13px] min-w-[600px]">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--card)" }}>
                      <TH>Vendedor</TH><TH>Telefone</TH>
                      {isCentral && <TH>Empresa</TH>}
                      <TH>Ordem</TH><TH>Status</TH><TH></TH>
                    </tr>
                  </thead>
                  <tbody>
                    {vendedores.map((v) => (
                      <>
                        <tr key={v.id} style={{ borderBottom: "1px solid var(--card)", opacity: v.ativo ? 1 : 0.45 }}
                          onMouseEnter={e => e.currentTarget.style.background = "var(--card)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <td className="px-4 py-3 font-semibold" style={{ color: "var(--text)" }}>{v.nome}</td>
                          <td className="px-4 py-3 font-mono text-[12px]" style={{ color: "var(--muted-2)" }}>{v.telefone}</td>
                          {isCentral && <td className="px-4 py-3" style={{ color: "var(--muted)" }}>{v.empresa.nome}</td>}
                          <td className="px-4 py-3" style={{ color: "var(--muted-2)" }}>#{v.ordemChamada}</td>
                          <td className="px-4 py-3">
                            <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                              style={v.ativo
                                ? { background: "rgba(52,211,153,.1)", color: "#34d399" }
                                : { background: "var(--card-2)", color: "var(--muted-2)" }}>
                              {v.ativo ? "Ativo" : "Inativo"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => editVendedor === v.id ? setEditVendedor(null) : abrirEditVendedor(v)}
                                className="text-[11px] px-2 py-1 rounded-lg font-semibold transition-all"
                                style={{ background: "rgba(99,102,241,.08)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,.15)" }}>
                                {editVendedor === v.id ? "Fechar" : "Editar"}
                              </button>
                              <button onClick={() => toggleAtivo(v)}
                                className="text-[11px] px-2 py-1 rounded-lg font-semibold transition-all"
                                style={v.ativo
                                  ? { background: "rgba(251,191,36,.08)", color: "#fbbf24", border: "1px solid rgba(251,191,36,.15)" }
                                  : { background: "rgba(52,211,153,.08)", color: "#34d399", border: "1px solid rgba(52,211,153,.15)" }}>
                                {v.ativo ? "Desativar" : "Ativar"}
                              </button>
                              <button onClick={() => excluirVendedor(v.id, v.nome)}
                                className="text-[11px] px-2 py-1 rounded-lg font-semibold transition-all"
                                style={{ background: "rgba(248,113,113,.08)", color: "#f87171", border: "1px solid rgba(248,113,113,.15)" }}>
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                        {editVendedor === v.id && (
                          <tr key={`${v.id}-edit`}>
                            <td colSpan={isCentral ? 6 : 5} className="px-4 py-4" style={editRowStyle}>
                              <div className="flex gap-3 items-end flex-wrap">
                                <div>
                                  <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>NOME</label>
                                  <input value={editVendedorData.nome} onChange={(e) => setEditVendedorData((p) => ({ ...p, nome: e.target.value }))}
                                    className="input-dark px-3 py-2 text-[13px]" />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>TELEFONE</label>
                                  <input value={editVendedorData.telefone} onChange={(e) => setEditVendedorData((p) => ({ ...p, telefone: e.target.value }))}
                                    className="input-dark px-3 py-2 text-[13px]" />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>ORDEM</label>
                                  <input type="number" min={1} value={editVendedorData.ordemChamada}
                                    onChange={(e) => setEditVendedorData((p) => ({ ...p, ordemChamada: Number(e.target.value) }))}
                                    className="input-dark px-3 py-2 text-[13px] w-20" />
                                </div>
                                <button onClick={() => salvarVendedor(v.id)} disabled={salvando}
                                  className="btn-primary px-4 py-2 text-[13px] disabled:opacity-50">Salvar</button>
                                <button onClick={() => setEditVendedor(null)}
                                  className="px-4 py-2 rounded-xl text-[13px] font-medium transition-all"
                                  style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)" }}>
                                  Cancelar
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                    {vendedores.length === 0 && (
                      <tr><td colSpan={isCentral ? 6 : 5} className="px-4 py-10 text-center text-[13px]" style={{ color: "var(--muted-3)" }}>Nenhum vendedor cadastrado.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── MÍDIAS ── */}
        {aba === "midias" && (
          <div className="space-y-4 animate-fade-up">
            <div className="px-4 py-3 rounded-xl text-[12.5px]"
              style={{ background: "rgba(99,102,241,.07)", border: "1px solid rgba(99,102,241,.15)", color: "#a5b4fc" }}>
              <strong>Mídias da IA</strong> — arquivos que a IA pode enviar automaticamente durante o atendimento. Cada mídia tem uma <em>etiqueta</em> e uma <em>descrição de uso</em> que instrui a IA quando enviar.
            </div>

            {empresas.length > 1 && (
              <div className="flex items-center gap-3">
                <label className="text-[13px] font-semibold" style={{ color: "var(--muted)" }}>Empresa:</label>
                <select value={midiaEmpresaId} onChange={(e) => setMidiaEmpresaId(e.target.value)} className="input-dark px-3 py-2 text-[13px]">
                  <option value="">Selecione uma empresa</option>
                  {empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
              </div>
            )}

            {midiaEmpresaId && (
              <>
                <form onSubmit={criarMidia} className="p-5 rounded-2xl space-y-4" style={cardStyle}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>Adicionar nova mídia</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>ETIQUETA</label>
                      <input required placeholder="ex: Catálogo Verão 2026" value={novaMidia.etiqueta}
                        onChange={(e) => setNovaMidia((p) => ({ ...p, etiqueta: e.target.value }))} className={INPUT} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>TIPO</label>
                      <select value={novaMidia.tipo} onChange={(e) => setNovaMidia((p) => ({ ...p, tipo: e.target.value }))} className={INPUT}>
                        <option value="imagem">Imagem (JPG, PNG)</option>
                        <option value="documento">Documento (PDF)</option>
                        <option value="video">Vídeo</option>
                        <option value="audio">Áudio</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>ARQUIVO</label>
                    <label className="flex flex-col items-center justify-center w-full py-6 rounded-xl cursor-pointer transition-all"
                      style={{
                        border: novaMidiaArquivo ? "1px solid rgba(52,211,153,.4)" : "1px dashed var(--border)",
                        background: novaMidiaArquivo ? "rgba(52,211,153,.05)" : "var(--card-2)",
                      }}>
                      <input type="file" accept="image/*,application/pdf,video/*,audio/*" className="hidden"
                        onChange={(e) => setNovaMidiaArquivo(e.target.files?.[0] ?? null)} />
                      {novaMidiaArquivo ? (
                        <div className="text-center">
                          <p className="text-[13px] font-semibold" style={{ color: "#34d399" }}>{novaMidiaArquivo.name}</p>
                          <p className="text-[11px] mt-1" style={{ color: "var(--muted-3)" }}>
                            {(novaMidiaArquivo.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"
                            style={{ color: "var(--muted-3)" }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                          </svg>
                          <p className="text-[13px]" style={{ color: "var(--muted)" }}>Clique para selecionar o arquivo</p>
                          <p className="text-[11px] mt-1" style={{ color: "var(--muted-3)" }}>JPG, PNG, PDF, MP4 · até 10 MB</p>
                        </div>
                      )}
                    </label>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>QUANDO A IA DEVE ENVIAR</label>
                    <input required placeholder="ex: quando o cliente pedir o catálogo ou perguntar sobre produtos" value={novaMidia.descricaoUso}
                      onChange={(e) => setNovaMidia((p) => ({ ...p, descricaoUso: e.target.value }))} className={INPUT} />
                  </div>
                  <button type="submit" disabled={salvando || !novaMidiaArquivo} className="btn-primary px-4 py-2.5 text-[13px] disabled:opacity-50">
                    {salvando ? "Enviando arquivo..." : "Adicionar Mídia"}
                  </button>
                </form>

                <ScrollHint />
                <div className="relative">
                  <GradientFade />
                  <div className="rounded-2xl overflow-x-auto" style={cardStyle}>
                    {carregandoMidias ? (
                      <div className="p-6 space-y-2">
                        {[1,2,3].map(i => <div key={i} className="shimmer h-12 rounded-xl" />)}
                      </div>
                    ) : midias.length === 0 ? (
                      <div className="p-10 text-center text-[13px]" style={{ color: "var(--muted-3)" }}>
                        Nenhuma mídia cadastrada para esta empresa.
                      </div>
                    ) : (
                      <table className="w-full text-[13px] min-w-[520px]">
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--card)" }}>
                            <TH>Etiqueta</TH><TH>Tipo</TH><TH>Quando usar</TH><TH>Status</TH><TH></TH>
                          </tr>
                        </thead>
                        <tbody>
                          {midias.map((m) => (
                            <tr key={m.id} style={{ borderBottom: "1px solid var(--card)", opacity: m.ativo ? 1 : 0.45 }}
                              onMouseEnter={e => e.currentTarget.style.background = "var(--card)"}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                              <td className="px-4 py-3">
                                <div className="font-semibold" style={{ color: "var(--text)" }}>{m.etiqueta}</div>
                                {m.url ? (
                                  <a href={m.url} target="_blank" rel="noopener noreferrer"
                                    className="text-[11px] truncate block max-w-xs hover:underline"
                                    style={{ color: "#60a5fa" }}>{m.url}</a>
                                ) : (
                                  <span className="text-[11px] px-1.5 py-0.5 rounded font-mono"
                                    style={{ background: "rgba(99,102,241,.1)", color: "#a5b4fc" }}>
                                    {m.mimeType || "arquivo"}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 capitalize" style={{ color: "var(--muted)" }}>{m.tipo}</td>
                              <td className="px-4 py-3 text-[12px] max-w-xs" style={{ color: "var(--muted-2)" }}>{m.descricaoUso}</td>
                              <td className="px-4 py-3">
                                <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                                  style={m.ativo
                                    ? { background: "rgba(52,211,153,.1)", color: "#34d399" }
                                    : { background: "var(--card-2)", color: "var(--muted-2)" }}>
                                  {m.ativo ? "Ativa" : "Inativa"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2 justify-end">
                                  <button onClick={() => toggleMidia(m)}
                                    className="text-[11px] px-2 py-1 rounded-lg font-semibold"
                                    style={m.ativo
                                      ? { background: "rgba(251,191,36,.08)", color: "#fbbf24", border: "1px solid rgba(251,191,36,.15)" }
                                      : { background: "rgba(52,211,153,.08)", color: "#34d399", border: "1px solid rgba(52,211,153,.15)" }}>
                                    {m.ativo ? "Desativar" : "Ativar"}
                                  </button>
                                  <button onClick={() => excluirMidia(m.id)}
                                    className="text-[11px] px-2 py-1 rounded-lg font-semibold"
                                    style={{ background: "rgba(248,113,113,.08)", color: "#f87171", border: "1px solid rgba(248,113,113,.15)" }}>
                                    Excluir
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── WHATSAPP (só EMPRESA) ── */}
        {aba === "whatsapp" && !isCentral && empresas[0] && (
          <AbaWhatsApp instancia={empresas[0].instanciaWhatsapp} />
        )}

      </div>
    </div>
  );
}
