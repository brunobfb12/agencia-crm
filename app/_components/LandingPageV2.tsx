"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ── CSS ─────────────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

/* Prefixed LP variables — avoids conflict with globals.css :root vars */
.lp {
  --lp-bg:#04040c;--lp-indigo:#6366f1;--lp-indigo-l:#818cf8;--lp-violet:#7c3aed;
  --lp-cyan:#22d3ee;--lp-emerald:#10b981;--lp-amber:#f59e0b;
  --lp-txt:#f0f0ff;--lp-txt2:rgba(240,240,255,.6);--lp-txt3:rgba(240,240,255,.35);
  --lp-gb:rgba(255,255,255,.035);--lp-gbh:rgba(255,255,255,.065);
  --lp-gbd:rgba(255,255,255,.08);--lp-gbdh:rgba(99,102,241,.4);
  --lp-tr:all .3s cubic-bezier(.4,0,.2,1);
  min-height:100vh;
  background:var(--lp-bg);
  color:var(--lp-txt);
  font-family:'DM Sans',sans-serif;
  line-height:1.6;
  overflow-x:hidden;
}

/* Light theme overrides */
html[data-theme="light"] .lp {
  --lp-bg:#f5f7ff;
  --lp-txt:#0f172a;--lp-txt2:rgba(15,23,42,.65);--lp-txt3:rgba(15,23,42,.38);
  --lp-gb:rgba(255,255,255,.78);--lp-gbh:rgba(255,255,255,.96);
  --lp-gbd:rgba(99,102,241,.14);--lp-gbdh:rgba(99,102,241,.45);
}

/* Grid background */
.lp::before{content:'';position:fixed;inset:0;
  background-image:linear-gradient(rgba(99,102,241,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.04) 1px,transparent 1px);
  background-size:56px 56px;pointer-events:none;z-index:0}
html[data-theme="light"] .lp::before{
  background-image:linear-gradient(rgba(99,102,241,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.03) 1px,transparent 1px)}

/* Cursor orb */
#cg{position:fixed;width:480px;height:480px;
  background:radial-gradient(circle,rgba(99,102,241,.14) 0%,rgba(124,58,237,.07) 40%,transparent 70%);
  border-radius:50%;pointer-events:none;transform:translate(-50%,-50%);
  z-index:1;transition:left .06s linear,top .06s linear;mix-blend-mode:screen}
html[data-theme="light"] #cg{
  background:radial-gradient(circle,rgba(99,102,241,.07) 0%,rgba(124,58,237,.03) 40%,transparent 70%);
  mix-blend-mode:multiply}

/* Orbs */
.lp-orbs{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}
.lp-orb{position:absolute;border-radius:50%;filter:blur(90px);opacity:.35}
html[data-theme="light"] .lp-orb{opacity:.12}
.lp-o1{width:700px;height:700px;background:radial-gradient(circle,rgba(99,102,241,.35),transparent);top:-280px;left:-250px}
.lp-o2{width:550px;height:550px;background:radial-gradient(circle,rgba(34,211,238,.2),transparent);bottom:10%;right:-150px}
.lp-o3{width:400px;height:400px;background:radial-gradient(circle,rgba(124,58,237,.22),transparent);top:55%;left:35%}

/* Layout */
.lp .container{max-width:1180px;margin:0 auto;padding:0 24px;position:relative;z-index:2}
.lp section{position:relative;z-index:2}
.lp h1,.lp h2,.lp h3{font-family:'Syne',sans-serif;line-height:1.1}
.lp h1{font-size:clamp(2.6rem,5.5vw,4.8rem);font-weight:800}
.lp h2{font-size:clamp(1.9rem,3.5vw,2.9rem);font-weight:700}
.lp .grad{background:linear-gradient(135deg,var(--lp-indigo-l) 0%,var(--lp-cyan) 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.lp .lbl{display:inline-flex;align-items:center;gap:8px;font-size:.72rem;font-weight:600;
  letter-spacing:.12em;text-transform:uppercase;color:var(--lp-indigo-l);
  padding:5px 14px;border:1px solid rgba(99,102,241,.28);border-radius:100px;
  background:rgba(99,102,241,.07);margin-bottom:18px}

/* Glass cards */
.lp .gc{background:var(--lp-gb);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  border:1px solid var(--lp-gbd);border-radius:24px;transition:var(--lp-tr)}
.lp .gc:hover{background:var(--lp-gbh);border-color:var(--lp-gbdh);
  transform:translateY(-4px);box-shadow:0 0 50px rgba(99,102,241,.2)}

/* Buttons */
.lp .btn{display:inline-flex;align-items:center;gap:8px;padding:14px 28px;border-radius:12px;
  font-family:'DM Sans',sans-serif;font-weight:600;font-size:1rem;
  cursor:pointer;border:none;transition:var(--lp-tr);text-decoration:none}
.lp .bp{background:linear-gradient(135deg,var(--lp-indigo),var(--lp-violet));color:#fff}
.lp .bp:hover{transform:translateY(-2px);box-shadow:0 8px 44px rgba(99,102,241,.5),0 0 0 1px rgba(99,102,241,.3)}
.lp .bs{background:rgba(255,255,255,.04);color:var(--lp-txt);
  border:1px solid var(--lp-gbd);backdrop-filter:blur(10px)}
.lp .bs:hover{background:rgba(255,255,255,.09);border-color:rgba(255,255,255,.18)}
html[data-theme="light"] .lp .bs{background:rgba(0,0,0,.04);color:var(--lp-txt);
  border-color:rgba(0,0,0,.10)}
html[data-theme="light"] .lp .bs:hover{background:rgba(0,0,0,.08);border-color:rgba(0,0,0,.16)}

/* Neon icons */
.lp .ni{display:flex;align-items:center;justify-content:center;width:52px;height:52px;
  border-radius:14px;color:#fff;background:rgba(99,102,241,.1);
  border:1px solid rgba(99,102,241,.22);animation:lp-np 4s ease-in-out infinite;flex-shrink:0}
.lp .ni.c{background:rgba(34,211,238,.1);border-color:rgba(34,211,238,.22);
  color:rgba(34,211,238,.95);animation:lp-npc 4s ease-in-out infinite}
.lp .ni.e{background:rgba(16,185,129,.1);border-color:rgba(16,185,129,.22);
  color:rgba(16,185,129,.95);animation:lp-npe 4s ease-in-out infinite}
.lp .ni.a{background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.22);
  color:rgba(245,158,11,.95);animation:lp-npa 4s ease-in-out infinite}
@keyframes lp-np{0%,100%{box-shadow:0 0 8px rgba(99,102,241,.3)}50%{box-shadow:0 0 22px rgba(99,102,241,.65),0 0 44px rgba(99,102,241,.18)}}
@keyframes lp-npc{0%,100%{box-shadow:0 0 8px rgba(34,211,238,.3)}50%{box-shadow:0 0 22px rgba(34,211,238,.65),0 0 44px rgba(34,211,238,.18)}}
@keyframes lp-npe{0%,100%{box-shadow:0 0 8px rgba(16,185,129,.3)}50%{box-shadow:0 0 22px rgba(16,185,129,.65),0 0 44px rgba(16,185,129,.18)}}
@keyframes lp-npa{0%,100%{box-shadow:0 0 8px rgba(245,158,11,.3)}50%{box-shadow:0 0 22px rgba(245,158,11,.65),0 0 44px rgba(245,158,11,.18)}}

/* Step icon */
.lp .si{display:flex;align-items:center;justify-content:center;width:44px;height:44px;
  color:rgba(99,102,241,.9);margin-bottom:12px;filter:drop-shadow(0 0 8px rgba(99,102,241,.5))}

/* Scroll reveal */
.lp .fu{opacity:0;transform:translateY(28px);transition:opacity .65s ease,transform .65s ease}
.lp .fu.v{opacity:1;transform:translateY(0)}
.lp .fu:nth-child(2){transition-delay:.1s}.lp .fu:nth-child(3){transition-delay:.2s}
.lp .fu:nth-child(4){transition-delay:.3s}.lp .fu:nth-child(5){transition-delay:.4s}
.lp .fu:nth-child(6){transition-delay:.5s}

/* NAV */
.lp nav{position:fixed;top:0;left:0;right:0;z-index:1000;padding:14px 0;
  backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);
  background:rgba(4,4,12,.82);border-bottom:1px solid var(--lp-gbd);transition:var(--lp-tr)}
html[data-theme="light"] .lp nav{background:rgba(245,247,255,.88);
  border-bottom-color:rgba(0,0,0,.07)}
.lp .nav-i{display:flex;align-items:center;justify-content:space-between}
.lp .logo{font-family:'Syne',sans-serif;font-size:1.35rem;font-weight:800;
  background:linear-gradient(135deg,var(--lp-indigo-l),var(--lp-cyan));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-decoration:none}
.lp .nav-links{display:flex;gap:28px;list-style:none}
.lp .nav-links a{color:var(--lp-txt2);text-decoration:none;font-size:.88rem;font-weight:500;transition:color .2s}
.lp .nav-links a:hover{color:var(--lp-txt)}
.lp .theme-btn{display:flex;align-items:center;justify-content:center;width:36px;height:36px;
  border-radius:10px;border:1px solid var(--lp-gbd);background:var(--lp-gb);
  color:var(--lp-txt2);cursor:pointer;transition:var(--lp-tr);flex-shrink:0}
.lp .theme-btn:hover{background:var(--lp-gbh);color:var(--lp-txt);border-color:var(--lp-gbdh)}

/* HERO */
.lp #hero{min-height:100vh;display:flex;align-items:center;padding:120px 0 80px}
.lp .hero-grid{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center}
.lp .hbadge{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;
  background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.25);border-radius:100px;
  font-size:.78rem;color:var(--lp-indigo-l);margin-bottom:22px}
.lp .hbadge::before{content:'';display:block;width:7px;height:7px;
  background:var(--lp-cyan);border-radius:50%;animation:lp-blink 2.2s ease-in-out infinite}
@keyframes lp-blink{0%,100%{opacity:1}50%{opacity:.25}}
.lp .hero-h1{margin-bottom:22px;letter-spacing:-.02em}
.lp .hero-sub{font-size:1.1rem;color:var(--lp-txt2);line-height:1.75;margin-bottom:36px;max-width:480px}
.lp .hero-ctas{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:18px}
.lp .hero-trust{font-size:.78rem;color:var(--lp-txt3)}
.lp .hero-trust span{margin:0 3px}
.lp .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:52px}
.lp .sc2-stat{padding:16px;text-align:center}
.lp .sv{font-family:'Syne',sans-serif;font-size:1.55rem;font-weight:800;color:var(--lp-indigo-l)}
.lp .sl{font-size:.72rem;color:var(--lp-txt3);margin-top:4px}

/* Phone mockup */
.lp .phone{background:var(--lp-gb);backdrop-filter:blur(20px);border:1px solid var(--lp-gbd);
  border-radius:28px;overflow:hidden;
  box-shadow:0 40px 120px rgba(99,102,241,.2),0 0 0 1px rgba(99,102,241,.1);
  max-width:360px;margin:0 auto;position:relative}
.lp .ph-hd{padding:16px 20px;border-bottom:1px solid var(--lp-gbd);
  display:flex;align-items:center;gap:12px;background:rgba(99,102,241,.06)}
.lp .ph-av{width:38px;height:38px;border-radius:50%;
  background:linear-gradient(135deg,var(--lp-indigo),var(--lp-cyan));
  display:flex;align-items:center;justify-content:center;
  font-size:.75rem;font-weight:700;color:#fff;flex-shrink:0}
.lp .ph-name{font-size:.9rem;font-weight:600;color:var(--lp-txt)}
.lp .ph-st{font-size:.72rem;color:var(--lp-emerald);display:flex;align-items:center;gap:4px}
.lp .ph-st::before{content:'';display:block;width:6px;height:6px;border-radius:50%;
  background:var(--lp-emerald);animation:lp-blink 2s ease-in-out infinite}
.lp .ph-body{padding:16px;display:flex;flex-direction:column;gap:10px;min-height:300px}
.lp .cm{max-width:82%;padding:10px 14px;border-radius:12px;font-size:.83rem;line-height:1.5}
.lp .cm.u{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);
  align-self:flex-start;border-bottom-left-radius:4px;color:var(--lp-txt)}
html[data-theme="light"] .lp .cm.u{background:rgba(0,0,0,.05);border-color:rgba(0,0,0,.07)}
.lp .cm.ai{background:linear-gradient(135deg,rgba(99,102,241,.22),rgba(124,58,237,.22));
  border:1px solid rgba(99,102,241,.22);align-self:flex-end;
  border-bottom-right-radius:4px;color:var(--lp-txt)}
.lp .cm-m{font-size:.63rem;color:var(--lp-txt3);margin-top:3px}
.lp .cm-m.r{text-align:right}
.lp .typing{display:flex;gap:4px;padding:10px 14px;background:rgba(255,255,255,.04);
  border:1px solid var(--lp-gbd);border-radius:12px;border-bottom-right-radius:4px;
  align-self:flex-end;width:fit-content}
.lp .td{width:6px;height:6px;border-radius:50%;background:var(--lp-indigo-l);
  animation:lp-t 1.3s ease-in-out infinite}
.lp .td:nth-child(2){animation-delay:.2s}.lp .td:nth-child(3){animation-delay:.4s}
@keyframes lp-t{0%,80%,100%{transform:translateY(0);opacity:.3}40%{transform:translateY(-7px);opacity:1}}
.lp .pbadge{position:absolute;top:-18px;right:-18px;padding:11px 15px;
  background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.3);
  backdrop-filter:blur(20px);border-radius:14px;font-size:.73rem;z-index:10}
.lp .pbadge .bt{font-weight:700;color:var(--lp-emerald);font-size:.78rem}
.lp .pbadge .bs2{color:var(--lp-txt3);margin-top:2px}

/* Ticker */
#lp-ticker{padding:18px 0;border-top:1px solid var(--lp-gbd);
  border-bottom:1px solid var(--lp-gbd);overflow:hidden;position:relative;z-index:2}
.lp .tk-i{display:flex;gap:36px;animation:lp-tk 28s linear infinite;width:max-content}
.lp .tk-item{display:flex;align-items:center;gap:10px;white-space:nowrap;
  font-size:.88rem;color:var(--lp-txt2)}
.lp .tk-item strong{color:var(--lp-txt)}
.lp .tk-dot{width:4px;height:4px;background:var(--lp-indigo);border-radius:50%;
  flex-shrink:0;align-self:center}
.lp .tk-icon{width:16px;height:16px;color:var(--lp-indigo-l);flex-shrink:0}
@keyframes lp-tk{from{transform:translateX(0)}to{transform:translateX(-50%)}}

/* Pain section */
.lp #pain{padding:100px 0}
.lp .pain-header{text-align:center;margin-bottom:56px}
.lp .pain-sub{color:var(--lp-txt2);margin-top:14px;max-width:540px;
  margin-left:auto;margin-right:auto;font-size:1.05rem}
.lp .pain-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px}
.lp .pcol{padding:32px;border-radius:24px}
.lp .pcol.bad{background:rgba(239,68,68,.04);border:1px solid rgba(239,68,68,.14)}
.lp .pcol.good{background:rgba(16,185,129,.04);border:1px solid rgba(16,185,129,.14)}
html[data-theme="light"] .lp .pcol.bad{background:rgba(239,68,68,.06);border-color:rgba(239,68,68,.2)}
html[data-theme="light"] .lp .pcol.good{background:rgba(16,185,129,.06);border-color:rgba(16,185,129,.2)}
.lp .pcol-t{display:flex;align-items:center;gap:10px;font-weight:700;margin-bottom:20px;font-size:.95rem}
.lp .pcol.bad .pcol-t{color:#f87171}
.lp .pcol.good .pcol-t{color:var(--lp-emerald)}
html[data-theme="light"] .lp .pcol.bad .pcol-t{color:#dc2626}
.lp .pl{list-style:none;display:flex;flex-direction:column;gap:11px}
.lp .pl li{display:flex;gap:10px;font-size:.88rem;color:var(--lp-txt2);line-height:1.5}
.lp .pl li .ic{flex-shrink:0}

/* How it works */
.lp #hiw{padding:100px 0 60px}
.lp .hiw-hd{margin-bottom:44px}
.lp .sdiv{width:55px;height:3px;background:linear-gradient(90deg,var(--lp-indigo),var(--lp-cyan));
  border-radius:2px;margin-top:14px}
.lp .sw{overflow-x:auto;padding-bottom:20px;scrollbar-width:thin;
  scrollbar-color:rgba(99,102,241,.3) transparent}
.lp .sw::-webkit-scrollbar{height:4px}
.lp .sw::-webkit-scrollbar-track{background:transparent}
.lp .sw::-webkit-scrollbar-thumb{background:rgba(99,102,241,.3);border-radius:2px}
.lp .st{display:flex;gap:14px;width:max-content;padding:4px 0}
.lp .scard{width:210px;flex-shrink:0;padding:24px;border-radius:24px}
.lp .sn{font-family:'Syne',sans-serif;font-size:.7rem;font-weight:700;
  color:var(--lp-indigo-l);letter-spacing:.1em;margin-bottom:10px;opacity:.65}
.lp .st2{font-size:.95rem;font-weight:700;margin-bottom:7px;font-family:'Syne',sans-serif;
  color:var(--lp-txt)}
.lp .sd{font-size:.8rem;color:var(--lp-txt2);line-height:1.5}
.lp .sarr{width:18px;flex-shrink:0;display:flex;align-items:center;
  justify-content:center;color:var(--lp-indigo-l);opacity:.35;align-self:center}

/* Features */
.lp #features{padding:100px 0}
.lp .fg{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:56px}
.lp .fcard{padding:28px}
.lp .fcard .ni{margin-bottom:18px}
.lp .ft{font-size:1.05rem;font-weight:700;margin-bottom:9px;font-family:'Syne',sans-serif;
  color:var(--lp-txt)}
.lp .fd{font-size:.86rem;color:var(--lp-txt2);line-height:1.65}

/* Highlight box */
.lp .hbox{padding:52px 48px;text-align:center;border-radius:32px;
  background:linear-gradient(135deg,rgba(99,102,241,.09) 0%,rgba(124,58,237,.07) 50%,rgba(34,211,238,.05) 100%);
  border:1px solid rgba(99,102,241,.22);position:relative;overflow:hidden;margin:60px 0}
html[data-theme="light"] .lp .hbox{
  background:linear-gradient(135deg,rgba(99,102,241,.06) 0%,rgba(124,58,237,.04) 50%,rgba(34,211,238,.03) 100%);
  border-color:rgba(99,102,241,.25)}
.lp .hbox::before{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);
  width:600px;height:1px;background:linear-gradient(90deg,transparent,rgba(99,102,241,.5),transparent)}
.lp .hbox-icon{margin-bottom:14px;display:flex;align-items:center;justify-content:center}
.lp .hbox h2{max-width:680px;margin:0 auto 14px;color:var(--lp-txt)}
.lp .hbox p{color:var(--lp-txt2);font-size:1.05rem;max-width:580px;margin:0 auto 30px;line-height:1.75}

/* Testimonials */
.lp #testi{padding:100px 0}
.lp .tw{overflow-x:auto;padding-bottom:20px;margin-top:46px;scrollbar-width:thin;
  scrollbar-color:rgba(99,102,241,.3) transparent}
.lp .tw::-webkit-scrollbar{height:4px}
.lp .tw::-webkit-scrollbar-thumb{background:rgba(99,102,241,.3);border-radius:2px}
.lp .tt{display:flex;gap:18px;width:max-content}
.lp .tcard{width:340px;flex-shrink:0;padding:28px}
.lp .tstars{font-size:.88rem;color:var(--lp-amber);margin-bottom:14px;
  filter:drop-shadow(0 0 5px rgba(245,158,11,.4))}
.lp .ttxt{font-size:.9rem;color:var(--lp-txt2);line-height:1.75;margin-bottom:20px;font-style:italic}
.lp .tauth{display:flex;align-items:center;gap:12px}
.lp .tav{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;
  justify-content:center;font-weight:700;font-size:.88rem;color:#fff;flex-shrink:0;
  background:linear-gradient(135deg,var(--lp-indigo),var(--lp-violet))}
.lp .tn{font-weight:600;font-size:.88rem;color:var(--lp-txt)}
.lp .tr2{font-size:.73rem;color:var(--lp-txt3)}

/* Pricing */
.lp #pricing{padding:100px 0}
.lp .pg{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:56px}
.lp .pcard{padding:32px;position:relative}
.lp .pcard.feat{background:rgba(99,102,241,.08);border-color:rgba(99,102,241,.36);
  box-shadow:0 0 70px rgba(99,102,241,.15)}
html[data-theme="light"] .lp .pcard.feat{background:rgba(99,102,241,.06);border-color:rgba(99,102,241,.3)}
.lp .pcard.feat::before{content:'MAIS POPULAR';position:absolute;top:-11px;left:50%;
  transform:translateX(-50%);background:linear-gradient(135deg,var(--lp-indigo),var(--lp-violet));
  color:#fff;font-size:.63rem;font-weight:700;letter-spacing:.12em;
  padding:4px 12px;border-radius:100px;white-space:nowrap}
.lp .pname{font-family:'Syne',sans-serif;font-size:1.7rem;font-weight:800;color:var(--lp-txt);
  margin-bottom:6px;letter-spacing:-.02em;padding-bottom:14px;border-bottom:1px solid var(--lp-gbd)}
.lp .pcard.feat .pname{background:linear-gradient(135deg,var(--lp-indigo-l),var(--lp-cyan));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.lp .pdesc{font-size:.82rem;color:var(--lp-txt3);margin:10px 0 18px}
.lp .pprice{margin-bottom:4px}
.lp .pcur{font-size:.95rem;color:var(--lp-indigo-l);vertical-align:top;margin-top:8px;display:inline-block}
.lp .pamt{font-family:'Syne',sans-serif;font-size:2.9rem;font-weight:800;color:var(--lp-txt)}
.lp .pper{font-size:.82rem;color:var(--lp-txt3)}
.lp .panual{font-size:.73rem;color:var(--lp-txt3);margin-bottom:20px}
.lp .pfl{list-style:none;display:flex;flex-direction:column;gap:9px;margin-bottom:26px}
.lp .pfl li{display:flex;align-items:flex-start;gap:8px;font-size:.83rem;color:var(--lp-txt2)}
.lp .pfl li::before{content:'✓';color:var(--lp-emerald);font-weight:700;flex-shrink:0;
  filter:drop-shadow(0 0 3px rgba(16,185,129,.4));margin-top:1px}
.lp .pfl li.star::before{content:'★';color:var(--lp-amber);filter:drop-shadow(0 0 4px rgba(245,158,11,.5))}
.lp .pfl li.note{color:var(--lp-txt3);font-size:.77rem;padding-left:16px}
.lp .pfl li.note::before{content:'';margin:0}
.lp .pcta{width:100%;justify-content:center;margin-top:auto}

/* FAQ */
.lp #faq{padding:100px 0}
.lp .sc2{text-align:center;margin-bottom:56px}
.lp .sc2 p{color:var(--lp-txt2);margin-top:12px;font-size:1rem;max-width:560px;
  margin-left:auto;margin-right:auto}
.lp .fql{display:flex;flex-direction:column;gap:10px;margin-top:40px;
  max-width:720px;margin-left:auto;margin-right:auto}
.lp .fqi{padding:20px 24px;cursor:pointer;user-select:none}
.lp .fqq{display:flex;justify-content:space-between;align-items:center;gap:16px;
  font-size:.93rem;font-weight:600;color:var(--lp-txt)}
.lp .fqtg{font-size:1.4rem;font-weight:300;color:var(--lp-indigo-l);
  flex-shrink:0;transition:transform .3s}
.lp .fqi.open .fqtg{transform:rotate(45deg)}
.lp .fqa{font-size:.86rem;color:var(--lp-txt2);line-height:1.7;
  max-height:0;overflow:hidden;transition:max-height .4s ease,margin-top .3s}
.lp .fqi.open .fqa{max-height:400px;margin-top:14px}

/* CTA Final */
.lp #ctaf{padding:100px 0}
.lp .ctabox{border-radius:32px;
  background:linear-gradient(135deg,rgba(99,102,241,.1) 0%,rgba(124,58,237,.08) 50%,rgba(34,211,238,.05) 100%);
  border:1px solid rgba(99,102,241,.25);padding:64px 48px;text-align:center;
  position:relative;overflow:hidden}
html[data-theme="light"] .lp .ctabox{
  background:linear-gradient(135deg,rgba(99,102,241,.07) 0%,rgba(124,58,237,.05) 50%,rgba(34,211,238,.03) 100%);
  border-color:rgba(99,102,241,.22)}
.lp .ctabox::before{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);
  width:600px;height:1px;background:linear-gradient(90deg,transparent,rgba(99,102,241,.6),transparent)}
.lp .ctabox h2{color:var(--lp-txt)}
.lp .ctrust{display:flex;flex-wrap:wrap;justify-content:center;gap:14px 24px;margin-top:20px}
.lp .ctrust span{font-size:.8rem;color:var(--lp-txt3)}

/* Footer */
.lp footer{padding:32px 0;border-top:1px solid var(--lp-gbd);position:relative;z-index:2}
.lp .fi{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
.lp .fc{font-size:.78rem;color:var(--lp-txt3)}
.lp .fc a{color:var(--lp-txt3);text-decoration:none}
.lp .fc a:hover{color:var(--lp-indigo-l)}

/* Responsive */
@media(max-width:768px){
  .lp .hero-grid{grid-template-columns:1fr;gap:40px}
  .lp .pain-grid{grid-template-columns:1fr}
  .lp .fg{grid-template-columns:1fr}
  .lp .pg{grid-template-columns:1fr}
  .lp .nav-links{display:none}
  .lp .fi{flex-direction:column;text-align:center}
  .lp .stats{grid-template-columns:repeat(2,1fr)}
  .lp .hbox{padding:32px 20px}
  .lp .ctabox{padding:40px 20px}
}
`;

/* ── Static data ─────────────────────────────────────────────────────────── */
const STEPS = [
  { n:"01", icon:"ic-chat",         t:"Lead chega",              d:"Mensagem no WhatsApp — pode ser às 23h de uma sexta-feira. A IA já está respondendo." },
  { n:"02", icon:"ic-cpu",          t:"IA qualifica em <30s",    d:"Entende o que o cliente quer, o orçamento, a urgência — e já separa os quentes dos frios." },
  { n:"03", icon:"ic-layers",       t:"Entra no pipeline",        d:"Lead é registrado automaticamente: nome, interesse, objeções, score de calor — tudo no CRM." },
  { n:"04", icon:"ic-cal-check",    t:"Agenda ou orça",           d:"Se o lead está pronto, a IA oferece horário e fecha o agendamento — sem intervenção humana." },
  { n:"05", icon:"ic-send",         t:"Vendedor recebe briefing", d:"Quando o lead está quente, seu vendedor recebe no WhatsApp: nome, interesse, histórico e link direto." },
  { n:"06", icon:"ic-check-circle", t:"Venda fechada",            d:"Vendedor entra preparado, fecha com mais segurança. Venda registrada com valor e data." },
  { n:"07", icon:"ic-mail",         t:"Pós-venda D+7",            d:"IA pergunta como foi, coleta feedback e mantém o vínculo. Cliente fidelizado sem esforço." },
  { n:"08", icon:"ic-rebuy",        t:"Recompra D+28",            d:"Oferta personalizada com base no histórico. Cliente volta — e você não precisou fazer nada." },
];

const FEATURES = [
  { cls:"",  icon:"ic-chat",           t:"IA no WhatsApp 24/7",         d:"Responde, qualifica, tira dúvidas e agenda — sem você precisar estar online. Nem feriado para. Nem domingo para." },
  { cls:"c", icon:"ic-kanban",         t:"Pipeline com Score de Calor", d:"Kanban visual que mostra exatamente quem está quente agora. Arraste o card e mova o lead de fase em segundos." },
  { cls:"e", icon:"ic-refresh",        t:"Follow-up que Nunca Esquece", d:"O sistema agenda e dispara a mensagem certa na hora certa. Seu vendedor foca em fechar — não em lembrar." },
  { cls:"a", icon:"ic-calendar-heart", t:"Aniversário Automático",      d:"Parabeniza cada cliente com mensagem personalizada no dia certo. Uma oportunidade de venda que a maioria desperdiça." },
  { cls:"",  icon:"ic-broadcast",      t:"Campanhas Anti-Spam",         d:"Dispare para centenas de clientes segmentados com espaçamento inteligente. Sem risco de bloqueio no WhatsApp." },
  { cls:"c", icon:"ic-chart",          t:"Analytics em Tempo Real",     d:"Faturamento, taxa de conversão e ranking de vendedores. Decida com dados — não com achismo." },
];

const DEPOIMENTOS = [
  { av:"TP", bg:"",                                          nome:"Thaísy P.",    cargo:"Proprietária — Studio de Sobrancelhas",  txt:"Em 2 semanas minha agenda estava lotada. Antes perdia cliente por não responder rápido — trabalhava em atendimentos e o WhatsApp ficava mudo. Agora a IA responde, qualifica e já manda o link de agendamento. Eu entro pra atender quem já está decidido." },
  { av:"MT", bg:"linear-gradient(135deg,#22d3ee,#10b981)",  nome:"Marcelo T.",   cargo:"Gestor Comercial — Loja de Tintas",       txt:"Recebia 80 mensagens por dia e o vendedor não dava conta. Com o FácilCRM a IA filtra, responde e passa pro vendedor só quem está quente. Resultado: conversão subiu 40% em 3 semanas e o vendedor parou de reclamar de sobrecarga." },
  { av:"CS", bg:"linear-gradient(135deg,#7c3aed,#ec4899)",  nome:"Carla S.",     cargo:"Diretora Clínica — Odontologia Estética",  txt:"O follow-up automático trouxe de volta 11 pacientes que tinham sumido há mais de 3 meses. O sistema mandou a mensagem certa na hora certa — eu nem sabia que essas pessoas ainda tinham interesse. Recuperamos R$4.800 em consultas que estavam perdidas." },
  { av:"AP", bg:"linear-gradient(135deg,#f59e0b,#f97316)",  nome:"Ana Paula R.", cargo:"Sócia — Boutique de Moda Feminina",        txt:"A IA parabenizou uma cliente antiga que a gente não falava há 4 meses. Ela respondeu pedindo orçamento de R$1.200. Só isso já pagou mais de 3 meses de plano. Agora imagina isso acontecendo com toda a base, todo mês, no piloto automático." },
];

const FAQS = [
  { q:"Preciso de cartão de crédito para começar?",          a:"Não. Nenhum dado de pagamento é pedido durante os 30 dias de teste. Se gostar e quiser continuar, aí você escolhe o plano. Se não curtir, não precisa nem avisar — simplesmente não renova." },
  { q:"A IA vai saber responder sobre os meus produtos?",    a:"Sim — mas você precisa cadastrar as informações. Preços, horários, serviços, formas de pagamento, endereço. O que você não cadastrar, a IA não inventa: ela fala que vai verificar e avisa seu vendedor. Zero alucinação, zero resposta errada." },
  { q:"E quando o cliente pergunta algo que a IA não sabe?", a:"A IA avisa seu vendedor no WhatsApp com o nome do cliente, o que foi perguntado e o histórico completo da conversa. Seu vendedor entra já sabendo tudo — sem o cliente precisar repetir nada." },
  { q:"Funciona com qualquer número de WhatsApp?",           a:"Sim — WhatsApp pessoal ou Business, qualquer operadora, qualquer aparelho. É só escanear o QR Code dentro do sistema. Em menos de 60 segundos a IA já está respondendo seus clientes." },
  { q:"Tem limite de mensagens enviadas e recebidas?",       a:"Não existe cobrança por volume. Todas as mensagens — recebidas e enviadas pela IA — são ilimitadas nos planos Starter, Pro e Agency. Atenda 10 ou 10.000 clientes: mesmo preço." },
  { q:"Quanto tempo leva para colocar no ar?",               a:"5 minutos no caso mais simples: criar conta, escanear QR Code, cadastrar seus serviços e preços. A IA já começa a responder. Não precisa de técnico, programador ou treinamento longo." },
  { q:"Posso cancelar sem burocracia?",                      a:"Sim, a qualquer momento, direto pelo sistema. Sem ligar, sem email, sem justificativa. Não acreditamos em fidelidade forçada — acreditamos que você continua porque os resultados aparecem." },
];

const TICKER_ITEMS = [
  { icon:"ic-chat",           label:<><strong>Resposta em &lt;30s</strong> qualquer hora</> },
  { icon:"ic-cpu",            label:<><strong>IA qualifica</strong> e filtra leads frios</> },
  { icon:"ic-cal-check",      label:<><strong>Agendamento automático</strong> sem intervenção</> },
  { icon:"ic-calendar-heart", label:<><strong>Aniversário</strong> nunca mais esquecido</> },
  { icon:"ic-kanban",         label:<><strong>Pipeline visual</strong> atualizado em tempo real</> },
  { icon:"ic-refresh",        label:<><strong>Follow-up automático</strong> — zero leads esquecidos</> },
  { icon:"ic-rebuy",          label:<><strong>Recompra automática</strong> no momento certo</> },
];

/* ── Component ───────────────────────────────────────────────────────────── */
export default function LandingPageV2() {
  const navRef         = useRef<HTMLElement>(null);
  const cgRef          = useRef<HTMLDivElement>(null);
  const hiwScrollRef   = useRef<HTMLDivElement>(null);
  const testiScrollRef = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isDark,  setIsDark]  = useState(true);

  useEffect(() => {
    /* LP always starts dark — ignore stored preference */
    document.documentElement.setAttribute("data-theme", "dark");
    setIsDark(true);

    /* cursor orb */
    const cg = cgRef.current;
    if (!cg) return;
    let mx = -1000, my = -1000, cx = -1000, cy = -1000, rafId = 0;
    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    document.addEventListener("mousemove", onMove);
    const anim = () => {
      cx += (mx - cx) * 0.1; cy += (my - cy) * 0.1;
      cg.style.left = cx + "px"; cg.style.top = cy + "px";
      rafId = requestAnimationFrame(anim);
    };
    rafId = requestAnimationFrame(anim);

    /* scroll reveal */
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("v"); }),
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".lp .fu").forEach((el) => obs.observe(el));

    /* nav transparency on scroll */
    const nav = navRef.current;
    const onScroll = () => {
      if (!nav) return;
      const dark = document.documentElement.getAttribute("data-theme") !== "light";
      nav.style.background = window.scrollY > 50
        ? (dark ? "rgba(4,4,12,.96)" : "rgba(245,247,255,.97)")
        : (dark ? "rgba(4,4,12,.82)" : "rgba(245,247,255,.88)");
    };
    window.addEventListener("scroll", onScroll);

    /* hover auto-scroll for HIW and Testimonials */
    const setupHoverScroll = (el: HTMLDivElement | null) => {
      if (!el) return () => {};
      let scrollRafId = 0;
      const tick = () => {
        el.scrollLeft += 1.5;
        if (el.scrollLeft < el.scrollWidth - el.clientWidth) {
          scrollRafId = requestAnimationFrame(tick);
        } else {
          scrollRafId = 0;
        }
      };
      const start = () => { cancelAnimationFrame(scrollRafId); scrollRafId = requestAnimationFrame(tick); };
      const stop  = () => { cancelAnimationFrame(scrollRafId); scrollRafId = 0; };
      el.addEventListener("mouseenter", start);
      el.addEventListener("mouseleave", stop);
      return () => {
        el.removeEventListener("mouseenter", start);
        el.removeEventListener("mouseleave", stop);
        cancelAnimationFrame(scrollRafId);
      };
    };
    const cleanHiw   = setupHoverScroll(hiwScrollRef.current);
    const cleanTesti = setupHoverScroll(testiScrollRef.current);

    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId);
      obs.disconnect();
      window.removeEventListener("scroll", onScroll);
      cleanHiw();
      cleanTesti();
    };
  }, []);

  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";
    setIsDark(!isDark);
    document.documentElement.setAttribute("data-theme", next);
    /* LP theme is session-only — não persiste no localStorage */
  };

  /* sun / moon icons */
  const SunIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
  const MoonIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
    </svg>
  );

  return (
    <div className="lp">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div id="cg" ref={cgRef} />
      <div className="lp-orbs">
        <div className="lp-orb lp-o1" /><div className="lp-orb lp-o2" /><div className="lp-orb lp-o3" />
      </div>

      {/* SVG Symbol Defs */}
      <svg width="0" height="0" style={{ position:"absolute" }}>
        <defs>
          <symbol id="ic-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></symbol>
          <symbol id="ic-cpu" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></symbol>
          <symbol id="ic-kanban" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></symbol>
          <symbol id="ic-refresh" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></symbol>
          <symbol id="ic-calendar-heart" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M12 17.5s-3-1.8-3-4a2 2 0 014 0 2 2 0 014 0c0 2.2-3 4-3 4z"/></symbol>
          <symbol id="ic-cal-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="9 16 11 18 15 14"/></symbol>
          <symbol id="ic-broadcast" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49m11.31-2.82a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14"/></symbol>
          <symbol id="ic-chart" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></symbol>
          <symbol id="ic-layers" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></symbol>
          <symbol id="ic-check-circle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="16 9 10.5 14.5 8 12"/></symbol>
          <symbol id="ic-mail" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></symbol>
          <symbol id="ic-rebuy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></symbol>
          <symbol id="ic-send" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></symbol>
        </defs>
      </svg>

      {/* ── NAV ── */}
      <nav ref={navRef}>
        <div className="container">
          <div className="nav-i">
            <div>
              <a href="/" className="logo">FácilCRM</a>
              <div style={{fontSize:".65rem",color:"var(--lp-txt3)",letterSpacing:".04em",marginTop:"1px"}}>A IA que atende. O vendedor que fecha.</div>
            </div>
            <ul className="nav-links">
              <li><a href="#features">Funcionalidades</a></li>
              <li><a href="#hiw">Como Funciona</a></li>
              <li><a href="#pricing">Preços</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
            <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
              <button className="theme-btn" onClick={toggleTheme} title={isDark ? "Modo claro" : "Modo escuro"}>
                {isDark ? <SunIcon /> : <MoonIcon />}
              </button>
              <Link href="/registro" className="btn bp" style={{padding:"10px 20px",fontSize:".88rem"}}>Testar grátis — 30 dias</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section id="hero">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-content">
              <div className="hbadge">IA Brasileira de Vendas · WhatsApp · Ativa 24h · 7 dias</div>
              <h1 className="hero-h1">
                Pare de perder<br />vendas pra quem<br /><span className="grad">responde mais</span><br />rápido
              </h1>
              <p style={{fontSize:".9rem",color:"var(--lp-indigo-l)",fontWeight:600,letterSpacing:".03em",marginBottom:"18px",marginTop:"-10px"}}>
                A IA que atende. O vendedor que fecha.
              </p>
              <p className="hero-sub">
                O FácilCRM responde seus leads no WhatsApp em menos de 30 segundos — qualifica, aquece, agenda e avisa seu vendedor só quando o cliente está <strong>pronto pra fechar.</strong> Você não perde mais nenhum lead por demora.
              </p>
              <div className="hero-ctas">
                <Link href="/registro" className="btn bp">Começar 30 dias grátis →</Link>
                <a href="#hiw" className="btn bs">Ver como funciona ↓</a>
              </div>
              <p className="hero-trust">✓ Sem cartão de crédito<span>·</span>✓ Ativo em 5 min<span>·</span>✓ Cancele quando quiser</p>
              <div className="stats">
                <div className="gc sc2-stat"><div className="sv">24/7</div><div className="sl">Nunca dorme, nunca falta</div></div>
                <div className="gc sc2-stat"><div className="sv">&lt;30s</div><div className="sl">Resposta garantida</div></div>
                <div className="gc sc2-stat"><div className="sv">3×</div><div className="sl">Mais leads convertidos</div></div>
                <div className="gc sc2-stat"><div className="sv">R$0</div><div className="sl">Em novas contratações</div></div>
              </div>
            </div>
            <div className="hero-visual" style={{position:"relative"}}>
              <div className="pbadge">
                <div className="bt">● IA respondendo agora</div>
                <div className="bs2">Lead respondido em 8s · pipeline atualizado</div>
              </div>
              <div className="phone">
                <div className="ph-hd">
                  <div className="ph-av">FC</div>
                  <div><div className="ph-name">Assistente FácilCRM</div><div className="ph-st">Online agora</div></div>
                </div>
                <div className="ph-body">
                  <div className="cm u">Oi! Quanto custa o serviço de vocês?<div className="cm-m">Mariana · 22:14</div></div>
                  <div className="cm ai">Oi, Mariana! Boa noite 😊 Tenho algumas opções pra te mostrar. Me conta: você precisa para uso pessoal ou para sua empresa?<div className="cm-m r">IA · 22:14 · respondeu em 6s</div></div>
                  <div className="cm u">Para minha empresa, tenho 2 lojas<div className="cm-m">Mariana · 22:15</div></div>
                  <div className="cm ai">Perfeito! Para 2 unidades, o plano Pro é o mais indicado. Posso te enviar os detalhes agora e já verificar disponibilidade de agenda. Prefere uma conversa rápida hoje ou amanhã?<div className="cm-m r">IA · 22:15 · respondeu em 4s</div></div>
                  <div className="typing"><div className="td" /><div className="td" /><div className="td" /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <div id="lp-ticker">
        <div className="tk-i">
          {[0, 1].flatMap((rep) =>
            TICKER_ITEMS.flatMap((item, i) => [
              <div key={`i-${rep}-${i}`} className="tk-item">
                <svg className="tk-icon"><use href={`#${item.icon}`}/></svg>
                <span>{item.label}</span>
              </div>,
              <div key={`d-${rep}-${i}`} className="tk-dot" />,
            ])
          )}
        </div>
      </div>

      {/* ── PAIN ── */}
      <section id="pain">
        <div className="container">
          <div className="pain-header fu">
            <div className="lbl">O Problema Real</div>
            <h2>Você já perdeu vendas<br /><span className="grad">hoje — só não sabe quais.</span></h2>
            <p className="pain-sub">Pesquisas mostram que 78% dos clientes compram do primeiro fornecedor que responde. Se seu WhatsApp demorou mais de 5 minutos, a venda já foi para o concorrente — e o lead nem te avisa.</p>
          </div>
          <div className="pain-grid">
            <div className="pcol bad fu">
              <div className="pcol-t">✗ Sem o FácilCRM</div>
              <ul className="pl">
                <li><span className="ic">✗</span>Lead manda mensagem às 22h e recebe resposta só de manhã — já comprou em outro lugar</li>
                <li><span className="ic">✗</span>Vendedor esquece o follow-up e o cliente esfria sem perceber</li>
                <li><span className="ic">✗</span>Não há controle de quem está pronto pra comprar e quem só está curiosando</li>
                <li><span className="ic">✗</span>Aniversário do cliente passa em branco — concorrente parabenizou e aproveitou</li>
                <li><span className="ic">✗</span>Promoção enviada manualmente, um por um, levando horas do dia do vendedor</li>
                <li><span className="ic">✗</span>Cliente compra, some — e nunca mais volta porque ninguém deu atenção depois</li>
              </ul>
            </div>
            <div className="pcol good fu">
              <div className="pcol-t">✓ Com o FácilCRM</div>
              <ul className="pl">
                <li><span className="ic">✓</span>IA responde em menos de 30 segundos — seja de madrugada, fim de semana ou feriado</li>
                <li><span className="ic">✓</span>Follow-up automático na hora certa: D+1, D+7, D+15 — zero lead esquecido</li>
                <li><span className="ic">✓</span>Kanban com score de calor mostra exatamente quem está pronto pra fechar agora</li>
                <li><span className="ic">✓</span>Parabéns personalizado no aniversário — com oferta, sem esforço</li>
                <li><span className="ic">✓</span>Campanha para centenas de clientes com 1 clique — com espaçamento anti-spam</li>
                <li><span className="ic">✓</span>Pós-venda e recompra automáticos — cliente volta sem você precisar pedir</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="hiw">
        <div className="container">
          <div className="hiw-hd fu">
            <div className="lbl">Jornada Automática</div>
            <h2>Do &quot;oi&quot; até a recompra —<br /><span className="grad">tudo acontece sozinho</span></h2>
            <p style={{color:"var(--lp-txt2)",marginTop:"10px",fontSize:".98rem"}}>Enquanto você dorme, a IA está aquecendo seus leads. Quando você acorda, o vendedor já tem quem fechar.</p>
            <div className="sdiv" />
          </div>
        </div>
        <div className="container" style={{overflow:"visible"}}>
          <div className="sw" ref={hiwScrollRef}>
            <div className="st">
              {STEPS.map((s, i) => (
                <div key={s.n} style={{display:"contents"}}>
                  <div className="gc scard">
                    <div className="sn">{s.n}</div>
                    <div className="si"><svg width="30" height="30"><use href={`#${s.icon}`}/></svg></div>
                    <div className="st2">{s.t}</div>
                    <div className="sd">{s.d}</div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="sarr">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M5 12h14M14 6l6 6-6 6"/>
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features">
        <div className="container">
          <div className="sc2 fu">
            <div className="lbl">Funcionalidades</div>
            <h2>Tudo que você precisa para<br /><span className="grad">nunca mais perder uma venda</span></h2>
            <p style={{color:"var(--lp-txt2)",marginTop:"12px",fontSize:"1rem"}}>Cada funcionalidade foi construída para resolver um problema real de quem vende pelo WhatsApp todo dia.</p>
          </div>
          <div className="fg">
            {FEATURES.map((f) => (
              <div key={f.t} className="gc fcard fu">
                <div className={`ni ${f.cls}`}><svg width="24" height="24"><use href={`#${f.icon}`}/></svg></div>
                <div className="ft">{f.t}</div>
                <div className="fd">{f.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HIGHLIGHT BOX ── */}
      <section style={{padding:"20px 0 60px",position:"relative",zIndex:2}}>
        <div className="container">
          <div className="hbox fu">
            <div className="hbox-icon">
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="rgba(99,102,241,.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{filter:"drop-shadow(0 0 18px rgba(99,102,241,.6))"}}>
                <rect x="9" y="9" width="6" height="6" rx="1"/><rect x="5" y="5" width="14" height="14" rx="3"/>
                <path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4"/>
              </svg>
            </div>
            <h2>Seu vendedor tem paciência para 10 follow-ups. A IA tem paciência para 10.000.</h2>
            <p>Nenhum vendedor aguenta mandar mensagem toda semana, parabenizar no aniversário, perguntar como foi a compra e oferecer desconto no momento certo — pra cada cliente da base. A IA do FácilCRM faz tudo isso, com consistência perfeita, sem nunca reclamar. O cliente se sente lembrado. E quem se sente lembrado, compra de você.</p>
            <Link href="/registro" className="btn bp" style={{fontSize:"1.05rem",padding:"16px 36px"}}>Ativar minha IA agora — grátis por 30 dias</Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testi">
        <div className="container">
          <div className="fu">
            <div className="lbl">Resultados Reais</div>
            <h2>O que muda em 30 dias<br /><span className="grad">de FácilCRM</span></h2>
          </div>
        </div>
        <div className="container" style={{overflow:"visible"}}>
          <div className="tw" ref={testiScrollRef}>
            <div className="tt">
              {DEPOIMENTOS.map((d) => (
                <div key={d.nome} className="gc tcard">
                  <div className="tstars">★★★★★</div>
                  <p className="ttxt">&quot;{d.txt}&quot;</p>
                  <div className="tauth">
                    <div className="tav" style={d.bg ? {background:d.bg} : {}}>{d.av}</div>
                    <div><div className="tn">{d.nome}</div><div className="tr2">{d.cargo}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing">
        <div className="container">
          <div className="sc2 fu">
            <div className="lbl">Planos</div>
            <h2>Quanto custa perder<br /><span className="grad">uma venda por dia?</span></h2>
            <p style={{color:"var(--lp-txt2)",marginTop:"12px",fontSize:"1rem"}}>Se você perde R$500 por mês em leads sem resposta, o FácilCRM se paga na primeira semana. 30 dias grátis — sem cartão.</p>
          </div>
          <div className="pg">
            <div className="gc pcard fu">
              <div className="pname">Starter</div>
              <div className="pdesc">Para quem está começando a profissionalizar vendas</div>
              <div className="pprice"><span className="pcur">R$</span><span className="pamt">397</span><span className="pper">/mês</span></div>
              <div className="panual">Ou R$ 3.970/ano — economize 2 meses</div>
              <ul className="pfl">
                <li>1 WhatsApp conectado</li><li>IA respondendo 24/7</li>
                <li>Pipeline Kanban completo</li><li>Follow-up automático</li>
                <li>Até 500 clientes ativos</li><li>Aniversário automático</li>
              </ul>
              <Link href="/registro?plano=STARTER" className="btn bs pcta">Começar grátis — 30 dias</Link>
            </div>
            <div className="gc pcard feat fu">
              <div className="pname">Pro</div>
              <div className="pdesc">Para empresas que querem escalar sem contratar</div>
              <div className="pprice"><span className="pcur">R$</span><span className="pamt">697</span><span className="pper">/mês</span></div>
              <div className="panual">Ou R$ 6.970/ano — economize 2 meses</div>
              <ul className="pfl">
                <li>Até 2 WhatsApp conectados</li><li>IA respondendo 24/7</li>
                <li>Pipeline Kanban completo</li><li>Follow-up automático</li>
                <li>Clientes ilimitados</li><li>Campanhas em massa</li>
                <li>Analytics completo</li><li>Aniversário automático</li>
              </ul>
              <Link href="/registro?plano=PRO" className="btn bp pcta">Começar grátis — 30 dias</Link>
            </div>
            <div className="gc pcard fu">
              <div className="pname">Agency</div>
              <div className="pdesc">Para agências que gerenciam múltiplos clientes</div>
              <div className="pprice"><span className="pcur">R$</span><span className="pamt">997</span><span className="pper">/mês</span></div>
              <div className="panual">Ou R$ 9.970/ano — economize 2 meses</div>
              <ul className="pfl">
                <li className="star">Fazemos toda a implantação por você</li>
                <li>3 WhatsApp conectados</li><li>Tudo do Pro incluído</li>
                <li>Suporte prioritário em até 2h</li><li>Gerente de conta dedicado</li>
                <li className="note">Acompanhamento estratégico mensal incluso</li>
                <li className="note">Instâncias adicionais negociadas direto com seu gerente</li>
              </ul>
              <Link href="/registro?plano=AGENCY" className="btn bs pcta">Começar grátis — 30 dias</Link>
            </div>
          </div>
          <p style={{textAlign:"center",color:"var(--lp-txt3)",fontSize:".83rem",marginTop:"22px"}}>
            Plano anual = <strong style={{color:"var(--lp-indigo-l)"}}>2 meses grátis</strong> · Cancele quando quiser · Sem fidelidade
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq">
        <div className="container">
          <div className="sc2 fu">
            <div className="lbl">FAQ</div>
            <h2>Suas dúvidas — respondidas<br /><span className="grad">com honestidade</span></h2>
          </div>
          <div className="fql">
            {FAQS.map((f, i) => (
              <div key={i} className={`gc fqi fu${openFaq === i ? " open" : ""}`} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div className="fqq">{f.q}<div className="fqtg">+</div></div>
                <div className="fqa">{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section id="ctaf">
        <div className="container">
          <div className="ctabox fu">
            <div style={{display:"flex",justifyContent:"center",marginBottom:"16px"}}>
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="rgba(99,102,241,.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{filter:"drop-shadow(0 0 18px rgba(99,102,241,.6))"}}>
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <h2>Seu concorrente vai ativar<br />isso <span className="grad">antes de você.</span></h2>
            <p style={{color:"var(--lp-txt2)",fontSize:"1.05rem",maxWidth:"580px",margin:"16px auto 30px",lineHeight:1.75}}>
              Enquanto você avalia, outro negócio no seu segmento já está respondendo leads em 10 segundos. Configure em 5 minutos. Os primeiros resultados aparecem em dias — não em meses.
            </p>
            <Link href="/registro" className="btn bp">Ativar minha IA agora — 30 dias grátis →</Link>
            <div className="ctrust">
              <span>✓ Sem cartão de crédito</span>
              <span>✓ Ativo em 5 minutos</span>
              <span>✓ Cancele quando quiser</span>
              <span>✓ Suporte em português</span>
            </div>
            <p style={{color:"var(--lp-txt3)",fontSize:".78rem",marginTop:"24px",maxWidth:"480px",marginLeft:"auto",marginRight:"auto"}}>
              <em>P.S. Se em 30 dias você não conseguir identificar pelo menos uma venda que viria do FácilCRM, basta cancelar. Sem perguntas. O risco é completamente nosso.</em>
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer>
        <div className="container">
          <div className="fi">
            <div>
              <a href="/" className="logo" style={{fontSize:"1.2rem"}}>FácilCRM</a>
              <p className="fc" style={{marginTop:"3px",fontStyle:"italic"}}>A IA que atende. O vendedor que fecha.</p>
              <p className="fc" style={{marginTop:"2px"}}>CRM com IA para empresas que vendem pelo WhatsApp</p>
            </div>
            <div className="fc">© 2026 FácilCRM · <a href="https://www.ocrmfacil.com.br">ocrmfacil.com.br</a></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
