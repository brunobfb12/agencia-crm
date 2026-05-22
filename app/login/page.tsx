"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SupportButton from "@/app/_components/SupportButton";

/* ── CSS ─────────────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

.auth-wrap {
  min-height:100vh;display:flex;
  background:#04040c;color:#f0f0ff;
  font-family:'DM Sans',sans-serif;
  overflow:hidden;position:relative;
}
.auth-grid{content:'';position:fixed;inset:0;
  background-image:linear-gradient(rgba(99,102,241,.04) 1px,transparent 1px),
    linear-gradient(90deg,rgba(99,102,241,.04) 1px,transparent 1px);
  background-size:56px 56px;pointer-events:none;z-index:0}
.auth-orb{position:fixed;border-radius:50%;filter:blur(90px);pointer-events:none;opacity:.35}
.auth-o1{width:600px;height:600px;background:radial-gradient(circle,rgba(99,102,241,.3),transparent);top:-200px;left:-180px}
.auth-o2{width:400px;height:400px;background:radial-gradient(circle,rgba(34,211,238,.2),transparent);bottom:5%;right:-100px}

/* Split layout */
.auth-left {
  width:54%;display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:64px 56px;position:relative;z-index:2;
  border-right:1px solid rgba(255,255,255,.05);
}
.auth-right {
  flex:1;display:flex;align-items:center;justify-content:center;
  padding:32px 24px;position:relative;z-index:2;
}

/* Logo */
.auth-logo{
  font-family:'Syne',sans-serif;font-size:1.4rem;font-weight:800;
  background:linear-gradient(135deg,#818cf8,#22d3ee);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  text-decoration:none;
}

/* Left copy */
.auth-h1{
  font-family:'Syne',sans-serif;font-weight:800;letter-spacing:-.02em;
  font-size:clamp(1.9rem,3vw,2.9rem);line-height:1.1;margin-bottom:14px;
}
.auth-grad{
  background:linear-gradient(135deg,#818cf8,#22d3ee);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.auth-sub{color:rgba(240,240,255,.5);font-size:.9rem;line-height:1.7;margin-bottom:28px;max-width:360px}

/* Phone mini */
.auth-phone{
  background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);
  border-radius:18px;padding:16px;max-width:300px;
  box-shadow:0 20px 60px rgba(99,102,241,.12);margin-bottom:28px;
}
.auth-msg{padding:9px 13px;border-radius:10px;font-size:.78rem;line-height:1.5;margin-bottom:8px;}
.auth-msg.u{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.07);color:rgba(240,240,255,.8);max-width:85%}
.auth-msg.a{
  background:linear-gradient(135deg,rgba(99,102,241,.18),rgba(124,58,237,.18));
  border:1px solid rgba(99,102,241,.2);color:rgba(240,240,255,.9);margin-left:auto;max-width:90%;
}
.auth-msg-t{font-size:.6rem;color:rgba(240,240,255,.28);margin-top:3px}

/* Stats row */
.auth-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.auth-stat{
  background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);
  border-radius:14px;padding:14px 10px;text-align:center;
}
.auth-stat-v{
  font-family:'Syne',sans-serif;font-size:1.3rem;font-weight:800;
  background:linear-gradient(135deg,#818cf8,#22d3ee);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.auth-stat-l{font-size:.65rem;color:rgba(240,240,255,.35);margin-top:3px}

/* Form card */
.auth-card{
  width:100%;max-width:380px;
  background:rgba(255,255,255,.035);
  backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  border:1px solid rgba(255,255,255,.1);
  border-radius:24px;padding:32px;
  box-shadow:0 24px 80px rgba(0,0,0,.5);
}
.auth-card-title{
  font-family:'Syne',sans-serif;font-weight:700;font-size:1.25rem;
  color:#f0f0ff;margin-bottom:4px;
}
.auth-card-sub{font-size:.8rem;color:rgba(240,240,255,.35);margin-bottom:24px}

/* Inputs */
.auth-label{display:block;font-size:.68rem;font-weight:600;letter-spacing:.1em;color:rgba(240,240,255,.4);margin-bottom:6px}
.auth-input{
  width:100%;background:rgba(255,255,255,.05);
  border:1px solid rgba(255,255,255,.1);border-radius:12px;
  padding:12px 16px;font-size:.88rem;color:#f0f0ff;
  font-family:'DM Sans',sans-serif;outline:none;
  transition:border-color .2s,box-shadow .2s;box-sizing:border-box;
}
.auth-input:focus{border-color:rgba(99,102,241,.55);box-shadow:0 0 0 3px rgba(99,102,241,.12)}
.auth-input::placeholder{color:rgba(240,240,255,.18)}
.auth-pwd-wrap{position:relative}
.auth-pwd-wrap input[type="password"]::-ms-reveal,
.auth-pwd-wrap input[type="password"]::-ms-clear{display:none}
.auth-eye{
  position:absolute;right:10px;top:50%;transform:translateY(-50%);
  display:flex;align-items:center;justify-content:center;
  width:28px;height:28px;background:none;border:none;
  color:#818cf8;cursor:pointer;z-index:2;padding:0;line-height:0;
}

/* Submit btn */
.auth-btn{
  width:100%;padding:13px;border-radius:12px;
  font-family:'DM Sans',sans-serif;font-weight:700;font-size:.95rem;
  cursor:pointer;border:none;margin-top:8px;
  background:linear-gradient(135deg,#6366f1,#7c3aed);color:#fff;
  transition:transform .2s,box-shadow .2s;
}
.auth-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 28px rgba(99,102,241,.45)}
.auth-btn:disabled{opacity:.5;cursor:not-allowed}

/* Error */
.auth-err{
  background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);
  color:#f87171;border-radius:12px;padding:10px 14px;font-size:.82rem;margin-bottom:14px;
}

/* Spinner */
@keyframes auth-spin{to{transform:rotate(360deg)}}
.auth-spin{
  width:15px;height:15px;border:2px solid #fff;border-top-color:transparent;
  border-radius:50%;display:inline-block;animation:auth-spin .7s linear infinite;
}

/* Responsive */
@media(max-width:768px){
  .auth-left{display:none}
  .auth-wrap{display:block}
  .auth-right{min-height:100vh;padding:40px 20px}
}
`;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]     = useState("");
  const [senha, setSenha]     = useState("");
  const [erro, setErro]       = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  /* Redireciona se já estiver logado */
  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d?.id) router.replace("/dashboard");
    }).catch(() => {});
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro(""); setLoading(true);
    const res = await fetch("/api/auth/login", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ email, senha }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setErro(data.error || "Email ou senha inválidos"); return; }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="auth-wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="auth-grid" />
      <div className="auth-orb auth-o1" />
      <div className="auth-orb auth-o2" />

      {/* ── Left panel ── */}
      <div className="auth-left">
        <div style={{ width:"100%", maxWidth:400 }}>
          <a href="/" className="auth-logo" style={{ display:"block", marginBottom:48 }}>FácilCRM</a>
          <h1 className="auth-h1">A IA que atende.<br /><span className="auth-grad">O vendedor que fecha.</span></h1>
          <p className="auth-sub">Resposta em menos de 30 segundos, qualificação automática e pipeline visual — enquanto você dorme.</p>

          <div className="auth-phone">
            <div className="auth-msg u">Oi! Quero saber o preço<div className="auth-msg-t">22:43</div></div>
            <div className="auth-msg a">Oi! Temos opções a partir de R$397/mês 😊 Posso montar uma proposta personalizada. Você prefere mensal ou anual?<div className="auth-msg-t" style={{textAlign:"right"}}>IA · respondeu em 5s ✓✓</div></div>
          </div>

          <div className="auth-stats">
            {[{v:"<30s",l:"Resposta média"},{v:"24/7",l:"Sem pausas"},{v:"3×",l:"Mais conversões"}].map(s=>(
              <div key={s.l} className="auth-stat">
                <div className="auth-stat-v">{s.v}</div>
                <div className="auth-stat-l">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="auth-right">
        <div className="auth-card">
          <a href="/" className="auth-logo" style={{ display:"block", marginBottom:22 }}>FácilCRM</a>
          <div className="auth-card-title">Bem-vindo de volta</div>
          <div className="auth-card-sub">Entre com suas credenciais para continuar</div>

          <form onSubmit={handleLogin}>
            {erro && <div className="auth-err">{erro}</div>}

            <div style={{ marginBottom:14 }}>
              <label className="auth-label">E-MAIL</label>
              <input className="auth-input" type="email" value={email} onChange={e=>setEmail(e.target.value)}
                required autoComplete="email" placeholder="seu@email.com" />
            </div>

            <div style={{ marginBottom:8 }} className="auth-pwd-wrap">
              <label className="auth-label">SENHA</label>
              <input className="auth-input" type={showPwd?"text":"password"} value={senha}
                onChange={e=>setSenha(e.target.value)} required autoComplete="current-password"
                placeholder="••••••••" style={{ paddingRight:44 }} />
              <button type="button" className="auth-eye" onClick={()=>setShowPwd(!showPwd)}>
                {showPwd
                  ? <svg width="18" height="18" fill="none" stroke="#818cf8" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  : <svg width="18" height="18" fill="none" stroke="#818cf8" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                }
              </button>
            </div>

            <button type="submit" disabled={loading} className="auth-btn">
              {loading
                ? <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><span className="auth-spin"/>Entrando...</span>
                : "Entrar →"
              }
            </button>
          </form>

          <p style={{ textAlign:"center",fontSize:".78rem",color:"rgba(240,240,255,.28)",marginTop:16 }}>
            <a href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP||"5562985974090"}?text=${encodeURIComponent("Preciso redefinir minha senha do FácilCRM")}`}
              target="_blank" rel="noopener noreferrer"
              style={{ color:"rgba(240,240,255,.45)",textDecoration:"none" }}>
              Esqueceu a senha?
            </a>
          </p>
          <p style={{ textAlign:"center",fontSize:".8rem",color:"rgba(240,240,255,.3)",marginTop:10 }}>
            Não tem conta?{" "}
            <Link href="/registro" style={{ color:"#818cf8",textDecoration:"none",fontWeight:600 }}>
              Teste grátis — 30 dias
            </Link>
          </p>
        </div>
      </div>

      <SupportButton />
    </div>
  );
}
