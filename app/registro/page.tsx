"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SupportButton from "@/app/_components/SupportButton";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

.reg-wrap{
  min-height:100vh;display:flex;
  background:#04040c;color:#f0f0ff;
  font-family:'DM Sans',sans-serif;
  overflow-x:hidden;position:relative;
}
.reg-grid{position:fixed;inset:0;
  background-image:linear-gradient(rgba(99,102,241,.04) 1px,transparent 1px),
    linear-gradient(90deg,rgba(99,102,241,.04) 1px,transparent 1px);
  background-size:56px 56px;pointer-events:none;z-index:0}
.reg-orb{position:fixed;border-radius:50%;filter:blur(90px);pointer-events:none;opacity:.3}
.reg-o1{width:550px;height:550px;background:radial-gradient(circle,rgba(99,102,241,.3),transparent);top:-180px;right:-150px}
.reg-o2{width:380px;height:380px;background:radial-gradient(circle,rgba(34,211,238,.18),transparent);bottom:0;left:-80px}

/* Left panel */
.reg-left{
  width:46%;display:flex;flex-direction:column;justify-content:center;
  padding:60px 48px;position:relative;z-index:2;
  border-right:1px solid rgba(255,255,255,.05);
}
.reg-logo{
  font-family:'Syne',sans-serif;font-size:1.4rem;font-weight:800;
  background:linear-gradient(135deg,#818cf8,#22d3ee);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  text-decoration:none;display:block;margin-bottom:48px;
}
.reg-h1{
  font-family:'Syne',sans-serif;font-weight:800;letter-spacing:-.02em;
  font-size:clamp(1.7rem,2.5vw,2.4rem);line-height:1.12;margin-bottom:14px;
}
.reg-grad{
  background:linear-gradient(135deg,#818cf8,#22d3ee);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.reg-sub{color:rgba(240,240,255,.45);font-size:.88rem;line-height:1.7;margin-bottom:32px;max-width:340px}
.reg-checks{display:flex;flex-direction:column;gap:11px}
.reg-check{display:flex;align-items:center;gap:10px;font-size:.85rem;color:rgba(240,240,255,.65)}
.reg-check-ic{width:18px;height:18px;border-radius:50%;background:rgba(16,185,129,.15);
  border:1px solid rgba(16,185,129,.3);display:flex;align-items:center;justify-content:center;flex-shrink:0}

/* Right — scrollable form */
.reg-right{
  flex:1;display:flex;align-items:flex-start;justify-content:center;
  padding:40px 24px;overflow-y:auto;position:relative;z-index:2;
}
.reg-card{
  width:100%;max-width:400px;
  background:rgba(255,255,255,.035);
  backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  border:1px solid rgba(255,255,255,.1);border-radius:24px;
  padding:32px;box-shadow:0 24px 80px rgba(0,0,0,.5);
}
.reg-card-title{font-family:'Syne',sans-serif;font-weight:700;font-size:1.2rem;color:#f0f0ff;margin-bottom:4px}
.reg-card-sub{font-size:.8rem;color:rgba(240,240,255,.35);margin-bottom:22px}

.reg-label{display:block;font-size:.68rem;font-weight:600;letter-spacing:.1em;color:rgba(240,240,255,.4);margin-bottom:6px}
.reg-input{
  width:100%;background:rgba(255,255,255,.05);
  border:1px solid rgba(255,255,255,.1);border-radius:12px;
  padding:11px 14px;font-size:.86rem;color:#f0f0ff;
  font-family:'DM Sans',sans-serif;outline:none;
  transition:border-color .2s,box-shadow .2s;box-sizing:border-box;
}
.reg-input:focus{border-color:rgba(99,102,241,.55);box-shadow:0 0 0 3px rgba(99,102,241,.12)}
.reg-input::placeholder{color:rgba(240,240,255,.18)}
.reg-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}

.reg-btn{
  width:100%;padding:13px;border-radius:12px;
  font-family:'DM Sans',sans-serif;font-weight:700;font-size:.95rem;
  cursor:pointer;border:none;margin-top:8px;
  background:linear-gradient(135deg,#6366f1,#7c3aed);color:#fff;
  transition:transform .2s,box-shadow .2s;
}
.reg-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 28px rgba(99,102,241,.45)}
.reg-btn:disabled{opacity:.5;cursor:not-allowed}

.reg-err{
  background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);
  color:#f87171;border-radius:12px;padding:10px 14px;font-size:.82rem;margin-bottom:14px;
}
.reg-terms{font-size:.72rem;color:rgba(240,240,255,.25);text-align:center;margin-top:14px;line-height:1.5}
.reg-terms a{color:rgba(240,240,255,.4);text-decoration:underline}

@keyframes reg-spin{to{transform:rotate(360deg)}}
.reg-spin{width:15px;height:15px;border:2px solid #fff;border-top-color:transparent;
  border-radius:50%;display:inline-block;animation:reg-spin .7s linear infinite}

@media(max-width:768px){
  .reg-left{display:none}
  .reg-wrap{display:block}
  .reg-right{min-height:100vh;padding:40px 20px}
}
`;

const VANTAGENS = [
  "30 dias grátis — sem cartão de crédito",
  "IA respondendo seu WhatsApp em segundos",
  "Pipeline Kanban com score de calor",
  "Follow-up automático para cada lead",
  "Cancele quando quiser, sem burocracia",
];

export default function RegistroPage() {
  const router = useRouter();
  const [form, setForm]         = useState({ nomeEmpresa:"", nome:"", telefone:"", email:"", senha:"", confirmar:"" });
  const [erro, setErro]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [showSenha, setShowSenha]       = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (form.senha !== form.confirmar) { setErro("As senhas não coincidem"); return; }
    setLoading(true);
    const res = await fetch("/api/auth/registro", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ nomeEmpresa:form.nomeEmpresa, nome:form.nome, telefone:form.telefone, email:form.email, senha:form.senha }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setErro(data.error || "Erro ao criar conta"); return; }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="reg-wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="reg-grid" />
      <div className="reg-orb reg-o1" />
      <div className="reg-orb reg-o2" />

      {/* Left panel */}
      <div className="reg-left">
        <a href="/" className="reg-logo">FácilCRM</a>
        <h1 className="reg-h1">Comece grátis.<br /><span className="reg-grad">Venda mais em dias.</span></h1>
        <p className="reg-sub">Configure em 5 minutos e veja sua IA atendendo clientes ainda hoje. Sem cartão, sem compromisso.</p>
        <div className="reg-checks">
          {VANTAGENS.map(v=>(
            <div key={v} className="reg-check">
              <div className="reg-check-ic">
                <svg width="10" height="10" fill="none" stroke="#10b981" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              {v}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="reg-right">
        <div className="reg-card">
          <a href="/" className="reg-logo" style={{ fontSize:"1.2rem", marginBottom:16 }}>FácilCRM</a>
          <div className="reg-card-title">Teste grátis por 30 dias</div>
          <div className="reg-card-sub">Sem cartão de crédito. Cancele quando quiser.</div>

          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {erro && <div className="reg-err">{erro}</div>}

            <div>
              <label className="reg-label">NOME DA EMPRESA</label>
              <input className="reg-input" type="text" value={form.nomeEmpresa}
                onChange={e=>set("nomeEmpresa",e.target.value)} required placeholder="Ex: Minha Loja" />
            </div>

            <div className="reg-row">
              <div>
                <label className="reg-label">SEU NOME</label>
                <input className="reg-input" type="text" value={form.nome}
                  onChange={e=>set("nome",e.target.value)} required placeholder="Nome completo" />
              </div>
              <div>
                <label className="reg-label">WHATSAPP</label>
                <input className="reg-input" type="tel" value={form.telefone}
                  onChange={e=>set("telefone",e.target.value)} required placeholder="(62) 99999-9999" />
              </div>
            </div>

            <div>
              <label className="reg-label">E-MAIL</label>
              <input className="reg-input" type="email" value={form.email}
                onChange={e=>set("email",e.target.value)} required placeholder="seu@email.com" />
            </div>

            <div className="reg-row">
              <div style={{ position:"relative" }}>
                <label className="reg-label">SENHA</label>
                <input className="reg-input" type={showSenha?"text":"password"} value={form.senha}
                  onChange={e=>set("senha",e.target.value)} required minLength={8}
                  placeholder="Mín. 8 caracteres" style={{ paddingRight:40 }} />
                <button type="button" onClick={()=>setShowSenha(!showSenha)}
                  style={{ position:"absolute",right:10,bottom:10,background:"none",border:"none",
                    color:"rgba(240,240,255,.3)",cursor:"pointer",padding:2 }}>
                  {showSenha
                    ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                    : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  }
                </button>
              </div>
              <div style={{ position:"relative" }}>
                <label className="reg-label">CONFIRMAR</label>
                <input className="reg-input" type={showConfirmar?"text":"password"} value={form.confirmar}
                  onChange={e=>set("confirmar",e.target.value)} required
                  placeholder="Repita a senha" style={{ paddingRight:40 }} />
                <button type="button" onClick={()=>setShowConfirmar(!showConfirmar)}
                  style={{ position:"absolute",right:10,bottom:10,background:"none",border:"none",
                    color:"rgba(240,240,255,.3)",cursor:"pointer",padding:2 }}>
                  {showConfirmar
                    ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                    : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  }
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="reg-btn">
              {loading
                ? <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><span className="reg-spin"/>Criando conta...</span>
                : "Começar teste grátis →"
              }
            </button>
          </form>

          <div className="reg-terms">
            Ao criar sua conta você concorda com nossos{" "}
            <a href="#">Termos de Uso</a> e <a href="#">Política de Privacidade</a>.
          </div>

          <p style={{ textAlign:"center",fontSize:".8rem",color:"rgba(240,240,255,.3)",marginTop:16 }}>
            Já tem conta?{" "}
            <Link href="/login" style={{ color:"#818cf8",textDecoration:"none",fontWeight:600 }}>Entrar</Link>
          </p>
        </div>
      </div>

      <SupportButton />
    </div>
  );
}
