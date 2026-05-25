"use client";
import Link from "next/link";

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&display=swap');
.pg-root{font-family:'DM Sans',sans-serif;background:#04040c;color:#f0f0ff;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 24px;position:relative;overflow:hidden}
.pg-root::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(99,102,241,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.04) 1px,transparent 1px);background-size:56px 56px;pointer-events:none;z-index:0}
.pg-orb1{position:fixed;width:600px;height:600px;background:radial-gradient(circle,rgba(99,102,241,.25),transparent);top:-200px;left:-200px;border-radius:50%;filter:blur(90px);opacity:.4;pointer-events:none}
.pg-orb2{position:fixed;width:500px;height:500px;background:radial-gradient(circle,rgba(34,211,238,.15),transparent);bottom:0;right:-100px;border-radius:50%;filter:blur(90px);opacity:.4;pointer-events:none}
.pg-inner{position:relative;z-index:2;width:100%;max-width:980px;display:flex;flex-direction:column;align-items:center}
.pg-tag{display:inline-flex;align-items:center;gap:8px;font-size:.72rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#818cf8;padding:5px 14px;border:1px solid rgba(99,102,241,.28);border-radius:100px;background:rgba(99,102,241,.07);margin-bottom:16px}
.pg-tag::before{content:'';display:block;width:6px;height:6px;background:#818cf8;border-radius:50%;animation:blink 2s ease-in-out infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
.pg-h1{font-family:'Syne',sans-serif;font-size:clamp(1.9rem,4vw,2.8rem);font-weight:800;text-align:center;margin-bottom:10px;line-height:1.1}
.pg-sub{color:rgba(240,240,255,.55);text-align:center;max-width:460px;margin-bottom:44px;font-size:.95rem;line-height:1.65}
.pg-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;width:100%;margin-bottom:18px}
@media(max-width:720px){.pg-grid{grid-template-columns:1fr}}
.pcard{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08);border-radius:22px;padding:30px 26px;position:relative;transition:border-color .3s}
.pcard.feat{background:rgba(99,102,241,.08);border-color:rgba(99,102,241,.36);box-shadow:0 0 70px rgba(99,102,241,.15)}
.pcard.feat::before{content:'MAIS POPULAR';position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#6366f1,#7c3aed);color:#fff;font-size:.63rem;font-weight:700;letter-spacing:.12em;padding:4px 14px;border-radius:100px;white-space:nowrap}
.pname{font-family:'Syne',sans-serif;font-size:1.6rem;font-weight:800;margin-bottom:4px;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.08)}
.pcard.feat .pname{background:linear-gradient(135deg,#818cf8,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.pdesc{font-size:.8rem;color:rgba(240,240,255,.45);margin-bottom:12px;margin-top:10px}
.pprice{margin-bottom:2px}
.pcur{font-size:.9rem;color:#818cf8;vertical-align:top;margin-top:8px;display:inline-block}
.pamt{font-family:'Syne',sans-serif;font-size:2.7rem;font-weight:800;color:#f0f0ff}
.pper{font-size:.8rem;color:rgba(240,240,255,.35)}
.panual{font-size:.72rem;color:rgba(240,240,255,.3);margin-bottom:18px}
.pfl{list-style:none;padding:0;margin:0 0 24px;display:flex;flex-direction:column;gap:7px}
.pfl li{display:flex;align-items:flex-start;gap:8px;font-size:.84rem;color:rgba(240,240,255,.8);line-height:1.45}
.pfl li::before{content:'✓';color:#10b981;font-weight:700;flex-shrink:0;margin-top:1px}
.pfl li.star::before{content:'★';color:#f59e0b}
.pfl li.note{color:rgba(240,240,255,.4);font-size:.75rem}
.pfl li.note::before{content:'';display:none}
.pfl li.note{padding-left:16px}
.pcta{display:block;text-align:center;padding:13px;border-radius:12px;font-family:'DM Sans',sans-serif;font-weight:700;font-size:.95rem;text-decoration:none;transition:all .3s;cursor:pointer;border:none}
.pcta.sec{background:rgba(255,255,255,.06);color:#f0f0ff;border:1px solid rgba(255,255,255,.12)}
.pcta.sec:hover{background:rgba(255,255,255,.1)}
.pcta.pri{background:linear-gradient(135deg,#6366f1,#7c3aed);color:#fff}
.pcta.pri:hover{box-shadow:0 8px 40px rgba(99,102,241,.5);transform:translateY(-1px)}
.pg-note{font-size:.8rem;color:rgba(240,240,255,.3);margin-bottom:32px;text-align:center}
.pg-note strong{color:#818cf8}
.pg-footer{display:flex;flex-direction:column;align-items:center;gap:8px;margin-top:8px}
.pg-footer a{color:rgba(240,240,255,.35);font-size:.78rem;text-decoration:underline}
.pg-footer p{color:rgba(240,240,255,.3);font-size:.78rem}
`;

export default function PlanosPage() {
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
          <p className="pg-sub">
            Sem fidelidade. Cancele quando quiser. Assine e volte a usar agora mesmo.
          </p>

          <div className="pg-grid">
            {/* Starter */}
            <div className="pcard">
              <div className="pname">Starter</div>
              <div className="pdesc">Para empresas que estão começando</div>
              <div className="pprice">
                <span className="pcur">R$</span>
                <span className="pamt">497</span>
                <span className="pper">/mês</span>
              </div>
              <div className="panual">Cobrado R$ 4.970/ano · 2 meses grátis</div>
              <ul className="pfl">
                <li>1 WhatsApp conectado</li>
                <li>IA respondendo 24/7</li>
                <li>Kanban de leads</li>
                <li>Follow-up automático</li>
                <li>Até 500 clientes/leads</li>
                <li>Aniversário automático</li>
              </ul>
              <a href="#" className="pcta sec">Assinar Starter</a>
            </div>

            {/* Pro */}
            <div className="pcard feat">
              <div className="pname">Pro</div>
              <div className="pdesc">Para empresas em crescimento</div>
              <div className="pprice">
                <span className="pcur">R$</span>
                <span className="pamt">897</span>
                <span className="pper">/mês</span>
              </div>
              <div className="panual">Cobrado R$ 8.970/ano · 2 meses grátis</div>
              <ul className="pfl">
                <li>Até 2 WhatsApp conectados</li>
                <li>IA respondendo 24/7</li>
                <li>Kanban de leads</li>
                <li>Follow-up automático</li>
                <li>Clientes ilimitados</li>
                <li>Campanhas em massa</li>
                <li>Analytics completo</li>
                <li>Aniversário automático</li>
              </ul>
              <a href="#" className="pcta pri">Assinar Pro</a>
            </div>

            {/* Agency */}
            <div className="pcard">
              <div className="pname">Agency</div>
              <div className="pdesc">Para agências e múltiplas empresas</div>
              <div className="pprice">
                <span className="pcur">R$</span>
                <span className="pamt">1.497</span>
                <span className="pper">/mês</span>
              </div>
              <div className="panual">Cobrado R$ 14.970/ano · 2 meses grátis</div>
              <ul className="pfl">
                <li className="star">Fazemos a implantação por você</li>
                <li>3 WhatsApp conectados</li>
                <li>Tudo do Pro incluso</li>
                <li>Suporte prioritário</li>
                <li>Gerente de conta dedicado</li>
                <li className="note">Seu ponto de contato direto para dúvidas, ajustes e estratégia</li>
                <li className="note">Instâncias adicionais: valor a combinar com seu gerente</li>
              </ul>
              <a href="#" className="pcta sec">Assinar Agency</a>
            </div>
          </div>

          <p className="pg-note">
            Planos anuais com <strong>2 meses grátis</strong> — economize até 34% em relação ao mensal
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
