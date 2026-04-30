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

interface Empresa {
  id: string;
  nome: string;
}

const statusLabels: Record<string, string> = {
  LEAD: "Lead",
  AQUECIMENTO: "Aquecimento",
  PRONTO_PARA_COMPRAR: "Pronto p/ Comprar",
  NEGOCIACAO: "Negociação",
  VENDA_REALIZADA: "Venda",
  POS_VENDA: "Pós-Venda",
  FOLLOW_UP: "Follow-up",
  PERDIDO: "Perdido",
  SEM_INTERESSE: "Sem Interesse",
  SEM_RESPOSTA: "Sem Resposta",
};

const statusColors: Record<string, string> = {
  LEAD: "bg-gray-100 text-gray-600",
  AQUECIMENTO: "bg-orange-100 text-orange-700",
  PRONTO_PARA_COMPRAR: "bg-yellow-100 text-yellow-700",
  NEGOCIACAO: "bg-blue-100 text-blue-700",
  VENDA_REALIZADA: "bg-green-100 text-green-700",
  POS_VENDA: "bg-purple-100 text-purple-700",
  FOLLOW_UP: "bg-cyan-100 text-cyan-700",
  PERDIDO: "bg-red-100 text-red-600",
  SEM_INTERESSE: "bg-rose-100 text-rose-600",
  SEM_RESPOSTA: "bg-amber-100 text-amber-700",
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

  // Auto-refresh a cada 15 segundos
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

  // Recarrega chat ativo a cada 10 segundos
  useEffect(() => {
    if (!ativa) return;
    const t = setInterval(async () => {
      const data = await fetch(`/api/conversas/${ativa.id}`).then((r) => r.json());
      setAtiva(data);
    }, 10000);
    return () => clearInterval(t);
  }, [ativa?.id]);

  useEffect(() => {
    if (ativa) {
      chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
    }
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
      setTimeout(() => {
        chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
      }, 100);
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
    <div className="flex h-full overflow-hidden">
      {/* Lista de conversas */}
      <div className="w-80 flex-shrink-0 border-r border-gray-200 flex flex-col bg-white">
        {/* Cabeçalho lista */}
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900 mb-3">Conversas</h2>
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
          />
          <select
            value={filtroEmpresa}
            onChange={(e) => setFiltroEmpresa(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas as empresas</option>
            {empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
          </select>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-400 text-sm">Carregando...</div>
          ) : conversas.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              Nenhuma conversa ainda.
              <br />
              <span className="text-xs">Conecte os WhatsApps para começar.</span>
            </div>
          ) : (
            conversas.map((c) => {
              const isAtiva = ativa?.id === c.id;
              const statusLead = c.cliente.leads[0]?.status;
              return (
                <button
                  key={c.id}
                  onClick={() => abrirConversa(c.id)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                    isAtiva ? "bg-blue-50 border-l-2 border-l-blue-500" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <span className="font-medium text-sm text-gray-900 truncate">
                      {c.cliente.nome ?? c.cliente.telefone}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {timeAgo(c.ultimaAtividade)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 truncate mb-1.5">
                    {c.ultimaMensagem ?? "Sem mensagens"}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-gray-400">{c.cliente.empresa.nome}</span>
                    {c.modoHumano && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700">
                        Humano
                      </span>
                    )}
                    {statusLead && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusColors[statusLead] ?? "bg-gray-100 text-gray-600"}`}>
                        {statusLabels[statusLead] ?? statusLead}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Área do chat */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
        {!ativa && !loadingChat ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-5xl mb-3">💬</div>
              <p className="text-sm font-medium">Selecione uma conversa</p>
              <p className="text-xs mt-1">para ver o histórico com o cliente</p>
            </div>
          </div>
        ) : loadingChat ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Carregando conversa...
          </div>
        ) : ativa ? (
          <>
            {/* Header do chat */}
            <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                  {(ativa.cliente.nome ?? ativa.cliente.telefone)[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {ativa.cliente.nome ?? ativa.cliente.telefone}
                  </p>
                  <p className="text-xs text-gray-500">
                    {ativa.cliente.telefone} · {ativa.cliente.empresa.nome}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {ativa.cliente.email && (
                  <span className="text-xs text-gray-400">{ativa.cliente.email}</span>
                )}
                {lead && (
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[lead.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {statusLabels[lead.status] ?? lead.status}
                  </span>
                )}
                {lead?.vendedor && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {lead.vendedor.nome}
                  </span>
                )}
                <button
                  onClick={toggleModoHumano}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    ativa.modoHumano
                      ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                >
                  {ativa.modoHumano ? "Devolver para IA" : "Assumir Conversa"}
                </button>
              </div>
            </div>

            {/* Banner modo humano */}
            {ativa.modoHumano && (
              <div className="bg-orange-50 border-b border-orange-200 px-5 py-2 flex items-center gap-2 flex-shrink-0">
                <span className="text-orange-600 text-xs font-medium">Você está atendendo manualmente — IA pausada para esta conversa</span>
              </div>
            )}

            {/* Mensagens */}
            <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {groupByDate(ativa.mensagens).map(({ date, items }) => (
                <div key={date}>
                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 font-medium">{date}</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  <div className="space-y-2">
                    {items.map((m) => (
                      <div
                        key={m.id}
                        className={`flex ${m.direcao === "SAIDA" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md xl:max-w-lg rounded-2xl px-4 py-2.5 text-sm ${
                            m.direcao === "SAIDA"
                              ? "bg-blue-600 text-white rounded-br-sm"
                              : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm shadow-sm"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words leading-relaxed">{m.conteudo}</p>
                          <p
                            className={`text-xs mt-1.5 ${
                              m.direcao === "SAIDA" ? "text-blue-200" : "text-gray-400"
                            }`}
                          >
                            {new Date(m.criadoEm).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {ativa.mensagens.length === 0 && (
                <div className="text-center text-gray-400 text-sm py-12">
                  Nenhuma mensagem nesta conversa ainda.
                </div>
              )}
            </div>

            {/* Input de envio */}
            <div className="bg-white border-t border-gray-200 p-3 flex-shrink-0">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escreva uma mensagem... (Enter para enviar)"
                  rows={1}
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32"
                  style={{ minHeight: "42px" }}
                />
                <button
                  onClick={enviar}
                  disabled={!texto.trim() || enviando}
                  className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                  {enviando ? "..." : "Enviar"}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5 px-1">
                Shift+Enter para nova linha · Esta mensagem será enviada pelo WhatsApp da {ativa.cliente.empresa.nome}
              </p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
