"use client";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { useState } from "react";

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
.pg-root{font-family:'DM Sans',sans-serif;background:#04040c;color:#f0f0ff;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 24px;position:relative;overflow:hidden}
.pg-root::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(99,102,241,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.04) 1px,transparent 1px);background-size:56px 56px;pointer-events:none;z-index:0}
.pg-orb1{position:fixed;width:600px;height:600px;background:radial-gradient(circle,rgba(99,102,241,.25),transparent);top:-200px;left:-200px;border-radius:50%;filter:blur(90px);opacity:.4;pointer-events:none}
.pg-orb2{position:fixed;width:500px;height:500px;background:radial-gradient(circle,rgba(34,211,238,.15),transparent);bottom:0;right:-100px;border-radius:50%;filter:blur(90px);opacity:.4;pointer-events:none}
.pg-inner{position:relative;z-index:2;width:100%;max-width:980px;display:flex;flex-direction:column;align-items:center}
.pg-tag{display:inline-flex;align-items:center;gap:8px;font-size:.72rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#818cf8;padding:5px 14px;border:1px solid rgba(99,102,241,.28);border-radius:100px;background:rgba(99,102,241,.07);margin-bottom:16px}
.pg-tag::before{content:'';display:block;width:6px;height:6px;background:#818cf8;border-radius:50%;animation:blink 2s ease-in-out infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
.pg-h1{font-family:'Syne',sans-serif;font-size:clamp(1.9rem,4vw,2.8rem);font-weight:800;text-align:center;margin-bottom:10px;line-height:1.1}
.pg-sub{color:rgba(240,240,255,.55);text-align:center;max-width:460px;margin-bottom:32px;font-size:.95rem;line-height:1.65}
.toggle-wrap{display:flex;align-items:center;gap:0;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:100px;padding:4px;margin-bottom:36px;position:relative}
.toggle-opt{padding:8px 22px;border-radius:100px;font-size:.88rem;font-weight:600;cursor:pointer;transition:all .25s;border:none;background:transparent;color:rgba(240,240,255,.5);position:relative;z-index:1}
.toggle-opt.active{background:linear-gradient(135deg,#6366f1,#7c3aed);color:#fff;box-shadow:0 4px 20px rgba(99,102,241,.4)}
.toggle-badge{background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:100px;margin-left:6px;letter-spacing:.04em}
.pg-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;width:100%;margin-bottom:18px}
@media(max-width:720px){.pg-grid{grid-template-columns:1fr}}
.pcard{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08);border-radius:22px;padding:30px 26px;position:relative;transition:border-color .3s}
.pcard.feat{background:rgba(99,102,241,.08);border-color:rgba(99,102,241,.36);box-shadow:0 0 70px rgba(99,102,241,.15)}
.pcard.feat::before{content:'MAIS POPULAR';position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#6366f1,#7c3aed);color:#fff;font-size:.63rem;font-weight:700;letter-spacing:.12em;padding:4px 14px;border-radius:100px;white-space:nowrap}
.pname{font-family:'Syne',sans-serif;font-size:1.6rem;font-weight:800;margin-bottom:4px;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.08)}
.pcard.feat .pname{background:linear-gradient(135deg,#818cf8,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.pdesc{font-size:.8rem;color:rgba(240,240,255,.45);margin-bottom:12px;margin-top:10px}
.pprice-wrap{margin-bottom:2px}
.pold{font-size:.85rem;color:rgba(240,240,255,.3);text-decoration:line-through;margin-bottom:2px;min-height:20px}
.pprice{display:flex;align-items:flex-end;gap:2px}
.pcur{font-size:.9rem;color:#818cf8;vertical-align:top;margin-top:8px;display:inline-block}
.pamt{font-family:'Syne',sans-serif;font-size:2.7rem;font-weight:800;color:#f0f0ff;line-height:1}
.pper{font-size:.8rem;color:rgba(240,240,255,.35);margin-bottom:4px}
.panual{font-size:.72rem;color:rgba(240,240,255,.3);margin-bottom:4px;min-height:16px}
.psave{display:inline-block;font-size:.7rem;font-weight:700;color:#10b981;background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.25);padding:2px 10px;border-radius:100px;margin-bottom:16px;min-height:22px}
.pfl{list-style:none;padding:0;margin:0 0 24px;display:flex;flex-direction:column;gap:7px}
.pfl li{display:flex;align-items:flex-start;gap:8px;font-size:.84rem;color:rgba(240,240,255,.8);line-height:1.45}
.pfl li::before{content:'✓';color:#10b981;font-weight:700;flex-shrink:0;margin-top:1px}
.pfl li.star::before{content:'★';color:#f59e0b}
.pfl li.note{color:rgba(240,240,255,.4);font-size:.75rem;padding-left:16px}
.pfl li.note::before{display:none}
.pcta{display:block;text-align:center;padding:13px;border-radius:12px;font-family:'DM Sans',sans-serif;font-weight:700;font-size:.95rem;text-decoration:none;transition:all .3s}
.pcta.sec{background:rgba(255,255,255,.06);color:#f0f0ff;border:1px solid rgba(255,255,255,.12)}
.pcta.sec:hover{background:rgba(255,255,255,.1)}
.pcta.pri{background:linear-gradient(135deg,#6366f1,#7c3aed);color:#fff}
.pcta.pri:hover{box-shadow:0 8px 40px rgba(99,102,241,.5);transform:translateY(-1px)}
.pg-note{font-size:.8rem;color:rgba(240,240,255,.3);margin-bottom:32px;text-align:center}
.pg-note strong{color:#818cf8}
.pg-footer{display:flex;flex-direction:column;align-items:center;gap:8px}
.pg-footer a{color:rgba(240,240,255,.35);font-size:.78rem;text-decoration:underline}
.pg-footer p{color:rgba(240,240,255,.3);font-size:.78rem}
`;

const PLANOS = [
  {
    key: "STARTER", nome: "Starter",
    desc: "Para empresas que estão começando",
    mensal: 497, anual: 414, totalAnual: 4970, economia: 994,
    features: ["1 WhatsApp conectado","IA respondendo 24/7","Kanban de leads","Follow-up automático","Até 500 clientes/leads","Aniversário automático"],
    urlMensal: "https://pay.hotmart.com/X105970507I?off=gl10cife",
    urlAnual:  "https://pay.hotmart.com/X105970507I?off=4vylb80p",
  },
  {
    key: "PRO", nome: "Pro",
    desc: "Para empresas em crescimento",
    mensal: 897, anual: 748, totalAnual: 8970, economia: 1794,
    features: ["Até 2 WhatsApp conectados","IA respondendo 24/7","Kanban de leads","Follow-up automático","Até 1.000 leads","Campanhas em massa","Analytics completo","Aniversário automático"],
    urlMensal: "https://pay.hotmart.com/D105975567P?off=aeumfwka",
    urlAnual:  "https://pay.hotmart.com/D105975567P?off=7vl7g284",
    destaque: true,
  },
  {
    key: "AGENCY", nome: "Agency",
    desc: "Para agências e múltiplas empresas",
    mensal: 1497, anual: 1248, totalAnual: 14970, economia: 2994,
    features: ["Fazemos a implantação por você","3 WhatsApp conectados","Tudo do Pro incluso","Até 5.000 leads (acima: a combinar)","Suporte prioritário","Gerente de conta dedicado"],
    urlMensal: "https://pay.hotmart.com/M105975917J",
    urlAnual:  "https://pay.hotmart.com/M105975917J?off=i6ul1rjy",
    star: 0,
  },
];

export default function PlanosPage() {
  const [anual, setAnual] = useState(false);

  return (
    <>
      <title>Escolha seu Plano — CRM Fácil</title>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pg-root">
        <div className="pg-orb1" />
        <div className="pg-orb2" />
        <div className="pg-inner">
          <div className="pg-tag">Seu período de teste encerrou</div>
          <h1 className="pg-h1">Escolha seu plano e continue vendendo</h1>
          <p className="pg-sub">Sem fidelidade. Cancele quando quiser. Assine e volte a usar agora mesmo.</p>

          {/* Toggle mensal / anual */}
          <div className="toggle-wrap">
            <button className={`toggle-opt${!anual ? " active" : ""}`} onClick={() => setAnual(false)}>Mensal</button>
            <button className={`toggle-opt${anual ? " active" : ""}`} onClick={() => setAnual(true)}>
              Anual <span className="toggle-badge">2 meses grátis</span>
            </button>
          </div>

          <div className="pg-grid">
            {PLANOS.map((p) => {
              const preco = anual ? p.anual : p.mensal;
              const url   = anual ? p.urlAnual : p.urlMensal;
              return (
                <div key={p.key} className={`pcard${p.destaque ? " feat" : ""}`}>
                  <div className="pname">{p.nome}</div>
                  <div className="pdesc">{p.desc}</div>

                  <div className="pprice-wrap">
                    {/* Preço riscado no anual */}
                    <div className="pold">{anual ? `R$${p.mensal.toLocaleString("pt-BR")}/mês` : ""}</div>
                    <div className="pprice">
                      <span className="pcur">R$</span>
                      <span className="pamt">{preco.toLocaleString("pt-BR")}</span>
                      <span className="pper">/mês</span>
                    </div>
                    <div className="panual">
                      {anual ? `Cobrado R$${p.totalAnual.toLocaleString("pt-BR")}/ano` : "Cobrado mensalmente"}
                    </div>
                    <div className="psave">
                      {anual
                        ? `✦ Você economiza R$${p.economia.toLocaleString("pt-BR")}/ano`
                        : ""}
                    </div>
                  </div>

                  <ul className="pfl">
                    {p.features.map((f, i) => (
                      <li key={i} className={i === 0 && p.star === 0 && p.key === "AGENCY" ? "star" : ""}>{f}</li>
                    ))}
                  </ul>

                  <a href={url} target="_blank" rel="noopener noreferrer"
                    className={`pcta ${p.destaque ? "pri" : "sec"}`}>
                    Assinar {p.nome} {anual ? "Anual" : "Mensal"}
                  </a>
                </div>
              );
            })}
          </div>

          <p className="pg-note">
            Plano anual = <strong>2 meses grátis</strong> — economize até 17% em relação ao mensal
          </p>

          <div className="pg-footer">
            <p>Dúvidas? Fale com a gente pelo WhatsApp</p>
            <Link href="/login">Voltar para o login</Link>
          </div>
        </div>
      </div>
    </>
  );
}
