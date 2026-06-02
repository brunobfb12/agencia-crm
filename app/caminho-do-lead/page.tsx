"use client";
import { useEffect } from "react";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
:root{
  --bg:#04040c;--indigo:#6366f1;--indigo-l:#818cf8;--violet:#7c3aed;
  --cyan:#22d3ee;--emerald:#10b981;--amber:#f59e0b;--rose:#f43f5e;
  --txt:#f0f0ff;--txt2:rgba(240,240,255,.6);--txt3:rgba(240,240,255,.35);
  --gb:rgba(255,255,255,.035);--gbh:rgba(255,255,255,.065);
  --gbd:rgba(255,255,255,.08);--gbdh:rgba(99,102,241,.4);
  --r:16px;--rl:24px;--tr:all .3s cubic-bezier(.4,0,.2,1)
}
body{font-family:'DM Sans',sans-serif;background:#04040c;color:#f0f0ff;overflow-x:hidden;line-height:1.6;min-height:100vh}
body::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(99,102,241,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.04) 1px,transparent 1px);background-size:56px 56px;pointer-events:none;z-index:0}
#cg{position:fixed;width:480px;height:480px;background:radial-gradient(circle,rgba(99,102,241,.14) 0%,rgba(124,58,237,.07) 40%,transparent 70%);border-radius:50%;pointer-events:none;transform:translate(-50%,-50%);z-index:1;transition:left .06s linear,top .06s linear;mix-blend-mode:screen}
.orbs{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}
.orb{position:absolute;border-radius:50%;filter:blur(90px);opacity:.35}
.o1{width:700px;height:700px;background:radial-gradient(circle,rgba(99,102,241,.35),transparent);top:-280px;left:-250px}
.o2{width:550px;height:550px;background:radial-gradient(circle,rgba(34,211,238,.2),transparent);bottom:10%;right:-150px}
.o3{width:400px;height:400px;background:radial-gradient(circle,rgba(124,58,237,.22),transparent);top:55%;left:35%}
.container{max-width:960px;margin:0 auto;padding:0 24px;position:relative;z-index:2}
section{position:relative;z-index:2}
h1,h2,h3,h4{font-family:'Syne',sans-serif;line-height:1.1}
h1{font-size:clamp(2.4rem,5vw,4.2rem);font-weight:800}
h2{font-size:clamp(1.6rem,3vw,2.4rem);font-weight:700}
.grad{background:linear-gradient(135deg,var(--indigo-l) 0%,var(--cyan) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.grad-warm{background:linear-gradient(135deg,var(--amber) 0%,var(--rose) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.lbl{display:inline-flex;align-items:center;gap:8px;font-size:.72rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--indigo-l);padding:5px 14px;border:1px solid rgba(99,102,241,.28);border-radius:100px;background:rgba(99,102,241,.07);margin-bottom:18px}
.lbl-pulse::before{content:'';display:block;width:7px;height:7px;background:var(--cyan);border-radius:50%;animation:blink 2.2s ease-in-out infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.25}}
.btn{display:inline-flex;align-items:center;gap:8px;padding:14px 28px;border-radius:12px;font-family:'DM Sans',sans-serif;font-weight:600;font-size:1rem;cursor:pointer;border:none;transition:var(--tr);text-decoration:none}
.bp{background:linear-gradient(135deg,var(--indigo),var(--violet));color:#fff}
.bp:hover{transform:translateY(-2px);box-shadow:0 8px 44px rgba(99,102,241,.5),0 0 0 1px rgba(99,102,241,.3)}
.bs{background:rgba(255,255,255,.04);color:var(--txt);border:1px solid var(--gbd);backdrop-filter:blur(10px)}
.bs:hover{background:rgba(255,255,255,.09);border-color:rgba(255,255,255,.18)}

/* Nav */
nav{position:fixed;top:0;left:0;right:0;z-index:1000;padding:14px 0;backdrop-filter:blur(22px);background:rgba(4,4,12,.82);border-bottom:1px solid var(--gbd)}
.nav-i{display:flex;align-items:center;justify-content:space-between}
.logo{font-family:'Syne',sans-serif;font-size:1.35rem;font-weight:800;background:linear-gradient(135deg,var(--indigo-l),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-decoration:none}

/* Hero */
#hero{min-height:100vh;display:flex;align-items:center;padding:120px 0 80px;text-align:center}
.hero-inner{max-width:760px;margin:0 auto}
.guilt-stat{display:inline-block;font-size:clamp(1rem,.5rem + 2vw,1.1rem);color:var(--txt3);margin-bottom:40px;font-style:italic}
.guilt-stat strong{color:var(--rose);font-style:normal}
.hero-sub{font-size:1.15rem;color:var(--txt2);line-height:1.75;margin:24px auto 40px;max-width:580px}
.hero-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:56px}
@media(max-width:640px){.hero-stats{grid-template-columns:repeat(2,1fr)}}
.hstat{background:var(--gb);border:1px solid var(--gbd);border-radius:16px;padding:20px 12px;text-align:center}
.hstat-n{font-family:'Syne',sans-serif;font-size:2rem;font-weight:800;background:linear-gradient(135deg,var(--indigo-l),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hstat-l{font-size:.72rem;color:var(--txt3);margin-top:4px;text-transform:uppercase;letter-spacing:.08em}

/* Timeline */
#timeline{padding:80px 0 120px}
.tl-intro{text-align:center;margin-bottom:72px}
.tl-intro p{color:var(--txt2);font-size:1.05rem;margin-top:16px;max-width:560px;margin-left:auto;margin-right:auto}
.tl-wrap{position:relative;padding-left:64px}
.tl-line{position:absolute;left:20px;top:0;bottom:0;width:2px;background:linear-gradient(to bottom,rgba(34,211,238,.6) 0%,rgba(99,102,241,.8) 40%,rgba(124,58,237,.8) 70%,rgba(244,63,94,.4) 100%);border-radius:2px}
.tl-line::after{content:'';position:absolute;top:0;left:-1px;right:-1px;height:60px;background:linear-gradient(to bottom,#04040c,transparent)}

/* Phase markers */
.tl-phase{display:flex;align-items:center;gap:12px;margin-bottom:32px;margin-top:56px;position:relative}
.tl-phase:first-child{margin-top:0}
.tl-phase-icon{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;margin-left:-52px;position:relative;z-index:2;border:2px solid}
.tl-phase-label{font-family:'Syne',sans-serif;font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.14em}
.tl-phase-sub{font-size:.72rem;color:var(--txt3);margin-left:6px}

.ph-speed .tl-phase-icon{background:rgba(34,211,238,.1);border-color:rgba(34,211,238,.3);color:var(--cyan);box-shadow:0 0 20px rgba(34,211,238,.2)}
.ph-speed .tl-phase-label{color:var(--cyan)}
.ph-heat .tl-phase-icon{background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.3);color:var(--amber);box-shadow:0 0 20px rgba(245,158,11,.2)}
.ph-heat .tl-phase-label{color:var(--amber)}
.ph-sale .tl-phase-icon{background:rgba(16,185,129,.1);border-color:rgba(16,185,129,.3);color:var(--emerald);box-shadow:0 0 20px rgba(16,185,129,.2)}
.ph-sale .tl-phase-label{color:var(--emerald)}
.ph-rel .tl-phase-icon{background:rgba(99,102,241,.1);border-color:rgba(99,102,241,.3);color:var(--indigo-l);box-shadow:0 0 20px rgba(99,102,241,.2)}
.ph-rel .tl-phase-label{color:var(--indigo-l)}
.ph-loyal .tl-phase-icon{background:rgba(124,58,237,.1);border-color:rgba(124,58,237,.3);color:#c084fc;box-shadow:0 0 20px rgba(124,58,237,.2)}
.ph-loyal .tl-phase-label{color:#c084fc}

/* Timeline events */
.tl-item{display:flex;gap:0;align-items:flex-start;margin-bottom:20px;opacity:0;transform:translateX(24px);transition:opacity .55s ease,transform .55s ease}
.tl-item.visible{opacity:1;transform:translateX(0)}
.tl-dot-wrap{position:absolute;left:12px;width:16px;height:16px;margin-top:18px;z-index:2}
.tl-dot{width:16px;height:16px;border-radius:50%;border:2px solid;background:#04040c;transition:var(--tr);position:relative}
.tl-dot::after{content:'';position:absolute;inset:-4px;border-radius:50%;opacity:0;transition:opacity .3s}
.tl-item.visible .tl-dot::after{opacity:1}
.dot-speed .tl-dot{border-color:var(--cyan)}
.dot-speed .tl-dot::after{background:radial-gradient(circle,rgba(34,211,238,.25),transparent)}
.dot-heat .tl-dot{border-color:var(--amber)}
.dot-heat .tl-dot::after{background:radial-gradient(circle,rgba(245,158,11,.25),transparent)}
.dot-sale .tl-dot{border-color:var(--emerald)}
.dot-sale .tl-dot::after{background:radial-gradient(circle,rgba(16,185,129,.25),transparent)}
.dot-rel .tl-dot{border-color:var(--indigo-l)}
.dot-rel .tl-dot::after{background:radial-gradient(circle,rgba(99,102,241,.25),transparent)}
.dot-loyal .tl-dot{border-color:#c084fc}
.dot-loyal .tl-dot::after{background:radial-gradient(circle,rgba(124,58,237,.25),transparent)}

.tl-card{flex:1;background:var(--gb);border:1px solid var(--gbd);border-radius:16px;padding:18px 20px;margin-left:0;border-left:3px solid}
.tl-card:hover{background:var(--gbh);transform:translateX(4px)}
.border-speed{border-left-color:var(--cyan)}
.border-heat{border-left-color:var(--amber)}
.border-sale{border-left-color:var(--emerald)}
.border-rel{border-left-color:var(--indigo-l)}
.border-loyal{border-left-color:#c084fc}
.tl-time{font-size:.68rem;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:var(--txt3);margin-bottom:6px}
.tl-who{display:inline-flex;align-items:center;gap:5px;font-size:.7rem;font-weight:600;padding:2px 8px;border-radius:100px;margin-bottom:8px}
.who-ia{background:rgba(99,102,241,.15);color:var(--indigo-l);border:1px solid rgba(99,102,241,.25)}
.who-v{background:rgba(16,185,129,.12);color:var(--emerald);border:1px solid rgba(16,185,129,.2)}
.who-lead{background:rgba(255,255,255,.06);color:var(--txt2);border:1px solid var(--gbd)}
.tl-title{font-family:'Syne',sans-serif;font-size:.95rem;font-weight:700;color:var(--txt);margin-bottom:4px}
.tl-desc{font-size:.83rem;color:var(--txt2);line-height:1.55}
.tl-ghost{display:flex;align-items:center;gap:6px;margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.06);font-size:.75rem;color:rgba(240,240,255,.3);font-style:italic}
.tl-ghost::before{content:'😶';font-style:normal;flex-shrink:0}

/* CTA */
#cta{padding:100px 0;text-align:center}
.cta-box{background:linear-gradient(135deg,rgba(99,102,241,.08) 0%,rgba(124,58,237,.06) 100%);border:1px solid rgba(99,102,241,.2);border-radius:28px;padding:64px 40px;position:relative;overflow:hidden}
.cta-box::before{content:'';position:absolute;top:-100px;left:50%;transform:translateX(-50%);width:500px;height:300px;background:radial-gradient(ellipse,rgba(99,102,241,.15),transparent);pointer-events:none}
.cta-box h2{margin-bottom:16px}
.cta-box p{color:var(--txt2);font-size:1.05rem;margin-bottom:36px}
.cta-trust{font-size:.78rem;color:var(--txt3);margin-top:16px}
.cta-trust span{margin:0 6px}

/* Footer */
footer{padding:40px 0;border-top:1px solid var(--gbd);text-align:center}
footer p{font-size:.8rem;color:var(--txt3)}
footer a{color:var(--indigo-l);text-decoration:none}

@media(max-width:768px){
  .tl-wrap{padding-left:48px}
  .tl-line{left:14px}
  .tl-dot-wrap{left:6px}
  .tl-phase-icon{margin-left:-40px;width:32px;height:32px;font-size:.9rem}
}
`;

const EVENTS = [
  {
    phase:"speed", phaseLabel:"⚡ Velocidade", phaseSub:"Primeiros minutos",
    time:"D+0 · 10:42:00", who:"lead", whoLabel:"Lead",
    title:"Primeira mensagem chega",
    desc:'Lead envia: "Oi, boa tarde! Vi o anúncio de vocês. Quero um orçamento."',
    ghost:null,
  },
  {
    phase:"speed", time:"D+0 · 10:42:03", who:"ia", whoLabel:"IA",
    title:"Resposta em 3 segundos",
    desc:"IA se apresenta, pergunta o que o lead precisa e já inicia o atendimento. Nenhum lead espera.",
    ghost:"Sem o FácilCRM: lead esperando. Talvez já abra o WhatsApp do concorrente.",
  },
  {
    phase:"speed", time:"D+0 · 10:44:00", who:"lead", whoLabel:"Lead",
    title:"Envia foto da lista manuscrita",
    desc:"Lead fotografa a lista escrita à mão com letra difícil de ler e manda no WhatsApp.",
    ghost:null,
  },
  {
    phase:"speed", time:"D+0 · 10:44:08", who:"ia", whoLabel:"IA",
    title:"OCR lê a lista em 8 segundos",
    desc:'IA identifica todos os itens, apresenta a lista numerada e pergunta: "Li assim — tá correto?"',
    ghost:"Sem o FácilCRM: você tentaria ler a foto, talvez errasse algum item, ou pediria para reenviar.",
  },
  {
    phase:"speed", time:"D+0 · 10:47:00", who:"ia", whoLabel:"IA",
    title:"Coleta entrega, endereço e pagamento",
    desc:"Uma pergunta por vez. IA conduz o fluxo completo até ter tudo necessário para o orçamento.",
    ghost:"Sem o FácilCRM: série de mensagens manuais, esquecimento de informações, idas e vindas.",
  },
  {
    phase:"speed", time:"D+0 · 10:49:00", who:"v", whoLabel:"Vendedor",
    title:"Vendedor recebe briefing completo",
    desc:"Mensagem no WhatsApp: nome, itens confirmados, endereço, forma de pagamento e link direto para chamar o cliente. Um toque para fechar.",
    ghost:"Sem o FácilCRM: você digitava isso tudo do zero, provavelmente depois de algumas horas.",
  },
];

const EVENTS2 = [
  {
    phase:"heat", phaseLabel:"🔥 Aquecimento", phaseSub:"Quando o lead some",
    time:"D+1 · 09:00", who:"ia", whoLabel:"IA",
    title:"Toque automático D+1",
    desc:'"Oi! Vi que conversamos ontem — ficou alguma dúvida ou posso te ajudar a finalizar?" — disparado sem você fazer nada.',
    ghost:"Sem o FácilCRM: você esqueceu. Lead também esqueceu.",
  },
  {
    phase:"heat", time:"D+2 · 09:00", who:"ia", whoLabel:"IA",
    title:"Segundo toque D+2",
    desc:'"Última tentativa por aqui — se precisar, é só me chamar! 🙌" — última chance, tom leve, sem pressão.',
    ghost:"Sem o FácilCRM: lead foi para o concorrente. Você nunca soube.",
  },
];

const EVENTS3 = [
  {
    phase:"sale", phaseLabel:"💰 Pós-Venda", phaseSub:"Depois que a venda fecha",
    time:"D+2 após venda", who:"ia", whoLabel:"IA",
    title:"Verificação de satisfação",
    desc:'"Tudo certo com seu pedido? Se tiver qualquer dúvida, estou aqui!" — automático, no timing certo.',
    ghost:"Sem o FácilCRM: cliente com problema? Você ficou sabendo quando ele não voltou a comprar.",
  },
  {
    phase:"sale", time:"D+7 após venda", who:"ia", whoLabel:"IA",
    title:"Check-in de experiência + indicação",
    desc:'"Como está sendo sua experiência? Conhece alguém que também pode se interessar? Me passa o contato que eu atendo com o mesmo cuidado!"',
    ghost:"Sem o FácilCRM: pedido de indicação nunca aconteceu. Clientes felizes que poderiam ter virado embaixadores.",
  },
  {
    phase:"sale", time:"D+7 (automático)", who:"ia", whoLabel:"IA",
    title:"IA contata o amigo indicado",
    desc:'Cliente indicou alguém? IA já envia mensagem para o indicado automaticamente: "João me passou seu contato e disse que você pode se interessar!"',
    ghost:"Sem o FácilCRM: lead indicado perdido. Ninguém entrou em contato.",
  },
];

const EVENTS4 = [
  {
    phase:"rel", phaseLabel:"🤝 Relacionamento", phaseSub:"Semanas depois — sem esforço",
    time:"D+20", who:"ia", whoLabel:"IA",
    title:"Toque de novidades",
    desc:'"Temos novidades que chegaram e lembrei de você! Quer dar uma olhada? 👀" — lead aquecido, na hora certa.',
    ghost:"Sem o FácilCRM: cliente comprou uma vez e sumiu. Sem motivo para voltar.",
  },
  {
    phase:"rel", time:"D+28", who:"ia", whoLabel:"IA",
    title:"Sugestão de recompra",
    desc:'"Já faz um tempinho do último pedido — está precisando repor? Me fala que te ajudo rapidinho!" — no timing certo para a recompra.',
    ghost:"Sem o FácilCRM: cliente comprou do concorrente porque chegou primeiro.",
  },
  {
    phase:"rel", time:"D+45", who:"ia", whoLabel:"IA",
    title:"Oferta exclusiva cliente fiel",
    desc:'"Preparamos uma condição especial exclusiva para clientes fiéis como você! Quer saber mais? 🎁" — fidelização real.',
    ghost:"Sem o FácilCRM: cliente não sabe que você o valoriza. Para ele, é só mais uma loja.",
  },
];

const EVENTS5 = [
  {
    phase:"loyal", phaseLabel:"♾️ Fidelização", phaseSub:"Para sempre, automático",
    time:"Aniversário · todo ano",
    who:"ia", whoLabel:"IA",
    title:"Parabéns no dia certo",
    desc:"IA lembra do aniversário e manda mensagem personalizada. Todo ano. Você não precisa fazer nada.",
    ghost:"Sem o FácilCRM: aniversário passou. Você nem sabia a data. Oportunidade de conexão real desperdiçada.",
  },
  {
    phase:"loyal", time:"D+60 (se sumiu)",
    who:"ia", whoLabel:"IA",
    title:"Conversa franca automática",
    desc:'"Já faz um tempo sem nos falar — você ainda tem interesse? Pode ser agora ou no futuro, sem compromisso." — honesto e humano.',
    ghost:"Sem o FácilCRM: lead sumiu sem explicação. Você nunca soube se era hora de desistir ou insistir.",
  },
  {
    phase:"loyal", time:"D+90",
    who:"ia", whoLabel:"IA",
    title:"Reativação leve",
    desc:'"Se precisar de nós, estamos aqui! 😊" — presença constante sem pressão. A marca que não abandona.',
    ghost:"Sem o FácilCRM: lead foi embora em silêncio. Nunca soube que você ainda estava lá.",
  },
];

type TlEvent = {
  phase: string;
  phaseLabel?: string;
  phaseSub?: string;
  time: string;
  who: string;
  whoLabel: string;
  title: string;
  desc: string;
  ghost: string | null;
};

function PhaseMarker({ label, sub, phase }: { label: string; sub: string; phase: string }) {
  return (
    <div className={`tl-phase ph-${phase}`}>
      <div className="tl-phase-icon">{label.split(" ")[0]}</div>
      <span className="tl-phase-label">{label.split(" ").slice(1).join(" ")}</span>
      <span className="tl-phase-sub">— {sub}</span>
    </div>
  );
}

function TlItem({ ev }: { ev: TlEvent }) {
  const dotClass = `dot-${ev.phase}`;
  const borderClass = `border-${ev.phase}`;
  const whoClass = ev.who === "ia" ? "who-ia" : ev.who === "v" ? "who-v" : "who-lead";
  return (
    <div className={`tl-item`}>
      <div className="tl-dot-wrap">
        <div className={`tl-dot ${dotClass}`} />
      </div>
      <div className={`tl-card ${borderClass}`}>
        <div className="tl-time">{ev.time}</div>
        <span className={`tl-who ${whoClass}`}>
          {ev.who === "ia" ? "🤖" : ev.who === "v" ? "👤" : "💬"} {ev.whoLabel}
        </span>
        <div className="tl-title">{ev.title}</div>
        <div className="tl-desc">{ev.desc}</div>
        {ev.ghost && (
          <div className="tl-ghost">{ev.ghost}</div>
        )}
      </div>
    </div>
  );
}

export default function CaminhoDoLead() {
  useEffect(() => {
    // Mouse orb
    const orb = document.getElementById("cg");
    const onMove = (e: MouseEvent) => {
      if (orb) { orb.style.left = e.clientX + "px"; orb.style.top = e.clientY + "px"; }
    };
    window.addEventListener("mousemove", onMove);

    // Scroll animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); });
    }, { threshold: 0.12 });
    document.querySelectorAll(".tl-item").forEach(el => observer.observe(el));

    return () => { window.removeEventListener("mousemove", onMove); observer.disconnect(); };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div id="cg" />
      <div className="orbs">
        <div className="orb o1" /><div className="orb o2" /><div className="orb o3" />
      </div>

      {/* Nav */}
      <nav>
        <div className="container nav-i">
          <a href="/" className="logo">FácilCRM</a>
          <a href="/registro" className="btn bp" style={{ padding: "10px 22px", fontSize: ".88rem" }}>
            Começar grátis →
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section id="hero">
        <div className="container">
          <div className="hero-inner">
            <div className="lbl lbl-pulse">A Roda do Relacionamento · 90 dias</div>
            <h1>
              Enquanto você <span className="grad-warm">esquece</span>,<br />
              a IA <span className="grad">nunca esquece</span>.
            </h1>
            <p className="guilt-stat">
              O lead médio recebe <strong>0 follow-ups</strong> após o primeiro contato.<br />
              Sem aniversário. Sem reativação. Sem indicação. Simplesmente… <strong>abandonado</strong>.
            </p>
            <p className="hero-sub">
              Veja o que acontece com cada lead nos próximos 90 dias dentro do FácilCRM —
              automático, inteligente, e com o vendedor fazendo apenas o que importa: <strong>fechar</strong>.
            </p>
            <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/registro" className="btn bp">Quero isso para meu negócio →</a>
              <a href="/" className="btn bs">← Voltar para o site</a>
            </div>

            <div className="hero-stats">
              {[
                { n: "3s", l: "Tempo de resposta da IA" },
                { n: "90", l: "Dias de jornada automática" },
                { n: "0", l: "Follow-ups manuais necessários" },
                { n: "16+", l: "Toques automáticos no período" },
              ].map(s => (
                <div key={s.l} className="hstat">
                  <div className="hstat-n">{s.n}</div>
                  <div className="hstat-l">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section id="timeline">
        <div className="container">
          <div className="tl-intro">
            <div className="lbl">Jornada completa do lead</div>
            <h2>Os 90 dias que mudam tudo</h2>
            <p>
              Cada ponto abaixo acontece automaticamente. Você só é chamado quando há
              uma venda para fechar. O resto? A IA cuida.
            </p>
          </div>

          <div className="tl-wrap">
            <div className="tl-line" />

            {/* Phase 1 */}
            <PhaseMarker label={EVENTS[0].phaseLabel!} sub={EVENTS[0].phaseSub!} phase="speed" />
            {EVENTS.map((ev, i) => <TlItem key={i} ev={ev} />)}

            {/* Phase 2 */}
            <PhaseMarker label={EVENTS2[0].phaseLabel!} sub={EVENTS2[0].phaseSub!} phase="heat" />
            {EVENTS2.map((ev, i) => <TlItem key={i} ev={ev} />)}

            {/* Phase 3 */}
            <PhaseMarker label={EVENTS3[0].phaseLabel!} sub={EVENTS3[0].phaseSub!} phase="sale" />
            {EVENTS3.map((ev, i) => <TlItem key={i} ev={ev} />)}

            {/* Phase 4 */}
            <PhaseMarker label={EVENTS4[0].phaseLabel!} sub={EVENTS4[0].phaseSub!} phase="rel" />
            {EVENTS4.map((ev, i) => <TlItem key={i} ev={ev} />)}

            {/* Phase 5 */}
            <PhaseMarker label={EVENTS5[0].phaseLabel!} sub={EVENTS5[0].phaseSub!} phase="loyal" />
            {EVENTS5.map((ev, i) => <TlItem key={i} ev={ev} />)}

          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta">
        <div className="container">
          <div className="cta-box">
            <div className="lbl">Pronto para começar?</div>
            <h2>
              Seus leads merecem isso.<br />
              <span className="grad">Você também.</span>
            </h2>
            <p>
              Configure em 5 minutos. Conecte o WhatsApp. A IA começa a trabalhar imediatamente.<br />
              Sem lead abandonado. Sem follow-up esquecido. Sem aniversário perdido.
            </p>
            <a href="/registro" className="btn bp" style={{ fontSize: "1.05rem", padding: "16px 36px" }}>
              Começar 30 dias grátis →
            </a>
            <div className="cta-trust">
              <span>✓ Sem cartão de crédito</span>
              <span>·</span>
              <span>✓ Configure em 5 minutos</span>
              <span>·</span>
              <span>✓ Cancele quando quiser</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container">
          <p>
            © 2026 <a href="/">FácilCRM</a> · A IA que nunca abandona seus leads.
          </p>
        </div>
      </footer>
    </>
  );
}
