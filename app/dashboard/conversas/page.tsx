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

interface MediaPreview {
  tipo: "imagem" | "documento" | "audio";
  base64: string;
  mimeType: string;
  fileName: string;
  legenda: string;
  previewUrl?: string;
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

function MensagemConteudo({ conteudo, isSaida }: { conteudo: string; isSaida: boolean }) {
  const muted = isSaida ? "rgba(255,255,255,.6)" : "var(--muted-2)";
  if (conteudo === "[ÁUDIO]" || conteudo === "[AUDIO]") {
    return (
      <div className="flex items-center gap-2">
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.8 }}>
          <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-1 17.93V21h-3v2h8v-2h-3v-2.07A9 9 0 0 0 21 11h-2a7 7 0 0 1-14 0H3a9 9 0 0 0 8 8.93z"/>
        </svg>
        <span style={{ color: muted, fontSize: 12 }}>Áudio</span>
      </div>
    );
  }
  if (conteudo.startsWith("[IMAGEM]")) {
    const legenda = conteudo.replace("[IMAGEM]", "").trim();
    return (
      <div className="flex items-center gap-2">
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.8 }}>
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
        <span>{legenda || "Foto"}</span>
      </div>
    );
  }
  if (conteudo.startsWith("[ARQUIVO]")) {
    const nome = conteudo.replace("[ARQUIVO]", "").trim();
    return (
      <div className="flex items-center gap-2">
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.8 }}>
          <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
        </svg>
        <span className="truncate max-w-[180px]">{nome || "Arquivo"}</span>
      </div>
    );
  }
  return <p className="whitespace-pre-wrap break-words leading-relaxed">{conteudo}</p>;
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
  const [erroEnvio, setErroEnvio] = useState("");

  // Mídia
  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Áudio
  const [recording, setRecording] = useState(false);
  const [recordingSec, setRecordingSec] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  useEffect(() => { fetch("/api/empresas").then((r) => r.json()).then(setEmpresas); }, []);
  useEffect(() => { carregarLista(); }, [carregarLista]);
  useEffect(() => { const t = setInterval(carregarLista, 15000); return () => clearInterval(t); }, [carregarLista]);

  const abrirConversa = async (id: string) => {
    setLoadingChat(true);
    const data = await fetch(`/api/conversas/${id}`).then((r) => r.json());
    setAtiva(data);
    setLoadingChat(false);
    setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }), 100);
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

  const recarregarConversa = async () => {
    if (!ativa) return;
    const data = await fetch(`/api/conversas/${ativa.id}`).then((r) => r.json());
    setAtiva(data);
    setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }), 100);
  };

  // ── Enviar texto ──────────────────────────────────────────────────────
  const enviarTexto = async () => {
    if (!texto.trim() || !ativa || enviando) return;
    setEnviando(true);
    setErroEnvio("");
    const res = await fetch(`/api/conversas/${ativa.id}/enviar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto }),
    });
    if (res.ok) { setTexto(""); await recarregarConversa(); }
    else { const d = await res.json().catch(() => ({})); setErroEnvio(d.erro || "Falha ao enviar."); }
    setEnviando(false);
    inputRef.current?.focus();
  };

  // ── Enviar mídia ──────────────────────────────────────────────────────
  const enviarMidia = async () => {
    if (!mediaPreview || !ativa || enviando) return;
    setEnviando(true);
    setErroEnvio("");
    const res = await fetch(`/api/conversas/${ativa.id}/enviar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: mediaPreview.tipo,
        base64: mediaPreview.base64,
        mimeType: mediaPreview.mimeType,
        fileName: mediaPreview.fileName,
        legenda: mediaPreview.legenda,
      }),
    });
    if (res.ok) { setMediaPreview(null); await recarregarConversa(); }
    else { const d = await res.json().catch(() => ({})); setErroEnvio(d.erro || "Falha ao enviar mídia."); }
    setEnviando(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviarTexto(); }
  };

  // ── File picker ───────────────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const isImage = file.type.startsWith("image/");
      setMediaPreview({
        tipo: isImage ? "imagem" : "documento",
        base64: dataUrl,
        mimeType: file.type,
        fileName: file.name,
        legenda: "",
        previewUrl: isImage ? dataUrl : undefined,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── Audio recording ───────────────────────────────────────────────────
  const startRecording = async () => {
    setErroEnvio("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/ogg;codecs=opus";
      const mr = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaPreview({
            tipo: "audio",
            base64: reader.result as string,
            mimeType,
            fileName: "audio.ogg",
            legenda: "",
          });
        };
        reader.readAsDataURL(blob);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      setRecordingSec(0);
      recordingTimerRef.current = setInterval(() => setRecordingSec((s) => s + 1), 1000);
    } catch {
      setErroEnvio("Microfone não disponível. Verifique as permissões do navegador.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setRecording(false);
  };

  const cancelarRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
    }
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setRecording(false);
    setRecordingSec(0);
    audioChunksRef.current = [];
  };

  const toggleModoHumano = async () => {
    if (!ativa) return;
    const novoModo = !ativa.modoHumano;
    const res = await fetch(`/api/conversas/${ativa.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modoHumano: novoModo }),
    });
    if (!res.ok) return;
    const data = await fetch(`/api/conversas/${ativa.id}`).then((r) => r.json());
    setAtiva(data);
    carregarLista();
  };

  const lead = ativa?.cliente.leads[0] ?? null;

  const fmtSec = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "var(--bg)" }}>

      {/* ── Sidebar lista ─────────────────────────────────── */}
      <div
        className={`${ativa ? "hidden md:flex" : "flex"} w-full md:w-80 flex-shrink-0 flex-col`}
        style={{ background: "var(--bg)", borderRight: "1px solid var(--border)" }}
      >
        <div className="px-4 pt-5 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-[15px] font-bold mb-3" style={{ color: "var(--text)" }}>Conversas</h2>
          <input
            type="text" placeholder="Buscar..." value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full input-dark px-3 py-2 text-[12.5px] mb-2"
          />
          <select value={filtroEmpresa} onChange={(e) => setFiltroEmpresa(e.target.value)}
            className="w-full input-dark px-3 py-2 text-[12.5px]">
            <option value="">Todas as empresas</option>
            {empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-2">{[1,2,3,4].map(i => <div key={i} className="shimmer h-16 rounded-xl" />)}</div>
          ) : conversas.length === 0 ? (
            <div className="p-6 text-center" style={{ color: "var(--muted-3)" }}>
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
                <button key={c.id} onClick={() => abrirConversa(c.id)}
                  className="w-full text-left px-4 py-3 transition-all"
                  style={{
                    borderBottom: "1px solid var(--card)",
                    borderLeft: isAtiva ? "2px solid #818cf8" : "2px solid transparent",
                    background: isAtiva ? "rgba(99,102,241,.1)" : "transparent",
                  }}
                  onMouseEnter={e => { if (!isAtiva) e.currentTarget.style.background = "var(--card)"; }}
                  onMouseLeave={e => { if (!isAtiva) e.currentTarget.style.background = "transparent"; }}
                >
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <span className="font-semibold text-[13px] truncate" style={{ color: isAtiva ? "#c7d2fe" : "var(--text-2)" }}>
                      {c.cliente.nome ?? c.cliente.telefone}
                    </span>
                    <span className="text-[11px] flex-shrink-0" style={{ color: "var(--muted-3)" }}>{timeAgo(c.ultimaAtividade)}</span>
                  </div>
                  <div className="text-[12px] truncate mb-1.5" style={{ color: "var(--muted-2)" }}>{c.ultimaMensagem ?? "Sem mensagens"}</div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px]" style={{ color: "var(--muted-3)" }}>{c.cliente.empresa.nome}</span>
                    {c.modoHumano && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                        style={{ background: "rgba(251,146,60,.1)", color: "#fb923c" }}>Humano</span>
                    )}
                    {badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                        style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Chat area ─────────────────────────────────────── */}
      <div className={`${ativa || loadingChat ? "flex" : "hidden md:flex"} flex-1 flex-col min-w-0`} style={{ background: "var(--bg)" }}>
        {!ativa && !loadingChat ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center" style={{ color: "var(--muted-3)" }}>
              <div className="text-5xl mb-3">💬</div>
              <p className="text-[14px] font-medium">Selecione uma conversa</p>
              <p className="text-[12px] mt-1">para ver o histórico com o cliente</p>
            </div>
          </div>
        ) : loadingChat ? (
          <div className="flex-1 flex items-center justify-center"><div className="shimmer w-32 h-4 rounded-xl" /></div>
        ) : ativa ? (
          <>
            {/* Header */}
            <div className="px-5 py-3.5 flex items-center justify-between flex-shrink-0"
              style={{ background: "var(--card)", borderBottom: "1px solid var(--border)", backdropFilter: "blur(12px)" }}>
              <div className="flex items-center gap-3">
                <button onClick={() => setAtiva(null)} className="md:hidden p-1.5 rounded-lg flex-shrink-0 -ml-1" style={{ color: "var(--muted)" }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #6366f1, #38bdf8)", color: "white" }}>
                  {(ativa.cliente.nome ?? ativa.cliente.telefone)[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-[14px]" style={{ color: "var(--text)" }}>{ativa.cliente.nome ?? ativa.cliente.telefone}</p>
                  <p className="text-[11px]" style={{ color: "var(--muted-2)" }}>{ativa.cliente.telefone} · {ativa.cliente.empresa.nome}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {ativa.cliente.email && <span className="text-[11px]" style={{ color: "var(--muted-3)" }}>{ativa.cliente.email}</span>}
                {lead && (() => { const b = STATUS_BADGE[lead.status]; return b ? (
                  <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold" style={{ background: b.bg, color: b.color }}>{b.label}</span>
                ) : null; })()}
                {lead?.vendedor && (
                  <span className="text-[11px] px-2.5 py-1 rounded-full" style={{ background: "var(--card-2)", color: "var(--muted)" }}>{lead.vendedor.nome}</span>
                )}
                <button onClick={toggleModoHumano}
                  className="text-[12px] px-3 py-1.5 rounded-lg font-semibold transition-all"
                  style={ativa.modoHumano
                    ? { background: "rgba(251,146,60,.1)", color: "#fb923c", border: "1px solid rgba(251,146,60,.2)" }
                    : { background: "rgba(52,211,153,.1)", color: "#34d399", border: "1px solid rgba(52,211,153,.2)" }}>
                  {ativa.modoHumano ? "Devolver para IA" : "Assumir Conversa"}
                </button>
              </div>
            </div>

            {/* Banner modo humano */}
            {ativa.modoHumano && (
              <div className="px-5 py-2 flex items-center gap-2 flex-shrink-0 text-[12px] font-medium"
                style={{ background: "rgba(251,146,60,.06)", borderBottom: "1px solid rgba(251,146,60,.15)", color: "#fb923c" }}>
                <span>⚡</span> Você está atendendo manualmente — IA pausada para esta conversa
              </div>
            )}

            {/* Messages */}
            <div ref={chatRef} className="flex-1 overflow-y-auto p-5 space-y-4">
              {groupByDate(ativa.mensagens).map(({ date, items }) => (
                <div key={date}>
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px" style={{ background: "var(--card-2)" }} />
                    <span className="text-[11px] font-medium px-3 py-1 rounded-full"
                      style={{ background: "var(--card)", color: "var(--muted-2)", border: "1px solid var(--border)" }}>{date}</span>
                    <div className="flex-1 h-px" style={{ background: "var(--card-2)" }} />
                  </div>
                  <div className="space-y-2">
                    {items.map((m) => (
                      <div key={m.id} className={`flex ${m.direcao === "SAIDA" ? "justify-end" : "justify-start"}`}>
                        <div className="max-w-xs lg:max-w-md xl:max-w-lg rounded-2xl px-4 py-2.5 text-[13px]"
                          style={m.direcao === "SAIDA"
                            ? { background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white", borderBottomRightRadius: "4px", boxShadow: "0 4px 14px rgba(99,102,241,.3)" }
                            : { background: "var(--border)", color: "var(--text-2)", border: "1px solid var(--border-2)", borderBottomLeftRadius: "4px" }
                          }>
                          <MensagemConteudo conteudo={m.conteudo} isSaida={m.direcao === "SAIDA"} />
                          <p className="text-[11px] mt-1.5" style={{ color: m.direcao === "SAIDA" ? "rgba(255,255,255,.5)" : "var(--muted-3)" }}>
                            {new Date(m.criadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {ativa.mensagens.length === 0 && (
                <div className="text-center py-12 text-[13px]" style={{ color: "var(--muted-3)" }}>Nenhuma mensagem nesta conversa ainda.</div>
              )}
            </div>

            {/* ── Input area ──────────────────────────────────── */}
            <div className="flex-shrink-0" style={{ background: "var(--card)", borderTop: "1px solid var(--border)" }}>

              {/* Preview mídia */}
              {mediaPreview && !recording && (
                <div className="px-3 pt-3 pb-1 flex items-start gap-3">
                  <div className="flex-1 rounded-xl p-3 text-[12px] flex items-center gap-3"
                    style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                    {mediaPreview.tipo === "imagem" && mediaPreview.previewUrl ? (
                      <img src={mediaPreview.previewUrl} alt="" className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                    ) : mediaPreview.tipo === "audio" ? (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(99,102,241,.15)" }}>
                        <svg width="18" height="18" fill="#818cf8" viewBox="0 0 24 24">
                          <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-1 17.93V21h-3v2h8v-2h-3v-2.07A9 9 0 0 0 21 11h-2a7 7 0 0 1-14 0H3a9 9 0 0 0 8 8.93z"/>
                        </svg>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(99,102,241,.15)" }}>
                        <svg width="16" height="16" fill="#818cf8" viewBox="0 0 24 24">
                          <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" style={{ color: "var(--text-2)" }}>
                        {mediaPreview.tipo === "audio" ? `Áudio gravado (${fmtSec(recordingSec)})` : mediaPreview.fileName}
                      </p>
                      {(mediaPreview.tipo === "imagem" || mediaPreview.tipo === "documento") && (
                        <input
                          type="text"
                          placeholder="Legenda (opcional)"
                          value={mediaPreview.legenda}
                          onChange={(e) => setMediaPreview({ ...mediaPreview, legenda: e.target.value })}
                          className="w-full mt-1 input-dark px-2 py-1 text-[12px]"
                        />
                      )}
                    </div>
                  </div>
                  <button onClick={() => setMediaPreview(null)} className="mt-1 p-1.5 rounded-lg" style={{ color: "var(--muted-3)" }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Recording indicator */}
              {recording && (
                <div className="px-3 pt-3 pb-1">
                  <div className="rounded-xl p-3 flex items-center gap-3 text-[13px]"
                    style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)" }}>
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: "#f87171" }} />
                    <span style={{ color: "#f87171" }}>Gravando... {fmtSec(recordingSec)}</span>
                    <div className="flex-1" />
                    <button onClick={stopRecording}
                      className="text-[12px] px-3 py-1 rounded-lg font-semibold"
                      style={{ background: "rgba(99,102,241,.15)", color: "#818cf8" }}>
                      Parar
                    </button>
                    <button onClick={cancelarRecording}
                      className="text-[12px] px-3 py-1 rounded-lg font-semibold"
                      style={{ background: "rgba(239,68,68,.1)", color: "#f87171" }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Input row */}
              <div className="p-3 flex items-end gap-2">

                {/* File picker */}
                <input ref={fileInputRef} type="file" className="hidden"
                  accept="image/*,application/pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.txt,.zip"
                  onChange={handleFileSelect} />

                {!recording && !mediaPreview && (
                  <>
                    <button onClick={() => fileInputRef.current?.click()}
                      className="flex-shrink-0 p-2.5 rounded-xl transition-all"
                      style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--muted)" }}
                      title="Enviar arquivo ou foto">
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </button>

                    <button onClick={startRecording}
                      className="flex-shrink-0 p-2.5 rounded-xl transition-all"
                      style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--muted)" }}
                      title="Gravar áudio">
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 0 1-14 0M12 19v4M8 23h8"/>
                      </svg>
                    </button>
                  </>
                )}

                {!recording && (
                  <textarea ref={inputRef} value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={mediaPreview ? "Legenda (opcional)..." : "Escreva uma mensagem... (Enter para enviar)"}
                    rows={1}
                    disabled={!!mediaPreview && mediaPreview.tipo === "audio"}
                    className="flex-1 input-dark px-4 py-2.5 text-[13px] resize-none"
                    style={{ minHeight: "42px", maxHeight: "128px", opacity: mediaPreview?.tipo === "audio" ? 0.4 : 1 }}
                  />
                )}

                {!recording && (
                  <button
                    onClick={mediaPreview ? enviarMidia : enviarTexto}
                    disabled={(!texto.trim() && !mediaPreview) || enviando}
                    className="flex-shrink-0 btn-primary px-4 py-2.5 text-[13px] disabled:opacity-40">
                    {enviando ? "..." : "Enviar"}
                  </button>
                )}
              </div>

              {erroEnvio && (
                <p className="text-[11px] px-4 pb-2" style={{ color: "#f87171" }}>⚠ {erroEnvio}</p>
              )}
              {!erroEnvio && !recording && !mediaPreview && (
                <p className="text-[11px] px-4 pb-2" style={{ color: "var(--muted-3)" }}>
                  Shift+Enter para nova linha · enviado pelo WhatsApp da {ativa.cliente.empresa.nome}
                </p>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
