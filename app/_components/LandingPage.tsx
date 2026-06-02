"use client";
import { useEffect } from "react";

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
:root{
  --bg:#04040c;--bg2:#080815;--indigo:#6366f1;--indigo-l:#818cf8;--violet:#7c3aed;
  --cyan:#22d3ee;--emerald:#10b981;--amber:#f59e0b;--red:#ef4444;--txt:#f0f0ff;
  --txt2:rgba(240,240,255,.6);--txt3:rgba(240,240,255,.35);
  --gb:rgba(255,255,255,.035);--gbh:rgba(255,255,255,.065);
  --gbd:rgba(255,255,255,.08);--gbdh:rgba(99,102,241,.4);
  --r:16px;--rl:24px;--tr:all .3s cubic-bezier(.4,0,.2,1)
}
.lp-root{font-family:'DM Sans',sans-serif;background:#04040c;color:#f0f0ff;overflow-x:hidden;line-height:1.6;min-height:100vh}
.lp-root::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(99,102,241,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.04) 1px,transparent 1px);background-size:56px 56px;pointer-events:none;z-index:0}
#cg{position:fixed;width:480px;height:480px;background:radial-gradient(circle,rgba(99,102,241,.14) 0%,rgba(124,58,237,.07) 40%,transparent 70%);border-radius:50%;pointer-events:none;transform:translate(-50%,-50%);z-index:1;transition:left .06s linear,top .06s linear;mix-blend-mode:screen}
.orbs{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}
.orb{position:absolute;border-radius:50%;filter:blur(90px);opacity:.35}
.o1{width:700px;height:700px;background:radial-gradient(circle,rgba(99,102,241,.35),transparent);top:-280px;left:-250px}
.o2{width:550px;height:550px;background:radial-gradient(circle,rgba(34,211,238,.2),transparent);bottom:10%;right:-150px}
.o3{width:400px;height:400px;background:radial-gradient(circle,rgba(124,58,237,.22),transparent);top:55%;left:35%}
.container{max-width:1180px;margin:0 auto;padding:0 24px;position:relative;z-index:2}
section{position:relative;z-index:2}
h1,h2,h3,h4{font-family:'Syne',sans-serif;line-height:1.1}
h1{font-size:clamp(2.6rem,5.5vw,4.8rem);font-weight:800}
h2{font-size:clamp(1.9rem,3.5vw,2.9rem);font-weight:700}
h3{font-size:1.15rem;font-weight:700}
.grad{background:linear-gradient(135deg,var(--indigo-l) 0%,var(--cyan) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.lbl{display:inline-flex;align-items:center;gap:8px;font-size:.72rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--indigo-l);padding:5px 14px;border:1px solid rgba(99,102,241,.28);border-radius:100px;background:rgba(99,102,241,.07);margin-bottom:18px}
.gc{background:var(--gb);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--gbd);border-radius:var(--rl);transition:var(--tr)}
.gc:hover{background:var(--gbh);border-color:var(--gbdh);transform:translateY(-4px);box-shadow:0 0 50px rgba(99,102,241,.2)}
.btn{display:inline-flex;align-items:center;gap:8px;padding:14px 28px;border-radius:12px;font-family:'DM Sans',sans-serif;font-weight:600;font-size:1rem;cursor:pointer;border:none;transition:var(--tr);text-decoration:none}
.bp{background:linear-gradient(135deg,var(--indigo),var(--violet));color:#fff}
.bp:hover{transform:translateY(-2px);box-shadow:0 8px 44px rgba(99,102,241,.5),0 0 0 1px rgba(99,102,241,.3)}
.bs{background:rgba(255,255,255,.04);color:var(--txt);border:1px solid var(--gbd);backdrop-filter:blur(10px)}
.bs:hover{background:rgba(255,255,255,.09);border-color:rgba(255,255,255,.18)}
.ni{display:flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:14px;color:#fff;background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.22);animation:np 4s ease-in-out infinite;flex-shrink:0}
.ni.c{background:rgba(34,211,238,.1);border-color:rgba(34,211,238,.22);color:rgba(34,211,238,.95);animation:npc 4s ease-in-out infinite}
.ni.e{background:rgba(16,185,129,.1);border-color:rgba(16,185,129,.22);color:rgba(16,185,129,.95);animation:npe 4s ease-in-out infinite}
.ni.a{background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.22);color:rgba(245,158,11,.95);animation:npa 4s ease-in-out infinite}
.ni svg{flex-shrink:0}
@keyframes np{0%,100%{box-shadow:0 0 8px rgba(99,102,241,.3)}50%{box-shadow:0 0 22px rgba(99,102,241,.65),0 0 44px rgba(99,102,241,.18)}}
@keyframes npc{0%,100%{box-shadow:0 0 8px rgba(34,211,238,.3)}50%{box-shadow:0 0 22px rgba(34,211,238,.65),0 0 44px rgba(34,211,238,.18)}}
@keyframes npe{0%,100%{box-shadow:0 0 8px rgba(16,185,129,.3)}50%{box-shadow:0 0 22px rgba(16,185,129,.65),0 0 44px rgba(16,185,129,.18)}}
@keyframes npa{0%,100%{box-shadow:0 0 8px rgba(245,158,11,.3)}50%{box-shadow:0 0 22px rgba(245,158,11,.65),0 0 44px rgba(245,158,11,.18)}}
.si{display:flex;align-items:center;justify-content:center;width:44px;height:44px;color:rgba(99,102,241,.9);margin-bottom:12px;filter:drop-shadow(0 0 8px rgba(99,102,241,.5))}
.si svg{flex-shrink:0}
.fu{opacity:0;transform:translateY(28px);transition:opacity .65s ease,transform .65s ease}
.fu.v{opacity:1;transform:translateY(0)}
.fu:nth-child(2){transition-delay:.1s}.fu:nth-child(3){transition-delay:.2s}.fu:nth-child(4){transition-delay:.3s}.fu:nth-child(5){transition-delay:.4s}.fu:nth-child(6){transition-delay:.5s}
nav{position:fixed;top:0;left:0;right:0;z-index:1000;padding:14px 0;backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);background:rgba(4,4,12,.82);border-bottom:1px solid var(--gbd);transition:var(--tr)}
.nav-i{display:flex;align-items:center;justify-content:space-between}
.logo{font-family:'Syne',sans-serif;font-size:1.35rem;font-weight:800;background:linear-gradient(135deg,var(--indigo-l),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-decoration:none}
.nav-links{display:flex;gap:28px;list-style:none}
.nav-links a{color:var(--txt2);text-decoration:none;font-size:.88rem;font-weight:500;transition:color .2s}
.nav-links a:hover{color:var(--txt)}
#hero{min-height:100vh;display:flex;align-items:center;padding:120px 0 80px}
.hero-grid{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center}
.hbadge{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.25);border-radius:100px;font-size:.78rem;color:var(--indigo-l);margin-bottom:22px}
.hbadge::before{content:'';display:block;width:7px;height:7px;background:var(--cyan);border-radius:50%;animation:blink 2.2s ease-in-out infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.25}}
.hero-h1{margin-bottom:22px;letter-spacing:-.02em}
.hero-sub{font-size:1.1rem;color:var(--txt2);line-height:1.75;margin-bottom:36px;max-width:480px}
.hero-ctas{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:18px}
.hero-trust{font-size:.78rem;color:var(--txt3)}
.hero-trust span{margin:0 3px}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:52px}
.sc2-stat{padding:16px;text-align:center}
.sv{font-family:'Syne',sans-serif;font-size:1.55rem;font-weight:800;color:var(--indigo-l)}
.sl{font-size:.72rem;color:var(--txt3);margin-top:4px}
.phone{background:var(--gb);backdrop-filter:blur(20px);border:1px solid var(--gbd);border-radius:28px;overflow:hidden;box-shadow:0 40px 120px rgba(99,102,241,.2),0 0 0 1px rgba(99,102,241,.1);max-width:360px;margin:0 auto;position:relative}
.ph-hd{padding:16px 20px;border-bottom:1px solid var(--gbd);display:flex;align-items:center;gap:12px;background:rgba(99,102,241,.06)}
.ph-av{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--indigo),var(--cyan));display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;color:#fff;flex-shrink:0}
.ph-name{font-size:.9rem;font-weight:600}
.ph-st{font-size:.72rem;color:var(--emerald);display:flex;align-items:center;gap:4px}
.ph-st::before{content:'';display:block;width:6px;height:6px;border-radius:50%;background:var(--emerald);animation:blink 2s ease-in-out infinite}
.ph-body{padding:16px;display:flex;flex-direction:column;gap:10px;min-height:300px}
.cm{max-width:82%;padding:10px 14px;border-radius:12px;font-size:.83rem;line-height:1.5;animation:mi .35s ease}
.cm.u{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);align-self:flex-start;border-bottom-left-radius:4px}
.cm.ai{background:linear-gradient(135deg,rgba(99,102,241,.22),rgba(124,58,237,.22));border:1px solid rgba(99,102,241,.22);align-self:flex-end;border-bottom-right-radius:4px}
.cm-m{font-size:.63rem;color:var(--txt3);margin-top:3px}
.cm-m.r{text-align:right}
@keyframes mi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.typing{display:flex;gap:4px;padding:10px 14px;background:rgba(255,255,255,.04);border:1px solid var(--gbd);border-radius:12px;border-bottom-right-radius:4px;align-self:flex-end;width:fit-content}
.td{width:6px;height:6px;border-radius:50%;background:var(--indigo-l);animation:t 1.3s ease-in-out infinite}
.td:nth-child(2){animation-delay:.2s}.td:nth-child(3){animation-delay:.4s}
@keyframes t{0%,80%,100%{transform:translateY(0);opacity:.3}40%{transform:translateY(-7px);opacity:1}}
.pbadge{position:absolute;top:-18px;right:-18px;padding:11px 15px;background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.3);backdrop-filter:blur(20px);border-radius:14px;font-size:.73rem;z-index:10}
.pbadge .bt{font-weight:700;color:var(--emerald);font-size:.78rem}
.pbadge .bs2{color:var(--txt3);margin-top:2px}
#ticker{padding:18px 0;border-top:1px solid var(--gbd);border-bottom:1px solid var(--gbd);overflow:hidden}
.tk-i{display:flex;gap:36px;animation:tk 24s linear infinite;width:max-content}
.tk-item{display:flex;align-items:center;gap:10px;white-space:nowrap;font-size:.88rem;color:var(--txt2)}
.tk-item strong{color:var(--txt)}
.tk-dot{width:4px;height:4px;background:var(--indigo);border-radius:50%;flex-shrink:0}
.tk-icon{width:16px;height:16px;color:var(--indigo-l);flex-shrink:0}
@keyframes tk{from{transform:translateX(0)}to{transform:translateX(-50%)}}
#pain{padding:100px 0;overflow:hidden}
.pain-header{text-align:center;margin-bottom:56px}
.pain-sub{color:var(--txt2);margin-top:14px;max-width:540px;margin-left:auto;margin-right:auto;font-size:1.05rem}
.pain-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px}
.pcol{padding:32px;border-radius:var(--rl)}
.pcol.bad{background:rgba(239,68,68,.04);border:1px solid rgba(239,68,68,.14)}
.pcol.good{background:rgba(16,185,129,.04);border:1px solid rgba(16,185,129,.14)}
.pcol-t{display:flex;align-items:center;gap:10px;font-weight:700;margin-bottom:20px;font-size:.95rem}
.pcol.bad .pcol-t{color:#f87171}
.pcol.good .pcol-t{color:var(--emerald)}
.pl{list-style:none;display:flex;flex-direction:column;gap:11px}
.pl li{display:flex;gap:10px;font-size:.88rem;color:var(--txt2);line-height:1.5}
.pl li .ic{flex-shrink:0}
#hiw{padding:100px 0 60px}
.hiw-hd{margin-bottom:44px}
.sdiv{width:55px;height:3px;background:linear-gradient(90deg,var(--indigo),var(--cyan));border-radius:2px;margin-top:14px}
.sw{overflow-x:auto;padding-bottom:20px;scrollbar-width:thin;scrollbar-color:rgba(99,102,241,.3) transparent}
.sw::-webkit-scrollbar{height:4px}
.sw::-webkit-scrollbar-track{background:transparent}
.sw::-webkit-scrollbar-thumb{background:rgba(99,102,241,.3);border-radius:2px}
.sw .gc:hover,.tw .gc:hover{transform:none;box-shadow:none}
.st{display:flex;gap:14px;width:max-content;padding:4px 0}
.scard{width:210px;flex-shrink:0;padding:24px;border-radius:var(--rl)}
.sn{font-family:'Syne',sans-serif;font-size:.7rem;font-weight:700;color:var(--indigo-l);letter-spacing:.1em;margin-bottom:10px;opacity:.65}
.st2{font-size:.95rem;font-weight:700;margin-bottom:7px;font-family:'Syne',sans-serif}
.sd{font-size:.8rem;color:var(--txt2);line-height:1.5}
.sarr{width:18px;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:var(--indigo-l);opacity:.35;align-self:center}
#features{padding:100px 0;overflow:hidden}
.fg{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:56px}
.fcard{padding:28px}
.fcard .ni{margin-bottom:18px}
.ft{font-size:1.05rem;font-weight:700;margin-bottom:9px;font-family:'Syne',sans-serif}
.fd{font-size:.86rem;color:var(--txt2);line-height:1.65}
.hbox{padding:52px 48px;text-align:center;border-radius:32px;background:linear-gradient(135deg,rgba(99,102,241,.09) 0%,rgba(124,58,237,.07) 50%,rgba(34,211,238,.05) 100%);border:1px solid rgba(99,102,241,.22);position:relative;overflow:hidden;margin:60px 0}
.hbox::before{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:600px;height:1px;background:linear-gradient(90deg,transparent,rgba(99,102,241,.5),transparent)}
.hbox-icon{margin-bottom:14px;display:flex;align-items:center;justify-content:center}
.hbox h2{max-width:680px;margin:0 auto 14px}
.hbox p{color:var(--txt2);font-size:1.05rem;max-width:580px;margin:0 auto 30px;line-height:1.75}
#testi{padding:100px 0}
.tw{overflow-x:auto;padding-bottom:20px;margin-top:46px;scrollbar-width:thin;scrollbar-color:rgba(99,102,241,.3) transparent}
.tw::-webkit-scrollbar{height:4px}
.tw::-webkit-scrollbar-thumb{background:rgba(99,102,241,.3);border-radius:2px}
.tt{display:flex;gap:18px;width:max-content}
.tcard{width:340px;flex-shrink:0;padding:28px}
.tstars{font-size:.88rem;color:var(--amber);margin-bottom:14px;filter:drop-shadow(0 0 5px rgba(245,158,11,.4))}
.ttxt{font-size:.9rem;color:var(--txt2);line-height:1.75;margin-bottom:20px;font-style:italic}
.tauth{display:flex;align-items:center;gap:12px}
.tav{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.88rem;color:#fff;flex-shrink:0;background:linear-gradient(135deg,var(--indigo),var(--violet))}
.tn{font-weight:600;font-size:.88rem}
.tr2{font-size:.73rem;color:var(--txt3)}
#pricing{padding:100px 0;overflow:hidden}
.pg{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:56px}
.pcard{padding:32px;position:relative}
.pcard.feat{background:rgba(99,102,241,.08);border-color:rgba(99,102,241,.36);box-shadow:0 0 70px rgba(99,102,241,.15)}
.pcard.feat::before{content:'MAIS POPULAR';position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,var(--indigo),var(--violet));color:#fff;font-size:.63rem;font-weight:700;letter-spacing:.12em;padding:4px 12px;border-radius:100px;white-space:nowrap}
.pname{font-family:'Syne',sans-serif;font-size:1.7rem;font-weight:800;color:var(--txt);margin-bottom:6px;letter-spacing:-.02em;padding-bottom:14px;border-bottom:1px solid var(--gbd)}
.pcard.feat .pname{background:linear-gradient(135deg,var(--indigo-l),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.pdesc{font-size:.82rem;color:var(--txt3);margin:10px 0 18px}
.pprice{margin-bottom:4px}
.pcur{font-size:.95rem;color:var(--indigo-l);vertical-align:top;margin-top:8px;display:inline-block}
.pamt{font-family:'Syne',sans-serif;font-size:2.9rem;font-weight:800;color:var(--txt)}
.pper{font-size:.82rem;color:var(--txt3)}
.panual{font-size:.73rem;color:var(--txt3);margin-bottom:20px}
.pfl{list-style:none;display:flex;flex-direction:column;gap:9px;margin-bottom:26px}
.pfl li{display:flex;align-items:flex-start;gap:8px;font-size:.83rem;color:var(--txt2)}
.pfl li::before{content:'✓';color:var(--emerald);font-weight:700;flex-shrink:0;filter:drop-shadow(0 0 3px rgba(16,185,129,.4));margin-top:1px}
.pfl li.star::before{content:'★';color:var(--amber);filter:drop-shadow(0 0 4px rgba(245,158,11,.5))}
.pfl li.note{color:var(--txt3);font-size:.77rem;padding-left:16px}
.pfl li.note::before{content:'';margin:0}
.pcta{width:100%;justify-content:center;padding:13px}
#faq{padding:100px 0}
.fql{display:flex;flex-direction:column;gap:10px;margin-top:56px;max-width:780px;margin-left:auto;margin-right:auto}
.fqi{border-radius:var(--r);overflow:hidden;cursor:pointer}
.fqq{padding:20px 24px;display:flex;justify-content:space-between;align-items:center;gap:16px;font-weight:600;font-size:.92rem}
.fqtg{width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:rgba(99,102,241,.1);color:var(--indigo-l);flex-shrink:0;transition:transform .3s;font-size:1rem}
.fqi.open .fqtg{transform:rotate(45deg)}
.fqa{max-height:0;overflow:hidden;transition:max-height .4s ease,padding .3s;padding:0 24px;font-size:.86rem;color:var(--txt2);line-height:1.75}
.fqi.open .fqa{max-height:200px;padding:0 24px 20px}
#ctaf{padding:100px 0}
.ctabox{text-align:center;padding:80px 40px;border-radius:32px;background:linear-gradient(135deg,rgba(99,102,241,.1) 0%,rgba(124,58,237,.08) 50%,rgba(34,211,238,.05) 100%);border:1px solid rgba(99,102,241,.2);position:relative;overflow:hidden}
.ctabox::before{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:600px;height:1px;background:linear-gradient(90deg,transparent,rgba(99,102,241,.55),transparent)}
.ctabox::after{content:'';position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:400px;height:1px;background:linear-gradient(90deg,transparent,rgba(34,211,238,.35),transparent)}
.ctabox h2{margin-bottom:18px}
.ctabox>p{color:var(--txt2);font-size:1.08rem;margin-bottom:38px;max-width:500px;margin-left:auto;margin-right:auto}
.ctabox .bp{font-size:1.1rem;padding:18px 44px}
.ctrust{display:flex;gap:22px;justify-content:center;flex-wrap:wrap;margin-top:18px;font-size:.78rem;color:var(--txt3)}
.ctrust span{display:flex;align-items:center;gap:5px}
footer{padding:36px 0;border-top:1px solid var(--gbd)}
.fi{display:flex;justify-content:space-between;align-items:center}
.fc{font-size:.78rem;color:var(--txt3)}
.fc a{color:var(--txt3);text-decoration:none}
.sc2{text-align:center}
.sc2 p{color:var(--txt2);margin-top:12px;max-width:520px;margin-left:auto;margin-right:auto;font-size:1rem}
@media(max-width:980px){
  .hero-grid{grid-template-columns:1fr}.hero-visual{display:none}
  .pain-grid{grid-template-columns:1fr}.fg{grid-template-columns:1fr 1fr}
  .pg{grid-template-columns:1fr}.stats{grid-template-columns:repeat(2,1fr)}
  .nav-links{display:none}.fi{flex-direction:column;gap:14px;text-align:center}
  .hbox{padding:40px 24px}
  .ci-stats{grid-template-columns:repeat(2,1fr) !important}
  .roda-grid{grid-template-columns:1fr !important}
}
@media(max-width:560px){
  .fg{grid-template-columns:1fr}
  .ci-stats{grid-template-columns:1fr !important}
}
`;

const HTML = `
<div id="cg"></div>
<div class="orbs"><div class="orb o1"></div><div class="orb o2"></div><div class="orb o3"></div></div>

<svg style="display:none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <symbol id="ic-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      <line x1="9" y1="10" x2="9.01" y2="10" stroke-width="2.5"/>
      <line x1="12" y1="10" x2="12.01" y2="10" stroke-width="2.5"/>
      <line x1="15" y1="10" x2="15.01" y2="10" stroke-width="2.5"/>
    </symbol>
    <symbol id="ic-kanban" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="4" width="5" height="17" rx="1.5"/>
      <rect x="9.5" y="8" width="5" height="13" rx="1.5"/>
      <rect x="17" y="6" width="5" height="15" rx="1.5"/>
    </symbol>
    <symbol id="ic-refresh" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="1 4 1 10 7 10"/>
      <polyline points="23 20 23 14 17 14"/>
      <path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15"/>
    </symbol>
    <symbol id="ic-calendar-heart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <path d="M12 17.5l-1.8-1.8C9 14.5 9 13 10.5 13c.75 0 1.5.6 1.5.6s.75-.6 1.5-.6C15 13 15 14.5 13.8 15.7L12 17.5z"/>
    </symbol>
    <symbol id="ic-broadcast" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M15.54 8.46a5 5 0 010 7.07"/>
      <path d="M19.07 4.93a10 10 0 010 14.14"/>
    </symbol>
    <symbol id="ic-chart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </symbol>
    <symbol id="ic-cpu" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <rect x="9" y="9" width="6" height="6" rx="1"/>
      <rect x="5" y="5" width="14" height="14" rx="3"/>
      <path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4"/>
    </symbol>
    <symbol id="ic-layers" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </symbol>
    <symbol id="ic-cal-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <polyline points="9 15 11 17 15 13"/>
    </symbol>
    <symbol id="ic-phone-send" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.72 11 19.79 19.79 0 011.7 2.38 2 2 0 013.68.18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.91 7.91a16 16 0 006.18 6.18l1.8-1.8a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
      <polyline points="16 2 21 2 21 7"/>
      <line x1="21" y1="2" x2="14" y2="9"/>
    </symbol>
    <symbol id="ic-check-circle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="16 9 10.5 14.5 8 12"/>
    </symbol>
    <symbol id="ic-mail" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22 6 12 13 2 6"/>
    </symbol>
    <symbol id="ic-rebuy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </symbol>
    <symbol id="ic-send" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </symbol>
    <symbol id="ic-zap" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </symbol>
  </defs>
</svg>

<nav id="nav">
  <div class="container">
    <div class="nav-i">
      <div>
        <a href="#" class="logo">CRM Fácil</a>
        <div style="font-size:.65rem;color:var(--txt3);letter-spacing:.04em;margin-top:1px">Sua IA vende. Seu time de vendas fecha.</div>
      </div>
      <ul class="nav-links">
        <li><a href="#features">Funcionalidades</a></li>
        <li><a href="#hiw">Como Funciona</a></li>
        <li><a href="#pricing">Preços</a></li>
        <li><a href="#faq">FAQ</a></li>
      </ul>
      <a href="https://www.ocrmfacil.com.br/registro" class="btn bp" style="padding:10px 20px;font-size:.88rem">Testar grátis — 30 dias</a>
    </div>
  </div>
</nav>

<section id="hero">
  <div class="container">
    <div class="hero-grid">
      <div class="hero-content">
        <div class="hbadge">IA de Vendas Ativa 24h por dia · 7 dias por semana</div>
        <h1 class="hero-h1">Sua empresa<br><span class="grad">vendendo 24h</span><br>sem contratar<br>ninguém</h1>
        <p style="font-size:.9rem;color:var(--indigo-l);font-weight:600;letter-spacing:.03em;margin-bottom:18px;margin-top:-10px">Sua IA vende. Seu time de vendas fecha.</p>
        <p class="hero-sub">A IA do CRM Fácil atende seus leads no WhatsApp, qualifica, agenda e aquece — e só te chama quando o cliente está <strong>pronto pra comprar.</strong></p>
        <div class="hero-ctas">
          <a href="https://www.ocrmfacil.com.br/registro" class="btn bp">Começar 30 dias grátis →</a>
          <a href="#hiw" class="btn bs">Ver como funciona ↓</a>
        </div>
        <p class="hero-trust">✓ Sem cartão<span>·</span>✓ Setup em 5 min<span>·</span>✓ Cancele quando quiser</p>
        <div style="margin-top:16px">
          <a href="/caminho-do-lead" target="_blank" style="display:inline-flex;align-items:center;gap:6px;font-size:.82rem;color:rgba(129,140,248,.8);text-decoration:none;transition:color .2s" onmouseover="this.style.color='#818cf8'" onmouseout="this.style.color='rgba(129,140,248,.8)'">
            <span style="display:inline-block;width:6px;height:6px;background:#22d3ee;border-radius:50%;animation:blink 2s ease-in-out infinite"></span>
            Ver o caminho completo de 90 dias do lead →
          </a>
        </div>
        <div class="stats">
          <div class="gc sc2-stat"><div class="sv">24/7</div><div class="sl">Atendimento ativo</div></div>
          <div class="gc sc2-stat"><div class="sv">&lt;30s</div><div class="sl">Tempo de resposta</div></div>
          <div class="gc sc2-stat"><div class="sv">10×</div><div class="sl">Mais conversão</div></div>
          <div class="gc sc2-stat"><div class="sv">R$0</div><div class="sl">Em contratações</div></div>
        </div>
      </div>
      <div class="hero-visual" style="position:relative">
        <div class="pbadge">
          <div class="bt">● IA respondendo agora</div>
          <div class="bs2">23 leads ativos · pipeline em tempo real</div>
        </div>
        <div class="phone">
          <div class="ph-hd">
            <div class="ph-av">CF</div>
            <div><div class="ph-name">IA CRM Fácil</div><div class="ph-st">Online agora</div></div>
          </div>
          <div class="ph-body">
            <div class="cm u">Olá! Vi que vocês fazem atendimento. Quanto custa?<div class="cm-m">João · 14:22</div></div>
            <div class="cm ai">Oi, João! Sim, fazemos! Antes de te mostrar os planos, me diz: qual é o tamanho da sua equipe de vendas?<div class="cm-m r">IA · 14:22 · respondeu em 4s</div></div>
            <div class="cm u">Tenho 3 vendedores<div class="cm-m">João · 14:23</div></div>
            <div class="cm ai">Perfeito! O plano Pro é ideal pra vocês. Posso agendar uma demo rápida. Prefere hoje ou amanhã?<div class="cm-m r">IA · 14:23 · respondeu em 2s</div></div>
            <div class="typing"><div class="td"></div><div class="td"></div><div class="td"></div></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<div id="ticker">
  <div class="tk-i">
    <div class="tk-item"><svg class="tk-icon"><use href="#ic-chat"/></svg><span><strong>Atendimento 24/7</strong> no WhatsApp</span></div>
    <div class="tk-dot"></div>
    <div class="tk-item"><svg class="tk-icon"><use href="#ic-cpu"/></svg><span><strong>IA qualifica leads</strong> automaticamente</span></div>
    <div class="tk-dot"></div>
    <div class="tk-item"><svg class="tk-icon"><use href="#ic-cal-check"/></svg><span><strong>Agendamento automático</strong> integrado</span></div>
    <div class="tk-dot"></div>
    <div class="tk-item"><svg class="tk-icon"><use href="#ic-calendar-heart"/></svg><span><strong>Parabéns automático</strong> no aniversário</span></div>
    <div class="tk-dot"></div>
    <div class="tk-item"><svg class="tk-icon"><use href="#ic-kanban"/></svg><span><strong>Pipeline visual</strong> em tempo real</span></div>
    <div class="tk-dot"></div>
    <div class="tk-item"><svg class="tk-icon"><use href="#ic-refresh"/></svg><span><strong>Follow-up automático</strong> zero leads perdidos</span></div>
    <div class="tk-dot"></div>
    <div class="tk-item"><svg class="tk-icon"><use href="#ic-mail"/></svg><span><strong>Pós-venda</strong> automático</span></div>
    <div class="tk-dot"></div>
    <div class="tk-item"><svg class="tk-icon"><use href="#ic-chat"/></svg><span><strong>Atendimento 24/7</strong> no WhatsApp</span></div>
    <div class="tk-dot"></div>
    <div class="tk-item"><svg class="tk-icon"><use href="#ic-cpu"/></svg><span><strong>IA qualifica leads</strong> automaticamente</span></div>
    <div class="tk-dot"></div>
    <div class="tk-item"><svg class="tk-icon"><use href="#ic-cal-check"/></svg><span><strong>Agendamento automático</strong> integrado</span></div>
    <div class="tk-dot"></div>
    <div class="tk-item"><svg class="tk-icon"><use href="#ic-calendar-heart"/></svg><span><strong>Parabéns automático</strong> no aniversário</span></div>
    <div class="tk-dot"></div>
    <div class="tk-item"><svg class="tk-icon"><use href="#ic-kanban"/></svg><span><strong>Pipeline visual</strong> em tempo real</span></div>
    <div class="tk-dot"></div>
    <div class="tk-item"><svg class="tk-icon"><use href="#ic-refresh"/></svg><span><strong>Follow-up automático</strong> zero leads perdidos</span></div>
    <div class="tk-dot"></div>
    <div class="tk-item"><svg class="tk-icon"><use href="#ic-mail"/></svg><span><strong>Pós-venda</strong> automático</span></div>
  </div>
</div>

<section id="pain">
  <div class="container">
    <div class="pain-header fu">
      <div class="lbl">O Problema</div>
      <h2>Quantas vendas você perde <span class="grad">todo dia?</span></h2>
      <p class="pain-sub">Cada lead sem resposta rápida vai direto pro concorrente. E a maioria dos vendedores não tem tempo — nem paciência — pra fazer follow-up até a venda acontecer.</p>
    </div>
    <div class="pain-grid">
      <div class="pcol bad fu">
        <div class="pcol-t">✗ Sem o CRM Fácil</div>
        <ul class="pl">
          <li><span class="ic">✗</span>Cliente manda mensagem e fica horas sem resposta</li>
          <li><span class="ic">✗</span>Vendedor esquece do follow-up e perde a venda</li>
          <li><span class="ic">✗</span>Não sabe onde cada lead está no funil</li>
          <li><span class="ic">✗</span>Nunca lembra de parabenizar no aniversário</li>
          <li><span class="ic">✗</span>Promoções enviadas manualmente, uma por uma</li>
          <li><span class="ic">✗</span>Pós-venda inexistente — cliente some após a compra</li>
        </ul>
      </div>
      <div class="pcol good fu">
        <div class="pcol-t">✓ Com o CRM Fácil</div>
        <ul class="pl">
          <li><span class="ic">✓</span>IA responde em menos de 30 segundos, 24h por dia</li>
          <li><span class="ic">✓</span>Follow-up automático no momento certo — zero perdidos</li>
          <li><span class="ic">✓</span>Kanban visual com todos os leads por etapa</li>
          <li><span class="ic">✓</span>Parabéns automático e personalizado no aniversário</li>
          <li><span class="ic">✓</span>Campanhas para centenas de clientes em 1 clique</li>
          <li><span class="ic">✓</span>Pós-venda e recompra no piloto automático</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<section id="hiw">
  <div class="container">
    <div class="hiw-hd fu">
      <div class="lbl">Jornada automática</div>
      <h2>Como a IA trabalha <span class="grad">por você</span></h2>
      <p style="color:var(--txt2);margin-top:10px;font-size:.98rem">Do primeiro "oi" até a recompra — tudo no piloto automático.</p>
      <div class="sdiv"></div>
    </div>
  </div>
  <div class="container" style="overflow:visible">
    <div class="sw">
      <div class="st">
        <div class="gc scard"><div class="sn">01</div><div class="si"><svg width="30" height="30"><use href="#ic-chat"/></svg></div><div class="st2">Mensagem chega</div><div class="sd">Lead manda "oi" no WhatsApp — qualquer hora do dia ou da noite.</div></div>
        <div class="sarr"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M14 6l6 6-6 6"/></svg></div>
        <div class="gc scard"><div class="sn">02</div><div class="si"><svg width="30" height="30"><use href="#ic-cpu"/></svg></div><div class="st2">IA responde em &lt;30s</div><div class="sd">Qualifica o interesse, tira dúvidas, envia catálogo e entende o que o cliente precisa.</div></div>
        <div class="sarr"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M14 6l6 6-6 6"/></svg></div>
        <div class="gc scard"><div class="sn">03</div><div class="si"><svg width="30" height="30"><use href="#ic-layers"/></svg></div><div class="st2">Lead no pipeline</div><div class="sd">CRM registra e acompanha: Lead → Aquecimento → Pronto pra Comprar.</div></div>
        <div class="sarr"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M14 6l6 6-6 6"/></svg></div>
        <div class="gc scard"><div class="sn">04</div><div class="si"><svg width="30" height="30"><use href="#ic-cal-check"/></svg></div><div class="st2">Agenda / Orçamento</div><div class="sd">Quando está pronto, a IA oferece horário e fecha o agendamento sem pressão.</div></div>
        <div class="sarr"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M14 6l6 6-6 6"/></svg></div>
        <div class="gc scard"><div class="sn">05</div><div class="si"><svg width="30" height="30"><use href="#ic-send"/></svg></div><div class="st2">Resumo pro vendedor</div><div class="sd">Quando o lead está quente, a IA envia o contexto completo no WhatsApp do vendedor.</div></div>
        <div class="sarr"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M14 6l6 6-6 6"/></svg></div>
        <div class="gc scard"><div class="sn">06</div><div class="si"><svg width="30" height="30"><use href="#ic-check-circle"/></svg></div><div class="st2">Venda fechada</div><div class="sd">Lead vira cliente. Registrado com valor, data e vendedor responsável.</div></div>
        <div class="sarr"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M14 6l6 6-6 6"/></svg></div>
        <div class="gc scard"><div class="sn">07</div><div class="si"><svg width="30" height="30"><use href="#ic-mail"/></svg></div><div class="st2">Pós-venda D+7</div><div class="sd">7 dias depois, IA pergunta como foi a experiência. Fidelização automática.</div></div>
        <div class="sarr"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M14 6l6 6-6 6"/></svg></div>
        <div class="gc scard"><div class="sn">08</div><div class="si"><svg width="30" height="30"><use href="#ic-rebuy"/></svg></div><div class="st2">Recompra D+28</div><div class="sd">Proposta personalizada baseada no histórico do cliente. Na hora certa, sem forçar.</div></div>
      </div>
    </div>
  </div>
</section>

<section id="features">
  <div class="container">
    <div class="sc2 fu">
      <div class="lbl">Funcionalidades</div>
      <h2>Tudo que você precisa para <span class="grad">vender mais</span></h2>
      <p>Sem trabalhar mais. Sem contratar mais. Só a tecnologia fazendo o que ela faz de melhor.</p>
    </div>
    <div class="fg">
      <div class="gc fcard fu"><div class="ni"><svg width="24" height="24"><use href="#ic-chat"/></svg></div><div class="ft">IA responde 24/7</div><div class="fd">Sua IA qualifica leads, tira dúvidas, envia catálogo e agenda — sozinha. Sem depender de ninguém.</div></div>
      <div class="gc fcard fu"><div class="ni c"><svg width="24" height="24"><use href="#ic-kanban"/></svg></div><div class="ft">Pipeline de Leads</div><div class="fd">Kanban completo com arrastar e soltar. Veja exatamente onde cada lead está e o que falta para fechar.</div></div>
      <div class="gc fcard fu"><div class="ni e"><svg width="24" height="24"><use href="#ic-refresh"/></svg></div><div class="ft">Follow-up Automático</div><div class="fd">O sistema lembra e manda mensagem no momento certo. Zero leads esquecidos. Zero vendas perdidas.</div></div>
      <div class="gc fcard fu"><div class="ni a"><svg width="24" height="24"><use href="#ic-calendar-heart"/></svg></div><div class="ft">Aniversário Automático</div><div class="fd">Parabeniza cada cliente no dia certo com mensagem personalizada. Fidelização sem precisar lembrar de nada.</div></div>
      <div class="gc fcard fu"><div class="ni"><svg width="24" height="24"><use href="#ic-broadcast"/></svg></div><div class="ft">Campanhas em Massa</div><div class="fd">Envie promoções para toda a base via WhatsApp com poucos cliques. Segmentação por perfil de cliente.</div></div>
      <div class="gc fcard fu"><div class="ni c"><svg width="24" height="24"><use href="#ic-chart"/></svg></div><div class="ft">Analytics Completo</div><div class="fd">Faturamento, conversão e ranking de vendedores em tempo real. Decisões baseadas em dados, não em chute.</div></div>
    </div>
  </div>
</section>

<section style="padding:20px 0 60px;position:relative;z-index:2">
  <div class="container">
    <div class="hbox fu">
      <div class="hbox-icon">
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="rgba(99,102,241,.9)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 18px rgba(99,102,241,.6))">
          <rect x="9" y="9" width="6" height="6" rx="1"/>
          <rect x="5" y="5" width="14" height="14" rx="3"/>
          <path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4"/>
        </svg>
      </div>
      <h2>A maioria dos vendedores não tem tempo de relacionar até a venda acontecer.</h2>
      <p>Sua IA do CRM Fácil tem paciência infinita. Ela manda mensagem toda semana, parabeniza no aniversário, pergunta como foi a experiência e oferece o desconto na hora certa. Ela cria empatia e reciprocidade — e o cliente chega querendo comprar da <em>sua</em> empresa.</p>
      <a href="https://www.ocrmfacil.com.br/registro" class="btn bp" style="font-size:1.05rem;padding:16px 36px">Começar agora — 30 dias grátis</a>
    </div>
  </div>
</section>

<section id="carteiras" style="padding:100px 0;position:relative;z-index:2">
  <div class="container">
    <div class="sc2 fu">
      <div class="lbl">O dinheiro que já é seu</div>
      <h2>Sua carteira inativa vale entre<br><span class="grad">R$ 75 mil e R$ 200 mil</span></h2>
      <p style="color:var(--txt2);margin-top:14px;max-width:560px;margin-left:auto;margin-right:auto;font-size:1rem">Você já pagou para trazer esses clientes. Eles compraram de você. Depois disso — o que aconteceu?</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:52px 0" class="ci-stats">
      <div class="gc fu" style="padding:28px 20px;text-align:center">
        <div style="font-family:'Syne',sans-serif;font-size:2.4rem;font-weight:800;background:linear-gradient(135deg,var(--red),#f97316);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">68%</div>
        <div style="font-size:.82rem;color:var(--txt2);margin-top:8px;line-height:1.5">dos clientes que abandonam uma empresa fazem isso por <strong style="color:var(--txt)">falta de atenção</strong> — não por preço ou produto</div>
      </div>
      <div class="gc fu" style="padding:28px 20px;text-align:center">
        <div style="font-family:'Syne',sans-serif;font-size:2.4rem;font-weight:800;background:linear-gradient(135deg,var(--amber),#f97316);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">7×</div>
        <div style="font-size:.82rem;color:var(--txt2);margin-top:8px;line-height:1.5">mais barato vender para um cliente existente do que <strong style="color:var(--txt)">adquirir um novo</strong></div>
      </div>
      <div class="gc fu" style="padding:28px 20px;text-align:center">
        <div style="font-family:'Syne',sans-serif;font-size:2.4rem;font-weight:800;background:linear-gradient(135deg,var(--indigo-l),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">R$400</div>
        <div style="font-size:.82rem;color:var(--txt2);margin-top:8px;line-height:1.5">é o custo médio para <strong style="color:var(--txt)">adquirir um lead</strong> no Brasil — que foi parar numa planilha e sumiu</div>
      </div>
      <div class="gc fu" style="padding:28px 20px;text-align:center">
        <div style="font-family:'Syne',sans-serif;font-size:2.4rem;font-weight:800;background:linear-gradient(135deg,var(--emerald),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">13%</div>
        <div style="font-size:.82rem;color:var(--txt2);margin-top:8px;line-height:1.5">das empresas têm um processo <strong style="color:var(--txt)">estruturado de follow-up</strong> pós-venda. O resto improvisa.</div>
      </div>
    </div>
    <div class="fu" style="background:linear-gradient(135deg,rgba(239,68,68,.07) 0%,rgba(245,158,11,.05) 100%);border:1px solid rgba(239,68,68,.2);border-radius:24px;padding:44px 48px;max-width:820px;margin:0 auto;position:relative;overflow:hidden">
      <div style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:500px;height:1px;background:linear-gradient(90deg,transparent,rgba(239,68,68,.4),transparent)"></div>
      <p style="font-family:'Syne',sans-serif;font-size:1.25rem;font-weight:700;line-height:1.5;color:var(--txt);margin-bottom:20px">
        "Você investiu até R$ 400 por lead para trazer cada um desses clientes.<br>Eles compraram de você.<br>Depois disso — <span style="color:#f87171">alguém ligou pra saber se ficaram satisfeitos?</span><br>Alguém ofereceu algo novo 30 dias depois?"
      </p>
      <p style="font-size:1rem;color:var(--txt2);line-height:1.75;margin-bottom:28px">
        A resposta honesta de <strong style="color:var(--txt)">90% das empresas</strong>: ninguém.<br>
        Uma carteira inativa de 500 clientes representa, em média, <strong style="color:var(--emerald)">R$ 75.000 a R$ 200.000 em receita não capturada por ano.</strong>
        Esse dinheiro não foi perdido — ele está esperando alguém entrar em contato.
      </p>
      <a href="https://www.ocrmfacil.com.br/registro" class="btn bp">Recuperar minha carteira inativa →</a>
    </div>
  </div>
</section>

<section id="roda" style="padding:60px 0 100px;position:relative;z-index:2">
  <div class="container">
    <div class="sc2 fu">
      <div class="lbl">Metodologia exclusiva</div>
      <h2>A <span class="grad">Roda de Relacionamento</span></h2>
      <p style="color:var(--txt2);margin-top:14px;max-width:600px;margin-left:auto;margin-right:auto;font-size:1rem">
        A maioria das empresas trata o cliente como uma transação — vende e esquece.<br>
        A Roda de Relacionamento funciona diferente: é um ciclo contínuo onde nenhum contato é desperdiçado.
        <strong style="color:var(--txt)">A roda só para quando o cliente pede para parar.</strong>
      </p>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:52px" class="roda-grid">
      <div class="gc fu" style="padding:28px;display:flex;gap:18px;align-items:flex-start">
        <div style="width:40px;height:40px;border-radius:10px;background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.25);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:'Syne',sans-serif;font-size:.75rem;font-weight:700;color:var(--indigo-l)">01</div>
        <div><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:.95rem;margin-bottom:6px">O lead entra na roda</div><div style="font-size:.83rem;color:var(--txt2);line-height:1.6">A IA identifica se é contato novo ou recorrente, carrega o histórico completo e começa com contexto real — não do zero.</div></div>
      </div>
      <div class="gc fu" style="padding:28px;display:flex;gap:18px;align-items:flex-start">
        <div style="width:40px;height:40px;border-radius:10px;background:rgba(34,211,238,.12);border:1px solid rgba(34,211,238,.25);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:'Syne',sans-serif;font-size:.75rem;font-weight:700;color:var(--cyan)">02</div>
        <div><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:.95rem;margin-bottom:6px">A IA lê o momento do cliente</div><div style="font-size:.83rem;color:var(--txt2);line-height:1.6">Comprou recentemente? Foco na experiência. Sumiu há tempo? Reaproxima com leveza. É novo? Qualifica e apresenta soluções.</div></div>
      </div>
      <div class="gc fu" style="padding:28px;display:flex;gap:18px;align-items:flex-start">
        <div style="width:40px;height:40px;border-radius:10px;background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.25);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:'Syne',sans-serif;font-size:.75rem;font-weight:700;color:var(--emerald)">03</div>
        <div><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:.95rem;margin-bottom:6px">Conversa humanizada, sem parecer robô</div><div style="font-size:.83rem;color:var(--txt2);line-height:1.6">O cliente sente que está falando com alguém que conhece o negócio. Faz perguntas, entende a necessidade, tira dúvidas em linguagem natural.</div></div>
      </div>
      <div class="gc fu" style="padding:28px;display:flex;gap:18px;align-items:flex-start">
        <div style="width:40px;height:40px;border-radius:10px;background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.25);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:'Syne',sans-serif;font-size:.75rem;font-weight:700;color:var(--amber)">04</div>
        <div><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:.95rem;margin-bottom:6px">Vendedor entra só na hora certa</div><div style="font-size:.83rem;color:var(--txt2);line-height:1.6">Recebe no WhatsApp: nome do cliente, o que ele quer, resumo da conversa e próximo passo. Sem pesquisar, sem perguntar o que já foi perguntado. Só chegar e fechar.</div></div>
      </div>
      <div class="gc fu" style="padding:28px;display:flex;gap:18px;align-items:flex-start">
        <div style="width:40px;height:40px;border-radius:10px;background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.25);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:'Syne',sans-serif;font-size:.75rem;font-weight:700;color:var(--indigo-l)">05</div>
        <div><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:.95rem;margin-bottom:6px">Pós-venda monitorado automaticamente</div><div style="font-size:.83rem;color:var(--txt2);line-height:1.6">D+7 verifica experiência. D+20 oferece suporte. D+45 faz oferta personalizada com base no histórico. Problema? Gerente avisado imediatamente.</div></div>
      </div>
      <div class="gc fu" style="padding:28px;display:flex;gap:18px;align-items:flex-start">
        <div style="width:40px;height:40px;border-radius:10px;background:rgba(236,72,153,.12);border:1px solid rgba(236,72,153,.25);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:'Syne',sans-serif;font-size:.75rem;font-weight:700;color:#ec4899">06</div>
        <div><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:.95rem;margin-bottom:6px">Ninguém é esquecido — nem no aniversário</div><div style="font-size:.83rem;color:var(--txt2);line-height:1.6">No aniversário, a IA manda parabéns e avisa o vendedor com um resumo do cliente — para que a conversa seja real, não genérica.</div></div>
      </div>
    </div>
    <div class="fu" style="margin-top:44px;padding:36px 44px;border-radius:20px;background:rgba(99,102,241,.05);border:1px solid rgba(99,102,241,.18);text-align:center;max-width:760px;margin-left:auto;margin-right:auto">
      <div style="font-size:2rem;margin-bottom:12px;filter:drop-shadow(0 0 12px rgba(99,102,241,.5))">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(99,102,241,.8)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          <line x1="9" y1="10" x2="9.01" y2="10" stroke-width="2.5"/>
          <line x1="12" y1="10" x2="12.01" y2="10" stroke-width="2.5"/>
          <line x1="15" y1="10" x2="15.01" y2="10" stroke-width="2.5"/>
        </svg>
      </div>
      <p style="font-family:'Syne',sans-serif;font-size:1.15rem;font-weight:700;line-height:1.6;color:var(--txt);margin-bottom:10px">
        "Você já pagou para trazer esse cliente até você.<br>
        A Roda de Relacionamento garante que ele nunca seja esquecido<br>
        — e que sempre tenha um motivo para voltar."
      </p>
    </div>
  </div>
</section>

<section id="testi">
  <div class="container">
    <div class="fu"><div class="lbl">Quem usa</div><h2>Quem usa, <span class="grad">não volta atrás</span></h2></div>
  </div>
  <div class="container" style="overflow:visible">
    <div class="tw">
      <div class="tt">
        <div class="gc tcard"><div class="tstars">★★★★★</div><p class="ttxt">"Antes eu perdia cliente por não responder rápido. Agora a IA responde em segundos, já manda o link de agendamento e o cliente agenda sozinho. Minha agenda encheu em 2 semanas."</p><div class="tauth"><div class="tav">RM</div><div><div class="tn">Rafaela M.</div><div class="tr2">Dona — Studio de Sobrancelhas</div></div></div></div>
        <div class="gc tcard"><div class="tstars">★★★★★</div><p class="ttxt">"Nosso WhatsApp recebia 80 mensagens por dia e o vendedor não dava conta. Com o CRM Fácil a IA filtra, responde e só passa pro vendedor quem está quente. Subimos 40% na conversão."</p><div class="tauth"><div class="tav" style="background:linear-gradient(135deg,var(--cyan),var(--emerald))">MT</div><div><div class="tn">Marcelo T.</div><div class="tr2">Gestor — Loja de Tintas</div></div></div></div>
        <div class="gc tcard"><div class="tstars">★★★★★</div><p class="ttxt">"O follow-up automático recuperou pacientes que tinham sumido há meses. O sistema manda a mensagem certa na hora certa — parece mágica. Recomendo demais."</p><div class="tauth"><div class="tav" style="background:linear-gradient(135deg,var(--violet),#ec4899)">CS</div><div><div class="tn">Carla S.</div><div class="tr2">Diretora — Clínica Odontológica</div></div></div></div>
        <div class="gc tcard"><div class="tstars">★★★★★</div><p class="ttxt">"A IA mandou parabéns pra um cliente antigo que a gente tinha esquecido. Ele respondeu pedindo orçamento novo. Só isso já pagou o plano inteiro do mês."</p><div class="tauth"><div class="tav" style="background:linear-gradient(135deg,var(--amber),#f97316)">AP</div><div><div class="tn">Ana Paula R.</div><div class="tr2">Sócia — Boutique de Moda</div></div></div></div>
      </div>
    </div>
  </div>
</section>

<section id="comparativo" style="padding:100px 0 0;position:relative;z-index:2">
  <div class="container">
    <div class="sc2 fu">
      <div class="lbl">Comparativo de mercado</div>
      <h2>O que outros cobram —<br><span class="grad">e o que entregam</span></h2>
      <p style="color:var(--txt2);margin-top:14px;max-width:560px;margin-left:auto;margin-right:auto;font-size:1rem">Pesquisamos os principais concorrentes. O resultado vai te surpreender.</p>
    </div>
    <div style="margin-top:52px;overflow-x:auto" class="fu">
      <table style="width:100%;border-collapse:collapse;min-width:700px">
        <thead>
          <tr>
            <th style="padding:14px 18px;text-align:left;font-size:.75rem;color:var(--txt3);font-weight:600;letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid var(--gbd)">Plataforma</th>
            <th style="padding:14px 18px;text-align:center;font-size:.75rem;color:var(--txt3);font-weight:600;letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid var(--gbd)">Preço</th>
            <th style="padding:14px 18px;text-align:center;font-size:.75rem;color:var(--txt3);font-weight:600;letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid var(--gbd)">IA incluída</th>
            <th style="padding:14px 18px;text-align:center;font-size:.75rem;color:var(--txt3);font-weight:600;letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid var(--gbd)">Pós-venda auto</th>
            <th style="padding:14px 18px;text-align:center;font-size:.75rem;color:var(--txt3);font-weight:600;letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid var(--gbd)">Reativação de carteira</th>
            <th style="padding:14px 18px;text-align:center;font-size:.75rem;color:var(--txt3);font-weight:600;letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid var(--gbd)">Aniversário auto</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid var(--gbd)"><td style="padding:16px 18px;font-size:.88rem;font-weight:600;color:var(--txt2)">Letalk</td><td style="padding:16px 18px;text-align:center;font-size:.85rem;color:var(--txt2)">R$ 600–1.200/mês<br><span style="font-size:.72rem;color:var(--txt3)">IA cobrada à parte</span></td><td style="padding:16px 18px;text-align:center;font-size:1rem;color:#f87171">✗</td><td style="padding:16px 18px;text-align:center;font-size:1rem;color:#f87171">✗</td><td style="padding:16px 18px;text-align:center;font-size:1rem;color:#f87171">✗</td><td style="padding:16px 18px;text-align:center;font-size:1rem;color:#f87171">✗</td></tr>
          <tr style="border-bottom:1px solid var(--gbd)"><td style="padding:16px 18px;font-size:.88rem;font-weight:600;color:var(--txt2)">Kommo</td><td style="padding:16px 18px;text-align:center;font-size:.85rem;color:var(--txt2)">R$ 200–600<br><span style="font-size:.72rem;color:var(--txt3)">por usuário/mês</span></td><td style="padding:16px 18px;text-align:center;font-size:.8rem;color:var(--txt3)">Básica</td><td style="padding:16px 18px;text-align:center;font-size:1rem;color:#f87171">✗</td><td style="padding:16px 18px;text-align:center;font-size:1rem;color:#f87171">✗</td><td style="padding:16px 18px;text-align:center;font-size:1rem;color:#f87171">✗</td></tr>
          <tr style="border-bottom:1px solid var(--gbd)"><td style="padding:16px 18px;font-size:.88rem;font-weight:600;color:var(--txt2)">SocialHub</td><td style="padding:16px 18px;text-align:center;font-size:.85rem;color:var(--txt2)">R$ 99–499/mês</td><td style="padding:16px 18px;text-align:center;font-size:.8rem;color:var(--txt3)">Parcial</td><td style="padding:16px 18px;text-align:center;font-size:1rem;color:#f87171">✗</td><td style="padding:16px 18px;text-align:center;font-size:1rem;color:#f87171">✗</td><td style="padding:16px 18px;text-align:center;font-size:1rem;color:#f87171">✗</td></tr>
          <tr style="border-bottom:1px solid var(--gbd)"><td style="padding:16px 18px;font-size:.88rem;font-weight:600;color:var(--txt2)">RD Station CRM</td><td style="padding:16px 18px;text-align:center;font-size:.85rem;color:var(--txt2)">R$ 73–131<br><span style="font-size:.72rem;color:var(--txt3)">por usuário/mês</span></td><td style="padding:16px 18px;text-align:center;font-size:1rem;color:#f87171">✗</td><td style="padding:16px 18px;text-align:center;font-size:1rem;color:#f87171">✗</td><td style="padding:16px 18px;text-align:center;font-size:1rem;color:#f87171">✗</td><td style="padding:16px 18px;text-align:center;font-size:1rem;color:#f87171">✗</td></tr>
          <tr style="border-bottom:1px solid var(--gbd)"><td style="padding:16px 18px;font-size:.88rem;font-weight:600;color:var(--txt2)">Umbler Talk<br><span style="font-size:.72rem;color:var(--txt3);font-weight:400">c/ Agente IA</span></td><td style="padding:16px 18px;text-align:center;font-size:.85rem;color:var(--txt2)">R$ 735–2.089/mês<br><span style="font-size:.72rem;color:var(--txt3)">+ R$ 3.000 de setup</span></td><td style="padding:16px 18px;text-align:center;font-size:.8rem;color:var(--txt3)">Módulo extra</td><td style="padding:16px 18px;text-align:center;font-size:1rem;color:#f87171">✗</td><td style="padding:16px 18px;text-align:center;font-size:1rem;color:#f87171">✗</td><td style="padding:16px 18px;text-align:center;font-size:1rem;color:#f87171">✗</td></tr>
          <tr style="background:rgba(99,102,241,.07);border:1px solid rgba(99,102,241,.25)">
            <td style="padding:18px 18px;border-radius:12px 0 0 12px"><div style="font-family:'Syne',sans-serif;font-weight:800;font-size:1rem;background:linear-gradient(135deg,var(--indigo-l),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">CRM Fácil</div><div style="font-size:.7rem;color:var(--indigo-l);margin-top:3px;font-weight:600">Você está aqui</div></td>
            <td style="padding:18px 18px;text-align:center"><div style="font-family:'Syne',sans-serif;font-size:1.05rem;font-weight:800;color:var(--txt)">R$ 497/mês</div><div style="font-size:.72rem;color:var(--txt3);margin-top:2px">por empresa, não por usuário</div></td>
            <td style="padding:18px 18px;text-align:center;font-size:1.1rem;color:var(--emerald);filter:drop-shadow(0 0 4px rgba(16,185,129,.5))">✓</td>
            <td style="padding:18px 18px;text-align:center;font-size:1.1rem;color:var(--emerald);filter:drop-shadow(0 0 4px rgba(16,185,129,.5))">✓</td>
            <td style="padding:18px 18px;text-align:center;font-size:1.1rem;color:var(--emerald);filter:drop-shadow(0 0 4px rgba(16,185,129,.5))">✓</td>
            <td style="padding:18px 18px;text-align:center;font-size:1.1rem;color:var(--emerald);border-radius:0 12px 12px 0;filter:drop-shadow(0 0 4px rgba(16,185,129,.5))">✓</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="fu" style="margin-top:28px;padding:22px 32px;border-radius:16px;background:rgba(16,185,129,.05);border:1px solid rgba(16,185,129,.15);display:flex;align-items:center;gap:18px;max-width:820px;margin-left:auto;margin-right:auto">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(16,185,129,.8)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;filter:drop-shadow(0 0 6px rgba(16,185,129,.4))"><circle cx="12" cy="12" r="10"/><polyline points="16 9 10.5 14.5 8 12"/></svg>
      <p style="font-size:.88rem;color:var(--txt2);line-height:1.65;margin:0"><strong style="color:var(--txt)">O CRM Fácil é cobrado por empresa — não por usuário.</strong> Um time de 3 vendedores no Kommo paga até R$ 1.800/mês. No CRM Fácil, o mesmo time paga R$ 497 — e ainda tem IA de relacionamento completa, pós-venda automatizado e reativação de carteira que o Kommo não entrega.</p>
    </div>
  </div>
</section>

<section id="pricing">
  <div class="container">
    <div class="sc2 fu">
      <div class="lbl">Planos</div>
      <h2>Simples, sem <span class="grad">surpresas</span></h2>
      <p>30 dias grátis. Sem cartão de crédito. Cancele quando quiser.</p>
    </div>
    <div class="pg">
      <div class="gc pcard fu">
        <div class="pname">Starter</div>
        <div class="pdesc">Para empresas que estão começando</div>
        <div class="pprice"><span class="pcur">R$</span><span class="pamt">497</span><span class="pper">/mês</span></div>
        <div class="panual">Cobrado R$ 4.970/ano · 2 meses grátis</div>
        <ul class="pfl">
          <li>1 WhatsApp conectado</li><li>IA respondendo 24/7</li><li>Kanban de leads</li>
          <li>Follow-up automático</li><li>Até 500 clientes/leads</li><li>Aniversário automático</li>
        </ul>
        <a href="https://www.ocrmfacil.com.br/registro?plano=STARTER" class="btn bs pcta">Começar grátis — 30 dias</a>
      </div>
      <div class="gc pcard feat fu">
        <div class="pname">Pro</div>
        <div class="pdesc">Para empresas em crescimento</div>
        <div class="pprice"><span class="pcur">R$</span><span class="pamt">897</span><span class="pper">/mês</span></div>
        <div class="panual">Cobrado R$ 8.970/ano · 2 meses grátis</div>
        <ul class="pfl">
          <li>Até 2 WhatsApp conectados</li><li>IA respondendo 24/7</li><li>Kanban de leads</li>
          <li>Follow-up automático</li><li>Até 1.000 leads</li><li>Campanhas em massa</li>
          <li>Analytics completo</li><li>Aniversário automático</li>
        </ul>
        <a href="https://www.ocrmfacil.com.br/registro?plano=PRO" class="btn bp pcta">Começar grátis — 30 dias</a>
      </div>
      <div class="gc pcard fu">
        <div class="pname">Agency</div>
        <div class="pdesc">Para agências e múltiplas empresas</div>
        <div class="pprice"><span class="pcur">R$</span><span class="pamt">1.497</span><span class="pper">/mês</span></div>
        <div class="panual">Cobrado R$ 14.970/ano · 2 meses grátis</div>
        <ul class="pfl">
          <li class="star">Fazemos a implantação por você</li>
          <li>3 WhatsApp conectados</li><li>Tudo do Pro incluso</li>
          <li>Até 5.000 leads (acima: a combinar)</li>
          <li>Suporte prioritário</li><li>Gerente de conta dedicado</li>
          <li class="note">Seu ponto de contato direto para dúvidas, ajustes e estratégia</li>
          <li class="note">Instâncias adicionais: valor a combinar com seu gerente de conta</li>
        </ul>
        <a href="https://www.ocrmfacil.com.br/registro?plano=AGENCY" class="btn bs pcta">Começar grátis — 30 dias</a>
      </div>
    </div>
    <p style="text-align:center;color:var(--txt3);font-size:.83rem;margin-top:22px">Planos anuais com <strong style="color:var(--indigo-l)">2 meses grátis</strong> — economize até 34% em relação ao mensal</p>
  </div>
</section>

<section id="faq">
  <div class="container">
    <div class="sc2 fu">
      <div class="lbl">FAQ</div>
      <h2>Dúvidas que surgem <span class="grad">antes de comprar</span></h2>
    </div>
    <div class="fql">
      <div class="gc fqi fu" onclick="toggleFaq(this)"><div class="fqq">Preciso de cartão de crédito para testar?<div class="fqtg">+</div></div><div class="fqa">Não. 30 dias completamente grátis, sem cartão. Só cobramos se você decidir continuar após o período de teste. E se não curtir, não precisa nem avisar.</div></div>
      <div class="gc fqi fu" onclick="toggleFaq(this)"><div class="fqq">A IA vai responder sobre os meus produtos especificamente?<div class="fqtg">+</div></div><div class="fqa">Sim. Você cadastra seus produtos, preços, horários e diferenciais. A IA usa exatamente essas informações para responder com precisão — e nunca inventa nada que você não cadastrou.</div></div>
      <div class="gc fqi fu" onclick="toggleFaq(this)"><div class="fqq">E se o cliente fizer uma pergunta que a IA não sabe?<div class="fqtg">+</div></div><div class="fqa">A IA avisa o vendedor responsável via WhatsApp com o contexto completo da conversa. Você nunca fica sem resposta — e o vendedor entra exatamente no momento certo.</div></div>
      <div class="gc fqi fu" onclick="toggleFaq(this)"><div class="fqq">Funciona com qualquer WhatsApp?<div class="fqtg">+</div></div><div class="fqa">Sim. Conectamos via QR Code — qualquer número WhatsApp normal ou Business. Em menos de 60 segundos a IA já está online respondendo seus clientes.</div></div>
      <div class="gc fqi fu" onclick="toggleFaq(this)"><div class="fqq">Tem limite de mensagens?<div class="fqtg">+</div></div><div class="fqa">Não. Todas as mensagens recebidas e enviadas pela IA são ilimitadas nos planos Starter, Pro e Agency. Sem cobrança por volume.</div></div>
      <div class="gc fqi fu" onclick="toggleFaq(this)"><div class="fqq">Quanto tempo leva pra configurar?<div class="fqtg">+</div></div><div class="fqa">Em média 5 minutos. Crie a conta, escaneie o QR Code do WhatsApp, cadastre seus produtos e horários — a IA já começa a responder. Sem precisar de técnico ou programador.</div></div>
      <div class="gc fqi fu" onclick="toggleFaq(this)"><div class="fqq">Posso cancelar quando quiser?<div class="fqtg">+</div></div><div class="fqa">Sim, sem multa, sem burocracia. Cancele pelo próprio sistema em qualquer momento. Sem precisar ligar pra ninguém ou enviar email.</div></div>
    </div>
  </div>
</section>

<section id="ctaf">
  <div class="container">
    <div class="ctabox fu">
      <div style="display:flex;justify-content:center;margin-bottom:16px">
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="rgba(99,102,241,.9)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 18px rgba(99,102,241,.6))"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
      </div>
      <h2>Pronto para vender mais<br><span class="grad">sem trabalhar mais?</span></h2>
      <p>Enquanto você lê isso, seus concorrentes estão perdendo leads por falta de resposta rápida. Configure em 5 minutos. Resultados em dias.</p>
      <a href="https://www.ocrmfacil.com.br/registro" class="btn bp">Começar 30 dias grátis →</a>
      <div class="ctrust">
        <span>✓ Sem cartão de crédito</span>
        <span>✓ Setup em 5 minutos</span>
        <span>✓ Cancele quando quiser</span>
        <span>✓ Suporte em português</span>
      </div>
      <p style="color:var(--txt3);font-size:.78rem;margin-top:24px;max-width:480px;margin-left:auto;margin-right:auto"><em>P.S. Se você configurar hoje e não ver resultados em 30 dias, basta cancelar sem perguntas. O risco é todo nosso.</em></p>
    </div>
  </div>
</section>

<footer>
  <div class="container">
    <div class="fi">
      <div>
        <a href="https://www.ocrmfacil.com.br" class="logo" style="font-size:1.2rem">CRM Fácil</a>
        <p class="fc" style="margin-top:3px;font-style:italic">Sua IA vende. Seu time de vendas fecha.</p>
        <p class="fc" style="margin-top:2px">CRM gerido por IA para empresas que vendem pelo WhatsApp</p>
      </div>
      <div class="fc">© 2026 CRM Fácil · <a href="https://www.ocrmfacil.com.br">ocrmfacil.com.br</a> · <a href="/afiliados" style="color:var(--indigo-l)">Programa de Afiliados</a></div>
    </div>
  </div>
</footer>
`;

export default function LandingPage() {
  useEffect(() => {
    if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Syne"]')) {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap";
      document.head.appendChild(l);
    }

    const cg = document.getElementById("cg");
    let mx = -1000, my = -1000, cx = -1000, cy = -1000, rafId = 0;
    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    document.addEventListener("mousemove", onMove);
    const anim = () => {
      cx += (mx - cx) * 0.1; cy += (my - cy) * 0.1;
      if (cg) { cg.style.left = cx + "px"; cg.style.top = cy + "px"; }
      rafId = requestAnimationFrame(anim);
    };
    rafId = requestAnimationFrame(anim);

    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("v"); }),
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".fu").forEach((el) => obs.observe(el));

    (window as any).toggleFaq = (el: Element) => { el.classList.toggle("open"); };

    const navEl = document.getElementById("nav");
    const onScroll = () => {
      if (navEl) navEl.style.background = window.scrollY > 50 ? "rgba(4,4,12,.96)" : "rgba(4,4,12,.82)";
    };
    window.addEventListener("scroll", onScroll);

    document.documentElement.setAttribute("data-theme", "dark");

    // Auto-scroll on hover for .sw and .tw strips
    const stripCleanups: (() => void)[] = [];
    document.querySelectorAll<HTMLElement>(".sw, .tw").forEach((strip) => {
      let stripRaf = 0;
      let active = false;
      const tick = () => {
        if (!active) return;
        strip.scrollLeft += 2;
        if (strip.scrollLeft >= strip.scrollWidth - strip.clientWidth) strip.scrollLeft = 0;
        stripRaf = requestAnimationFrame(tick);
      };
      const start = () => { active = true; stripRaf = requestAnimationFrame(tick); };
      const stop  = () => { active = false; cancelAnimationFrame(stripRaf); };
      strip.addEventListener("mouseenter", start);
      strip.addEventListener("mouseleave", stop);
      stripCleanups.push(() => {
        strip.removeEventListener("mouseenter", start);
        strip.removeEventListener("mouseleave", stop);
        cancelAnimationFrame(stripRaf);
      });
    });

    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId);
      obs.disconnect();
      window.removeEventListener("scroll", onScroll);
      delete (window as any).toggleFaq;
      stripCleanups.forEach((fn) => fn());
    };
  }, []);

  return (
    <div className="lp-root">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div dangerouslySetInnerHTML={{ __html: HTML }} />
    </div>
  );
}
