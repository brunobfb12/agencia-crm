"use client";
import Link from "next/link";

const planos = [
  {
    nome: "Starter",
    preco: "R$ 97",
    periodo: "/mês",
    descricao: "Ideal para pequenos negócios começando a automatizar o atendimento.",
    recursos: [
      "1 número WhatsApp",
      "IA responde 24/7",
      "Pipeline de leads",
      "Até 500 leads",
      "Follow-up automático",
    ],
    destaque: false,
    hotmartUrl: "#", // substituir após receber link
  },
  {
    nome: "Pro",
    preco: "R$ 197",
    periodo: "/mês",
    descricao: "Para negócios em crescimento que precisam de mais escala.",
    recursos: [
      "Até 3 números WhatsApp",
      "IA responde 24/7",
      "Pipeline de leads",
      "Leads ilimitados",
      "Follow-up automático",
      "Campanhas em massa",
      "Aniversário automático",
    ],
    destaque: true,
    hotmartUrl: "#", // substituir após receber link
  },
  {
    nome: "Agency",
    preco: "R$ 397",
    periodo: "/mês",
    descricao: "Para agências e empresas com múltiplas operações.",
    recursos: [
      "Até 10 números WhatsApp",
      "IA responde 24/7",
      "Pipeline de leads",
      "Leads ilimitados",
      "Follow-up automático",
      "Campanhas em massa",
      "Aniversário automático",
      "Multi-empresas",
      "Suporte prioritário",
    ],
    destaque: false,
    hotmartUrl: "#", // substituir após receber link
  },
];

export default function PlanosPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#04040c", color: "#f0f0ff", fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ marginBottom: 8, fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#818cf8" }}>
        Seu período de teste encerrou
      </div>
      <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, textAlign: "center", marginBottom: 12 }}>
        Escolha seu plano
      </h1>
      <p style={{ color: "rgba(240,240,255,.6)", textAlign: "center", maxWidth: 480, marginBottom: 48, fontSize: "1rem" }}>
        Continue usando o CRM Fácil com IA que vende 24h por você. Sem fidelidade, cancele quando quiser.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, width: "100%", maxWidth: 900 }}>
        {planos.map((p) => (
          <div
            key={p.nome}
            style={{
              background: p.destaque ? "rgba(99,102,241,.1)" : "rgba(255,255,255,.035)",
              border: p.destaque ? "1px solid rgba(99,102,241,.5)" : "1px solid rgba(255,255,255,.08)",
              borderRadius: 20,
              padding: "32px 28px",
              position: "relative",
              boxShadow: p.destaque ? "0 0 60px rgba(99,102,241,.2)" : "none",
            }}
          >
            {p.destaque && (
              <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#6366f1,#7c3aed)", color: "#fff", fontSize: "0.7rem", fontWeight: 700, padding: "4px 14px", borderRadius: 100, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
                MAIS POPULAR
              </div>
            )}
            <div style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 6 }}>{p.nome}</div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: "2.2rem", fontWeight: 800 }}>{p.preco}</span>
              <span style={{ color: "rgba(240,240,255,.5)", fontSize: "0.9rem" }}>{p.periodo}</span>
            </div>
            <p style={{ color: "rgba(240,240,255,.55)", fontSize: "0.82rem", marginBottom: 20, lineHeight: 1.6 }}>{p.descricao}</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 8 }}>
              {p.recursos.map((r) => (
                <li key={r} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "rgba(240,240,255,.8)" }}>
                  <span style={{ color: "#10b981", fontWeight: 700 }}>✓</span> {r}
                </li>
              ))}
            </ul>
            <a
              href={p.hotmartUrl}
              style={{
                display: "block",
                textAlign: "center",
                padding: "13px 0",
                borderRadius: 12,
                fontWeight: 700,
                fontSize: "0.95rem",
                background: p.destaque ? "linear-gradient(135deg,#6366f1,#7c3aed)" : "rgba(255,255,255,.06)",
                color: "#fff",
                border: p.destaque ? "none" : "1px solid rgba(255,255,255,.12)",
                textDecoration: "none",
                cursor: p.hotmartUrl === "#" ? "default" : "pointer",
              }}
            >
              {p.hotmartUrl === "#" ? "Em breve" : `Assinar ${p.nome}`}
            </a>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <p style={{ color: "rgba(240,240,255,.35)", fontSize: "0.78rem" }}>
          Dúvidas? Fale com a gente pelo WhatsApp
        </p>
        <Link href="/login" style={{ color: "rgba(240,240,255,.4)", fontSize: "0.78rem", textDecoration: "underline" }}>
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}
