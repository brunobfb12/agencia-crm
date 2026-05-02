"use client";

import { useEffect, useState } from "react";

interface Campanha {
  id: string;
  empresaId: string;
  nomeEmpresa: string;
  mensagem: string;
  tipo: string;
  status: string;
  criadoEm: string;
  total: number;
  enviados: number;
  pendentes: number;
  erros: number;
}

interface Regra {
  tipo: string;
  diasInativo: number;
  ativo: boolean;
  mensagem: string;
}

const TIPO_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  MANUAL:             { label: "Manual",       color: "#a5b4fc", bg: "rgba(99,102,241,.1)" },
  AUTO_SEM_RESPOSTA:  { label: "Sem Resposta", color: "#fbbf24", bg: "rgba(251,191,36,.1)" },
  AUTO_AQUECIMENTO:   { label: "Aquecimento",  color: "#fb923c", bg: "rgba(251,146,60,.1)" },
  AUTO_POS_VENDA:     { label: "Pós-Venda",    color: "#c084fc", bg: "rgba(192,132,252,.1)" },
  AUTO_FOLLOW_UP:     { label: "Follow-up",    color: "#22d3ee", bg: "rgba(34,211,238,.1)" },
};

const REGRA_LABELS: Record<string, string> = {
  AUTO_SEM_RESPOSTA: "Leads Sem Resposta",
  AUTO_AQUECIMENTO:  "Leads em Aquecimento",
  AUTO_POS_VENDA:    "Pós-Venda",
  AUTO_FOLLOW_UP:    "Follow-up",
};

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}

export default function CampanhasPage() {
  const [aba, setAba] = useState<"historico" | "regras">("historico");
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [regras, setRegras] = useState<Regra[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvandoRegras, setSalvandoRegras] = useState(false);
  const [msg, setMsg] = useState("");
  const [isCentral, setIsCentral] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((me) => {
        if (me?.perfil === "CENTRAL") setIsCentral(true);
      });
    fetch("/api/campanhas")
      .then((r) => r.json())
      .then((d) => {
        setCampanhas(Array.isArray(d) ? d : []);
        setLoading(false);
      });
    fetch("/api/campanhas/regras")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setRegras(d);
      });
  }, []);

  const salvarRegras = async () => {
    setSalvandoRegras(true);
    await fetch("/api/campanhas/regras", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(regras),
    });
    setSalvandoRegras(false);
    setMsg("Regras salvas!");
    setTimeout(() => setMsg(""), 3000);
  };

  const totalEnviados = campanhas.reduce((s, c) => s + c.enviados, 0);
  const totalPendentes = campanhas.reduce((s, c) => s + c.pendentes, 0);

  const tabStyle = (id: string) =>
    aba === id
      ? {
          background: "linear-gradient(135deg, #6366f1, #4f46e5)",
          color: "white",
          border: "1px solid transparent",
        }
      : {
          background: "rgba(255,255,255,.04)",
          border: "1px solid rgba(255,255,255,.08)",
          color: "rgba(148,163,184,.7)",
        };

  const cardStyle = {
    background:
      "linear-gradient(145deg, rgba(255,255,255,.055), rgba(255,255,255,.02))",
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: "16px",
  };

  return (
    <div className="h-full overflow-y-auto" style={{ background: "#08080e" }}>
      <div className="p-8 max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <span
            className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full mb-3"
            style={{
              background: "rgba(99,102,241,.1)",
              color: "#a5b4fc",
              border: "1px solid rgba(99,102,241,.18)",
            }}
          >
            Automação
          </span>
          <div className="flex items-end justify-between">
            <div>
              <h1
                className="text-[28px] font-bold tracking-tight"
                style={{ color: "#f1f5f9" }}
              >
                Campanhas
              </h1>
              <p
                className="text-[13px] mt-1"
                style={{ color: "rgba(148,163,184,.5)" }}
              >
                Follow-ups automáticos e disparos manuais com espaçamento anti-spam
              </p>
            </div>
            {msg && (
              <span
                className="text-[12px] px-3 py-1.5 rounded-full font-semibold"
                style={{
                  background: "rgba(52,211,153,.1)",
                  color: "#34d399",
                  border: "1px solid rgba(52,211,153,.2)",
                }}
              >
                {msg}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            {
              value: campanhas.length,
              label: "Campanhas criadas",
              color: "#a5b4fc",
              bg: "rgba(99,102,241,.12)",
              border: "rgba(99,102,241,.2)",
            },
            {
              value: totalEnviados,
              label: "Mensagens enviadas",
              color: "#34d399",
              bg: "rgba(52,211,153,.12)",
              border: "rgba(52,211,153,.2)",
            },
            {
              value: totalPendentes,
              label: "Na fila agora",
              color: "#fb923c",
              bg: "rgba(251,146,60,.12)",
              border: "rgba(251,146,60,.2)",
            },
          ].map((m, i) => (
            <div
              key={i}
              className="bento-card p-5"
              style={{ background: m.bg, borderColor: m.border }}
            >
              <div
                className="text-[30px] font-bold leading-none mb-1"
                style={{ color: m.color }}
              >
                {m.value}
              </div>
              <div
                className="text-[12px]"
                style={{ color: "rgba(148,163,184,.55)" }}
              >
                {m.label}
              </div>
            </div>
          ))}
        </div>

        {/* Info box */}
        <div
          className="px-4 py-3 rounded-xl text-[12.5px] mb-6"
          style={{
            background: "rgba(99,102,241,.06)",
            border: "1px solid rgba(99,102,241,.15)",
            color: "#a5b4fc",
          }}
        >
          💡 <strong>Para disparar uma campanha manual:</strong> acesse{" "}
          <a href="/dashboard/leads" className="underline font-semibold">
            Leads
          </a>
          , selecione os leads com o checkbox e clique em{" "}
          <strong>&quot;Disparar Campanha&quot;</strong>.
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setAba("historico")}
            className="px-4 py-2 rounded-xl text-[13px] font-medium transition-all"
            style={tabStyle("historico")}
          >
            Histórico
          </button>
          {isCentral && (
            <button
              onClick={() => setAba("regras")}
              className="px-4 py-2 rounded-xl text-[13px] font-medium transition-all"
              style={tabStyle("regras")}
            >
              Regras Automáticas
            </button>
          )}
        </div>

        {/* HISTÓRICO */}
        {aba === "historico" && (
          <div className="animate-fade-up">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="shimmer h-20 rounded-2xl" />
                ))}
              </div>
            ) : campanhas.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-20 gap-3"
                style={{ color: "rgba(148,163,184,.3)" }}
              >
                <div className="text-5xl">📨</div>
                <p className="text-[13px]">Nenhuma campanha disparada ainda.</p>
                <p className="text-[12px]">
                  Selecione leads no Kanban para começar.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {campanhas.map((c, idx) => {
                  const tipo =
                    TIPO_LABELS[c.tipo] ?? {
                      label: c.tipo,
                      color: "#94a3b8",
                      bg: "rgba(148,163,184,.1)",
                    };
                  const pct =
                    c.total > 0 ? Math.round((c.enviados / c.total) * 100) : 0;
                  return (
                    <div
                      key={c.id}
                      className="rounded-2xl p-4 animate-fade-up"
                      style={{
                        ...cardStyle,
                        animationDelay: `${idx * 40}ms`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span
                              className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold"
                              style={{
                                background: tipo.bg,
                                color: tipo.color,
                              }}
                            >
                              {tipo.label}
                            </span>
                            <span
                              className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold"
                              style={
                                c.status === "CONCLUIDA"
                                  ? {
                                      background: "rgba(52,211,153,.1)",
                                      color: "#34d399",
                                    }
                                  : c.status === "ATIVA"
                                  ? {
                                      background: "rgba(251,146,60,.1)",
                                      color: "#fb923c",
                                    }
                                  : {
                                      background: "rgba(255,255,255,.06)",
                                      color: "rgba(148,163,184,.5)",
                                    }
                              }
                            >
                              {c.status === "CONCLUIDA"
                                ? "Concluída"
                                : c.status === "ATIVA"
                                ? "Em andamento"
                                : "Pausada"}
                            </span>
                            <span
                              className="text-[11px]"
                              style={{ color: "rgba(148,163,184,.35)" }}
                            >
                              {c.nomeEmpresa}
                            </span>
                            <span
                              className="text-[11px]"
                              style={{ color: "rgba(148,163,184,.3)" }}
                            >
                              {timeAgo(c.criadoEm)}
                            </span>
                          </div>
                          <p
                            className="text-[13px] truncate mb-2"
                            style={{ color: "rgba(148,163,184,.7)" }}
                          >
                            &quot;{c.mensagem}&quot;
                          </p>
                          {/* Progress bar */}
                          <div className="flex items-center gap-3">
                            <div
                              className="flex-1 h-1.5 rounded-full overflow-hidden"
                              style={{ background: "rgba(255,255,255,.06)" }}
                            >
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${pct}%`,
                                  background:
                                    "linear-gradient(90deg, #6366f1, #34d399)",
                                }}
                              />
                            </div>
                            <span
                              className="text-[11px] font-semibold shrink-0"
                              style={{ color: "rgba(148,163,184,.6)" }}
                            >
                              {c.enviados}/{c.total}
                              {c.erros > 0 && (
                                <span style={{ color: "#f87171" }}>
                                  {" "}
                                  · {c.erros} erros
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* REGRAS */}
        {aba === "regras" && isCentral && (
          <div className="space-y-4 animate-fade-up">
            <div
              className="px-4 py-3 rounded-xl text-[12.5px]"
              style={{
                background: "rgba(251,191,36,.06)",
                border: "1px solid rgba(251,191,36,.15)",
                color: "#fbbf24",
              }}
            >
              ⚡ Estas regras rodam automaticamente todo dia às 8h. O N8N
              verifica leads inativos e cria campanhas automaticamente.
            </div>

            <div className="space-y-3">
              {regras.map((r, i) => (
                <div key={r.tipo} className="p-5 rounded-2xl" style={cardStyle}>
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() =>
                        setRegras((prev) =>
                          prev.map((x, j) =>
                            j === i ? { ...x, ativo: !x.ativo } : x
                          )
                        )
                      }
                      className="flex-shrink-0 mt-0.5 w-10 h-6 rounded-full transition-all relative"
                      style={{
                        background: r.ativo
                          ? "rgba(52,211,153,.3)"
                          : "rgba(255,255,255,.1)",
                        border: r.ativo
                          ? "1px solid rgba(52,211,153,.4)"
                          : "1px solid rgba(255,255,255,.1)",
                      }}
                    >
                      <div
                        className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                        style={{
                          left: r.ativo ? "18px" : "2px",
                          background: r.ativo
                            ? "#34d399"
                            : "rgba(148,163,184,.4)",
                        }}
                      />
                    </button>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[14px] font-semibold"
                          style={{
                            color: r.ativo ? "#f1f5f9" : "rgba(148,163,184,.4)",
                          }}
                        >
                          {REGRA_LABELS[r.tipo] ?? r.tipo}
                        </span>
                        <span
                          className="text-[11px] px-2 py-0.5 rounded-full"
                          style={{
                            background: "rgba(255,255,255,.06)",
                            color: "rgba(148,163,184,.5)",
                          }}
                        >
                          após {r.diasInativo} dias inativo
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label
                            className="block text-[11px] font-semibold mb-1"
                            style={{ color: "rgba(148,163,184,.5)" }}
                          >
                            DIAS INATIVO
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={r.diasInativo}
                            onChange={(e) =>
                              setRegras((prev) =>
                                prev.map((x, j) =>
                                  j === i
                                    ? { ...x, diasInativo: Number(e.target.value) }
                                    : x
                                )
                              )
                            }
                            className="input-dark px-3 py-2 text-[13px] w-24"
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          className="block text-[11px] font-semibold mb-1"
                          style={{ color: "rgba(148,163,184,.5)" }}
                        >
                          MENSAGEM
                        </label>
                        <textarea
                          rows={2}
                          value={r.mensagem}
                          onChange={(e) =>
                            setRegras((prev) =>
                              prev.map((x, j) =>
                                j === i ? { ...x, mensagem: e.target.value } : x
                              )
                            )
                          }
                          className="w-full input-dark px-3 py-2 text-[13px] resize-none"
                        />
                        <p
                          className="text-[11px] mt-1"
                          style={{ color: "rgba(148,163,184,.3)" }}
                        >
                          Use {"{nome}"} para personalizar com o nome do cliente.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={salvarRegras}
              disabled={salvandoRegras}
              className="btn-primary px-6 py-2.5 text-[13px] disabled:opacity-50"
            >
              {salvandoRegras ? "Salvando..." : "Salvar Regras"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
