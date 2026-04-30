"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/* ── Continent dots [lon, lat] ──────────────────────────────────── */
function buildContinentDots(): [number, number][] {
  const dots: [number, number][] = [];
  const regions: [number, number, number, number, number][] = [
    [-18, 52,  -34, 37,  9],  // Africa
    [-82, -34, -55, 12,  10], // South America
    [-125,-60,  25, 72,  13], // North America
    [-12,  45,  36, 71,  10], // Europe
    [ 28, 148,  -2, 77,  14], // Asia
    [114, 154, -42, -9,  10], // Australia
  ];
  for (const [lonMin, lonMax, latMin, latMax, step] of regions) {
    for (let lon = lonMin; lon <= lonMax; lon += step) {
      for (let lat = latMin; lat <= latMax; lat += step) {
        dots.push([lon, lat]);
      }
    }
  }
  return dots;
}
const DOTS = buildContinentDots();

/* ── Globe canvas component ─────────────────────────────────────── */
function GlobeCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const S = 360;
    canvas.width  = S * dpr;
    canvas.height = S * dpr;
    canvas.style.width  = `${S}px`;
    canvas.style.height = `${S}px`;
    ctx.scale(dpr, dpr);

    const cx = S / 2;
    const cy = S / 2;
    const R  = S * 0.38;

    const t0 = performance.now();
    let animId: number;

    function project(lon: number, lat: number, rotDeg: number): [number, number, number] {
      const d = Math.PI / 180;
      const lr = (lon + rotDeg) * d;
      const pr = lat * d;
      const cosP = Math.cos(pr);
      return [cosP * Math.cos(lr), Math.sin(pr), cosP * Math.sin(lr)];
      // returns [depth, screenY_raw, screenX_raw]
    }

    function draw(now: number) {
      const t = (now - t0) / 1000;
      const rot = (t * 10) % 360; // 36s per revolution
      ctx.clearRect(0, 0, S, S);

      /* 1 ── outer ambient glow */
      const g1 = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.45);
      g1.addColorStop(0, "rgba(0,100,255,.07)");
      g1.addColorStop(1, "transparent");
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.45, 0, Math.PI * 2);
      ctx.fillStyle = g1; ctx.fill();

      /* 2 ── sphere fill */
      const g2 = ctx.createRadialGradient(cx - R * .28, cy - R * .28, R * .05, cx, cy, R);
      g2.addColorStop(0, "#0d1b3e");
      g2.addColorStop(.55, "#060d22");
      g2.addColorStop(1, "#020810");
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = g2; ctx.fill();

      /* edge rim light */
      const g3 = ctx.createRadialGradient(cx, cy, R * .82, cx, cy, R);
      g3.addColorStop(0, "transparent");
      g3.addColorStop(1, "rgba(0,110,255,.22)");
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = g3; ctx.fill();

      /* 3 ── orbit ring params */
      const orx = R * 1.2;
      const ory = R * 0.36;
      const tilt = -0.22; // radians

      /* 3a ── back arc (lower opacity, drawn behind dots) */
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(tilt);
      ctx.beginPath();
      ctx.ellipse(0, 0, orx, ory, 0, Math.PI, Math.PI * 2);
      ctx.strokeStyle = "rgba(0,130,255,.2)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();

      /* 4 ── continent dots */
      for (const [lon, lat] of DOTS) {
        const [depth, sy, sx] = project(lon, lat, rot);
        if (depth < 0.04) continue;
        const px = cx + sx * R;
        const py = cy - sy * R;
        const alpha = 0.14 + depth * 0.6;
        const size  = 0.9 + depth * 1.4;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(80,160,255,${alpha.toFixed(2)})`;
        ctx.fill();
      }

      /* 5 ── front arc (bright, with glow) */
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(tilt);
      ctx.shadowColor = "#0088ff";
      ctx.shadowBlur  = 14;
      ctx.beginPath();
      ctx.ellipse(0, 0, orx, ory, 0, 0, Math.PI);
      ctx.strokeStyle = "rgba(0,150,255,.9)";
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      /* 6 ── orbit nodes + connection lines */
      const N = 6;
      const speed = t * 0.45;
      const nodes: [number, number][] = [];

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(tilt);

      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2 + speed;
        nodes.push([Math.cos(a) * orx, Math.sin(a) * ory]);
      }

      /* lines between non-adjacent nodes */
      for (let i = 0; i < N; i++) {
        const j = (i + 2) % N;
        ctx.beginPath();
        ctx.moveTo(...nodes[i]);
        ctx.lineTo(...nodes[j]);
        ctx.strokeStyle = "rgba(0,140,255,.1)";
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }

      /* dots */
      for (const [nx, ny] of nodes) {
        ctx.beginPath();
        ctx.arc(nx, ny, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#4db8ff";
        ctx.shadowColor = "#4db8ff";
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.shadowBlur = 0;
        /* bright center */
        ctx.beginPath();
        ctx.arc(nx, ny, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
      }

      ctx.restore();

      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={ref} style={{ display: "block" }} />;
}

/* ── Login page ─────────────────────────────────────────────────── */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [senha, setSenha]       = useState("");
  const [erro, setErro]         = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro(""); setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setErro(data.error || "Email ou senha inválidos"); return; }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-full flex" style={{ background: "#08080e" }}>

      {/* ── Left: Globe ───────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[58%] flex-col items-center justify-center relative overflow-hidden"
        style={{
          background: "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(0,80,200,.07) 0%, transparent 70%)",
          borderRight: "1px solid rgba(255,255,255,.05)",
        }}
      >
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Globe */}
        <div className="relative z-10 flex flex-col items-center gap-8">
          <div
            style={{
              filter: "drop-shadow(0 0 40px rgba(0,100,255,.25)) drop-shadow(0 0 80px rgba(0,100,255,.1))",
            }}
          >
            <GlobeCanvas />
          </div>

          {/* Copy */}
          <div className="text-center px-8 max-w-sm">
            <h2
              className="text-[28px] font-bold tracking-tight leading-tight"
              style={{ color: "#f1f5f9" }}
            >
              Atendimento inteligente
              <br />
              <span className="gradient-text">via WhatsApp</span>
            </h2>
            <p className="mt-3 text-[13px] leading-relaxed" style={{ color: "rgba(148,163,184,.55)" }}>
              IA + CRM integrados para aumentar suas vendas e centralizar o relacionamento com clientes de 10 empresas.
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-8">
            {[
              { value: "10",  label: "Empresas"     },
              { value: "24/7", label: "Atendimento" },
              { value: "IA",   label: "Integrada"   },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div
                  className="text-[22px] font-bold"
                  style={{ color: "#60a5fa" }}
                >
                  {s.value}
                </div>
                <div className="text-[11px] font-medium" style={{ color: "rgba(148,163,184,.45)" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Form ───────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[360px]">

          {/* Logo (mobile only) */}
          <div className="lg:hidden flex items-center gap-2.5 justify-center mb-10">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #6366f1, #38bdf8)", boxShadow: "0 4px 14px rgba(99,102,241,.5)" }}
            >
              <svg className="w-[18px] h-[18px] text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
                <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/>
              </svg>
            </div>
            <span className="text-[18px] font-bold gradient-text">FácilCRM</span>
          </div>

          {/* Card */}
          <div
            className="rounded-2xl p-7"
            style={{
              background: "linear-gradient(145deg, rgba(255,255,255,.06), rgba(255,255,255,.03))",
              border: "1px solid rgba(255,255,255,.1)",
              boxShadow: "0 24px 80px rgba(0,0,0,.5)",
            }}
          >
            {/* Logo (desktop, inside card) */}
            <div className="hidden lg:flex items-center gap-2.5 mb-7">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #6366f1, #38bdf8)", boxShadow: "0 4px 12px rgba(99,102,241,.45)" }}
              >
                <svg className="w-[16px] h-[16px] text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/>
                </svg>
              </div>
              <span className="text-[15px] font-bold gradient-text">FácilCRM</span>
            </div>

            <h1 className="text-[22px] font-bold mb-1" style={{ color: "#f1f5f9" }}>
              Bem-vindo de volta
            </h1>
            <p className="text-[13px] mb-6" style={{ color: "rgba(148,163,184,.5)" }}>
              Entre com suas credenciais para continuar
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              {erro && (
                <div
                  className="text-[12.5px] rounded-xl px-4 py-3"
                  style={{
                    background: "rgba(239,68,68,.1)",
                    border: "1px solid rgba(239,68,68,.25)",
                    color: "#f87171",
                  }}
                >
                  {erro}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "rgba(148,163,184,.7)" }}>
                  EMAIL
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="seu@email.com"
                  className="w-full input-dark px-4 py-3 text-[13.5px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "rgba(148,163,184,.7)" }}>
                  SENHA
                </label>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full input-dark px-4 py-3 text-[13.5px]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-[14px] mt-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Entrando...
                  </span>
                ) : (
                  "Entrar"
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-[11px] mt-6" style={{ color: "rgba(148,163,184,.3)" }}>
            FácilCRM · Powered by Claude AI
          </p>
        </div>
      </div>
    </div>
  );
}
