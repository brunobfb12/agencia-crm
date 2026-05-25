"use client";

import Link from "next/link";

type Props = {
  nome: string;
  planStatus: string;
  plano: string;
  trialFim: string | null;
  isenta: boolean;
};

const WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "5562985974090";
const HOTMART_SUBSCRIBER = "https://app-vlc.hotmart.com/";

const HOTMART: Record<string, string | undefined> = {
  STARTER_MENSAL: process.env.NEXT_PUBLIC_HOTMART_URL_STARTER_MENSAL,
  STARTER_ANUAL:  process.env.NEXT_PUBLIC_HOTMART_URL_STARTER_ANUAL,
  PRO_MENSAL:     process.env.NEXT_PUBLIC_HOTMART_URL_PRO_MENSAL,
  PRO_ANUAL:      process.env.NEXT_PUBLIC_HOTMART_URL_PRO_ANUAL,
  AGENCY_MENSAL:  process.env.NEXT_PUBLIC_HOTMART_URL_AGENCY_MENSAL,
  AGENCY_ANUAL:   process.env.NEXT_PUBLIC_HOTMART_URL_AGENCY_ANUAL,
};

const PLANOS = [
  {
    key:"STARTER", nome:"Starter",
    desc:"Para empresas que estão começando",
    mensal:497, anualMes:414,
    features:["1 WhatsApp conectado","IA respondendo 24/7","Kanban de leads","Follow-up automático","Até 500 clientes/leads","Aniversário automático"],
  },
  {
    key:"PRO", nome:"Pro",
    desc:"Para empresas em crescimento",
    mensal:897, anualMes:748,
    features:["Até 2 WhatsApp conectados","IA respondendo 24/7","Kanban de leads","Follow-up automático","Clientes ilimitados","Campanhas em massa","Analytics completo","Aniversário automático"],
    destaque:true,
  },
  {
    key:"AGENCY", nome:"Agency",
    desc:"Para agências e múltiplas empresas",
    mensal:1497, anualMes:1248,
    features:["★ Fazemos a implantação por você","3 WhatsApp conectados","Tudo do Pro incluso","Suporte prioritário","Gerente de conta dedicado"],
  },
];

function StatusBadge({ status, isenta }: { status: string; isenta: boolean }) {
  if (isenta) return (
    <span style={{ background:"rgba(16,185,129,.15)",border:"1px solid rgba(16,185,129,.3)",color:"#10b981",borderRadius:100,padding:"3px 12px",fontSize:".72rem",fontWeight:700 }}>
      Plano Gratuito
    </span>
  );
  const map: Record<string, { label: string; color: string; bg: string; border: string }> = {
    TRIAL:     { label:"Em Trial",   color:"#f59e0b", bg:"rgba(245,158,11,.1)", border:"rgba(245,158,11,.3)" },
    ATIVO:     { label:"Ativo",      color:"#10b981", bg:"rgba(16,185,129,.1)", border:"rgba(16,185,129,.3)" },
    BLOQUEADO: { label:"Bloqueado",  color:"#f87171", bg:"rgba(239,68,68,.1)", border:"rgba(239,68,68,.3)" },
    CANCELADO: { label:"Cancelado",  color:"#94a3b8", bg:"rgba(148,163,184,.1)", border:"rgba(148,163,184,.3)" },
  };
  const s = map[status] ?? map.ATIVO;
  return (
    <span style={{ background:s.bg,border:`1px solid ${s.border}`,color:s.color,borderRadius:100,padding:"3px 12px",fontSize:".72rem",fontWeight:700 }}>
      {s.label}
    </span>
  );
}

function getDiasRestantes(trialFim: string | null): number {
  if (!trialFim) return 0;
  const diff = new Date(trialFim).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function AssinaturaClient({ nome, planStatus, plano, trialFim, isenta }: Props) {
  const dias = planStatus === "TRIAL" ? getDiasRestantes(trialFim) : null;
  const isBloqueado = planStatus === "BLOQUEADO" || planStatus === "CANCELADO";

  function abrirCheckout(planKey: string) {
    const url = HOTMART[`${planKey}_MENSAL`];
    if (url) { window.open(url, "_blank"); return; }
    const msg = encodeURIComponent(`Quero fazer upgrade para o plano ${planKey} do FácilCRM`);
    window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, "_blank");
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8" style={{ maxWidth:900, marginLeft:"auto", marginRight:"auto", width:"100%" }}>

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:"1.45rem", fontWeight:700, color:"var(--text-2)", marginBottom:4 }}>
          Minha Assinatura
        </h1>
        <p style={{ fontSize:".88rem", color:"var(--muted-2)" }}>Gerencie seu plano do FácilCRM</p>
      </div>

      {/* Status card */}
      <div className="card" style={{ padding:24, marginBottom:24 }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
          <div>
            <div style={{ fontSize:".72rem", color:"var(--muted-3)", fontWeight:600, letterSpacing:".08em", marginBottom:6 }}>EMPRESA</div>
            <div style={{ fontSize:"1.1rem", fontWeight:700, color:"var(--text-2)", marginBottom:12 }}>{nome}</div>
            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
              <StatusBadge status={planStatus} isenta={isenta} />
              {planStatus !== "TRIAL" && (
                <span style={{ fontSize:".8rem", color:"var(--muted-2)", background:"var(--card-2)", borderRadius:8, padding:"2px 10px" }}>
                  Plano {plano}
                </span>
              )}
            </div>
          </div>
          {/* Actions for active subscriber */}
          {(planStatus === "ATIVO" || isenta) && (
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              {!isenta && (
                <a href={HOTMART_SUBSCRIBER} target="_blank" rel="noopener noreferrer"
                  className="btn-secondary" style={{ fontSize:".82rem", padding:"8px 16px", textDecoration:"none" }}>
                  Gerenciar pagamentos ↗
                </a>
              )}
              <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Preciso de ajuda com minha assinatura do FácilCRM")}`}
                target="_blank" rel="noopener noreferrer"
                className="btn-secondary" style={{ fontSize:".82rem", padding:"8px 16px", textDecoration:"none" }}>
                Suporte WhatsApp
              </a>
            </div>
          )}
        </div>

        {/* Trial countdown */}
        {planStatus === "TRIAL" && dias !== null && (
          <div style={{
            marginTop:16, padding:"14px 18px", borderRadius:14,
            background: dias <= 3 ? "rgba(239,68,68,.08)" : "rgba(245,158,11,.06)",
            border: `1px solid ${dias <= 3 ? "rgba(239,68,68,.2)" : "rgba(245,158,11,.18)"}`,
            display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12,
          }}>
            <div>
              <div style={{ fontWeight:600, fontSize:".88rem", color: dias <= 3 ? "#f87171" : "#f59e0b" }}>
                {dias === 0 ? "Seu trial expira hoje!" : `Seu trial expira em ${dias} dia${dias !== 1 ? "s" : ""}`}
              </div>
              <div style={{ fontSize:".78rem", color:"var(--muted-2)", marginTop:3 }}>
                Escolha um plano abaixo para continuar sem interrupção.
              </div>
            </div>
            <a href="/assinar" className="btn-primary" style={{ fontSize:".82rem", padding:"8px 18px", textDecoration:"none" }}>
              Assinar agora →
            </a>
          </div>
        )}

        {/* Payment blocked */}
        {isBloqueado && (
          <div style={{
            marginTop:16, padding:"14px 18px", borderRadius:14,
            background:"rgba(239,68,68,.08)", border:"1px solid rgba(239,68,68,.2)",
            display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12,
          }}>
            <div>
              <div style={{ fontWeight:600, fontSize:".88rem", color:"#f87171" }}>
                {planStatus === "CANCELADO" ? "Assinatura cancelada" : "Problema com seu pagamento"}
              </div>
              <div style={{ fontSize:".78rem", color:"var(--muted-2)", marginTop:3 }}>
                {planStatus === "CANCELADO"
                  ? "Escolha um novo plano para reativar sua conta."
                  : "Acesse sua área na Hotmart para regularizar o pagamento."}
              </div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              {planStatus === "BLOQUEADO" && (
                <a href={HOTMART_SUBSCRIBER} target="_blank" rel="noopener noreferrer"
                  className="btn-primary" style={{ fontSize:".82rem", padding:"8px 16px", textDecoration:"none" }}>
                  Regularizar pagamento ↗
                </a>
              )}
              <a href="/assinar" className="btn-secondary" style={{ fontSize:".82rem", padding:"8px 16px", textDecoration:"none" }}>
                Escolher plano
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Plan cards — upgrade/downgrade */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:".85rem", fontWeight:600, color:"var(--muted-2)", marginBottom:16 }}>
          {planStatus === "ATIVO" ? "Alterar plano" : "Escolha um plano"}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))", gap:14 }}>
          {PLANOS.map(p => {
            const isCurrent = planStatus === "ATIVO" && plano === p.key;
            return (
              <div key={p.key} className="card" style={{
                padding:22, position:"relative",
                border: isCurrent ? "1px solid rgba(99,102,241,.4)" : undefined,
                background: p.destaque ? "rgba(99,102,241,.05)" : undefined,
              }}>
                {isCurrent && (
                  <div style={{
                    position:"absolute", top:-10, left:16,
                    background:"linear-gradient(135deg,#6366f1,#7c3aed)",
                    color:"#fff", fontSize:".6rem", fontWeight:700, letterSpacing:".1em",
                    padding:"3px 10px", borderRadius:100,
                  }}>PLANO ATUAL</div>
                )}
                {p.destaque && !isCurrent && (
                  <div style={{
                    position:"absolute", top:-10, left:16,
                    background:"linear-gradient(135deg,#6366f1,#7c3aed)",
                    color:"#fff", fontSize:".6rem", fontWeight:700, letterSpacing:".1em",
                    padding:"3px 10px", borderRadius:100,
                  }}>MAIS POPULAR</div>
                )}
                <div style={{ fontWeight:700, fontSize:"1rem", color:"var(--text-2)", marginBottom:3 }}>{p.nome}</div>
                <div style={{ fontSize:".75rem", color:"var(--muted-2)", marginBottom:12 }}>{p.desc}</div>
                <div style={{ display:"flex", alignItems:"flex-end", gap:2, marginBottom:14 }}>
                  <span style={{ fontSize:".8rem", color:"#818cf8" }}>R$</span>
                  <span style={{ fontSize:"1.8rem", fontWeight:800, color:"var(--text-2)", lineHeight:1 }}>
                    {p.mensal.toLocaleString("pt-BR")}
                  </span>
                  <span style={{ fontSize:".75rem", color:"var(--muted-3)", marginBottom:4 }}>/mês</span>
                </div>
                <ul style={{ listStyle:"none", display:"flex", flexDirection:"column", gap:7, marginBottom:18 }}>
                  {p.features.map((f,i) => (
                    <li key={i} style={{ display:"flex", gap:7, fontSize:".78rem", color:"var(--muted-2)" }}>
                      <span style={{ color:"#10b981", flexShrink:0 }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <button disabled className="btn-secondary" style={{ width:"100%", opacity:.5, cursor:"not-allowed", fontSize:".82rem" }}>
                    Plano atual
                  </button>
                ) : (
                  <button onClick={()=>abrirCheckout(p.key)}
                    className={p.destaque ? "btn-primary" : "btn-secondary"}
                    style={{ width:"100%", fontSize:".82rem" }}>
                    {planStatus === "ATIVO"
                      ? (PLANOS.findIndex(x=>x.key===plano) < PLANOS.findIndex(x=>x.key===p.key) ? "Fazer upgrade →" : "Fazer downgrade")
                      : "Assinar agora →"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ fontSize:".75rem", color:"var(--muted-3)", textAlign:"center", marginTop:20, lineHeight:1.6 }}>
        Plano anual = 2 meses grátis · Cancele quando quiser ·{" "}
        <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer"
          style={{ color:"var(--muted-2)", textDecoration:"none" }}>
          Dúvidas? Fale conosco
        </a>
      </div>
    </div>
  );
}
