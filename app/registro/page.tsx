"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegistroPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nomeEmpresa: "", nome: "", email: "", senha: "", confirmar: "" });
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (form.senha !== form.confirmar) {
      setErro("As senhas não coincidem");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nomeEmpresa: form.nomeEmpresa,
        nome: form.nome,
        email: form.email,
        senha: form.senha,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setErro(data.error || "Erro ao criar conta");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-full flex items-center justify-center p-6" style={{ background: "#08080e" }}>
      <div className="w-full max-w-[420px]">

        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6366f1, #38bdf8)", boxShadow: "0 4px 14px rgba(99,102,241,.5)" }}
          >
            <svg className="w-[18px] h-[18px] text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/>
            </svg>
          </div>
          <span className="text-[20px] font-bold gradient-text">FácilCRM</span>
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
          <h1 className="text-[22px] font-bold mb-1" style={{ color: "#f1f5f9" }}>
            Teste grátis por 30 dias
          </h1>
          <p className="text-[13px] mb-6" style={{ color: "rgba(148,163,184,.5)" }}>
            Sem cartão de crédito. Cancele quando quiser.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {erro && (
              <div
                className="text-[12.5px] rounded-xl px-4 py-3"
                style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", color: "#f87171" }}
              >
                {erro}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "rgba(148,163,184,.7)" }}>
                NOME DA EMPRESA
              </label>
              <input
                type="text"
                value={form.nomeEmpresa}
                onChange={(e) => set("nomeEmpresa", e.target.value)}
                required
                placeholder="Ex: Minha Loja"
                className="w-full input-dark px-4 py-3 text-[13.5px]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "rgba(148,163,184,.7)" }}>
                SEU NOME
              </label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => set("nome", e.target.value)}
                required
                placeholder="Seu nome completo"
                className="w-full input-dark px-4 py-3 text-[13.5px]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "rgba(148,163,184,.7)" }}>
                E-MAIL
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
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
                value={form.senha}
                onChange={(e) => set("senha", e.target.value)}
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                className="w-full input-dark px-4 py-3 text-[13.5px]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "rgba(148,163,184,.7)" }}>
                CONFIRMAR SENHA
              </label>
              <input
                type="password"
                value={form.confirmar}
                onChange={(e) => set("confirmar", e.target.value)}
                required
                placeholder="Repita a senha"
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
                  Criando conta...
                </span>
              ) : (
                "Começar teste grátis"
              )}
            </button>
          </form>

          <p className="text-center text-[12px] mt-5" style={{ color: "rgba(148,163,184,.4)" }}>
            Já tem conta?{" "}
            <Link href="/login" className="underline" style={{ color: "rgba(148,163,184,.7)" }}>
              Entrar
            </Link>
          </p>
        </div>

        <p className="text-center text-[11px] mt-5" style={{ color: "rgba(148,163,184,.25)" }}>
          FácilCRM · Powered by Claude AI
        </p>
      </div>
    </div>
  );
}
