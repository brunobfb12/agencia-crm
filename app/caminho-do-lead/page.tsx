"use client";
import { useEffect, useRef } from "react";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'DM Sans',sans-serif;background:#06060e;color:#f0f0ff;overflow-x:hidden;line-height:1.6}
body::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(99,102,241,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.03) 1px,transparent 1px);background-size:56px 56px;pointer-events:none;z-index:0}
h1,h2,h3{font-family:'Syne',sans-serif;line-height:1.1}
.grad{background:linear-gradient(135deg,#818cf8,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.grad-red{background:linear-gradient(135deg,#f87171,#fb923c);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}

/* Nav */
nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:14px 24px;backdrop-filter:blur(20px);background:rgba(6,6,14,.85);border-bottom:1px solid rgba(255,255,255,.07);display:flex;align-items:center;justify-content:space-between}
.logo{font-family:'Syne',sans-serif;font-size:1.2rem;font-weight:800;background:linear-gradient(135deg,#818cf8,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-decoration:none}
.nav-cta{display:inline-flex;align-items:center;gap:6px;padding:9px 20px;border-radius:10px;font-weight:600;font-size:.85rem;background:linear-gradient(135deg,#6366f1,#7c3aed);color:#fff;text-decoration:none;transition:all .2s}
.nav-cta:hover{transform:translateY(-1px);box-shadow:0 6px 24px rgba(99,102,241,.4)}

/* Hero */
#hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:120px 24px 60px;text-align:center;position:relative;z-index:1}
#hero h1{font-size:clamp(2.2rem,5vw,4rem);font-weight:800;margin-bottom:20px;max-width:700px}
#hero p{font-size:1.1rem;color:rgba(240,240,255,.6);max-width:520px;margin:0 auto 16px}
.hero-sub-guilt{font-size:.9rem;color:rgba(240,240,255,.35);font-style:italic;margin-bottom:40px}
.hero-sub-guilt strong{color:#f87171;font-style:normal}
.hero-arrow{margin-top:32px;display:flex;flex-direction:column;align-items:center;gap:8px;color:rgba(240,240,255,.3);font-size:.78rem;letter-spacing:.1em;text-transform:uppercase}
.hero-arrow svg{animation:bounce 2s ease-in-out infinite}
@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(6px)}}

/* Chapter nav */
.chapters{position:sticky;top:56px;z-index:50;background:rgba(6,6,14,.92);backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,.06);padding:0 24px;display:flex;justify-content:center;gap:0;overflow-x:auto}
.ch-btn{padding:14px 20px;font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:rgba(240,240,255,.35);border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;transition:all .25s;white-space:nowrap;font-family:'DM Sans',sans-serif}
.ch-btn.active{color:#818cf8;border-bottom-color:#818cf8}
.ch-btn:hover{color:rgba(240,240,255,.7)}

/* Split columns */
.split-world{display:grid;grid-template-columns:1fr 1px 1fr;min-height:100vh;position:relative;z-index:1}
@media(max-width:768px){.split-world{grid-template-columns:1fr;}}
.world-divider{background:linear-gradient(to bottom,transparent,rgba(99,102,241,.4) 20%,rgba(34,211,238,.4) 80%,transparent);position:relative}
.world-divider::after{content:'90 dias · 0 esforço';position:sticky;top:50%;display:block;writing-mode:vertical-rl;transform:rotate(180deg) translateY(50%);font-size:.65rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(99,102,241,.6);padding:8px 0;margin:0 auto;width:fit-content}
@media(max-width:768px){.world-divider{display:none}}

/* Left world — sem FácilCRM */
.world-left{background:linear-gradient(135deg,#080808,#0a0a10);border-right:none;padding:0}
.world-header{padding:32px 32px 24px;border-bottom:1px solid rgba(255,255,255,.05)}
.world-header.left{background:rgba(0,0,0,.3)}
.world-header.right{background:rgba(99,102,241,.04)}
.world-tag{display:inline-flex;align-items:center;gap:6px;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.12em;padding:4px 12px;border-radius:100px;margin-bottom:10px}
.tag-bad{background:rgba(248,113,113,.1);color:#f87171;border:1px solid rgba(248,113,113,.2)}
.tag-good{background:rgba(99,102,241,.12);color:#818cf8;border:1px solid rgba(99,102,241,.25)}
.world-title-left{font-family:'Syne',sans-serif;font-size:1.3rem;font-weight:700;color:rgba(240,240,255,.4)}
.world-title-right{font-family:'Syne',sans-serif;font-size:1.3rem;font-weight:700}

/* Right world — com FácilCRM */
.world-right{background:linear-gradient(135deg,#06060e,#08061a)}
.world-right .world-header{background:rgba(99,102,241,.06)}

/* Chapter sections */
.chapter-section{display:none;padding:32px}
.chapter-section.active{display:block}

/* Phone mockup */
.phone-frame{background:#111118;border:1px solid rgba(255,255,255,.08);border-radius:20px;overflow:hidden;max-width:340px;margin:0 auto}
.phone-frame.dead{background:#0a0a0a;border-color:rgba(255,255,255,.04)}
.ph-top{padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;gap:10px}
.ph-avatar{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;color:#fff;flex-shrink:0}
.avatar-ia{background:linear-gradient(135deg,#6366f1,#22d3ee)}
.avatar-dead{background:#222;color:rgba(255,255,255,.3)}
.ph-name{font-size:.85rem;font-weight:600}
.ph-status{font-size:.7rem;margin-top:1px}
.status-online{color:#34d399}
.status-offline{color:rgba(255,255,255,.25)}
.ph-body{padding:14px;min-height:200px;display:flex;flex-direction:column;gap:8px}

/* Messages */
.msg{max-width:80%;padding:9px 13px;border-radius:14px;font-size:.82rem;line-height:1.5;position:relative}
.msg-in{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.08);align-self:flex-start;border-bottom-left-radius:4px;color:rgba(240,240,255,.85)}
.msg-out{background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;align-self:flex-end;border-bottom-right-radius:4px;box-shadow:0 4px 16px rgba(99,102,241,.3)}
.msg-out.dead{background:#1a1a1a;color:rgba(255,255,255,.2);box-shadow:none}
.msg-time{font-size:.65rem;opacity:.5;margin-top:3px;text-align:right}
.msg-anim{opacity:0;transform:translateY(8px);transition:opacity .4s ease,transform .4s ease}
.msg-anim.show{opacity:1;transform:translateY(0)}

/* Typing indicator */
.typing{display:flex;align-items:center;gap:4px;padding:10px 14px;background:rgba(255,255,255,.06);border-radius:14px;border-bottom-left-radius:4px;align-self:flex-start;width:fit-content}
.typing span{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.4)}
.typing span:nth-child(1){animation:dot 1.4s .0s ease-in-out infinite}
.typing span:nth-child(2){animation:dot 1.4s .2s ease-in-out infinite}
.typing span:nth-child(3){animation:dot 1.4s .4s ease-in-out infinite}
@keyframes dot{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-5px);opacity:1}}
.typing.dead span{animation:none;opacity:.15}

/* Dead states */
.dead-state{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:40px 24px;text-align:center;min-height:200px}
.dead-icon{font-size:2.5rem;opacity:.25}
.dead-text{font-size:.82rem;color:rgba(240,240,255,.25);line-height:1.6}
.dead-timer{font-family:'Syne',sans-serif;font-size:1.4rem;font-weight:800;color:rgba(248,113,113,.4);font-variant-numeric:tabular-nums}

/* Calendar dead */
.cal-dead{background:#0c0c0c;border:1px solid rgba(255,255,255,.04);border-radius:14px;padding:16px;max-width:300px;margin:16px auto 0}
.cal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;font-size:.75rem;color:rgba(240,240,255,.25);font-weight:600;text-transform:uppercase;letter-spacing:.08em}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.cal-day{aspect-ratio:1;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:.7rem;color:rgba(240,240,255,.15);background:rgba(255,255,255,.02)}
.cal-day.miss{background:rgba(248,113,113,.06);color:rgba(248,113,113,.3)}
.cal-day.today{background:rgba(248,113,113,.12);color:#f87171;font-weight:700;border:1px solid rgba(248,113,113,.2)}

/* Active cal */
.cal-active{background:rgba(99,102,241,.05);border:1px solid rgba(99,102,241,.12);border-radius:14px;padding:16px;max-width:300px;margin:16px auto 0}
.cal-day.done{background:rgba(16,185,129,.08);color:#34d399}
.cal-day.star{background:rgba(99,102,241,.15);color:#818cf8;font-weight:700;border:1px solid rgba(99,102,241,.3)}

/* Notification card */
.notif{background:rgba(99,102,241,.08);border:1px solid rgba(99,102,241,.2);border-radius:14px;padding:14px 16px;margin-top:16px;display:flex;align-items:flex-start;gap:10px}
.notif-icon{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#22d3ee);display:flex;align-items:center;justify-content:center;font-size:.9rem;flex-shrink:0}
.notif-text{font-size:.8rem;color:rgba(240,240,255,.7);line-height:1.5}
.notif-text strong{color:#fff;display:block;margin-bottom:2px}
.notif.dead{background:rgba(255,255,255,.02);border-color:rgba(255,255,255,.04)}
.notif.dead .notif-icon{background:#1a1a1a}
.notif.dead .notif-text{color:rgba(240,240,255,.15)}
.notif.dead .notif-text strong{color:rgba(240,240,255,.2)}

/* Stats bar */
.stat-pill{display:inline-flex;align-items:center;gap:6px;font-size:.75rem;font-weight:600;padding:6px 14px;border-radius:100px;margin-top:12px}
.pill-bad{background:rgba(248,113,113,.08);color:#f87171;border:1px solid rgba(248,113,113,.15)}
.pill-good{background:rgba(16,185,129,.08);color:#34d399;border:1px solid rgba(16,185,129,.15)}
.chapter-label{font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:rgba(240,240,255,.3);margin-bottom:16px}

/* Context banner */
.ctx-banner{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:14px 16px;margin-bottom:20px;font-size:.82rem;color:rgba(240,240,255,.5);display:flex;align-items:center;gap:8px}
.ctx-banner .ctx-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.dot-cyan{background:#22d3ee;box-shadow:0 0 8px rgba(34,211,238,.5)}
.dot-gray{background:#333;box-shadow:none}

/* Bottom stats */
#stats{padding:80px 24px;text-align:center;position:relative;z-index:1}
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;max-width:800px;margin:40px auto 0}
@media(max-width:640px){.stats-grid{grid-template-columns:repeat(2,1fr)}}
.stat-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:24px 16px;text-align:center}
.stat-n{font-family:'Syne',sans-serif;font-size:2.2rem;font-weight:800;background:linear-gradient(135deg,#818cf8,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.stat-l{font-size:.72rem;color:rgba(240,240,255,.35);margin-top:6px;text-transform:uppercase;letter-spacing:.08em}

/* CTA */
#cta{padding:100px 24px;text-align:center;position:relative;z-index:1}
.cta-inner{max-width:600px;margin:0 auto;background:linear-gradient(135deg,rgba(99,102,241,.08),rgba(124,58,237,.06));border:1px solid rgba(99,102,241,.18);border-radius:28px;padding:64px 40px;position:relative;overflow:hidden}
.cta-inner::before{content:'';position:absolute;top:-80px;left:50%;transform:translateX(-50%);width:400px;height:250px;background:radial-gradient(ellipse,rgba(99,102,241,.2),transparent);pointer-events:none}
.cta-inner h2{font-size:clamp(1.6rem,3vw,2.2rem);margin-bottom:14px}
.cta-inner p{color:rgba(240,240,255,.6);margin-bottom:32px}
.btn-cta{display:inline-flex;align-items:center;gap:8px;padding:15px 36px;border-radius:12px;font-weight:700;font-size:1rem;background:linear-gradient(135deg,#6366f1,#7c3aed);color:#fff;text-decoration:none;transition:all .25s;font-family:'DM Sans',sans-serif}
.btn-cta:hover{transform:translateY(-2px);box-shadow:0 10px 40px rgba(99,102,241,.5)}
.cta-trust{font-size:.78rem;color:rgba(240,240,255,.3);margin-top:16px}
.cta-trust span{margin:0 6px}
.btn-back{display:inline-flex;align-items:center;gap:6px;font-size:.85rem;color:rgba(240,240,255,.4);text-decoration:none;margin-top:24px;transition:color .2s}
.btn-back:hover{color:rgba(240,240,255,.7)}

footer{padding:32px 24px;border-top:1px solid rgba(255,255,255,.05);text-align:center;position:relative;z-index:1}
footer p{font-size:.78rem;color:rgba(240,240,255,.25)}
footer a{color:#818cf8;text-decoration:none}
`;

const CHAPTERS = [
  { id:"d0", label:"D+0 · Chegada" },
  { id:"d1", label:"D+1 · Silêncio" },
  { id:"d7", label:"D+7 · Pós-venda" },
  { id:"d28", label:"D+28 · Recompra" },
  { id:"aniv", label:"Aniversário" },
];

function CalDead() {
  const days = Array.from({length:28},(_,i)=>i+1);
  return (
    <div className="cal-dead">
      <div className="cal-header"><span>Maio 2026</span><span>Lead</span></div>
      <div className="cal-grid">
        {days.map(d=>(
          <div key={d} className={`cal-day ${d<5?"miss":d===5?"today":""}`}>
            {d<5?"✗":d===5?"●":d}
          </div>
        ))}
      </div>
    </div>
  );
}

function CalActive() {
  const days = Array.from({length:28},(_,i)=>i+1);
  return (
    <div className="cal-active">
      <div className="cal-header"><span>Maio 2026</span><span>IA trabalhando</span></div>
      <div className="cal-grid">
        {days.map(d=>(
          <div key={d} className={`cal-day ${[1,2,7,20,28].includes(d)?"star":d<5?"done":""}`}>
            {[1,2,7,20,28].includes(d)?"★":d<5?"✓":d}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CaminhoDoLead() {
  const activeChapter = useRef("d0");
  const sectionRefs = useRef<Record<string,HTMLElement|null>>({});

  useEffect(()=>{
    // Chapter scroll observer
    const obs = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          const id = (e.target as HTMLElement).dataset.chapter;
          if(!id) return;
          activeChapter.current = id;
          document.querySelectorAll(".ch-btn").forEach(b=>b.classList.remove("active"));
          document.querySelector(`[data-ch="${id}"]`)?.classList.add("active");
          document.querySelectorAll(".chapter-section").forEach(s=>s.classList.remove("active"));
          document.querySelectorAll(`[data-sec="${id}"]`).forEach(s=>s.classList.add("active"));
        }
      });
    },{threshold:0.4});

    document.querySelectorAll(".split-chapter").forEach(el=>obs.observe(el));

    // Animate messages
    const msgObs = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          const msgs = e.target.querySelectorAll(".msg-anim");
          msgs.forEach((m,i)=>{
            setTimeout(()=>m.classList.add("show"),i*300);
          });
          msgObs.unobserve(e.target);
        }
      });
    },{threshold:0.2});
    document.querySelectorAll(".phone-frame").forEach(el=>msgObs.observe(el));

    // Chapter button clicks
    document.querySelectorAll(".ch-btn").forEach(btn=>{
      btn.addEventListener("click",()=>{
        const id = (btn as HTMLElement).dataset.ch;
        document.querySelector(`.split-chapter[data-chapter="${id}"]`)
          ?.scrollIntoView({behavior:"smooth",block:"center"});
      });
    });

    return ()=>{ obs.disconnect(); msgObs.disconnect(); };
  },[]);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>

      <nav>
        <a href="/" className="logo">FácilCRM</a>
        <a href="/registro" className="nav-cta">Começar grátis →</a>
      </nav>

      {/* Hero */}
      <section id="hero">
        <div style={{fontSize:".78rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".14em",color:"#818cf8",marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:"#22d3ee",display:"inline-block",animation:"dot 2s ease-in-out infinite"}}/>
          A Roda do Relacionamento
        </div>
        <h1>
          Um lead chegou.<br/>
          <span className="grad-red">O que acontece</span> agora?
        </h1>
        <p>Veja, lado a lado, o que acontece com seus leads hoje — e o que poderia acontecer com o FácilCRM.</p>
        <p className="hero-sub-guilt"><strong>87% dos leads não recebem nenhum follow-up.</strong> Provavelmente os seus também não.</p>
        <div className="hero-arrow">
          <span>Scroll para ver os dois mundos</span>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M12 5v14M5 12l7 7 7-7"/>
          </svg>
        </div>
      </section>

      {/* Chapter nav */}
      <div className="chapters">
        {CHAPTERS.map((c,i)=>(
          <button key={c.id} data-ch={c.id} className={`ch-btn${i===0?" active":""}`}>{c.label}</button>
        ))}
      </div>

      {/* Split World */}
      {/* ─── D+0 ─────────────────────────────── */}
      <div className="split-world split-chapter" data-chapter="d0">
        {/* LEFT */}
        <div className="world-left">
          <div className="world-header left">
            <div className="world-tag tag-bad">😶 Hoje, no seu negócio</div>
            <div className="world-title-left">Lead chegou. Você não viu.</div>
          </div>
          <div className="chapter-section active" data-sec="d0">
            <div className="chapter-label">D+0 · 10:42 — Lead envia mensagem</div>
            <div className="ctx-banner">
              <div className="ctx-dot dot-gray"/>
              Você estava em reunião. Ou no almoço. Ou simplesmente não viu.
            </div>
            <div className="phone-frame dead">
              <div className="ph-top">
                <div className="ph-avatar avatar-dead">?</div>
                <div>
                  <div className="ph-name" style={{color:"rgba(240,240,255,.3)"}}>Novo contato</div>
                  <div className="ph-status status-offline">Aguardando resposta...</div>
                </div>
              </div>
              <div className="ph-body">
                <div className="msg msg-in msg-anim">
                  Oi! Vi o anúncio de vocês. Quero um orçamento!
                  <div className="msg-time">10:42</div>
                </div>
                <div className="typing dead"><span/><span/><span/></div>
                <div className="dead-state">
                  <div className="dead-timer">6h 47min</div>
                  <div className="dead-text">sem resposta</div>
                </div>
              </div>
            </div>
            <div className="stat-pill pill-bad">⚠ 78% dos leads compram do primeiro que responde</div>
          </div>
        </div>

        <div className="world-divider"/>

        {/* RIGHT */}
        <div className="world-right">
          <div className="world-header right">
            <div className="world-tag tag-good">⚡ Com o FácilCRM</div>
            <div className="world-title-right"><span className="grad">IA responde em 3 segundos.</span></div>
          </div>
          <div className="chapter-section active" data-sec="d0">
            <div className="chapter-label">D+0 · 10:42:03 — IA assume o atendimento</div>
            <div className="ctx-banner">
              <div className="ctx-dot dot-cyan"/>
              Você não precisa fazer nada. A IA atende, qualifica e monta o orçamento.
            </div>
            <div className="phone-frame">
              <div className="ph-top">
                <div className="ph-avatar avatar-ia">IA</div>
                <div>
                  <div className="ph-name">Lu · FácilCRM</div>
                  <div className="ph-status status-online">● online agora</div>
                </div>
              </div>
              <div className="ph-body">
                <div className="msg msg-in msg-anim">
                  Oi! Vi o anúncio de vocês. Quero um orçamento!
                  <div className="msg-time">10:42</div>
                </div>
                <div className="msg msg-out msg-anim">
                  Oi! Sou a Lu, da Paredão Tintas 😊 Vou te fazer algumas perguntinhas rápidas pra montar seu orçamento completinho, ok? Assim que terminar, passo pro nosso vendedor te dar o preço!
                  <div className="msg-time">10:42:03</div>
                </div>
                <div className="msg msg-in msg-anim">
                  [foto da lista manuscrita]
                  <div className="msg-time">10:44</div>
                </div>
                <div className="msg msg-out msg-anim">
                  Li sua lista! Encontrei: 2x tinta branco gelo 18L, 1x rolo textura, fita crepe. Tá correto? 😊
                  <div className="msg-time">10:44:09</div>
                </div>
              </div>
            </div>
            <div className="stat-pill pill-good">✓ Respondido em 3 segundos. Sempre.</div>
          </div>
        </div>
      </div>

      {/* ─── D+1 ─────────────────────────────── */}
      <div className="split-world split-chapter" data-chapter="d1">
        <div className="world-left">
          <div className="world-header left">
            <div className="world-tag tag-bad">😶 Hoje, no seu negócio</div>
            <div className="world-title-left">Lead sumiu. Você também.</div>
          </div>
          <div className="chapter-section" data-sec="d1">
            <div className="chapter-label">D+1 · 09:00 — Lead não respondeu</div>
            <div className="ctx-banner">
              <div className="ctx-dot dot-gray"/>
              Você até pensou em mandar mensagem. Mas o dia foi corrido.
            </div>
            <div className="phone-frame dead">
              <div className="ph-top">
                <div className="ph-avatar avatar-dead">?</div>
                <div>
                  <div className="ph-name" style={{color:"rgba(240,240,255,.3)"}}>Lead de ontem</div>
                  <div className="ph-status status-offline">Visto ontem às 10:42</div>
                </div>
              </div>
              <div className="ph-body">
                <div className="dead-state">
                  <div className="dead-icon">🪦</div>
                  <div className="dead-text">Nenhum follow-up enviado.<br/>Lead foi pesquisar preço no concorrente.</div>
                </div>
              </div>
            </div>
            <CalDead/>
            <div className="stat-pill pill-bad">⚠ Lead sem follow-up em 24h: -60% chance de fechar</div>
          </div>
        </div>

        <div className="world-divider"/>

        <div className="world-right">
          <div className="world-header right">
            <div className="world-tag tag-good">⚡ Com o FácilCRM</div>
            <div className="world-title-right"><span className="grad">Toque automático. Você dormiu.</span></div>
          </div>
          <div className="chapter-section" data-sec="d1">
            <div className="chapter-label">D+1 · 09:00 — IA envia follow-up automático</div>
            <div className="ctx-banner">
              <div className="ctx-dot dot-cyan"/>
              Às 9h em ponto, sem você tocar no celular.
            </div>
            <div className="phone-frame">
              <div className="ph-top">
                <div className="ph-avatar avatar-ia">IA</div>
                <div>
                  <div className="ph-name">Lu · FácilCRM</div>
                  <div className="ph-status status-online">● enviando...</div>
                </div>
              </div>
              <div className="ph-body">
                <div className="msg msg-out msg-anim">
                  Oi! Vi que conversamos ontem — ficou alguma dúvida ou posso te ajudar a finalizar o orçamento? 😊
                  <div className="msg-time">09:00</div>
                </div>
                <div className="msg msg-in msg-anim">
                  Oi! Sim, quero sim! Esqueci de responder ontem
                  <div className="msg-time">09:14</div>
                </div>
                <div className="msg msg-out msg-anim">
                  Que ótimo! Vamos lá! Vai retirar na loja ou prefere entrega?
                  <div className="msg-time">09:14</div>
                </div>
              </div>
            </div>
            <CalActive/>
            <div className="stat-pill pill-good">✓ D+1 e D+2 automáticos. Zero esforço.</div>
          </div>
        </div>
      </div>

      {/* ─── D+7 ─────────────────────────────── */}
      <div className="split-world split-chapter" data-chapter="d7">
        <div className="world-left">
          <div className="world-header left">
            <div className="world-tag tag-bad">😶 Hoje, no seu negócio</div>
            <div className="world-title-left">Cliente comprou. Sumiu do radar.</div>
          </div>
          <div className="chapter-section" data-sec="d7">
            <div className="chapter-label">D+7 após a venda — Experiência do cliente</div>
            <div className="ctx-banner">
              <div className="ctx-dot dot-gray"/>
              Venda fechada. Cliente satisfeito? Você nunca vai saber.
            </div>
            <div className="phone-frame dead">
              <div className="ph-body">
                <div className="dead-state">
                  <div className="dead-icon">🔇</div>
                  <div className="dead-text">
                    Nenhuma mensagem de satisfação enviada.<br/>
                    Nenhum pedido de indicação.<br/>
                    Oportunidade de fidelização desperdiçada.
                  </div>
                </div>
              </div>
            </div>
            <div className="notif dead">
              <div className="notif-icon">👤</div>
              <div className="notif-text">
                <strong>Indicação perdida</strong>
                Cliente tinha 3 amigos que precisavam do mesmo serviço. Ninguém perguntou.
              </div>
            </div>
            <div className="stat-pill pill-bad">⚠ D+7 é o pico de satisfação. Janela de indicação ignorada.</div>
          </div>
        </div>

        <div className="world-divider"/>

        <div className="world-right">
          <div className="world-header right">
            <div className="world-tag tag-good">⚡ Com o FácilCRM</div>
            <div className="world-title-right"><span className="grad">Satisfação + indicação automáticos.</span></div>
          </div>
          <div className="chapter-section" data-sec="d7">
            <div className="chapter-label">D+7 — IA verifica satisfação e pede indicação</div>
            <div className="ctx-banner">
              <div className="ctx-dot dot-cyan"/>
              Melhor momento para pedir indicação: quando o cliente está no pico da satisfação.
            </div>
            <div className="phone-frame">
              <div className="ph-top">
                <div className="ph-avatar avatar-ia">IA</div>
                <div>
                  <div className="ph-name">Lu · FácilCRM</div>
                  <div className="ph-status status-online">● D+7 automático</div>
                </div>
              </div>
              <div className="ph-body">
                <div className="msg msg-out msg-anim">
                  Oi! 😊 Passando pra saber: como está sendo sua experiência? Ficou tudo certo?
                  <div className="msg-time">09:00</div>
                </div>
                <div className="msg msg-in msg-anim">
                  Ficou ótimo! Muito satisfeito
                  <div className="msg-time">09:23</div>
                </div>
                <div className="msg msg-out msg-anim">
                  Que ótimo! 🥳 Você conhece alguém que também pode se interessar? Me passa o contato que eu atendo com o mesmo cuidado!
                  <div className="msg-time">09:23</div>
                </div>
                <div className="msg msg-in msg-anim">
                  Sim! Meu irmão tá precisando. O número dele é 62999...
                  <div className="msg-time">09:25</div>
                </div>
              </div>
            </div>
            <div className="notif">
              <div className="notif-icon">🤝</div>
              <div className="notif-text">
                <strong>Novo lead criado automaticamente</strong>
                IA já enviou mensagem para o irmão: "Seu irmão me passou seu contato..."
              </div>
            </div>
            <div className="stat-pill pill-good">✓ Lead indicado criado e contactado. Automático.</div>
          </div>
        </div>
      </div>

      {/* ─── D+28 ─────────────────────────────── */}
      <div className="split-world split-chapter" data-chapter="d28">
        <div className="world-left">
          <div className="world-header left">
            <div className="world-tag tag-bad">😶 Hoje, no seu negócio</div>
            <div className="world-title-left">Hora de repor. Você não lembrou.</div>
          </div>
          <div className="chapter-section" data-sec="d28">
            <div className="chapter-label">D+28 — Janela de recompra</div>
            <div className="ctx-banner">
              <div className="ctx-dot dot-gray"/>
              Cliente precisa comprar de novo. Quem chegou primeiro levou.
            </div>
            <div className="phone-frame dead">
              <div className="ph-body">
                <div className="dead-state">
                  <div className="dead-icon">🛒</div>
                  <div className="dead-text">
                    Cliente foi no Google.<br/>
                    Achou o concorrente primeiro.<br/>
                    Comprou lá.
                  </div>
                </div>
              </div>
            </div>
            <div className="stat-pill pill-bad">⚠ Recompra em 28 dias: oportunidade perdida</div>
          </div>
        </div>

        <div className="world-divider"/>

        <div className="world-right">
          <div className="world-header right">
            <div className="world-tag tag-good">⚡ Com o FácilCRM</div>
            <div className="world-title-right"><span className="grad">Na janela certa. Sem você lembrar.</span></div>
          </div>
          <div className="chapter-section" data-sec="d28">
            <div className="chapter-label">D+28 — Sugestão de recompra automática</div>
            <div className="ctx-banner">
              <div className="ctx-dot dot-cyan"/>
              IA sabe quando é hora de abordar. Você não precisa calcular nada.
            </div>
            <div className="phone-frame">
              <div className="ph-top">
                <div className="ph-avatar avatar-ia">IA</div>
                <div>
                  <div className="ph-name">Lu · FácilCRM</div>
                  <div className="ph-status status-online">● D+28 automático</div>
                </div>
              </div>
              <div className="ph-body">
                <div className="msg msg-out msg-anim">
                  Oi! Já faz um tempinho do seu último pedido — está precisando repor? Me fala que te ajudo rapidinho! 😊
                  <div className="msg-time">09:00</div>
                </div>
                <div className="msg msg-in msg-anim">
                  Nossa, tava pensando nisso mesmo! Sim, preciso de mais tinta
                  <div className="msg-time">11:34</div>
                </div>
                <div className="msg msg-out msg-anim">
                  Ótimo! Igual ao pedido anterior ou vai precisar de algo diferente dessa vez?
                  <div className="msg-time">11:34</div>
                </div>
              </div>
            </div>
            <div className="notif">
              <div className="notif-icon">💰</div>
              <div className="notif-text">
                <strong>Segunda venda iniciada</strong>
                Cliente retomou a conversa. Vendedor notificado com histórico completo.
              </div>
            </div>
            <div className="stat-pill pill-good">✓ D+20, D+28 e D+45 automáticos. Vendas recorrentes sem esforço.</div>
          </div>
        </div>
      </div>

      {/* ─── Aniversário ─────────────────────── */}
      <div className="split-world split-chapter" data-chapter="aniv">
        <div className="world-left">
          <div className="world-header left">
            <div className="world-tag tag-bad">😶 Hoje, no seu negócio</div>
            <div className="world-title-left">Aniversário do cliente passou.</div>
          </div>
          <div className="chapter-section" data-sec="aniv">
            <div className="chapter-label">Aniversário — A data mais importante do cliente</div>
            <div className="ctx-banner">
              <div className="ctx-dot dot-gray"/>
              Você nem sabia a data. Muito menos mandou mensagem.
            </div>
            <div className="phone-frame dead">
              <div className="ph-body">
                <div className="dead-state">
                  <div className="dead-icon">🎂</div>
                  <div className="dead-text">
                    Dia de aniversário do cliente.<br/>
                    Família lembrou. Amigos lembraram.<br/>
                    Seu negócio não.
                  </div>
                </div>
              </div>
            </div>
            <div className="stat-pill pill-bad">⚠ Conexão emocional com o cliente: inexistente</div>
          </div>
        </div>

        <div className="world-divider"/>

        <div className="world-right">
          <div className="world-header right">
            <div className="world-tag tag-good">⚡ Com o FácilCRM</div>
            <div className="world-title-right"><span className="grad">Todo ano. Na data certa.</span></div>
          </div>
          <div className="chapter-section" data-sec="aniv">
            <div className="chapter-label">Aniversário — IA lembra. Você não precisa.</div>
            <div className="ctx-banner">
              <div className="ctx-dot dot-cyan"/>
              Mensagem personalizada, no dia certo, todo ano. Automático para sempre.
            </div>
            <div className="phone-frame">
              <div className="ph-top">
                <div className="ph-avatar avatar-ia">IA</div>
                <div>
                  <div className="ph-name">Lu · FácilCRM</div>
                  <div className="ph-status status-online">● aniversário 🎂</div>
                </div>
              </div>
              <div className="ph-body">
                <div className="msg msg-out msg-anim">
                  Oi Carlos! 🎂 Hoje é um dia muito especial — feliz aniversário! Que seu dia seja incrível e cheio de realizações! 🥳 Da equipe Paredão Tintas com muito carinho!
                  <div className="msg-time">08:00</div>
                </div>
                <div className="msg msg-in msg-anim">
                  Caramba! Que surpresa! Obrigado demais!! 😊
                  <div className="msg-time">08:47</div>
                </div>
                <div className="msg msg-in msg-anim">
                  Vocês são os únicos que lembraram além da família hahaha
                  <div className="msg-time">08:47</div>
                </div>
              </div>
            </div>
            <div className="notif">
              <div className="notif-icon">⭐</div>
              <div className="notif-text">
                <strong>Conexão emocional criada</strong>
                Clientes que recebem mensagem de aniversário têm 3× mais chance de indicar.
              </div>
            </div>
            <div className="stat-pill pill-good">✓ Toda data especial. Todo cliente. Todo ano.</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <section id="stats">
        <div style={{textAlign:"center",position:"relative",zIndex:1}}>
          <div style={{fontSize:".72rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".14em",color:"#818cf8",marginBottom:12}}>O resultado em números</div>
          <h2 style={{fontSize:"clamp(1.6rem,3vw,2.4rem)",fontWeight:800}}>
            90 dias. <span className="grad">0 esforço.</span><br/>Relacionamento que vende.
          </h2>
        </div>
        <div className="stats-grid">
          {[
            {n:"3s",l:"Tempo de resposta da IA"},
            {n:"90d",l:"Jornada automática por lead"},
            {n:"0",l:"Follow-ups manuais necessários"},
            {n:"16+",l:"Toques automáticos no período"},
          ].map(s=>(
            <div key={s.l} className="stat-card">
              <div className="stat-n">{s.n}</div>
              <div className="stat-l">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="cta">
        <div className="cta-inner">
          <div style={{fontSize:".72rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".14em",color:"#818cf8",marginBottom:14}}>Pronto para começar?</div>
          <h2>Seus leads merecem isso.<br/><span className="grad">Você também.</span></h2>
          <p>Configure em 5 minutos. A IA começa a trabalhar imediatamente.<br/>Nenhum lead abandonado. Nenhum follow-up esquecido.</p>
          <a href="/registro" className="btn-cta">Começar 30 dias grátis →</a>
          <div className="cta-trust">
            <span>✓ Sem cartão de crédito</span>
            <span>·</span>
            <span>✓ Setup em 5 minutos</span>
            <span>·</span>
            <span>✓ Cancele quando quiser</span>
          </div>
        </div>
        <div style={{textAlign:"center",marginTop:24}}>
          <a href="/" className="btn-back">← Voltar para o site</a>
        </div>
      </section>

      <footer>
        <p>© 2026 <a href="/">FácilCRM</a> · A IA que nunca abandona seus leads.</p>
      </footer>
    </>
  );
}
