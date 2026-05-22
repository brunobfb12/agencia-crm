"use client";

import { useState } from "react";
import Link from "next/link";
import SupportButton from "@/app/_components/SupportButton";

type Ciclo = "mensal" | "anual";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

.ass-wrap{
  min-height:100vh;display:flex;flex-direction:column;align-items:center;
  padding:48px 20px 64px;
  background:#04040c;color:#f0f0ff;font-family:'DM Sans',sans-serif;
  position:relative;overflow-x:hidden;
}
.ass-grid{position:fixed;inset:0;
  background-image:linear-gradient(rgba(99,102,241,.04) 1px,transparent 1px),
    linear-gradient(90deg,rgba(99,102,241,.04) 1px,transparent 1px);
  background-size:56px 56px;pointer-events:none;z-index:0}
.ass-orb{position:fixed;border-radius:50%;filter:blur(90px);pointer-events:none}
.ass-o1{width:600px;height:600px;background:radial-gradient(circle,rgba(99,102,241,.28),transparent);top:-200px;left:-180px;opacity:.35}
.ass-o2{width:400px;height:400px;background:radial-gradient(circle,rgba(34,211,238,.18),transparent);bottom:5%;right:-100px;opacity:.3}

.ass-z{position:relative;z-index:2;width:100%}
.ass-logo{
  font-family:'Syne',sans-serif;font-size:1.5rem;font-weight:800;
  background:linear-gradient(135deg,#818cf8,#22d3ee);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  text-decoration:none;display:block;text-align:center;margin-bottom:40px;
}
.ass-badge{
  display:inline-flex;align-items:center;gap:6px;
  font-size:.72rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;
  color:#f87171;padding:5px 14px;border:1px solid rgba(239,68,68,.28);
  border-radius:100px;background:rgba(239,68,68,.08);margin-bottom:16px;
}
.ass-h1{
  font-family:'Syne',sans-serif;font-weight:800;letter-spacing:-.02em;
  font-size:clamp(1.7rem,3vw,2.6rem);line-height:1.12;
  text-align:center;margin-bottom:10px;color:#f0f0ff;
}
.ass-h1 span{
  background:linear-gradient(135deg,#818cf8,#22d3ee);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.ass-sub{font-size:.9rem;color:rgba(240,240,255,.45);text-align:center;margin-bottom:36px;max-width:480px;line-height:1.65}

/* Toggle */
.ass-toggle{
  display:flex;gap:4px;padding:4px;border-radius:14px;margin-bottom:36px;
  background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
}
.ass-toggle-btn{
  position:relative;padding:9px 24px;border-radius:10px;
  font-family:'DM Sans',sans-serif;font-size:.85rem;font-weight:600;
  cursor:pointer;border:none;transition:all .2s;
}
.ass-toggle-btn.active{background:linear-gradient(135deg,#6366f1,#7c3aed);color:#fff}
.ass-toggle-btn.inactive{background:transparent;color:rgba(240,240,255,.45)}
.ass-eco{
  position:absolute;top:-10px;right:-8px;
  font-size:.6rem;font-weight:700;padding:2px 6px;border-radius:100px;
  background:#10b981;color:#fff;white-space:nowrap;
}

/* Cards grid */
.ass-grid-cards{
  display:grid;grid-template-columns:repeat(3,1fr);gap:18px;
  width:100%;max-width:900px;
}
.ass-card{
  background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
  border-radius:24px;padding:28px 24px;display:flex;flex-direction:column;
  position:relative;transition:border-color .2s,box-shadow .2s;
}
.ass-card.popular{
  background:rgba(99,102,241,.07);border-color:rgba(99,102,241,.35);
  box-shadow:0 0 60px rgba(99,102,241,.14);
}
.ass-badge-top{
  position:absolute;top:-11px;left:50%;transform:translateX(-50%);
  background:linear-gradient(135deg,#6366f1,#7c3aed);
  color:#fff;font-size:.62rem;font-weight:700;letter-spacing:.12em;
  padding:4px 12px;border-radius:100px;white-space:nowrap;
}
.ass-plano{
  font-family:'Syne',sans-serif;font-size:1.6rem;font-weight:800;color:#f0f0ff;
  margin-bottom:4px;letter-spacing:-.02em;
  padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.08);
}
.ass-card.popular .ass-plano{
  background:linear-gradient(135deg,#818cf8,#22d3ee);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.ass-desc{font-size:.78rem;color:rgba(240,240,255,.4);margin:10px 0 16px}
.ass-price-row{display:flex;align-items:flex-end;gap:2px;margin-bottom:3px}
.ass-cur{font-size:.9rem;color:#818cf8;margin-bottom:5px}
.ass-amt{font-family:'Syne',sans-serif;font-size:2.6rem;font-weight:800;color:#f0f0ff;line-height:1}
.ass-per{font-size:.78rem;color:rgba(240,240,255,.35);margin-bottom:4px}
.ass-anual-note{font-size:.68rem;color:rgba(240,240,255,.3);margin-bottom:18px}
.ass-features{list-style:none;display:flex;flex-direction:column;gap:9px;margin-bottom:22px;flex:1}
.ass-features li{display:flex;align-items:flex-start;gap:8px;font-size:.82rem;color:rgba(240,240,255,.7);line-height:1.45}
.ass-features li::before{content:'✓';color:#10b981;font-weight:700;flex-shrink:0;
  filter:drop-shadow(0 0 4px rgba(16,185,129,.4))}
.ass-features li.star::before{content:'★';color:#f59e0b;filter:drop-shadow(0 0 4px rgba(245,158,11,.4))}
.ass-cta{
  width:100%;padding:13px;border-radius:12px;font-family:'DM Sans',sans-serif;
  font-weight:700;font-size:.9rem;cursor:pointer;border:none;
  transition:transform .2s,box-shadow .2s;margin-top:auto;
}
.ass-cta.primary{background:linear-gradient(135deg,#6366f1,#7c3aed);color:#fff}
.ass-cta.primary:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 28px rgba(99,102,241,.45)}
.ass-cta.secondary{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);color:#f0f0ff}
.ass-cta.secondary:hover:not(:disabled){background:rgba(255,255,255,.09)}
.ass-cta:disabled{opacity:.5;cursor:not-allowed}

/* Guarantee */
.ass-guarantee{
  display:flex;align-items:center;gap:14px;
  background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.18);
  border-radius:18px;padding:18px 24px;max-width:520px;width:100%;margin-top:40px;
}
.ass-footer{font-size:.72rem;color:rgba(240,240,255,.25);text-align:center;margin-top:16px}
.ass-footer a{color:rgba(240,240,255,.4);text-decoration:none}

@keyframes ass-spin{to{transform:rotate(360deg)}}
.ass-spin{width:15px;height:15px;border:2px solid #fff;border-top-color:transparent;
  border-radius:50%;display:inline-block;animation:ass-spin .7s linear infinite}

@media(max-width:768px){
  .ass-grid-cards{grid-template-columns:1fr}
  .ass-wrap{padding:36px 16px 60px}
}
`;

const PLANOS = [
  {
    key:"STARTER", nome:"Starter", popular:false,
    desc:"Para quem está começando a profissionalizar vendas",
    mensal:397, anual:3970, anualMes:330,
    features:["1 WhatsApp conectado","IA respondendo 24/7","Pipeline Kanban completo","Follow-up automático","Até 500 clientes ativos","Aniversário automático"],
  },
  {
    key:"PRO", nome:"Pro", popular:true,
    desc:"Para empresas que querem escalar sem contratar",
    mensal:697, anual:6970, anualMes:580,
    features:["Até 2 WhatsApp conectados","IA respondendo 24/7","Pipeline Kanban completo","Follow-up automático","Clientes ilimitados","Campanhas em massa","Analytics completo","Aniversário automático"],
  },
  {
    key:"AGENCY", nome:"Agency", popular:false,
    desc:"Para agências que gerenciam múltiplos clientes",
    mensal:997, anual:9970, anualMes:830,
    features:[{t:"Fazemos toda a implantação por você",star:true},"3 WhatsApp conectados","Tudo do Pro incluído","Suporte prioritário em até 2h","Gerente de conta dedicado"],
  },
];

const HOTMART: Record<string,string|undefined> = {
  STARTER_MENSAL: process.env.NEXT_PUBLIC_HOTMART_URL_STARTER_MENSAL,
  STARTER_ANUAL:  process.env.NEXT_PUBLIC_HOTMART_URL_STARTER_ANUAL,
  PRO_MENSAL:     process.env.NEXT_PUBLIC_HOTMART_URL_PRO_MENSAL,
  PRO_ANUAL:      process.env.NEXT_PUBLIC_HOTMART_URL_PRO_ANUAL,
  AGENCY_MENSAL:  process.env.NEXT_PUBLIC_HOTMART_URL_AGENCY_MENSAL,
  AGENCY_ANUAL:   process.env.NEXT_PUBLIC_HOTMART_URL_AGENCY_ANUAL,
};
const WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "5562985974090";

export default function AssinarPage() {
  const [ciclo, setCiclo]           = useState<Ciclo>("anual");
  const [loading, setLoading]       = useState<string | null>(null);

  async function irParaCheckout(key: string) {
    setLoading(key);
    const cicloKey = ciclo === "anual" ? "ANUAL" : "MENSAL";
    const hotmartUrl = HOTMART[`${key}_${cicloKey}`];
    if (hotmartUrl) {
      window.open(hotmartUrl, "_blank");
    } else {
      const msg = encodeURIComponent(`Quero assinar o plano ${key} ${ciclo} do FácilCRM`);
      window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, "_blank");
    }
    setLoading(null);
  }

  return (
    <div className="ass-wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ass-grid" />
      <div className="ass-orb ass-o1" />
      <div className="ass-orb ass-o2" />

      <div className="ass-z" style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
        <a href="/" className="ass-logo">FácilCRM</a>

        <div className="ass-badge">
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Período de teste encerrado
        </div>

        <h1 className="ass-h1">Escolha seu plano para<br /><span>continuar crescendo</span></h1>
        <p className="ass-sub">Sem cartão de crédito nas primeiras cobranças. Cancele quando quiser, direto pelo sistema.</p>

        {/* Toggle */}
        <div className="ass-toggle">
          <button className={`ass-toggle-btn ${ciclo==="mensal"?"active":"inactive"}`} onClick={()=>setCiclo("mensal")}>Mensal</button>
          <button className={`ass-toggle-btn ${ciclo==="anual"?"active":"inactive"}`} onClick={()=>setCiclo("anual")}>
            Anual
            <span className="ass-eco">2 meses grátis</span>
          </button>
        </div>

        {/* Cards */}
        <div className="ass-grid-cards">
          {PLANOS.map(p => {
            const preco = ciclo==="anual" ? p.anualMes : p.mensal;
            const isLoad = loading === p.key;
            return (
              <div key={p.key} className={`ass-card ${p.popular?"popular":""}`}>
                {p.popular && <div className="ass-badge-top">MAIS POPULAR</div>}
                <div className="ass-plano">{p.nome}</div>
                <div className="ass-desc">{p.desc}</div>
                <div className="ass-price-row">
                  <span className="ass-cur">R$</span>
                  <span className="ass-amt">{preco.toLocaleString("pt-BR")}</span>
                  <span className="ass-per">/mês</span>
                </div>
                {ciclo==="anual" && (
                  <div className="ass-anual-note">Cobrado R$ {p.anual.toLocaleString("pt-BR")}/ano · 2 meses grátis</div>
                )}
                <ul className="ass-features">
                  {p.features.map((f,i) => {
                    if (typeof f === "string") return <li key={i}>{f}</li>;
                    return <li key={i} className="star">{f.t}</li>;
                  })}
                </ul>
                <button className={`ass-cta ${p.popular?"primary":"secondary"}`}
                  onClick={()=>irParaCheckout(p.key)} disabled={isLoad}>
                  {isLoad
                    ? <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><span className="ass-spin"/>Redirecionando...</span>
                    : "Assinar agora →"
                  }
                </button>
              </div>
            );
          })}
        </div>

        <div className="ass-guarantee">
          <svg width="36" height="36" fill="none" stroke="#10b981" strokeWidth="1.5" viewBox="0 0 24 24" style={{flexShrink:0}}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
          </svg>
          <p style={{fontSize:".85rem",color:"rgba(240,240,255,.6)",lineHeight:1.6}}>
            <strong style={{color:"#10b981"}}>Sem risco.</strong> Se em 30 dias você não identificar pelo menos uma venda gerada pelo FácilCRM, basta cancelar. Sem perguntas, sem burocracia.
          </p>
        </div>

        <div className="ass-footer" style={{marginTop:24}}>
          Dúvidas?{" "}
          <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Quero saber mais sobre os planos do FácilCRM")}`}
            target="_blank" rel="noopener noreferrer">
            Fale conosco no WhatsApp
          </a>
          {" "}·{" "}
          <Link href="/login">Já tenho conta</Link>
        </div>
      </div>

      <SupportButton />
    </div>
  );
}
