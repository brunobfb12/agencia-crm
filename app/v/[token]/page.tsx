"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

type Categoria = "negociando" | "pronto" | "parado" | "qualificando" | "novo";

type Lead = {
  id: string;
  clienteNome: string;
  clienteTelefone: string;
  empresaNome: string;
  instancia: string;
  horasParado: number;
  observacoes: string;
  status: string;
  categoria: Categoria;
};

type Estado = "idle" | "fechei_valor" | "nao_fechei_motivo" | "salvando" | "done";

type CardState = {
  estado: Estado;
  valor: string;
  motivo: string;
  respondido: boolean;
};

const MOTIVOS = [
  { n: "1", label: "Cliente sumiu / não respondeu" },
  { n: "2", label: "Falou que está caro" },
  { n: "3", label: "Ainda negociando" },
  { n: "4", label: "Produto não disponível" },
];

function urgencyColor(h: number): string {
  if (h >= 72) return "#ef4444";
  if (h >= 48) return "#f97316";
  if (h >= 24) return "#f0f028";
  return "#6ee7b7";
}

function urgencyLabel(h: number): string {
  if (h >= 72) return `🔴 ${h}h`;
  if (h >= 48) return `🟠 ${h}h`;
  if (h >= 24) return `⏰ ${h}h`;
  return `🟢 ${h}h`;
}

function resumoPedido(obs: string): string {
  const match = obs.match(/[Pp]edido[:\s]+([^|]+)/);
  if (match) return match[1].trim().slice(0, 100);
  return obs.split("|")[0].trim().slice(0, 100);
}

const SECTION_CONFIG: Record<string, { label: string; cor: string; bg: string; border: string; icon: string; desc: string }> = {
  negociando: { label: "Aguardando resposta", cor: "#f0f028", bg: "rgba(240,240,40,.06)", border: "rgba(240,240,40,.2)", icon: "⏰", desc: "Leads que você recebeu e ainda não respondeu o resultado" },
  pronto:     { label: "Pronto para comprar", cor: "#6ee7b7", bg: "rgba(110,231,183,.06)", border: "rgba(110,231,183,.2)", icon: "🟢", desc: "IA qualificou — cliente está quente, feche agora" },
  parado:     { label: "Parados na qualificação", cor: "#f97316", bg: "rgba(249,115,22,.05)", border: "rgba(249,115,22,.2)", icon: "⏸️", desc: "Leads que pararam de responder à IA há 24h+" },
  qualificando: { label: "Em qualificação", cor: "#818cf8", bg: "rgba(129,140,248,.05)", border: "rgba(129,140,248,.15)", icon: "🤖", desc: "IA em conversa — nenhuma ação necessária agora" },
  novo:       { label: "Novos leads", cor: "#67e8f9", bg: "rgba(103,232,249,.05)", border: "rgba(103,232,249,.15)", icon: "✨", desc: "Chegaram agora — IA está iniciando o atendimento" },
};

const SECTION_ORDER: Categoria[] = ["negociando", "pronto", "parado", "qualificando", "novo"];

export default function PainelVendedor() {
  const params = useParams();
  const token = params.token as string;

  const [vendedorNome, setVendedorNome] = useState("");
  const [empresaNome, setEmpresaNome] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [cards, setCards] = useState<Record<string, CardState>>({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch(`/api/v/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setErro(d.error); setLoading(false); return; }
        setVendedorNome(d.vendedorNome);
        setEmpresaNome(d.empresaNome ?? "");
        setLeads(d.leads);
        const init: Record<string, CardState> = {};
        d.leads.forEach((l: Lead) => { init[l.id] = { estado: "idle", valor: "", motivo: "", respondido: false }; });
        setCards(init);
        setLoading(false);
      })
      .catch(() => { setErro("Erro ao carregar. Tente novamente."); setLoading(false); });
  }, [token]);

  const setCard = useCallback((id: string, patch: Partial<CardState>) => {
    setCards(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }, []);

  const confirmar = useCallback(async (lead: Lead, acao: string) => {
    const card = cards[lead.id];
    if (!card) return;
    setCard(lead.id, { estado: "salvando" });
    const body: Record<string, unknown> = { leadId: lead.id, acao };
    if (acao === "venda") body.valor = card.valor;
    if (acao === "derrota") body.motivo = card.motivo;
    const r = await fetch(`/api/v/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.ok) setCard(lead.id, { estado: "done", respondido: true });
    else setCard(lead.id, { estado: "idle" });
  }, [cards, token, setCard]);

  // counts only leads that need action from vendor
  const leadsAtivos = leads.filter(l => l.categoria === "negociando" || l.categoria === "pronto" || l.categoria === "parado");
  const totalRespondidos = leadsAtivos.filter(l => cards[l.id]?.respondido).length;
  const todosRespondidos = leadsAtivos.length > 0 && totalRespondidos === leadsAtivos.length;

  if (loading) return (
    <div style={{ background: "#050505", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#f0f028", fontFamily: "sans-serif", fontSize: "1rem" }}>Carregando...</div>
    </div>
  );

  if (erro) return (
    <div style={{ background: "#050505", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ color: "#ff8080", fontFamily: "sans-serif", textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⚠️</div>
        <div>{erro}</div>
      </div>
    </div>
  );

  const byCategory = SECTION_ORDER.reduce<Record<string, Lead[]>>((acc, cat) => {
    acc[cat] = leads.filter(l => l.categoria === cat);
    return acc;
  }, {} as Record<string, Lead[]>);

  return (
    <div style={{ background: "#050505", minHeight: "100vh", fontFamily: "'DM Sans', system-ui, sans-serif", color: "#f5f5f0" }}>

      {/* Header */}
      <div style={{ background: "rgba(240,240,40,.06)", borderBottom: "1px solid rgba(240,240,40,.15)", padding: "16px 20px", position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <div style={{ display: "flex", gap: "3px" }}>
            {["#b4dcf0", "#f0a050", "#f0f028"].map((c, i) => (
              <div key={i} style={{ width: "5px", height: "28px", borderRadius: "2px", background: c }} />
            ))}
          </div>
          <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontWeight: 800, fontSize: "1rem", color: "#f0f028", letterSpacing: ".04em", textTransform: "uppercase" }}>
            {empresaNome || "FácilCRM"}
          </span>
        </div>
        <div style={{ fontSize: ".85rem", color: "rgba(245,245,240,.7)" }}>
          Oi <strong style={{ color: "#f5f5f0" }}>{vendedorNome}</strong>!{" "}
          {todosRespondidos
            ? "Tudo respondido ✅"
            : leadsAtivos.length === 0
            ? "Nenhuma ação pendente 🎉"
            : `${leadsAtivos.length - totalRespondidos} ação${leadsAtivos.length - totalRespondidos !== 1 ? "ões" : ""} pendente${leadsAtivos.length - totalRespondidos !== 1 ? "s" : ""}`}
        </div>
        {leadsAtivos.length > 0 && (
          <div style={{ marginTop: "8px", background: "rgba(255,255,255,.08)", borderRadius: "100px", height: "6px", overflow: "hidden" }}>
            <div style={{ height: "100%", background: "#f0f028", borderRadius: "100px", width: `${(totalRespondidos / leadsAtivos.length) * 100}%`, transition: "width .4s ease" }} />
          </div>
        )}
      </div>

      <div style={{ padding: "16px", maxWidth: "480px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>

        {todosRespondidos && leadsAtivos.length > 0 && (
          <div style={{ background: "rgba(110,231,183,.08)", border: "1px solid rgba(110,231,183,.25)", borderRadius: "16px", padding: "32px 20px", textAlign: "center", marginTop: "8px" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "10px" }}>🎉</div>
            <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "#6ee7b7", marginBottom: "6px" }}>Tudo pronto!</div>
            <div style={{ fontSize: ".85rem", color: "rgba(245,245,240,.6)" }}>Os leads foram atualizados. Obrigado, {vendedorNome}!</div>
          </div>
        )}

        {leads.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "rgba(245,245,240,.35)", fontSize: ".9rem" }}>
            Nenhum lead agora 🎉
          </div>
        )}

        {SECTION_ORDER.map(cat => {
          const grupo = byCategory[cat] ?? [];
          if (grupo.length === 0) return null;
          const cfg = SECTION_CONFIG[cat];
          const isInfo = cat === "qualificando" || cat === "novo";

          return (
            <div key={cat}>
              {/* Section header */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <span style={{ fontSize: ".75rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: cfg.cor }}>
                  {cfg.icon} {cfg.label}
                </span>
                <span style={{ fontSize: ".72rem", padding: "1px 8px", borderRadius: "100px", background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.cor, fontWeight: 700 }}>
                  {grupo.length}
                </span>
              </div>
              {isInfo && (
                <div style={{ fontSize: ".75rem", color: "rgba(245,245,240,.4)", marginBottom: "10px", marginLeft: "2px" }}>{cfg.desc}</div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {grupo.map(lead => <LeadCard key={lead.id} lead={lead} card={cards[lead.id] ?? { estado: "idle", valor: "", motivo: "", respondido: false }} setCard={setCard} confirmar={confirmar} />)}
              </div>
            </div>
          );
        })}

        <div style={{ height: "32px" }} />
      </div>
    </div>
  );
}

function LeadCard({ lead, card, setCard, confirmar }: {
  lead: Lead;
  card: CardState;
  setCard: (id: string, patch: Partial<CardState>) => void;
  confirmar: (lead: Lead, acao: string) => void;
}) {
  const cor = urgencyColor(lead.horasParado);
  const pedido = resumoPedido(lead.observacoes);
  const isInfo = lead.categoria === "qualificando" || lead.categoria === "novo";
  const isAquecimentoParado = lead.categoria === "parado";

  return (
    <div style={{
      background: card.respondido ? "rgba(255,255,255,.03)" : isInfo ? "rgba(255,255,255,.02)" : "rgba(240,240,40,.03)",
      border: `1px solid ${card.respondido ? "rgba(255,255,255,.08)" : isInfo ? "rgba(255,255,255,.07)" : "rgba(240,240,40,.15)"}`,
      borderRadius: "16px",
      overflow: "hidden",
      opacity: card.respondido ? .5 : 1,
      transition: "opacity .3s",
    }}>
      {/* Card header */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
          <span style={{ fontFamily: "Syne, system-ui, sans-serif", fontWeight: 700, fontSize: ".95rem", color: "#f5f5f0" }}>{lead.clienteNome}</span>
          <span style={{ fontSize: ".75rem", fontWeight: 600, color: cor, background: `${cor}18`, padding: "2px 8px", borderRadius: "100px", border: `1px solid ${cor}40` }}>
            {urgencyLabel(lead.horasParado)}
          </span>
        </div>
        {pedido && <div style={{ fontSize: ".8rem", color: "rgba(245,245,240,.5)", lineHeight: 1.4 }}>{pedido}</div>}
        {lead.categoria === "novo" && (
          <div style={{ marginTop: "6px", fontSize: ".72rem", color: "#67e8f9", background: "rgba(103,232,249,.08)", border: "1px solid rgba(103,232,249,.15)", padding: "2px 8px", borderRadius: "6px", display: "inline-block" }}>
            ✨ Novo — IA em atendimento
          </div>
        )}
        {lead.categoria === "qualificando" && (
          <div style={{ marginTop: "6px", fontSize: ".72rem", color: "#818cf8", background: "rgba(129,140,248,.08)", border: "1px solid rgba(129,140,248,.15)", padding: "2px 8px", borderRadius: "6px", display: "inline-block" }}>
            🤖 IA qualificando...
          </div>
        )}
      </div>

      {/* Card body — only for leads that need action */}
      {!isInfo && (
        <div style={{ padding: "14px 16px" }}>

          {/* AQUECIMENTO parado — assumir ou descartar */}
          {isAquecimentoParado && !card.respondido && card.estado === "idle" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ fontSize: ".78rem", color: "rgba(245,245,240,.5)", marginBottom: "2px" }}>
                Parado há {lead.horasParado}h. Deseja assumir este lead?
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button onClick={() => confirmar(lead, "assumir")} style={{
                  background: "rgba(110,231,183,.1)", border: "1px solid rgba(110,231,183,.3)", color: "#6ee7b7",
                  borderRadius: "12px", padding: "14px 8px", fontSize: ".83rem", fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit",
                }}>📞 Assumir</button>
                <button onClick={() => confirmar(lead, "descartar_aquecimento")} style={{
                  background: "rgba(255,128,128,.08)", border: "1px solid rgba(255,128,128,.25)", color: "#ff9090",
                  borderRadius: "12px", padding: "14px 8px", fontSize: ".83rem", fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit",
                }}>🗑️ Descartar</button>
              </div>
            </div>
          )}

          {/* NEGOCIACAO / PRONTO — fechei ou não */}
          {!isAquecimentoParado && card.estado === "idle" && !card.respondido && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button onClick={() => setCard(lead.id, { estado: "fechei_valor" })} style={{
                background: "rgba(110,231,183,.1)", border: "1px solid rgba(110,231,183,.3)", color: "#6ee7b7",
                borderRadius: "12px", padding: "14px 8px", fontSize: ".85rem", fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit",
              }}>✅ Fechei</button>
              <button onClick={() => setCard(lead.id, { estado: "nao_fechei_motivo" })} style={{
                background: "rgba(255,128,128,.08)", border: "1px solid rgba(255,128,128,.25)", color: "#ff9090",
                borderRadius: "12px", padding: "14px 8px", fontSize: ".85rem", fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit",
              }}>❌ Não fechei</button>
            </div>
          )}

          {card.estado === "fechei_valor" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ fontSize: ".8rem", color: "rgba(245,245,240,.6)", marginBottom: "2px" }}>Qual o valor da venda?</div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ color: "rgba(245,245,240,.5)", fontSize: ".9rem" }}>R$</span>
                <input
                  type="number" inputMode="decimal" placeholder="0,00"
                  value={card.valor}
                  onChange={e => setCard(lead.id, { valor: e.target.value })}
                  style={{
                    flex: 1, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.15)",
                    borderRadius: "10px", padding: "12px 14px", color: "#f5f5f0", fontSize: "1rem",
                    fontFamily: "inherit", outline: "none",
                  }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <button onClick={() => setCard(lead.id, { estado: "idle" })} style={{
                  background: "transparent", border: "1px solid rgba(255,255,255,.12)", color: "rgba(245,245,240,.5)",
                  borderRadius: "10px", padding: "12px", fontSize: ".82rem", cursor: "pointer", fontFamily: "inherit",
                }}>Voltar</button>
                <button onClick={() => confirmar(lead, "venda")} style={{
                  background: "rgba(110,231,183,.15)", border: "1px solid rgba(110,231,183,.4)", color: "#6ee7b7",
                  borderRadius: "10px", padding: "12px", fontSize: ".85rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>Confirmar →</button>
              </div>
            </div>
          )}

          {card.estado === "nao_fechei_motivo" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ fontSize: ".8rem", color: "rgba(245,245,240,.6)", marginBottom: "2px" }}>O que aconteceu?</div>
              {MOTIVOS.map(m => (
                <button key={m.n} onClick={() => setCard(lead.id, { motivo: m.n })} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  background: card.motivo === m.n ? "rgba(240,240,40,.1)" : "rgba(255,255,255,.04)",
                  border: `1px solid ${card.motivo === m.n ? "rgba(240,240,40,.4)" : "rgba(255,255,255,.1)"}`,
                  color: card.motivo === m.n ? "#f0f028" : "rgba(245,245,240,.7)",
                  borderRadius: "10px", padding: "12px 14px", fontSize: ".83rem", cursor: "pointer",
                  fontFamily: "inherit", textAlign: "left", transition: "all .15s",
                }}>
                  <span style={{
                    width: "26px", height: "26px", borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    background: card.motivo === m.n ? "#f0f028" : "rgba(255,255,255,.08)",
                    color: card.motivo === m.n ? "#000" : "rgba(245,245,240,.5)",
                    fontWeight: 700, fontSize: ".8rem",
                  }}>{m.n}</span>
                  {m.label}
                </button>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "4px" }}>
                <button onClick={() => setCard(lead.id, { estado: "idle", motivo: "" })} style={{
                  background: "transparent", border: "1px solid rgba(255,255,255,.12)", color: "rgba(245,245,240,.5)",
                  borderRadius: "10px", padding: "12px", fontSize: ".82rem", cursor: "pointer", fontFamily: "inherit",
                }}>Voltar</button>
                <button onClick={() => card.motivo && confirmar(lead, "derrota")} style={{
                  background: card.motivo ? "rgba(255,128,128,.12)" : "rgba(255,255,255,.04)",
                  border: `1px solid ${card.motivo ? "rgba(255,128,128,.35)" : "rgba(255,255,255,.08)"}`,
                  color: card.motivo ? "#ff9090" : "rgba(245,245,240,.3)",
                  borderRadius: "10px", padding: "12px", fontSize: ".85rem", fontWeight: 700,
                  cursor: card.motivo ? "pointer" : "default", fontFamily: "inherit",
                }}>Confirmar →</button>
              </div>
            </div>
          )}

          {card.estado === "salvando" && (
            <div style={{ textAlign: "center", padding: "8px", color: "rgba(245,245,240,.5)", fontSize: ".85rem" }}>Salvando...</div>
          )}

          {card.estado === "done" && (
            <div style={{ textAlign: "center", padding: "8px", color: "#6ee7b7", fontSize: ".85rem", fontWeight: 600 }}>✅ Respondido</div>
          )}
        </div>
      )}
    </div>
  );
}
