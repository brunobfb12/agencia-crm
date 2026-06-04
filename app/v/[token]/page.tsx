"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

type Lead = {
  id: string;
  clienteNome: string;
  clienteTelefone: string;
  empresaNome: string;
  instancia: string;
  horasParado: number;
  observacoes: string;
  status: string;
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

export default function PainelVendedor() {
  const params = useParams();
  const token = params.token as string;

  const [vendedorNome, setVendedorNome] = useState("");
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

  const totalRespondidos = Object.values(cards).filter(c => c.respondido).length;
  const todosRespondidos = leads.length > 0 && totalRespondidos === leads.length;

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
            Paredão Tintas
          </span>
        </div>
        <div style={{ fontSize: ".85rem", color: "rgba(245,245,240,.7)" }}>
          Oi <strong style={{ color: "#f5f5f0" }}>{vendedorNome}</strong>! {todosRespondidos ? "Tudo respondido ✅" : `${leads.length - totalRespondidos} orçamento${leads.length - totalRespondidos !== 1 ? "s" : ""} pendente${leads.length - totalRespondidos !== 1 ? "s" : ""}`}
        </div>
        {leads.length > 0 && (
          <div style={{ marginTop: "8px", background: "rgba(255,255,255,.08)", borderRadius: "100px", height: "6px", overflow: "hidden" }}>
            <div style={{ height: "100%", background: "#f0f028", borderRadius: "100px", width: `${(totalRespondidos / leads.length) * 100}%`, transition: "width .4s ease" }} />
          </div>
        )}
      </div>

      <div style={{ padding: "16px", maxWidth: "480px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "12px" }}>

        {todosRespondidos && (
          <div style={{ background: "rgba(110,231,183,.08)", border: "1px solid rgba(110,231,183,.25)", borderRadius: "16px", padding: "32px 20px", textAlign: "center", marginTop: "16px" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "10px" }}>🎉</div>
            <div style={{ fontFamily: "Syne, system-ui, sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "#6ee7b7", marginBottom: "6px" }}>Tudo pronto!</div>
            <div style={{ fontSize: ".85rem", color: "rgba(245,245,240,.6)" }}>Os leads foram atualizados no sistema. Obrigada, {vendedorNome}!</div>
          </div>
        )}

        {leads.map(lead => {
          const card = cards[lead.id] ?? { estado: "idle", valor: "", motivo: "", respondido: false };
          const cor = urgencyColor(lead.horasParado);
          const pedido = resumoPedido(lead.observacoes);

          return (
            <div key={lead.id} style={{
              background: card.respondido ? "rgba(255,255,255,.03)" : "rgba(240,240,40,.03)",
              border: `1px solid ${card.respondido ? "rgba(255,255,255,.08)" : "rgba(240,240,40,.15)"}`,
              borderRadius: "16px",
              overflow: "hidden",
              opacity: card.respondido ? .55 : 1,
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
              </div>

              {/* Card body */}
              <div style={{ padding: "14px 16px" }}>

                {card.estado === "idle" && !card.respondido && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <button onClick={() => setCard(lead.id, { estado: "fechei_valor" })} style={{
                      background: "rgba(110,231,183,.1)", border: "1px solid rgba(110,231,183,.3)", color: "#6ee7b7",
                      borderRadius: "12px", padding: "14px 8px", fontSize: ".85rem", fontWeight: 700, cursor: "pointer",
                      fontFamily: "inherit", transition: "all .2s",
                    }}>✅ Fechei</button>
                    <button onClick={() => setCard(lead.id, { estado: "nao_fechei_motivo" })} style={{
                      background: "rgba(255,128,128,.08)", border: "1px solid rgba(255,128,128,.25)", color: "#ff9090",
                      borderRadius: "12px", padding: "14px 8px", fontSize: ".85rem", fontWeight: 700, cursor: "pointer",
                      fontFamily: "inherit", transition: "all .2s",
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
            </div>
          );
        })}

        {leads.length === 0 && !todosRespondidos && (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "rgba(245,245,240,.35)", fontSize: ".9rem" }}>
            Nenhum orçamento pendente agora 🎉
          </div>
        )}

        <div style={{ height: "32px" }} />
      </div>
    </div>
  );
}
