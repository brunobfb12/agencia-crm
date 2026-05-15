"use client";

import { useEffect, useState } from "react";
import { ScrollHint, GradientFade } from "../components/table-scroll-hint";

interface EmpresaSetup {
  vendedores: boolean; informacoes: boolean; nomeIA: boolean;
  tipoDefinido: boolean; calendly: boolean; qualificacao: boolean;
  tipoAtendimento: string;
}
interface WhatsAppStatus { instancia: string; state: string; nomeEmpresa: string; setup: EmpresaSetup | null }
interface Ferramenta {
  id: string; nome: string; tipo: string; valor: number | null;
  vencimento: string | null; link: string | null; observacoes: string | null; ativo: boolean;
}
interface StatusData {
  whatsapp: WhatsAppStatus[];
  atividade: { mensagensHoje: number; leadsHoje: number; mensagensMes: number };
  ferramentas: Ferramenta[];
  alertas: Ferramenta[];
}

const TIPOS = ["IA", "Dominio", "VPS", "Painel", "Automacao", "WhatsApp", "Outro"];
const EMPTY_FORM = { nome: "", tipo: "IA", valor: "", vencimento: "", link: "", observacoes: "" };

function diasRestantes(venc: string | null) {
  if (!venc) return null;
  return Math.ceil((new Date(venc).getTime() - Date.now()) / 86400000);
}

function VencimentoBadge({ vencimento }: { vencimento: string | null }) {
  if (!vencimento) return <span style={{ color: "var(--muted-3)", fontSize: "12px" }}>—</span>;
  const dias = diasRestantes(vencimento);
  const data = new Date(vencimento).toLocaleDateString("pt-BR");
  if (dias === null) return null;
  if (dias < 0) return (
    <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
      style={{ background: "rgba(248,113,113,.1)", color: "#f87171" }}>
      Vencido ({data})
    </span>
  );
  if (dias <= 7) return (
    <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
      style={{ background: "rgba(251,146,60,.1)", color: "#fb923c" }}>
      Vence em {dias}d ({data})
    </span>
  );
  return <span className="text-[12px]" style={{ color: "var(--muted-2)" }}>{data}</span>;
}

interface Empresa { id: string; nome: string; instanciaWhatsapp: string }
interface EmpresaPlano {
  id: string; nome: string; instanciaWhatsapp: string;
  planStatus: string; plano: string; trialFim: string | null;
  valorMensal: number | null; isenta: boolean;
}
interface Usuario { id: string; nome: string; email: string; ativo: boolean; empresaId: string | null; empresa: { nome: string } | null }

const INPUT = "w-full input-dark px-3 py-2.5 text-[13px]";

export default function CentralPage() {
  const [data, setData] = useState<StatusData | null>(null);
  const [aba, setAba] = useState<"ferramentas" | "whatsapp" | "atividade" | "usuarios" | "planos">("ferramentas");
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresasPlano, setEmpresasPlano] = useState<EmpresaPlano[]>([]);
  const [editPlanoId, setEditPlanoId] = useState<string | null>(null);
  const [editPlanoForm, setEditPlanoForm] = useState<{ planStatus: string; plano: string; trialFim: string; valorMensal: string; isenta: boolean }>({ planStatus: "TRIAL", plano: "STARTER", trialFim: "", valorMensal: "", isenta: false });
  const [salvandoPlano, setSalvandoPlano] = useState(false);
  const [userForm, setUserForm] = useState({ nome: "", email: "", senha: "", empresaId: "" });
  const [salvandoUser, setSalvandoUser] = useState(false);
  const [msgUser, setMsgUser] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState("");
  const [qrInstancia, setQrInstancia] = useState<Record<string, string | null>>({});
  const [loadingQr, setLoadingQr] = useState<Record<string, boolean>>({});

  const reconectar = async (instancia: string) => {
    setLoadingQr((p) => ({ ...p, [instancia]: true }));
    const res = await fetch(`/api/central/instancia?instancia=${instancia}`);
    const d = await res.json();
    setQrInstancia((p) => ({ ...p, [instancia]: d.qrcode ?? null }));
    setLoadingQr((p) => ({ ...p, [instancia]: false }));
  };

  const desconectar = async (instancia: string) => {
    if (!confirm(`Desconectar "${instancia}"? O WhatsApp precisará ser escaneado novamente.`)) return;
    await fetch(`/api/central/instancia?instancia=${instancia}`, { method: "DELETE" });
    showMsg(`${instancia} desconectado`);
    setTimeout(() => carregar(), 2000);
  };

  const carregar = (silent = false) => {
    if (!silent) setLoading(true);
    fetch("/api/central/status").then((r) => r.json()).then((d) => { setData(d); setLoading(false); });
  };

  const carregarUsuarios = async () => {
    const [uRes, eRes] = await Promise.all([fetch("/api/usuarios"), fetch("/api/empresas")]);
    if (uRes.ok) setUsuarios(await uRes.json());
    if (eRes.ok) {
      const lista = await eRes.json();
      setEmpresas(lista);
      setEmpresasPlano(lista);
    }
  };

  const abrirEditPlano = (e: EmpresaPlano) => {
    setEditPlanoId(e.id);
    setEditPlanoForm({
      planStatus: e.planStatus,
      plano: e.plano,
      trialFim: e.trialFim ? e.trialFim.split("T")[0] : "",
      valorMensal: e.valorMensal != null ? String(e.valorMensal) : "",
      isenta: e.isenta,
    });
  };

  const salvarPlano = async (id: string) => {
    setSalvandoPlano(true);
    await fetch(`/api/empresas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planStatus: editPlanoForm.planStatus,
        plano: editPlanoForm.plano,
        trialFim: editPlanoForm.trialFim || null,
        valorMensal: editPlanoForm.valorMensal !== "" ? editPlanoForm.valorMensal : null,
        isenta: editPlanoForm.isenta,
      }),
    });
    setSalvandoPlano(false);
    setEditPlanoId(null);
    carregarUsuarios();
    showMsg("Plano atualizado!");
  };

  const ativarTrial = async (id: string, dias = 30) => {
    const trialFim = new Date(Date.now() + dias * 86400000).toISOString().split("T")[0];
    await fetch(`/api/empresas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planStatus: "TRIAL", trialFim }),
    });
    carregarUsuarios();
    showMsg(`Trial de ${dias} dias ativado!`);
  };

  useEffect(() => { carregar(); carregarUsuarios(); }, []);

  // Auto-refresh WhatsApp status every 8s when on whatsapp tab, until all open
  useEffect(() => {
    if (aba !== "whatsapp") return;
    const allOpen = data?.whatsapp.every((w) => w.state === "open") ?? false;
    if (allOpen) return;
    const t = setInterval(() => carregar(true), 8000);
    return () => clearInterval(t);
  }, [aba, data?.whatsapp]);

  const criarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoUser(true);
    const res = await fetch("/api/usuarios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(userForm) });
    setSalvandoUser(false);
    if (res.ok) {
      setUserForm({ nome: "", email: "", senha: "", empresaId: "" });
      setMsgUser("Usuário criado com sucesso!");
      carregarUsuarios();
      setTimeout(() => setMsgUser(""), 3000);
    } else {
      const d = await res.json();
      setMsgUser(d.error || "Erro ao criar usuário");
    }
  };

  const excluirUsuario = async (id: string, nome: string) => {
    if (!confirm(`Excluir usuário "${nome}"?`)) return;
    await fetch(`/api/usuarios/${id}`, { method: "DELETE" });
    carregarUsuarios();
  };

  const toggleAtivo = async (id: string, ativo: boolean) => {
    await fetch(`/api/usuarios/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ativo: !ativo }) });
    carregarUsuarios();
  };

  function showMsg(texto: string) { setMsg(texto); setTimeout(() => setMsg(""), 3000); }

  const criarFerramenta = async (e: React.FormEvent) => {
    e.preventDefault(); setSalvando(true);
    await fetch("/api/ferramentas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm(EMPTY_FORM); carregar(); setSalvando(false); showMsg("Ferramenta adicionada!");
  };

  const salvarEdicao = async (id: string) => {
    setSalvando(true);
    await fetch(`/api/ferramentas/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
    setEditId(null); carregar(); setSalvando(false); showMsg("Atualizado!");
  };

  const excluir = async (id: string, nome: string) => {
    if (!confirm(`Excluir "${nome}"?`)) return;
    await fetch(`/api/ferramentas/${id}`, { method: "DELETE" });
    carregar(); showMsg("Excluído.");
  };

  function abrirEdicao(f: Ferramenta) {
    setEditId(f.id);
    setEditForm({ nome: f.nome, tipo: f.tipo, valor: f.valor?.toString() ?? "", vencimento: f.vencimento ? f.vencimento.split("T")[0] : "", link: f.link ?? "", observacoes: f.observacoes ?? "" });
  }

  const tabStyle = (id: string) => aba === id
    ? { background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white", border: "1px solid transparent", boxShadow: "0 4px 14px rgba(99,102,241,.3)" }
    : { background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)" };

  const cardStyle = {
    background: "linear-gradient(145deg, var(--card), var(--card))",
    border: "1px solid var(--border)",
    borderRadius: "16px",
  };

  const editRowStyle = {
    background: "rgba(99,102,241,.05)",
    borderBottom: "1px solid rgba(99,102,241,.12)",
  };

  const TH = ({ children }: { children?: React.ReactNode }) => (
    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
      {children}
    </th>
  );

  return (
    <div className="h-full overflow-y-auto" style={{ background: "var(--bg)" }}>
      <div className="p-4 md:p-8 max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full mb-3"
            style={{ background: "rgba(99,102,241,.1)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,.18)" }}>
            Painel Central
          </span>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="text-[28px] font-bold tracking-tight" style={{ color: "var(--text)" }}>Central</h1>
              <p className="text-[13px] mt-1" style={{ color: "var(--muted-2)" }}>Ferramentas, WhatsApp, atividade e usuários</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {msg && (
                <span className="text-[12px] px-3 py-1.5 rounded-full font-semibold"
                  style={{ background: "rgba(52,211,153,.1)", color: "#34d399", border: "1px solid rgba(52,211,153,.2)" }}>
                  {msg}
                </span>
              )}
              {data?.alertas.length ? (
                <span className="text-[12px] px-3 py-1.5 rounded-full font-semibold"
                  style={{ background: "rgba(251,146,60,.1)", color: "#fb923c", border: "1px solid rgba(251,146,60,.2)" }}>
                  ⚠ {data.alertas.length} vencimento{data.alertas.length > 1 ? "s" : ""} próximo{data.alertas.length > 1 ? "s" : ""}
                </span>
              ) : null}
              <button onClick={() => carregar()}
                className="text-[13px] px-3 py-1.5 rounded-xl font-medium transition-all"
                style={{ background: "var(--input)", border: "1px solid var(--border-2)", color: "var(--text-2)" }}>
                Atualizar
              </button>
            </div>
          </div>
        </div>

        {/* Metric cards */}
        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { value: data.atividade.mensagensHoje, label: "Respostas Claude hoje", color: "#60a5fa", bg: "rgba(96,165,250,.12)", border: "rgba(96,165,250,.2)" },
              { value: data.atividade.leadsHoje, label: "Leads criados hoje", color: "#34d399", bg: "rgba(52,211,153,.12)", border: "rgba(52,211,153,.2)" },
              { value: data.atividade.mensagensMes, label: "Respostas este mês", color: "#c084fc", bg: "rgba(192,132,252,.12)", border: "rgba(192,132,252,.2)" },
            ].map((m, i) => (
              <div key={i} className="bento-card p-5 animate-fade-up" style={{ background: m.bg, borderColor: m.border, animationDelay: `${i * 55}ms` }}>
                <div className="text-[30px] font-bold tracking-tight leading-none mb-1" style={{ color: m.color }}>{m.value}</div>
                <div className="text-[12px]" style={{ color: "var(--muted-2)" }}>{m.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(["planos", "ferramentas", "whatsapp", "atividade", "usuarios"] as const).map((tab) => (
            <button key={tab} onClick={() => setAba(tab)}
              className="px-4 py-2 rounded-xl text-[13px] font-medium transition-all"
              style={tabStyle(tab)}>
              {tab === "planos" ? "Planos" : tab === "ferramentas" ? "Ferramentas" : tab === "whatsapp" ? "WhatsApp" : tab === "atividade" ? "Atividade" : "Usuários"}
            </button>
          ))}
        </div>

        {/* ── PLANOS ── */}
        {aba === "planos" && (
          <div className="space-y-4 animate-fade-up">
            <div className="px-4 py-3 rounded-xl text-[12px]" style={{ background: "rgba(99,102,241,.06)", border: "1px solid rgba(99,102,241,.15)", color: "#a5b4fc" }}>
              Gerencie planos manualmente — isento, valor personalizado, Hotmart ou trial. Empresas isentas nunca são bloqueadas.
            </div>
            {/* Mobile: cards */}
            <div className="sm:hidden space-y-3">
              {empresasPlano.map((e) => {
                const statusColor: Record<string, string> = { TRIAL: "#fbbf24", ATIVO: "#34d399", BLOQUEADO: "#fb923c", CANCELADO: "#f87171" };
                const statusBg: Record<string, string> = { TRIAL: "rgba(251,191,36,.1)", ATIVO: "rgba(52,211,153,.1)", BLOQUEADO: "rgba(251,146,60,.1)", CANCELADO: "rgba(248,113,113,.1)" };
                const cor = statusColor[e.planStatus] ?? "#94a3b8";
                const bg = statusBg[e.planStatus] ?? "rgba(148,163,184,.08)";
                return (
                  <div key={e.id}>
                    <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-[14px]" style={{ color: "var(--text)" }}>{e.nome}</p>
                          <p className="text-[11px] font-mono" style={{ color: "var(--muted-3)" }}>{e.instanciaWhatsapp}</p>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0" style={{ background: bg, color: cor }}>{e.planStatus}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] mb-3">
                        <span style={{ color: "var(--muted-2)" }}>Plano: <strong style={{ color: "var(--text)" }}>{e.plano}</strong></span>
                        <span style={{ color: "var(--muted-2)" }}>Trial: <strong style={{ color: "var(--text)" }}>{e.trialFim ? new Date(e.trialFim).toLocaleDateString("pt-BR") : "—"}</strong></span>
                        <span style={{ color: "var(--muted-2)" }}>Valor: <strong style={{ color: "var(--text)" }}>{e.valorMensal != null ? `R$ ${e.valorMensal.toFixed(2)}` : "—"}</strong></span>
                        {e.isenta && <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(99,102,241,.12)", color: "#a5b4fc" }}>Isenta</span>}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => editPlanoId === e.id ? setEditPlanoId(null) : abrirEditPlano(e)}
                          className="py-2 rounded-xl text-[12px] font-semibold"
                          style={{ background: "rgba(99,102,241,.08)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,.15)" }}>
                          {editPlanoId === e.id ? "Fechar" : "Editar"}
                        </button>
                        <button onClick={() => ativarTrial(e.id, 30)}
                          className="py-2 rounded-xl text-[12px] font-semibold"
                          style={{ background: "rgba(251,191,36,.08)", color: "#fbbf24", border: "1px solid rgba(251,191,36,.15)" }}>
                          +30d trial
                        </button>
                        {e.planStatus !== "ATIVO" && (
                          <button onClick={async () => {
                            await fetch(`/api/empresas/${e.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planStatus: "ATIVO", trialFim: null }) });
                            carregarUsuarios(); showMsg("Ativado!");
                          }} className="py-2 rounded-xl text-[12px] font-semibold"
                            style={{ background: "rgba(52,211,153,.08)", color: "#34d399", border: "1px solid rgba(52,211,153,.15)" }}>
                            Ativar
                          </button>
                        )}
                        {e.planStatus !== "BLOQUEADO" && (
                          <button onClick={async () => {
                            if (!confirm(`Bloquear "${e.nome}"?`)) return;
                            await fetch(`/api/empresas/${e.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planStatus: "BLOQUEADO" }) });
                            carregarUsuarios(); showMsg("Bloqueado.");
                          }} className="py-2 rounded-xl text-[12px] font-semibold"
                            style={{ background: "rgba(251,146,60,.08)", color: "#fb923c", border: "1px solid rgba(251,146,60,.15)" }}>
                            Bloquear
                          </button>
                        )}
                      </div>
                    </div>
                    {editPlanoId === e.id && (
                      <div className="rounded-xl p-4 mt-1" style={{ background: "rgba(99,102,241,.04)", border: "1px solid rgba(99,102,241,.12)" }}>
                        <div className="grid grid-cols-1 gap-3 mb-3">
                          <div>
                            <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted-2)" }}>STATUS</label>
                            <select value={editPlanoForm.planStatus} onChange={ev => setEditPlanoForm(p => ({ ...p, planStatus: ev.target.value }))} className={INPUT}>
                              {["TRIAL", "ATIVO", "BLOQUEADO", "CANCELADO"].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted-2)" }}>PLANO</label>
                            <select value={editPlanoForm.plano} onChange={ev => setEditPlanoForm(p => ({ ...p, plano: ev.target.value }))} className={INPUT}>
                              {["STARTER", "PRO", "AGENCY"].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted-2)" }}>TRIAL ATÉ</label>
                            <input type="date" value={editPlanoForm.trialFim} onChange={ev => setEditPlanoForm(p => ({ ...p, trialFim: ev.target.value }))} className={INPUT} />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted-2)" }}>VALOR REAL (R$)</label>
                            <input type="number" step="0.01" placeholder="0,00" value={editPlanoForm.valorMensal} onChange={ev => setEditPlanoForm(p => ({ ...p, valorMensal: ev.target.value }))} className={INPUT} />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted-2)" }}>ISENTA</label>
                            <button type="button" onClick={() => setEditPlanoForm(p => ({ ...p, isenta: !p.isenta }))}
                              className="w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all"
                              style={editPlanoForm.isenta
                                ? { background: "rgba(99,102,241,.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,.3)" }
                                : { background: "var(--input)", color: "var(--muted)", border: "1px solid var(--border-2)" }}>
                              {editPlanoForm.isenta ? "Sim — Isenta" : "Não"}
                            </button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => salvarPlano(e.id)} disabled={salvandoPlano} className="btn-primary px-4 py-2 text-[13px] disabled:opacity-50">
                            {salvandoPlano ? "Salvando..." : "Salvar"}
                          </button>
                          <button onClick={() => setEditPlanoId(null)}
                            className="px-4 py-2 rounded-xl text-[13px] font-medium"
                            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)" }}>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {!empresasPlano.length && (
                <p className="text-center py-10 text-[13px]" style={{ color: "var(--muted-3)" }}>Nenhuma empresa cadastrada.</p>
              )}
            </div>

            {/* Desktop: table */}
            <div className="hidden sm:block">
              <ScrollHint />
              <div className="relative">
                <GradientFade />
                <div className="rounded-2xl overflow-x-auto" style={cardStyle}>
                  <table className="w-full text-[13px] min-w-[700px]">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--card)" }}>
                        <TH>Empresa</TH><TH>Status</TH><TH>Plano</TH><TH>Trial até</TH><TH>Valor/mês</TH><TH>Isenta</TH><TH></TH>
                      </tr>
                    </thead>
                    <tbody>
                      {empresasPlano.map((e) => {
                        const statusColor: Record<string, string> = { TRIAL: "#fbbf24", ATIVO: "#34d399", BLOQUEADO: "#fb923c", CANCELADO: "#f87171" };
                        const statusBg: Record<string, string> = { TRIAL: "rgba(251,191,36,.1)", ATIVO: "rgba(52,211,153,.1)", BLOQUEADO: "rgba(251,146,60,.1)", CANCELADO: "rgba(248,113,113,.1)" };
                        const cor = statusColor[e.planStatus] ?? "#94a3b8";
                        const bg = statusBg[e.planStatus] ?? "rgba(148,163,184,.08)";
                        return (
                          <>
                            <tr key={e.id} style={{ borderBottom: "1px solid var(--card)" }}
                              onMouseEnter={ev => ev.currentTarget.style.background = "var(--card)"}
                              onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}>
                              <td className="px-4 py-3">
                                <div className="font-semibold" style={{ color: "var(--text)" }}>{e.nome}</div>
                                <div className="text-[11px]" style={{ color: "var(--muted-3)" }}>{e.instanciaWhatsapp}</div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ background: bg, color: cor }}>{e.planStatus}</span>
                              </td>
                              <td className="px-4 py-3 text-[12px]" style={{ color: "var(--muted)" }}>{e.plano}</td>
                              <td className="px-4 py-3 text-[12px]" style={{ color: "var(--muted-2)" }}>
                                {e.trialFim ? new Date(e.trialFim).toLocaleDateString("pt-BR") : "—"}
                              </td>
                              <td className="px-4 py-3 text-[12px]" style={{ color: "var(--muted)" }}>
                                {e.valorMensal != null ? `R$ ${e.valorMensal.toFixed(2)}` : "—"}
                              </td>
                              <td className="px-4 py-3">
                                {e.isenta && (
                                  <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(99,102,241,.12)", color: "#a5b4fc" }}>Isenta</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1.5 justify-end flex-wrap">
                                  <button onClick={() => editPlanoId === e.id ? setEditPlanoId(null) : abrirEditPlano(e)}
                                    className="text-[11px] px-2 py-1 rounded-lg font-semibold"
                                    style={{ background: "rgba(99,102,241,.08)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,.15)" }}>
                                    {editPlanoId === e.id ? "Fechar" : "Editar"}
                                  </button>
                                  {e.planStatus !== "ATIVO" && (
                                    <button onClick={async () => {
                                      await fetch(`/api/empresas/${e.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planStatus: "ATIVO", trialFim: null }) });
                                      carregarUsuarios(); showMsg("Ativado!");
                                    }} className="text-[11px] px-2 py-1 rounded-lg font-semibold"
                                      style={{ background: "rgba(52,211,153,.08)", color: "#34d399", border: "1px solid rgba(52,211,153,.15)" }}>
                                      Ativar
                                    </button>
                                  )}
                                  {e.planStatus !== "BLOQUEADO" && (
                                    <button onClick={async () => {
                                      if (!confirm(`Bloquear "${e.nome}"?`)) return;
                                      await fetch(`/api/empresas/${e.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planStatus: "BLOQUEADO" }) });
                                      carregarUsuarios(); showMsg("Bloqueado.");
                                    }} className="text-[11px] px-2 py-1 rounded-lg font-semibold"
                                      style={{ background: "rgba(251,146,60,.08)", color: "#fb923c", border: "1px solid rgba(251,146,60,.15)" }}>
                                      Bloquear
                                    </button>
                                  )}
                                  <button onClick={() => ativarTrial(e.id, 30)}
                                    className="text-[11px] px-2 py-1 rounded-lg font-semibold"
                                    style={{ background: "rgba(251,191,36,.08)", color: "#fbbf24", border: "1px solid rgba(251,191,36,.15)" }}>
                                    +30d trial
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {editPlanoId === e.id && (
                              <tr key={`${e.id}-edit`}>
                                <td colSpan={7} className="px-4 py-4" style={{ background: "rgba(99,102,241,.04)", borderBottom: "1px solid rgba(99,102,241,.12)" }}>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-3">
                                    <div>
                                      <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted-2)" }}>STATUS</label>
                                      <select value={editPlanoForm.planStatus} onChange={ev => setEditPlanoForm(p => ({ ...p, planStatus: ev.target.value }))} className={INPUT}>
                                        {["TRIAL", "ATIVO", "BLOQUEADO", "CANCELADO"].map(s => <option key={s} value={s}>{s}</option>)}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted-2)" }}>PLANO</label>
                                      <select value={editPlanoForm.plano} onChange={ev => setEditPlanoForm(p => ({ ...p, plano: ev.target.value }))} className={INPUT}>
                                        {["STARTER", "PRO", "AGENCY"].map(s => <option key={s} value={s}>{s}</option>)}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted-2)" }}>TRIAL ATÉ</label>
                                      <input type="date" value={editPlanoForm.trialFim} onChange={ev => setEditPlanoForm(p => ({ ...p, trialFim: ev.target.value }))} className={INPUT} />
                                    </div>
                                    <div>
                                      <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted-2)" }}>VALOR REAL (R$)</label>
                                      <input type="number" step="0.01" placeholder="0,00" value={editPlanoForm.valorMensal} onChange={ev => setEditPlanoForm(p => ({ ...p, valorMensal: ev.target.value }))} className={INPUT} />
                                    </div>
                                    <div className="flex flex-col justify-end">
                                      <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted-2)" }}>ISENTA</label>
                                      <button type="button" onClick={() => setEditPlanoForm(p => ({ ...p, isenta: !p.isenta }))}
                                        className="w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all"
                                        style={editPlanoForm.isenta
                                          ? { background: "rgba(99,102,241,.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,.3)" }
                                          : { background: "var(--input)", color: "var(--muted)", border: "1px solid var(--border-2)" }}>
                                        {editPlanoForm.isenta ? "Sim — Isenta" : "Não"}
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button onClick={() => salvarPlano(e.id)} disabled={salvandoPlano} className="btn-primary px-4 py-2 text-[13px] disabled:opacity-50">
                                      {salvandoPlano ? "Salvando..." : "Salvar"}
                                    </button>
                                    <button onClick={() => setEditPlanoId(null)}
                                      className="px-4 py-2 rounded-xl text-[13px] font-medium"
                                      style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)" }}>
                                      Cancelar
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                      {!empresasPlano.length && (
                        <tr><td colSpan={7} className="px-4 py-10 text-center text-[13px]" style={{ color: "var(--muted-3)" }}>Nenhuma empresa cadastrada.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── FERRAMENTAS ── */}
        {aba === "ferramentas" && (
          <div className="space-y-4 animate-fade-up">
            <form onSubmit={criarFerramenta} className="p-4 rounded-2xl" style={cardStyle}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                {[
                  { key: "nome", label: "NOME *", placeholder: "Ex: Claude API", required: true, type: "text" },
                  { key: "link", label: "LINK / URL", placeholder: "https://...", type: "text" },
                  { key: "observacoes", label: "OBSERVAÇÕES", placeholder: "Plano, créditos...", type: "text" },
                  { key: "valor", label: "VALOR MENSAL (R$)", placeholder: "0,00", type: "number" },
                  { key: "vencimento", label: "VENCIMENTO", placeholder: "", type: "date" },
                ].map(f => (
                  f.key === "tipo" ? null :
                  <div key={f.key}>
                    <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted-2)" }}>{f.label}</label>
                    <input required={f.required} type={f.type} step={f.key === "valor" ? "0.01" : undefined}
                      placeholder={f.placeholder}
                      value={(form as Record<string, string>)[f.key]}
                      onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                      className={INPUT} />
                  </div>
                ))}
                <div>
                  <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted-2)" }}>TIPO *</label>
                  <select required value={form.tipo} onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))} className={INPUT}>
                    {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={salvando} className="btn-primary px-4 py-2.5 text-[13px] disabled:opacity-50">
                Adicionar Ferramenta
              </button>
            </form>

            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="shimmer h-12 rounded-xl" />)}</div>
            ) : (
              <>
                {/* Mobile: cards */}
                <div className="sm:hidden space-y-2">
                  {data?.ferramentas.map((f) => (
                    <div key={f.id}>
                      <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-[14px]" style={{ color: f.link ? "#60a5fa" : "var(--text)" }}>
                              {f.link
                                ? <a href={f.link} target="_blank" rel="noopener noreferrer">{f.nome}</a>
                                : f.nome}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "var(--border)", color: "var(--muted)" }}>{f.tipo}</span>
                              {f.valor != null && <span className="text-[12px]" style={{ color: "var(--muted-2)" }}>R$ {f.valor.toFixed(2)}/mês</span>}
                            </div>
                          </div>
                          <VencimentoBadge vencimento={f.vencimento} />
                        </div>
                        {f.observacoes && <p className="text-[12px] mb-2" style={{ color: "var(--muted-2)" }}>{f.observacoes}</p>}
                        <div className="flex gap-2">
                          <button onClick={() => editId === f.id ? setEditId(null) : abrirEdicao(f)}
                            className="flex-1 py-2 rounded-xl text-[12px] font-semibold"
                            style={{ background: "rgba(99,102,241,.08)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,.15)" }}>
                            {editId === f.id ? "Fechar" : "Editar"}
                          </button>
                          <button onClick={() => excluir(f.id, f.nome)}
                            className="flex-1 py-2 rounded-xl text-[12px] font-semibold"
                            style={{ background: "rgba(248,113,113,.08)", color: "#f87171", border: "1px solid rgba(248,113,113,.15)" }}>
                            Excluir
                          </button>
                        </div>
                      </div>
                      {editId === f.id && (
                        <div className="rounded-xl p-4 mt-1" style={editRowStyle}>
                          <div className="grid grid-cols-1 gap-3 mb-3">
                            {[
                              { key: "nome", label: "NOME", type: "text" },
                              { key: "link", label: "LINK", type: "text" },
                              { key: "observacoes", label: "OBSERVAÇÕES", type: "text" },
                              { key: "valor", label: "VALOR (R$)", type: "number" },
                              { key: "vencimento", label: "VENCIMENTO", type: "date" },
                            ].map(fi => (
                              <div key={fi.key}>
                                <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted-2)" }}>{fi.label}</label>
                                <input type={fi.type} step={fi.key === "valor" ? "0.01" : undefined}
                                  value={(editForm as Record<string, string>)[fi.key]}
                                  onChange={(e) => setEditForm((p) => ({ ...p, [fi.key]: e.target.value }))}
                                  className={INPUT} />
                              </div>
                            ))}
                            <div>
                              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted-2)" }}>TIPO</label>
                              <select value={editForm.tipo} onChange={(e) => setEditForm((p) => ({ ...p, tipo: e.target.value }))} className={INPUT}>
                                {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => salvarEdicao(f.id)} disabled={salvando} className="btn-primary px-4 py-2 text-[13px] disabled:opacity-50">Salvar</button>
                            <button onClick={() => setEditId(null)}
                              className="px-4 py-2 rounded-xl text-[13px] font-medium"
                              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)" }}>
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {!data?.ferramentas.length && (
                    <p className="text-center py-10 text-[13px]" style={{ color: "var(--muted-3)" }}>Nenhuma ferramenta cadastrada.</p>
                  )}
                </div>

                {/* Desktop: table */}
                <div className="hidden sm:block">
                  <ScrollHint />
                  <div className="relative">
                    <GradientFade />
                    <div className="rounded-2xl overflow-x-auto" style={cardStyle}>
                      <table className="w-full text-[13px] min-w-[560px]">
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--card)" }}>
                            <TH>Ferramenta</TH><TH>Tipo</TH><TH>Valor/mês</TH><TH>Vencimento</TH><TH>Obs.</TH><TH></TH>
                          </tr>
                        </thead>
                        <tbody>
                          {data?.ferramentas.map((f) => (
                            <>
                              <tr key={f.id} style={{ borderBottom: "1px solid var(--card)" }}
                                onMouseEnter={e => e.currentTarget.style.background = "var(--card)"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                <td className="px-4 py-3 font-semibold" style={{ color: "var(--text)" }}>
                                  {f.link
                                    ? <a href={f.link} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: "#60a5fa" }}>{f.nome}</a>
                                    : f.nome}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                                    style={{ background: "var(--border)", color: "var(--muted)" }}>{f.tipo}</span>
                                </td>
                                <td className="px-4 py-3" style={{ color: "var(--muted)" }}>
                                  {f.valor != null ? `R$ ${f.valor.toFixed(2)}` : "—"}
                                </td>
                                <td className="px-4 py-3"><VencimentoBadge vencimento={f.vencimento} /></td>
                                <td className="px-4 py-3 text-[12px] max-w-xs truncate" style={{ color: "var(--muted-2)" }}>{f.observacoes ?? "—"}</td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-2 justify-end">
                                    <button onClick={() => editId === f.id ? setEditId(null) : abrirEdicao(f)}
                                      className="text-[11px] px-2 py-1 rounded-lg font-semibold"
                                      style={{ background: "rgba(99,102,241,.08)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,.15)" }}>
                                      {editId === f.id ? "Fechar" : "Editar"}
                                    </button>
                                    <button onClick={() => excluir(f.id, f.nome)}
                                      className="text-[11px] px-2 py-1 rounded-lg font-semibold"
                                      style={{ background: "rgba(248,113,113,.08)", color: "#f87171", border: "1px solid rgba(248,113,113,.15)" }}>
                                      Excluir
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {editId === f.id && (
                                <tr key={`${f.id}-edit`}>
                                  <td colSpan={6} className="px-4 py-4" style={editRowStyle}>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                                      {[
                                        { key: "nome", label: "NOME", type: "text" },
                                        { key: "link", label: "LINK", type: "text" },
                                        { key: "observacoes", label: "OBSERVAÇÕES", type: "text" },
                                        { key: "valor", label: "VALOR (R$)", type: "number" },
                                        { key: "vencimento", label: "VENCIMENTO", type: "date" },
                                      ].map(fi => (
                                        <div key={fi.key}>
                                          <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted-2)" }}>{fi.label}</label>
                                          <input type={fi.type} step={fi.key === "valor" ? "0.01" : undefined}
                                            value={(editForm as Record<string, string>)[fi.key]}
                                            onChange={(e) => setEditForm((p) => ({ ...p, [fi.key]: e.target.value }))}
                                            className={INPUT} />
                                        </div>
                                      ))}
                                      <div>
                                        <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted-2)" }}>TIPO</label>
                                        <select value={editForm.tipo} onChange={(e) => setEditForm((p) => ({ ...p, tipo: e.target.value }))} className={INPUT}>
                                          {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <button onClick={() => salvarEdicao(f.id)} disabled={salvando} className="btn-primary px-4 py-2 text-[13px] disabled:opacity-50">Salvar</button>
                                      <button onClick={() => setEditId(null)}
                                        className="px-4 py-2 rounded-xl text-[13px] font-medium"
                                        style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)" }}>
                                        Cancelar
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          ))}
                          {!data?.ferramentas.length && (
                            <tr><td colSpan={6} className="px-4 py-10 text-center text-[13px]" style={{ color: "var(--muted-3)" }}>Nenhuma ferramenta cadastrada.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── WHATSAPP ── */}
        {aba === "whatsapp" && (
          <div className="space-y-6 animate-fade-up">
            <NovaInstancia onCriada={carregar} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {loading ? (
                <div className="col-span-1 sm:col-span-2 space-y-3">
                  {[1,2,3,4].map(i => <div key={i} className="shimmer h-20 rounded-2xl" />)}
                </div>
              ) : (
                data?.whatsapp.map((w) => (
                  <div key={w.instancia} className="rounded-2xl p-4" style={cardStyle}>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{
                          background: w.state === "open" ? "#34d399" : w.state === "close" ? "#f87171" : "#fbbf24",
                          boxShadow: w.state === "open" ? "0 0 8px rgba(52,211,153,.6)" : w.state === "close" ? "0 0 8px rgba(248,113,113,.4)" : "0 0 8px rgba(251,191,36,.4)",
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[14px] truncate" style={{ color: "var(--text)" }}>{w.nomeEmpresa}</div>
                        <div className="text-[11px] truncate" style={{ color: "var(--muted-2)" }}>{w.instancia}</div>
                        <div className="text-[12px] font-medium mt-0.5" style={{
                          color: w.state === "open" ? "#34d399" : w.state === "close" ? "#f87171" : "#fbbf24"
                        }}>
                          {w.state === "open" ? "✓ Conectado" : w.state === "close" ? "✗ Desconectado" : "⟳ Conectando..."}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 items-end">
                        {w.state !== "open" && (
                          <button onClick={() => reconectar(w.instancia)} disabled={loadingQr[w.instancia]}
                            className="text-[12px] px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50"
                            style={{ background: "rgba(52,211,153,.1)", color: "#34d399", border: "1px solid rgba(52,211,153,.2)" }}>
                            {loadingQr[w.instancia] ? "Aguarde..." : qrInstancia[w.instancia] ? "Atualizar QR" : "Ver QR Code"}
                          </button>
                        )}
                        {w.state === "open" && (
                          <button onClick={() => desconectar(w.instancia)}
                            className="text-[12px] px-3 py-1.5 rounded-lg font-semibold"
                            style={{ background: "rgba(248,113,113,.08)", color: "#f87171", border: "1px solid rgba(248,113,113,.15)" }}>
                            Desconectar
                          </button>
                        )}
                      </div>
                    </div>
                    {qrInstancia[w.instancia] && (
                      <div className="mt-3 pt-3 flex flex-col sm:flex-row gap-3 items-start" style={{ borderTop: "1px solid var(--border)" }}>
                        <div className="bg-white p-2 rounded-xl">
                          <img src={qrInstancia[w.instancia]!} alt="QR Code" className="w-36 h-36" />
                        </div>
                        <div className="flex-1 text-[12px] space-y-1.5" style={{ color: "var(--muted)" }}>
                          <p className="font-semibold" style={{ color: "var(--text-2)" }}>Como conectar:</p>
                          <p>1. Abra o WhatsApp no celular</p>
                          <p>2. Toque em ⋮ → Aparelhos conectados</p>
                          <p>3. Conectar aparelho → Escaneie o QR</p>
                          <p className="font-semibold" style={{ color: "#fb923c" }}>QR expira em ~20s — atualize se necessário</p>
                        </div>
                      </div>
                    )}
                    {w.setup && (
                      <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                        <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--muted-2)" }}>Setup da empresa</p>
                        <div className="grid grid-cols-2 gap-1">
                          {[
                            { ok: w.state === "open", label: "WhatsApp conectado" },
                            { ok: w.setup.vendedores,  label: "Vendedor cadastrado" },
                            { ok: w.setup.informacoes, label: "Informações preenchidas" },
                            { ok: w.setup.nomeIA,      label: "Nome da IA definido" },
                            { ok: w.setup.calendly,    label: (w.setup.tipoAtendimento === "ORCAMENTO" ? "Tipo configurado" : "Link de agendamento") },
                            { ok: w.setup.qualificacao, label: "Roteiro de qualificação" },
                          ].map(({ ok, label }) => (
                            <div key={label} className="flex items-center gap-1.5 text-[11px]" style={{ color: ok ? "#34d399" : "#f87171" }}>
                              <span>{ok ? "✓" : "✗"}</span>
                              <span style={{ color: ok ? "var(--muted)" : "#f87171" }}>{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── ATIVIDADE ── */}
        {aba === "atividade" && data && (
          <div className="space-y-4 animate-fade-up">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { value: data.atividade.mensagensHoje, label: "Respostas Claude hoje", sub: "Mensagens enviadas pelo bot", color: "#60a5fa", bg: "rgba(96,165,250,.12)", border: "rgba(96,165,250,.2)" },
                { value: data.atividade.leadsHoje, label: "Leads novos hoje", sub: "Primeiros contatos do dia", color: "#34d399", bg: "rgba(52,211,153,.12)", border: "rgba(52,211,153,.2)" },
                { value: data.atividade.mensagensMes, label: "Respostas este mês", sub: "Total de tokens Claude usados", color: "#c084fc", bg: "rgba(192,132,252,.12)", border: "rgba(192,132,252,.2)" },
              ].map((m, i) => (
                <div key={i} className="bento-card p-5" style={{ background: m.bg, borderColor: m.border }}>
                  <div className="text-[36px] font-bold tracking-tight leading-none mb-2" style={{ color: m.color }}>{m.value}</div>
                  <div className="text-[13px] font-semibold" style={{ color: "var(--text-2)" }}>{m.label}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: "var(--muted-2)" }}>{m.sub}</div>
                </div>
              ))}
            </div>
            <div
              className="px-4 py-3 rounded-xl text-[13px]"
              style={{ background: "rgba(96,165,250,.06)", border: "1px solid rgba(96,165,250,.15)", color: "#60a5fa" }}
            >
              Para ver o custo exato de tokens Claude, acesse{" "}
              <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                console.anthropic.com
              </a>{" "}
              → Usage.
            </div>
          </div>
        )}

        {/* ── USUÁRIOS ── */}
        {aba === "usuarios" && (
          <div className="space-y-6 animate-fade-up">
            <MigracaoBtn />

            {msgUser && (
              <div
                className="text-[13px] rounded-xl px-4 py-3 font-medium"
                style={msgUser.includes("sucesso")
                  ? { background: "rgba(52,211,153,.08)", border: "1px solid rgba(52,211,153,.2)", color: "#34d399" }
                  : { background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.2)", color: "#f87171" }
                }
              >
                {msgUser}
              </div>
            )}

            <div className="p-5 rounded-2xl" style={cardStyle}>
              <h3 className="text-[15px] font-semibold mb-4" style={{ color: "var(--text)" }}>Criar acesso para empresa</h3>
              <form onSubmit={criarUsuario} className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>NOME</label>
                  <input value={userForm.nome} onChange={e => setUserForm(p => ({...p, nome: e.target.value}))} required placeholder="Maria Silva" className={INPUT} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>EMAIL</label>
                  <input type="email" value={userForm.email} onChange={e => setUserForm(p => ({...p, email: e.target.value}))} required placeholder="maria@empresa.com" className={INPUT} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>SENHA INICIAL</label>
                  <input type="password" value={userForm.senha} onChange={e => setUserForm(p => ({...p, senha: e.target.value}))} required minLength={6} placeholder="mínimo 6 caracteres" className={INPUT} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>EMPRESA</label>
                  <select value={userForm.empresaId} onChange={e => setUserForm(p => ({...p, empresaId: e.target.value}))} required className={INPUT}>
                    <option value="">Selecionar empresa...</option>
                    {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                  </select>
                </div>
                <div className="col-span-2 flex justify-end">
                  <button type="submit" disabled={salvandoUser} className="btn-primary px-5 py-2 text-[13px] disabled:opacity-50">
                    {salvandoUser ? "Criando..." : "Criar usuário"}
                  </button>
                </div>
              </form>
            </div>

            <div className="px-4 py-3 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h3 className="text-[14px] font-semibold" style={{ color: "var(--text)" }}>Acessos ativos ({usuarios.length})</h3>
            </div>

            {usuarios.length === 0 ? (
              <p className="text-center py-10 text-[13px]" style={{ color: "var(--muted-3)" }}>Nenhum usuário de empresa criado ainda</p>
            ) : (
              <>
                {/* Mobile: cards */}
                <div className="sm:hidden space-y-2">
                  {usuarios.map(u => (
                    <div key={u.id} className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="min-w-0">
                          <p className="font-semibold text-[14px]" style={{ color: "var(--text)" }}>{u.nome}</p>
                          <p className="text-[12px]" style={{ color: "var(--muted-2)" }}>{u.email}</p>
                          <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-3)" }}>{u.empresa?.nome ?? "—"}</p>
                        </div>
                        <button onClick={() => toggleAtivo(u.id, u.ativo)}
                          className="text-[11px] px-2.5 py-1 rounded-full font-semibold flex-shrink-0"
                          style={u.ativo
                            ? { background: "rgba(52,211,153,.1)", color: "#34d399" }
                            : { background: "var(--card-2)", color: "var(--muted-2)" }
                          }>
                          {u.ativo ? "Ativo" : "Inativo"}
                        </button>
                      </div>
                      <button onClick={() => excluirUsuario(u.id, u.nome)}
                        className="mt-2 text-[12px] w-full py-1.5 rounded-lg font-medium"
                        style={{ background: "rgba(248,113,113,.06)", color: "#f87171", border: "1px solid rgba(248,113,113,.15)" }}>
                        Excluir
                      </button>
                    </div>
                  ))}
                </div>

                {/* Desktop: table */}
                <div className="hidden sm:block">
                  <ScrollHint />
                  <div className="relative">
                    <GradientFade />
                    <div className="rounded-2xl overflow-x-auto" style={cardStyle}>
                      <table className="w-full text-[13px] min-w-[480px]">
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--card)" }}>
                            <TH>Nome</TH><TH>Email</TH><TH>Empresa</TH><TH>Status</TH><TH></TH>
                          </tr>
                        </thead>
                        <tbody>
                          {usuarios.map(u => (
                            <tr key={u.id} style={{ borderBottom: "1px solid var(--card)" }}
                              onMouseEnter={e => e.currentTarget.style.background = "var(--card)"}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                              <td className="px-4 py-3 font-semibold" style={{ color: "var(--text)" }}>{u.nome}</td>
                              <td className="px-4 py-3" style={{ color: "var(--muted)" }}>{u.email}</td>
                              <td className="px-4 py-3" style={{ color: "var(--muted)" }}>{u.empresa?.nome ?? "—"}</td>
                              <td className="px-4 py-3">
                                <button onClick={() => toggleAtivo(u.id, u.ativo)}
                                  className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                                  style={u.ativo
                                    ? { background: "rgba(52,211,153,.1)", color: "#34d399" }
                                    : { background: "var(--card-2)", color: "var(--muted-2)" }
                                  }>
                                  {u.ativo ? "Ativo" : "Inativo"}
                                </button>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button onClick={() => excluirUsuario(u.id, u.nome)}
                                  className="text-[12px] transition-colors"
                                  style={{ color: "var(--muted-3)" }}
                                  onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                                  onMouseLeave={e => e.currentTarget.style.color = "var(--muted-3)"}>
                                  Excluir
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MigracaoBtn() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "erro">("idle");
  const rodar = async () => {
    setStatus("loading");
    const res = await fetch("/api/admin/migrate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ secret: "crm2026migra" }) });
    setStatus(res.ok ? "ok" : "erro");
  };
  return (
    <div
      className="px-5 py-4 rounded-2xl flex items-center gap-4"
      style={{ background: "rgba(251,191,36,.06)", border: "1px solid rgba(251,191,36,.15)" }}
    >
      <div className="flex-1">
        <div className="text-[14px] font-semibold" style={{ color: "#fbbf24" }}>Atualizar banco de dados</div>
        <div className="text-[12px] mt-0.5" style={{ color: "rgba(251,191,36,.6)" }}>Rode uma vez após cada deploy com mudanças no schema.</div>
      </div>
      <button onClick={rodar} disabled={status === "loading"}
        className="text-[13px] px-4 py-2 rounded-xl font-semibold disabled:opacity-50 transition-all"
        style={{ background: "rgba(251,191,36,.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,.25)" }}>
        {status === "loading" ? "Rodando..." : status === "ok" ? "Concluído ✓" : status === "erro" ? "Erro — tente novamente" : "Executar migração"}
      </button>
    </div>
  );
}

function NovaInstancia({ onCriada }: { onCriada: () => void }) {
  const [form, setForm] = useState({ instanciaNome: "", empresaNome: "" });
  const [criando, setCriando] = useState(false);
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [instanciaCriada, setInstanciaCriada] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const cardStyle = {
    background: "linear-gradient(145deg, var(--card), var(--card))",
    border: "1px solid var(--border)",
    borderRadius: "16px",
  };

  const criar = async (e: React.FormEvent) => {
    e.preventDefault(); setCriando(true); setErro(""); setQrcode(null); setSucesso("");
    try {
      const res = await fetch("/api/central/instancia", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.ok) { setErro(data.erro ?? "Erro ao criar instância"); return; }
      setInstanciaCriada(data.instancia);
      setForm({ instanciaNome: "", empresaNome: "" });
      if (data.qrcode) {
        setQrcode(data.qrcode);
        setSucesso(`Empresa "${data.empresa?.nome}" salva! Escaneie o QR Code abaixo.`);
      } else {
        setSucesso(`Empresa "${data.empresa?.nome}" salva no CRM! Clique em "Ver QR Code" para conectar o WhatsApp.`);
      }
      onCriada();
    } catch (err) {
      setErro("Erro de conexão. Verifique o servidor e tente novamente.");
      console.error(err);
    } finally {
      setCriando(false);
    }
  };

  const atualizarQr = async () => {
    if (!instanciaCriada) return;
    const res = await fetch(`/api/central/instancia?instancia=${instanciaCriada}`);
    const data = await res.json();
    setQrcode(data.qrcode);
  };

  return (
    <div className="p-5 rounded-2xl" style={cardStyle}>
      <h3 className="text-[15px] font-semibold mb-4" style={{ color: "var(--text)" }}>Criar Nova Instância WhatsApp</h3>
      <form onSubmit={criar} className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>NOME DA EMPRESA *</label>
          <input required value={form.empresaNome} onChange={(e) => setForm((p) => ({ ...p, empresaNome: e.target.value }))}
            placeholder="Ex: Loja da Maria" className="w-full input-dark px-3 py-2.5 text-[13px]" />
        </div>
        <div className="flex-1">
          <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>NOME DA INSTÂNCIA * (sem espaços)</label>
          <input required value={form.instanciaNome}
            onChange={(e) => setForm((p) => ({ ...p, instanciaNome: e.target.value.replace(/\s/g, "_") }))}
            placeholder="Ex: loja_maria" className="w-full input-dark px-3 py-2.5 text-[13px]" />
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={criando} className="btn-primary px-4 py-2.5 text-[13px] disabled:opacity-50">
            {criando ? "Criando..." : "Criar"}
          </button>
        </div>
      </form>
      {erro && <p className="text-[13px] mb-3" style={{ color: "#f87171" }}>{erro}</p>}
      {sucesso && (
        <p className="text-[13px] px-4 py-2.5 rounded-xl mb-3"
          style={{ background: "rgba(52,211,153,.08)", border: "1px solid rgba(52,211,153,.2)", color: "#34d399" }}>
          {sucesso}
        </p>
      )}
      {instanciaCriada && !qrcode && (
        <div className="mb-3">
          <button onClick={atualizarQr} className="btn-primary px-4 py-2 text-[13px]">
            Gerar QR Code
          </button>
        </div>
      )}
      {qrcode && (
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="bg-white p-2 rounded-xl self-center sm:self-auto">
            <img src={qrcode} alt="QR Code WhatsApp" className="w-48 h-48" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold mb-1" style={{ color: "var(--text)" }}>
              QR Code gerado para <strong>{instanciaCriada}</strong>
            </p>
            <p className="text-[12px] mb-3" style={{ color: "var(--muted-2)" }}>
              Abra o WhatsApp → Aparelhos conectados → Conectar aparelho → Escaneie
            </p>
            <button onClick={atualizarQr}
              className="text-[12px] px-3 py-1.5 rounded-lg font-medium"
              style={{ background: "var(--card-2)", border: "1px solid var(--border-2)", color: "var(--text-2)" }}>
              Atualizar QR Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
