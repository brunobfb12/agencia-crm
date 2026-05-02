"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Mensagem {
  id: string;
  conteudo: string;
  direcao: "ENTRADA" | "SAIDA";
  criadoEm: string;
}

interface Lead {
  id: string;
  status: string;
  score: number;
  observacoes: string | null;
  vendedor: { id: string; nome: string; telefone: string } | null;
}

interface ConversaDetalhe {
  id: string;
  modoHumano: boolean;
  mensagens: Mensagem[];
  cliente: {
    id: string;
    nome: string | null;
    telefone: string;
    email: string | null;
    empresa: { id: string; nome: string; instanciaWhatsapp: string };
    leads: Lead[];
  };
}

interface ConversaItem {
  id: string;
  ultimaMensagem: string | null;
  ultimaAtividade: string;
  modoHumano: boolean;
  _count: { mensagens: number };
  cliente: {
    id: string;
    nome: string | null;
    telefone: string;
    empresa: { id: string; nome: string; instanciaWhatsapp: string };
    leads: { id: string; status: string; vendedor: { nome: string } | null }[];
  };
}

interface Empresa { id: string; nome: string }

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

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function groupByDate(mensagens: Mensagem[]): { date: string; items: Mensagem[] }[] {
  const groups: Record<string, Mensagem[]> = {};
  for (const m of mensagens) {
    const d = new Date(m.criadoEm).toLocaleDateString("pt-BR");
    if (!groups[d]) groups[d] = [];
    groups[d].push(m);
  }
  return Object.entries(groups).map(([date, items]) => ({ date, items }));
}

export default function ConversasPage() {
  const [conversas, setConversas] = useState<ConversaItem[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [ativa, setAtiva] = useState<ConversaDetalhe | null>(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const carregarLista = useCallback(() => {
    const params = new URLSearchParams();
    if (filtroEmpresa) params.set("empresaId", filtroEmpresa);
    if (busca) params.set("busca", busca);
    fetch(`/api/conversas?${params}`)
      .then((r) => r.json())
      .then((data) => { setConversas(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filtroEmpresa, busca]);

  useEffect(() => {
    fetch("/api/empresas").then((r) => r.json()).then(setEmpresas);
  }, []);

  useEffect(() => { carregarLista(); }, [carregarLista]);

  useEffect(() => {
    const t = setInterval(carregarLista, 15000);
    return () => clearInterval(t);
  }, [carregarLista]);

  const abrirConversa = async (id: string) => {
    setLoadingChat(true);
    const data = await fetch(`/api/conversas/${id}`).then((r) => r.json());
    setAtiva(data);
    setLoadingChat(false);
    setTimeout(() => {
      chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    if (!ativa) return;
    const t = setInterval(async () => {
      const data = await fetch(`/api/conversas/${ativa.id}`).then((r) => r.json());
      setAtiva(data);
    }, 10000);
    return () => clearInterval(t);
  }, [ativa?.id]);

  useEffect(() => {
    if (ativa) chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [ativa?.mensagens.length]);

  const enviar = async () => {
    if (!texto.trim() || !ativa || enviando) return;
    setEnviando(true);
    const res = await fetch(`/api/conversas/${ativa.id}/enviar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto }),
    });
    if (res.ok) {
      setTexto("");
      const data = await fetch(`/api/conversas/${ativa.id}`).then((r) => r.json());
      setAtiva(data);
      setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }), 100);
    }
    setEnviando(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); }
  };

  const toggleModoHumano = async () => {
    if (!ativa) return;
    const novoModo = !ativa.modoHumano;
    await fetch(`/api/conversas/${ativa.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modoHumano: novoModo }),
    });
    setAtiva((prev) => prev ? { ...prev, modoHumano: novoModo } : prev);
    carregarLista();
  };

  const lead = ativa?.cliente.leads[0] ?? null;

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "#08080e" }}>

      {/* ── Sidebar lista ─────────────────────────────────── */}
      <div
        className="w-80 flex-shrink-0 flex flex-col"
        style={{
          background: "#0a0916",
          borderRight: "1px solid rgba(255,255,255,.06)",
        }}
      >
        {/* Header */}
        <div className="px-4 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,.05)" }}>
          <h2 className="text-[15px] font-bold mb-3" style={{ color: "#f1f5f9" }}>Conversas</h2>
          <input
            type="text"
            placeholder="Buscar..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full input-dark px-3 py-2 text-[12.5px] mb-2"
          />
          <select
            value={filtroEmpresa}
            onChange={(e) => setFiltroEmpresa(e.target.value)}
            className="w-full input-dark px-3 py-2 text-[12.5px]"
          >
            <option value="">Todas as empresas</option>
            {empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
          </select>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-2">
              {[1,2,3,4].map(i => <div key={i} className="shimmer h-16 rounded-xl" />)}
            </div>
          ) : conversas.length === 0 ? (
            <div className="p-6 text-center" style={{ color: "rgba(148,163,184,.35)" }}>
              <div className="text-3xl mb-2">💬</div>
              <p className="text-[12px]">Nenhuma conversa ainda.</p>
              <p className="text-[11px] mt-1">Conecte os WhatsApps para começar.</p>
            </div>
          ) : (
            conversas.map((c) => {
              const isAtiva = ativa?.id === c.id;
              const statusLead = c.cliente.leads[0]?.status;
              const badge = statusLead ? STATUS_BADGE[statusLead] : null;
              return (
                <button
                  key={c.id}
                  onClick={() => abrirConversa(c.id)}
                  className="w-full text-left px-4 py-3 transition-all"
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,.04)",
                    borderLeft: isAtiva ? "2px solid #818cf8" : "2px solid transparent",
                    background: isAtiva ? "rgba(99,102,241,.1)" : "transparent",
                  }}
                  onMouseEnter={e => { if (!isAtiva) e.currentTarget.style.background = "rgba(255,255,255,.03)"; }}
                  onMouseLeave={e => { if (!isAtiva) e.currentTarget.style.background = "transparent"; }}
                >
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <span className="font-semibold text-[13px] truncate" style={{ color: isAtiva ? "#c7d2fe" : "#e2e8f0" }}>
                      {c.cliente.nome ?? c.cliente.telefone}
                    </span>
                    <span className="text-[11px] flex-shrink-0" style={{ color: "rgba(148,163,184,.4)" }}>
                      {timeAgo(c.ultimaAtividade)}
                    </span>
                  </div>
                  <div className="text-[12px] truncate mb-1.5" style={{ color: "rgba(148,163,184,.45)" }}>
                    {c.ultimaMensagem ?? "Sem mensagens"}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px]" style={{ color: "rgba(148,163,184,.35)" }}>{c.cliente.empresa.nome}</span>
                    {c.modoHumano && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                        style={{ background: "rgba(251,146,60,.1)", color: "#fb923c" }}>
                        Humano
                      </span>
                    )}
                    {badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                        style={{ background: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Chat area ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0" style={{ background: "#08080e" }}>
        {!ativa && !loadingChat ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center" style={{ color: "rgba(148,163,184,.3)" }}>
              <div className="text-5xl mb-3">💬</div>
              <p className="text-[14px] font-medium">Selecione uma conversa</p>
              <p className="text-[12px] mt-1">para ver o histórico com o cliente</p>
            </div>
          </div>
        ) : loadingChat ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="shimmer w-32 h-4 rounded-xl" />
          </div>
        ) : ativa ? (
          <>
            {/* Chat header */}
            <div
              className="px-5 py-3.5 flex items-center justify-between flex-shrink-0"
              style={{
                background: "rgba(255,255,255,.03)",
                borderBottom: "1px solid rgba(255,255,255,.06)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #6366f1, #38bdf8)", color: "white" }}
                >
                  {(ativa.cliente.nome ?? ativa.cliente.telefone)[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-[14px]" style={{ color: "#f1f5f9" }}>
                    {ativa.cliente.nome ?? ativa.cliente.telefone}
                  </p>
                  <p className="text-[11px]" style={{ color: "rgba(148,163,184,.5)" }}>
                    {ativa.cliente.telefone} · {ativa.cliente.empresa.nome}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {ativa.cliente.email && (
                  <span className="text-[11px]" style={{ color: "rgba(148,163,184,.4)" }}>{ativa.cliente.email}</span>
                )}
                {lead && (() => {
                  const b = STATUS_BADGE[lead.status];
                  return b ? (
                    <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold"
                      style={{ background: b.bg, color: b.color }}>{b.label}</span>
                  ) : null;
                })()}
                {lead?.vendedor && (
                  <span className="text-[11px] px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(255,255,255,.06)", color: "rgba(148,163,184,.7)" }}>
                    {lead.vendedor.nome}
                  </span>
                )}
                <button
                  onClick={toggleModoHumano}
                  className="text-[12px] px-3 py-1.5 rounded-lg font-semibold transition-all"
                  style={ativa.modoHumano
                    ? { background: "rgba(251,146,60,.1)", color: "#fb923c", border: "1px solid rgba(251,146,60,.2)" }
                    : { background: "rgba(52,211,153,.1)", color: "#34d399", border: "1px solid rgba(52,211,153,.2)" }
                  }
                >
                  {ativa.modoHumano ? "Devolver para IA" : "Assumir Conversa"}
                </button>
              </div>
            </div>

            {/* Banner modo humano */}
            {ativa.modoHumano && (
              <div
                className="px-5 py-2 flex items-center gap-2 flex-shrink-0 text-[12px] font-medium"
                style={{ background: "rgba(251,146,60,.06)", borderBottom: "1px solid rgba(251,146,60,.15)", color: "#fb923c" }}
              >
                <span>⚡</span>
                Você está atendendo manualmente — IA pausada para esta conversa
              </div>
            )}

            {/* Messages */}
            <div ref={chatRef} className="flex-1 overflow-y-auto p-5 space-y-4">
              {groupByDate(ativa.mensagens).map(({ date, items }) => (
                <div key={date}>
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,.06)" }} />
                    <span className="text-[11px] font-medium px-3 py-1 rounded-full"
                      style={{ background: "rgba(255,255,255,.04)", color: "rgba(148,163,184,.45)", border: "1px solid rgba(255,255,255,.06)" }}>
                      {date}
                    </span>
                    <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,.06)" }} />
                  </div>
                  <div className="space-y-2">
                    {items.map((m) => (
                      <div key={m.id} className={`flex ${m.direcao === "SAIDA" ? "justify-end" : "justify-start"}`}>
                        <div
                          className="max-w-xs lg:max-w-md xl:max-w-lg rounded-2xl px-4 py-2.5 text-[13px]"
                          style={m.direcao === "SAIDA"
                            ? {
                                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                                color: "white",
                                borderBottomRightRadius: "4px",
                                boxShadow: "0 4px 14px rgba(99,102,241,.3)",
                              }
                            : {
                                background: "rgba(255,255,255,.07)",
                                color: "#e2e8f0",
                                border: "1px solid rgba(255,255,255,.1)",
                                borderBottomLeftRadius: "4px",
                              }
                          }
                        >
                          <p className="whitespace-pre-wrap break-words leading-relaxed">{m.conteudo}</p>
                          <p className="text-[11px] mt-1.5" style={{ color: m.direcao === "SAIDA" ? "rgba(255,255,255,.5)" : "rgba(148,163,184,.4)" }}>
                            {new Date(m.criadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {ativa.mensagens.length === 0 && (
                <div className="text-center py-12 text-[13px]" style={{ color: "rgba(148,163,184,.3)" }}>
                  Nenhuma mensagem nesta conversa ainda.
                </div>
              )}
            </div>

            {/* Input */}
            <div
              className="p-3 flex-shrink-0"
              style={{ background: "rgba(255,255,255,.02)", borderTop: "1px solid rgba(255,255,255,.06)" }}
            >
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escreva uma mensagem... (Enter para enviar)"
                  rows={1}
                  className="flex-1 input-dark px-4 py-2.5 text-[13px] resize-none"
                  style={{ minHeight: "42px", maxHeight: "128px" }}
                />
                <button
                  onClick={enviar}
                  disabled={!texto.trim() || enviando}
                  className="flex-shrink-0 btn-primary px-4 py-2.5 text-[13px] disabled:opacity-40"
                >
                  {enviando ? "..." : "Enviar"}
                </button>
              </div>
              <p className="text-[11px] mt-1.5 px-1" style={{ color: "rgba(148,163,184,.3)" }}>
                Shift+Enter para nova linha · enviado pelo WhatsApp da {ativa.cliente.empresa.nome}
              </p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
