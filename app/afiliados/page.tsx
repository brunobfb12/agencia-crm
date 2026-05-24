"use client";
import { useEffect } from "react";

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
:root{
  --bg:#04040c;--indigo:#6366f1;--indigo-l:#818cf8;--violet:#7c3aed;
  --cyan:#22d3ee;--emerald:#10b981;--amber:#f59e0b;--txt:#f0f0ff;
  --txt2:rgba(240,240,255,.6);--txt3:rgba(240,240,255,.35);
  --gb:rgba(255,255,255,.035);--gbh:rgba(255,255,255,.065);
  --gbd:rgba(255,255,255,.08);--gbdh:rgba(99,102,241,.4);
  --r:16px;--rl:24px;--tr:all .3s cubic-bezier(.4,0,.2,1)
}
.lp-root{font-family:'DM Sans',sans-serif;background:#04040c;color:#f0f0ff;overflow-x:hidden;line-height:1.6;min-height:100vh}
.lp-root::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(99,102,241,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.04) 1px,transparent 1px);background-size:56px 56px;pointer-events:none;z-index:0}
#cg{position:fixed;width:480px;height:480px;background:radial-gradient(circle,rgba(16,185,129,.12) 0%,rgba(99,102,241,.06) 40%,transparent 70%);border-radius:50%;pointer-events:none;transform:translate(-50%,-50%);z-index:1;transition:left .06s linear,top .06s linear;mix-blend-mode:screen}
.orbs{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}
.orb{position:absolute;border-radius:50%;filter:blur(90px);opacity:.3}
.o1{width:600px;height:600px;background:radial-gradient(circle,rgba(16,185,129,.3),transparent);top:-200px;right:-100px}
.o2{width:500px;height:500px;background:radial-gradient(circle,rgba(99,102,241,.25),transparent);bottom:10%;left:-100px}
.o3{width:350px;height:350px;background:radial-gradient(circle,rgba(245,158,11,.15),transparent);top:50%;left:40%}
.container{max-width:1100px;margin:0 auto;padding:0 24px;position:relative;z-index:2}
section{position:relative;z-index:2}
h1,h2,h3{font-family:'Syne',sans-serif;line-height:1.1}
h1{font-size:clamp(2.4rem,5vw,4.4rem);font-weight:800}
h2{font-size:clamp(1.8rem,3vw,2.7rem);font-weight:700}
.grad{background:linear-gradient(135deg,var(--emerald) 0%,var(--cyan) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.grad2{background:linear-gradient(135deg,var(--indigo-l) 0%,var(--cyan) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.lbl{display:inline-flex;align-items:center;gap:8px;font-size:.72rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--emerald);padding:5px 14px;border:1px solid rgba(16,185,129,.28);border-radius:100px;background:rgba(16,185,129,.07);margin-bottom:18px}
.gc{background:var(--gb);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--gbd);border-radius:var(--rl);transition:var(--tr)}
.gc:hover{background:var(--gbh);border-color:var(--gbdh);transform:translateY(-4px);box-shadow:0 0 50px rgba(16,185,129,.15)}
.btn{display:inline-flex;align-items:center;gap:8px;padding:14px 28px;border-radius:12px;font-family:'DM Sans',sans-serif;font-weight:600;font-size:1rem;cursor:pointer;border:none;transition:var(--tr);text-decoration:none}
.bp{background:linear-gradient(135deg,var(--emerald),#059669);color:#fff}
.bp:hover{transform:translateY(-2px);box-shadow:0 8px 44px rgba(16,185,129,.5)}
.bs{background:rgba(255,255,255,.04);color:var(--txt);border:1px solid var(--gbd)}
.bs:hover{background:rgba(255,255,255,.09)}
.fu{opacity:0;transform:translateY(28px);transition:opacity .65s ease,transform .65s ease}
.fu.v{opacity:1;transform:translateY(0)}
.fu:nth-child(2){transition-delay:.1s}.fu:nth-child(3){transition-delay:.2s}.fu:nth-child(4){transition-delay:.3s}
.sc2{text-align:center}
.sc2 p{color:var(--txt2);margin-top:12px;max-width:520px;margin-left:auto;margin-right:auto;font-size:1rem}
nav{position:fixed;top:0;left:0;right:0;z-index:1000;padding:14px 0;backdrop-filter:blur(22px);background:rgba(4,4,12,.82);border-bottom:1px solid var(--gbd)}
.nav-i{display:flex;align-items:center;justify-content:space-between}
.logo{font-family:'Syne',sans-serif;font-size:1.2rem;font-weight:800;background:linear-gradient(135deg,var(--indigo-l),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-decoration:none}
.logo-tag{font-size:.6rem;color:var(--emerald);letter-spacing:.08em;display:block;margin-top:1px}
#hero{min-height:100vh;display:flex;align-items:center;padding:120px 0 80px}
.hbadge{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.25);border-radius:100px;font-size:.78rem;color:var(--emerald);margin-bottom:22px}
.hbadge::before{content:'';display:block;width:7px;height:7px;background:var(--emerald);border-radius:50%;animation:blink 2s ease-in-out infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.25}}
.ecards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:52px}
.ecard{padding:24px;text-align:center}
.eplan{font-size:.72rem;color:var(--txt3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px}
.eamt{font-family:'Syne',sans-serif;font-size:1.8rem;font-weight:800;color:var(--emerald);filter:drop-shadow(0 0 12px rgba(16,185,129,.4))}
.etype{font-size:.75rem;color:var(--txt3);margin-top:4px}
.eor{display:flex;align-items:center;gap:8px;margin:6px 0;font-size:.7rem;color:var(--txt3)}
.eor::before,.eor::after{content:'';flex:1;height:1px;background:var(--gbd)}
.eamt2{font-family:'Syne',sans-serif;font-size:1.1rem;font-weight:700;color:var(--indigo-l)}
.ctable{width:100%;border-collapse:collapse;margin-top:44px}
.ctable th{padding:12px 20px;text-align:left;font-size:.72rem;color:var(--txt3);font-weight:600;letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid var(--gbd)}
.ctable td{padding:16px 20px;font-size:.88rem;border-bottom:1px solid rgba(255,255,255,.04)}
.ctable tr:last-child td{border-bottom:none}
.ctable tr:hover td{background:rgba(255,255,255,.02)}
.tag{display:inline-block;padding:3px 10px;border-radius:100px;font-size:.68rem;font-weight:600}
.tag.g{background:rgba(16,185,129,.12);color:var(--emerald);border:1px solid rgba(16,185,129,.2)}
.tag.b{background:rgba(99,102,241,.12);color:var(--indigo-l);border:1px solid rgba(99,102,241,.2)}
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:44px}
.step{padding:28px;text-align:center}
.step-n{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--emerald),var(--cyan));display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:1rem;color:#fff;margin:0 auto 16px;box-shadow:0 0 20px rgba(16,185,129,.4)}
.step-t{font-family:'Syne',sans-serif;font-weight:700;font-size:.95rem;margin-bottom:8px}
.step-d{font-size:.83rem;color:var(--txt2);line-height:1.6}
.personas{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:44px}
.persona{padding:28px}
.persona-icon{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:0}
.persona-icon svg{width:24px;height:24px}
.pi-g{background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.22);color:var(--indigo-l);animation:np 4s ease-in-out infinite}
.pi-a{background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.22);color:var(--amber);animation:npa 4s ease-in-out infinite}
.pi-y{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.22);color:#f87171;animation:npr 4s ease-in-out infinite}
@keyframes np{0%,100%{box-shadow:0 0 8px rgba(99,102,241,.3)}50%{box-shadow:0 0 22px rgba(99,102,241,.65)}}
@keyframes npa{0%,100%{box-shadow:0 0 8px rgba(245,158,11,.3)}50%{box-shadow:0 0 22px rgba(245,158,11,.65)}}
@keyframes npr{0%,100%{box-shadow:0 0 8px rgba(239,68,68,.3)}50%{box-shadow:0 0 22px rgba(239,68,68,.65)}}
.persona-t{font-family:'Syne',sans-serif;font-weight:700;font-size:1rem;margin-bottom:8px}
.persona-d{font-size:.83rem;color:var(--txt2);line-height:1.65}
.persona-tag{display:inline-flex;align-items:center;gap:5px;margin-top:12px;font-size:.72rem;color:var(--emerald);font-weight:600}
.wsg{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:44px}
.wsitem{padding:24px;display:flex;gap:16px;align-items:flex-start}
.wsn{width:36px;height:36px;border-radius:10px;background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--emerald)}
.wst{font-family:'Syne',sans-serif;font-weight:700;font-size:.9rem;margin-bottom:5px}
.wsd{font-size:.82rem;color:var(--txt2);line-height:1.6}
.fql{display:flex;flex-direction:column;gap:10px;margin-top:44px;max-width:760px;margin-left:auto;margin-right:auto}
.fqi{border-radius:var(--r);overflow:hidden;cursor:pointer}
.fqq{padding:20px 24px;display:flex;justify-content:space-between;align-items:center;gap:16px;font-weight:600;font-size:.92rem}
.fqtg{width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:rgba(16,185,129,.1);color:var(--emerald);flex-shrink:0;transition:transform .3s}
.fqi.open .fqtg{transform:rotate(45deg)}
.fqa{max-height:0;overflow:hidden;transition:max-height .4s ease,padding .3s;padding:0 24px;font-size:.86rem;color:var(--txt2);line-height:1.75}
.fqi.open .fqa{max-height:220px;padding:0 24px 20px}
.ctabox{text-align:center;padding:80px 40px;border-radius:32px;background:linear-gradient(135deg,rgba(16,185,129,.1) 0%,rgba(99,102,241,.07) 50%,rgba(34,211,238,.05) 100%);border:1px solid rgba(16,185,129,.2);position:relative;overflow:hidden}
.ctabox::before{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:600px;height:1px;background:linear-gradient(90deg,transparent,rgba(16,185,129,.5),transparent)}
.ctrust{display:flex;gap:20px;justify-content:center;flex-wrap:wrap;margin-top:18px;font-size:.78rem;color:var(--txt3)}
.ctrust span{display:flex;align-items:center;gap:5px}
footer{padding:32px 0;border-top:1px solid var(--gbd)}
.fi{display:flex;justify-content:space-between;align-items:center}
.fc{font-size:.78rem;color:var(--txt3)}
.fc a{color:var(--txt3);text-decoration:none}
@media(max-width:860px){
  .ecards,.steps,.personas{grid-template-columns:1fr}
  .wsg{grid-template-columns:1fr}
  .nav-links{display:none}
  .fi{flex-direction:column;gap:12px;text-align:center}
}
`;

const HTML = `
<div id="cg"></div>
<div class="orbs"><div class="orb o1"></div><div class="orb o2"></div><div class="orb o3"></div></div>

<svg style="display:none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <symbol id="ic-zap" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></symbol>
    <symbol id="ic-users" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></symbol>
    <symbol id="ic-trending" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></symbol>
    <symbol id="ic-video" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></symbol>
    <symbol id="ic-link" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></symbol>
    <symbol id="ic-share" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></symbol>
    <symbol id="ic-dollar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></symbol>
    <symbol id="ic-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></symbol>
    <symbol id="ic-clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></symbol>
    <symbol id="ic-cpu" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="6" height="6" rx="1"/><rect x="5" y="5" width="14" height="14" rx="3"/><path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4"/></symbol>
  </defs>
</svg>

<nav>
  <div class="container">
    <div class="nav-i">
      <a href="https://www.ocrmfacil.com.br" class="logo">
        CRM Fácil
        <span class="logo-tag">Programa de Afiliados</span>
      </a>
      <a href="https://www.ocrmfacil.com.br" class="btn bs" style="padding:9px 18px;font-size:.82rem">Ver o produto →</a>
    </div>
  </div>
</nav>

<section id="hero">
  <div class="container">
    <div style="max-width:760px;margin:0 auto;text-align:center">
      <div class="hbadge">Programa de Afiliados — Hotmart</div>
      <h1>Indique o CRM Fácil.<br><span class="grad">Ganhe toda vez</span><br>que sua indicação pagar.</h1>
      <p style="font-size:1.1rem;color:var(--txt2);line-height:1.75;margin:22px auto 36px;max-width:580px">
        Você já tem audiência. Seus seguidores ou clientes provavelmente têm equipe de vendas no WhatsApp — e estão perdendo dinheiro sem saber. Você apresenta o CRM Fácil. Nós convertemos. Você ganha.
      </p>
      <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">
        <a href="https://hotmart.com/ocrmfacil/afiliados" class="btn bp" style="font-size:1.05rem;padding:16px 36px">Quero ser afiliado agora →</a>
        <a href="#como-funciona" class="btn bs">Como funciona ↓</a>
      </div>
      <p style="font-size:.78rem;color:var(--txt3);margin-top:14px">✓ Gratuito para se cadastrar · ✓ Cookie de 365 dias · ✓ Pagamento via Hotmart</p>
    </div>
    <div class="ecards" style="margin-top:64px">
      <div class="gc ecard fu">
        <div class="eplan">Plano Starter</div>
        <div class="eamt">R$ 1.491</div>
        <div class="etype">por indicação anual (30%)</div>
        <div class="eor">ou</div>
        <div class="eamt2">R$ 124/mês</div>
        <div class="etype">recorrente por 12 meses (25%)</div>
      </div>
      <div class="gc ecard fu" style="border-color:rgba(16,185,129,.3);background:rgba(16,185,129,.05)">
        <div class="eplan" style="color:var(--emerald)">Plano Pro — mais vendido</div>
        <div class="eamt">R$ 2.691</div>
        <div class="etype">por indicação anual (30%)</div>
        <div class="eor">ou</div>
        <div class="eamt2">R$ 224/mês</div>
        <div class="etype">recorrente por 12 meses (25%)</div>
      </div>
      <div class="gc ecard fu">
        <div class="eplan">Plano Agency</div>
        <div class="eamt">R$ 4.491</div>
        <div class="etype">por indicação anual (30%)</div>
        <div class="eor">ou</div>
        <div class="eamt2">R$ 374/mês</div>
        <div class="etype">recorrente por 12 meses (25%)</div>
      </div>
    </div>
    <p style="text-align:center;color:var(--txt3);font-size:.78rem;margin-top:16px">Comissão calculada sobre o valor cobrado. Anual = 10 meses (2 meses grátis para o cliente).</p>
  </div>
</section>

<section style="padding:80px 0">
  <div class="container">
    <div class="sc2 fu">
      <div class="lbl">Este programa é para você</div>
      <h2>Quem <span class="grad2">performa</span> como afiliado do CRM Fácil</h2>
      <p>Três perfis que já têm a audiência certa — e podem começar a gerar renda agora.</p>
    </div>
    <div class="personas">
      <div class="gc persona fu">
        <div class="persona-icon pi-g"><svg width="24" height="24"><use href="#ic-trending"/></svg></div>
        <div class="persona-t">Gestor de Tráfego</div>
        <div class="persona-d">Você gera leads para negócios locais e PMEs todo dia. Seus clientes têm WhatsApp lotado de mensagens sem resposta. O CRM Fácil resolve o problema que você mesmo vê na operação deles — e você ganha por cada um que assinar.</div>
        <div class="persona-tag"><svg width="12" height="12"><use href="#ic-check"/></svg>Seu cliente já é o cliente ideal do CRM Fácil</div>
      </div>
      <div class="gc persona fu">
        <div class="persona-icon pi-a"><svg width="24" height="24"><use href="#ic-users"/></svg></div>
        <div class="persona-t">Agência de Marketing</div>
        <div class="persona-d">Você já tem carteira de clientes que vendem pelo WhatsApp. Adicionar o CRM Fácil ao seu portfólio é indicar uma solução que seus clientes precisam, fechar mais valor por conta e ainda receber comissão recorrente de cada assinatura.</div>
        <div class="persona-tag"><svg width="12" height="12"><use href="#ic-check"/></svg>Receita recorrente sem aumentar sua operação</div>
      </div>
      <div class="gc persona fu">
        <div class="persona-icon pi-y"><svg width="24" height="24"><use href="#ic-video"/></svg></div>
        <div class="persona-t">YouTuber e Criador de Conteúdo</div>
        <div class="persona-d">Você fala sobre vendas, negócios, marketing ou empreendedorismo. Sua audiência tem empresas, times de vendas e profissionais que vivem o problema que o CRM Fácil resolve. Um vídeo, um post ou uma story pode gerar comissões por meses.</div>
        <div class="persona-tag"><svg width="12" height="12"><use href="#ic-check"/></svg>Cookie de 365 dias — você ganha mesmo depois</div>
      </div>
    </div>
  </div>
</section>

<section style="padding:40px 0 80px">
  <div class="container">
    <div class="sc2 fu">
      <div class="lbl">Por que converte</div>
      <h2>O produto que <span class="grad">se vende sozinho</span></h2>
      <p>Você não precisa convencer ninguém de que precisa responder mais rápido. A dor já existe. Você só apresenta a solução.</p>
    </div>
    <div class="wsg">
      <div class="gc wsitem fu"><div class="wsn"><svg width="18" height="18"><use href="#ic-zap"/></svg></div><div><div class="wst">30 dias grátis sem cartão</div><div class="wsd">Você indica. Seu lead testa de graça. A própria IA faz a conversão durante o trial. Sua comissão entra quando ele assina — e a taxa de conversão de trial é alta porque o produto entrega valor rápido.</div></div></div>
      <div class="gc wsitem fu"><div class="wsn"><svg width="18" height="18"><use href="#ic-clock"/></svg></div><div><div class="wst">Cookie de 365 dias</div><div class="wsd">Seu lead clicou no link hoje, assinou em 3 meses? Você recebe. Empresas B2B têm ciclo de decisão longo. Com 365 dias de janela, nenhuma indicação é perdida.</div></div></div>
      <div class="gc wsitem fu"><div class="wsn"><svg width="18" height="18"><use href="#ic-cpu"/></svg></div><div><div class="wst">Dor universal e óbvia</div><div class="wsd">Qualquer empresa que vende pelo WhatsApp tem o problema. Não é nicho — é o canal de vendas número 1 do Brasil. Você não precisa educar o mercado, só apresentar a solução.</div></div></div>
      <div class="gc wsitem fu"><div class="wsn"><svg width="18" height="18"><use href="#ic-dollar"/></svg></div><div><div class="wst">Ticket alto, comissão alta</div><div class="wsd">Não é um produto de R$97. Você ganha R$1.491 por uma indicação Starter anual — e R$4.491 por um Agency. Um conteúdo bem feito pode gerar isso várias vezes.</div></div></div>
    </div>
  </div>
</section>

<section id="como-funciona" style="padding:40px 0 80px">
  <div class="container">
    <div class="sc2 fu">
      <div class="lbl">Como funciona</div>
      <h2>3 passos para <span class="grad">começar a ganhar</span></h2>
    </div>
    <div class="steps">
      <div class="gc step fu"><div class="step-n">01</div><div class="step-t">Cadastre-se na Hotmart</div><div class="step-d">Acesse o programa pelo link abaixo, crie sua conta de afiliado na Hotmart (gratuito) e solicite aprovação. Em até 48h você recebe seu link exclusivo.</div></div>
      <div class="gc step fu"><div class="step-n">02</div><div class="step-t">Divulgue para sua audiência</div><div class="step-d">Use seu link em vídeos, posts, stories, e-mails, artigos ou diretamente com seus clientes. Disponibilizamos materiais de apoio: copy pronta, artes e roteiros.</div></div>
      <div class="gc step fu"><div class="step-n">03</div><div class="step-t">Receba sua comissão</div><div class="step-d">Quando seu indicado assinar qualquer plano, sua comissão cai automaticamente pela Hotmart. Acompanhe em tempo real no painel de afiliados.</div></div>
    </div>
    <div class="gc fu" style="margin-top:52px;overflow:hidden">
      <div style="padding:28px 28px 0">
        <div class="lbl">Estrutura de comissões</div>
        <h3 style="font-family:'Syne',sans-serif;font-size:1.2rem;font-weight:700;margin-bottom:4px">Simples e transparente</h3>
        <p style="font-size:.85rem;color:var(--txt2)">Sem letra pequena. Sem surpresas.</p>
      </div>
      <div style="overflow-x:auto">
        <table class="ctable">
          <thead>
            <tr>
              <th>Plano</th><th>Valor do plano</th><th>Anual — 30% one-time</th><th>Mensal — 25% × 12 meses</th><th>Cookie</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style="font-weight:600">Starter</td><td style="color:var(--txt2)">R$ 497/mês · R$ 4.970/ano</td><td><span class="tag g">R$ 1.491 único</span></td><td><span class="tag b">R$ 124/mês</span></td><td style="color:var(--txt3)">365 dias</td></tr>
            <tr><td style="font-weight:600">Pro <span style="font-size:.68rem;color:var(--emerald);margin-left:4px">mais vendido</span></td><td style="color:var(--txt2)">R$ 897/mês · R$ 8.970/ano</td><td><span class="tag g">R$ 2.691 único</span></td><td><span class="tag b">R$ 224/mês</span></td><td style="color:var(--txt3)">365 dias</td></tr>
            <tr><td style="font-weight:600">Agency</td><td style="color:var(--txt2)">R$ 1.497/mês · R$ 14.970/ano</td><td><span class="tag g">R$ 4.491 único</span></td><td><span class="tag b">R$ 374/mês</span></td><td style="color:var(--txt3)">365 dias</td></tr>
          </tbody>
        </table>
      </div>
      <div style="padding:16px 28px;font-size:.75rem;color:var(--txt3);border-top:1px solid var(--gbd)">* Anual calculado sobre 10 meses pagos (cliente recebe 2 meses grátis). Mensal pago mensalmente durante 12 meses de permanência.</div>
    </div>
  </div>
</section>

<section style="padding:40px 0 80px">
  <div class="container">
    <div class="sc2 fu">
      <div class="lbl">FAQ Afiliados</div>
      <h2>Dúvidas antes de <span class="grad2">se cadastrar</span></h2>
    </div>
    <div class="fql">
      <div class="gc fqi fu" onclick="toggleFaq(this)"><div class="fqq">Quanto tempo leva para ser aprovado como afiliado?<div class="fqtg">+</div></div><div class="fqa">Em até 48 horas úteis após o cadastro na Hotmart. Aprovamos afiliados com audiência relacionada a negócios, vendas, marketing e empreendedorismo.</div></div>
      <div class="gc fqi fu" onclick="toggleFaq(this)"><div class="fqq">Preciso pagar algo para ser afiliado?<div class="fqtg">+</div></div><div class="fqa">Não. O cadastro é gratuito. Você só precisa de uma conta na Hotmart (também gratuita) e solicitar a afiliação ao produto CRM Fácil.</div></div>
      <div class="gc fqi fu" onclick="toggleFaq(this)"><div class="fqq">Como e quando recebo minha comissão?<div class="fqtg">+</div></div><div class="fqa">Pelo painel da Hotmart, com os prazos padrões da plataforma. Comissões de planos anuais são creditadas após o período de garantia (30 dias). Mensais recorrentes são creditadas mês a mês enquanto o cliente permanecer ativo.</div></div>
      <div class="gc fqi fu" onclick="toggleFaq(this)"><div class="fqq">Vocês fornecem materiais de divulgação?<div class="fqtg">+</div></div><div class="fqa">Sim. Após a aprovação você recebe acesso a: copy pronta para posts e stories, artes em diferentes formatos, roteiro de vídeo de indicação e sugestões de abordagem para cada persona.</div></div>
      <div class="gc fqi fu" onclick="toggleFaq(this)"><div class="fqq">E se meu indicado cancelar antes dos 30 dias?<div class="fqtg">+</div></div><div class="fqa">O produto oferece 30 dias grátis antes de cobrar. Se o cliente cancelar dentro do trial, não há cobrança e portanto não há comissão. A comissão é gerada apenas sobre assinaturas efetivamente pagas.</div></div>
      <div class="gc fqi fu" onclick="toggleFaq(this)"><div class="fqq">Posso indicar para meus próprios clientes de agência?<div class="fqtg">+</div></div><div class="fqa">Sim, essa é uma das melhores estratégias. Se você é agência e seus clientes vendem pelo WhatsApp, você indica o CRM Fácil como parte do seu serviço e recebe comissão de cada um que assinar. É receita adicional sem aumentar sua operação.</div></div>
    </div>
  </div>
</section>

<section style="padding:40px 0 100px">
  <div class="container">
    <div class="ctabox fu">
      <div style="display:flex;justify-content:center;margin-bottom:16px">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(16,185,129,.9)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 16px rgba(16,185,129,.5))">
          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
        </svg>
      </div>
      <h2 style="margin-bottom:16px">Sua audiência já tem o problema.<br><span class="grad">Você só precisa apresentar a solução.</span></h2>
      <p style="color:var(--txt2);font-size:1.05rem;margin-bottom:36px;max-width:500px;margin-left:auto;margin-right:auto">Cadastre-se agora, receba seu link e comece a divulgar hoje. Sem investimento, sem risco — só comissão quando sua indicação fechar.</p>
      <a href="https://hotmart.com/ocrmfacil/afiliados" class="btn bp" style="font-size:1.1rem;padding:18px 44px">Quero ser afiliado agora →</a>
      <div class="ctrust">
        <span>✓ Cadastro gratuito</span>
        <span>✓ Cookie 365 dias</span>
        <span>✓ Materiais prontos</span>
        <span>✓ Pagamento via Hotmart</span>
      </div>
    </div>
  </div>
</section>

<footer>
  <div class="container">
    <div class="fi">
      <div>
        <a href="https://www.ocrmfacil.com.br" class="logo" style="font-size:1.1rem">CRM Fácil</a>
        <p class="fc" style="margin-top:3px;font-style:italic">Sua IA vende. Seu time de vendas fecha.</p>
      </div>
      <div class="fc">© 2026 CRM Fácil · <a href="https://www.ocrmfacil.com.br">ocrmfacil.com.br</a></div>
    </div>
  </div>
</footer>
`;

export default function AfiliadosPage() {
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

    document.documentElement.setAttribute("data-theme", "dark");

    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId);
      obs.disconnect();
      delete (window as any).toggleFaq;
    };
  }, []);

  return (
    <>
      <title>Programa de Afiliados — CRM Fácil</title>
      <meta name="description" content="Ganhe comissão recorrente indicando o CRM Fácil. Cookie de 365 dias, 25-30% de comissão, pagamento via Hotmart. Gratuito para se cadastrar." />
      <div className="lp-root">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div dangerouslySetInnerHTML={{ __html: HTML }} />
      </div>
    </>
  );
}
