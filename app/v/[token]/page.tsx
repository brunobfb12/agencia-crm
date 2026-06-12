"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Lead {
  id: string;
  clienteNome: string;
  clienteTelefone: string;
  empresaNome: string;
  instancia: string;
  horasParado: number;
  observacoes: string;
  status: string;
  resumoPedido: string;
}

interface PageData {
  vendedorNome: string;
  empresaNome: string;
  leads: Lead[];
  total: number;
}

export default function VendedorPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState<string | null>(null);
  const [concluidos, setConcluidos] = useState<Set<string>>(new Set());
  const [valores, setValores] = useState<Record<string, string>>({});
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch(`/api/v/${token}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  async function agir(leadId: string, acao: "venda" | "derrota" | "balcao") {
    setProcessando(leadId);
    setErro("");
    try {
      const body: Record<string, string> = { leadId, acao };
      if (acao === "venda" || acao === "balcao") {
        body.valor = valores[leadId] || "";
      }
      const r = await fetch(`/api/v/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("Erro ao processar");
      setConcluidos(prev => new Set([...prev, leadId]));
    } catch {
      setErro("Erro ao processar. Tente novamente.");
    } finally {
      setProcessando(null);
    }
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#04040c" }}>
      <div style={{ color: "#818cf8", fontSize: "1rem" }}>Carregando...</div>
    </div>
  );

  if (!data) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#04040c" }}>
      <div style={{ color: "#f87171", fontSize: "1rem" }}>Link inválido ou expirado.</div>
    </div>
  );

  const leadsPendentes = data.leads.filter(l => !concluidos.has(l.id));

  return (
    <div style={{ minHeight: "100vh", background: "#04040c", color: "#f0f0ff", fontFamily: "sans-serif", padding: "24px 16px" }}>

      {/* Header */}
      <div style={{ maxWidth: 480, margin: "0 auto 24px" }}>
        <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#818cf8", marginBottom: 4 }}>
          FácilCRM
        </div>
        <div style={{ fontSize: "0.85rem", color: "rgba(240,240,255,0.4)" }}>
          Oi {data.vendedorNome?.split(" ")[0]}! Você tem {leadsPendentes.length} orçamento{leadsPendentes.length !== 1 ? "s" : ""} sem retorno.
        </div>
        <div style={{ fontSize: "0.75rem", color: "rgba(240,240,255,0.25)", marginTop: 4 }}>
          Confirma o que aconteceu com cada um — leva 1 minuto.
        </div>
      </div>

      {erro && (
        <div style={{ maxWidth: 480, margin: "0 auto 16px", background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 10, padding: "10px 14px", fontSize: "0.82rem", color: "#f87171" }}>
          {erro}
        </div>
      )}

      {/* Lista de leads */}
      <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
        {leadsPendentes.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(240,240,255,0.3)", fontSize: "0.9rem" }}>
            ✅ Tudo em dia! Nenhum orçamento pendente.
          </div>
        )}

        {leadsPendentes.map(lead => (
          <div key={lead.id} style={{
            background: "rgba(255,255,255,.04)",
            border: "1px solid rgba(255,255,255,.08)",
            borderRadius: 14,
            padding: 18,
          }}>
            {/* Info do lead */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#f0f0ff", marginBottom: 2 }}>
                {lead.clienteNome}
              </div>
              <div style={{ fontSize: "0.75rem", color: "rgba(240,240,255,.35)", marginBottom: 6 }}>
                Orçamento há {lead.horasParado}h sem retorno
              </div>
              {lead.resumoPedido && (
                <div style={{
                  fontSize: "0.78rem",
                  color: "rgba(240,240,255,.6)",
                  background: "rgba(255,255,255,.04)",
                  borderRadius: 8,
                  padding: "6px 10px",
                }}>
                  📋 {lead.resumoPedido}
                </div>
              )}
            </div>

            {/* Campo de valor (opcional) */}
            <input
              type="number"
              placeholder="Valor (opcional) R$"
              value={valores[lead.id] || ""}
              onChange={e => setValores(prev => ({ ...prev, [lead.id]: e.target.value }))}
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "rgba(255,255,255,.06)",
                border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 10,
                padding: "10px 14px",
                color: "#f0f0ff",
                fontSize: "0.88rem",
                marginBottom: 12,
                outline: "none",
              }}
            />

            {/* Botões de ação */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => agir(lead.id, "venda")}
                disabled={processando === lead.id}
                style={{
                  flex: 1,
                  padding: "12px 8px",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  background: "linear-gradient(135deg,#10b981,#059669)",
                  color: "#fff",
                  opacity: processando === lead.id ? 0.5 : 1,
                }}
              >
                ✅ Fechei
              </button>

              <button
                onClick={() => agir(lead.id, "balcao")}
                disabled={processando === lead.id}
                style={{
                  flex: 1,
                  padding: "12px 8px",
                  borderRadius: 10,
                  border: "1px solid rgba(99,102,241,.4)",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  background: "rgba(99,102,241,.1)",
                  color: "#818cf8",
                  opacity: processando === lead.id ? 0.5 : 1,
                }}
              >
                🏪 Balcão
              </button>

              <button
                onClick={() => agir(lead.id, "derrota")}
                disabled={processando === lead.id}
                style={{
                  flex: 1,
                  padding: "12px 8px",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  background: "rgba(239,68,68,.15)",
                  color: "#f87171",
                  opacity: processando === lead.id ? 0.5 : 1,
                }}
              >
                ❌ Não fechei
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Concluídos */}
      {concluidos.size > 0 && (
        <div style={{ maxWidth: 480, margin: "16px auto 0", textAlign: "center", fontSize: "0.78rem", color: "rgba(240,240,255,.25)" }}>
          {concluidos.size} confirmado{concluidos.size !== 1 ? "s" : ""} ✓
        </div>
      )}
    </div>
  );
}
