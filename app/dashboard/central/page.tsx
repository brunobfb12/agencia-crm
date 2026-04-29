"use client";

import { useEffect, useState } from "react";

interface WhatsAppStatus { instancia: string; state: string }
interface Ferramenta {
  id: string; nome: string; tipo: string; valor: number | null;
  vencimento: string | null; link: string | null; observacoes: string | null; ativo: boolean;
}
interface StatusData {
  whatsapp: WhatsAppStatus[];
  atividade: { mensagensHoje: number; leadsHoje: number; mensagensMes: number };
  ferramentas: Ferramenta[];
  alertas: Ferramenta[];
}

const TIPOS = ["IA", "Dominio", "VPS", "Painel", "Automacao", "WhatsApp", "Outro"];

const EMPTY_FORM = { nome: "", tipo: "IA", valor: "", vencimento: "", link: "", observacoes: "" };

function diasRestantes(venc: string | null) {
  if (!venc) return null;
  return Math.ceil((new Date(venc).getTime() - Date.now()) / 86400000);
}

function VencimentoBadge({ vencimento }: { vencimento: string | null }) {
  if (!vencimento) return <span className="text-gray-400 text-xs">—</span>;
  const dias = diasRestantes(vencimento);
  const data = new Date(vencimento).toLocaleDateString("pt-BR");
  if (dias === null) return null;
  if (dias < 0) return <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Vencido ({data})</span>;
  if (dias <= 7) return <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Vence em {dias}d ({data})</span>;
  return <span className="text-xs text-gray-500">{data}</span>;
}

export default function CentralPage() {
  const [data, setData] = useState<StatusData | null>(null);
  const [aba, setAba] = useState<"ferramentas" | "whatsapp" | "atividade">("ferramentas");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState("");

  const carregar = () => {
    setLoading(true);
    fetch("/api/central/status")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  };

  useEffect(() => { carregar(); }, []);

  function showMsg(texto: string) {
    setMsg(texto);
    setTimeout(() => setMsg(""), 3000);
  }

  const criarFerramenta = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    await fetch("/api/ferramentas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm(EMPTY_FORM);
    carregar();
    setSalvando(false);
    showMsg("Ferramenta adicionada!");
  };

  const salvarEdicao = async (id: string) => {
    setSalvando(true);
    await fetch(`/api/ferramentas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditId(null);
    carregar();
    setSalvando(false);
    showMsg("Atualizado!");
  };

  const excluir = async (id: string, nome: string) => {
    if (!confirm(`Excluir "${nome}"?`)) return;
    await fetch(`/api/ferramentas/${id}`, { method: "DELETE" });
    carregar();
    showMsg("Excluído.");
  };

  function abrirEdicao(f: Ferramenta) {
    setEditId(f.id);
    setEditForm({
      nome: f.nome, tipo: f.tipo,
      valor: f.valor?.toString() ?? "",
      vencimento: f.vencimento ? f.vencimento.split("T")[0] : "",
      link: f.link ?? "",
      observacoes: f.observacoes ?? "",
    });
  }

  const stateColor = (state: string) =>
    state === "open" ? "bg-green-500" : state === "close" ? "bg-red-500" : "bg-gray-400";

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Painel Central</h2>
          <p className="text-sm text-gray-500 mt-1">Controle de ferramentas, WhatsApp e atividade</p>
        </div>
        <div className="flex items-center gap-3">
          {msg && <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">{msg}</span>}
          {data?.alertas.length ? (
            <span className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
              ⚠ {data.alertas.length} vencimento{data.alertas.length > 1 ? "s" : ""} próximo{data.alertas.length > 1 ? "s" : ""}
            </span>
          ) : null}
          <button onClick={carregar} className="text-sm bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50">
            Atualizar
          </button>
        </div>
      </div>

      {data && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-2xl font-bold text-blue-600">{data.atividade.mensagensHoje}</div>
            <div className="text-xs text-gray-500 mt-1">Respostas Claude hoje</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-2xl font-bold text-green-600">{data.atividade.leadsHoje}</div>
            <div className="text-xs text-gray-500 mt-1">Leads criados hoje</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-2xl font-bold text-purple-600">{data.atividade.mensagensMes}</div>
            <div className="text-xs text-gray-500 mt-1">Respostas Claude este mês</div>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {(["ferramentas", "whatsapp", "atividade"] as const).map((tab) => (
          <button key={tab} onClick={() => setAba(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${aba === tab ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            {tab === "ferramentas" ? "Ferramentas" : tab === "whatsapp" ? "WhatsApp" : "Atividade"}
          </button>
        ))}
      </div>

      {aba === "ferramentas" && (
        <div className="space-y-4">
          <form onSubmit={criarFerramenta} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nome *</label>
                <input required value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                  placeholder="Ex: Claude API"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo *</label>
                <select required value={form.tipo} onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Valor mensal (R$)</label>
                <input type="number" step="0.01" value={form.valor} onChange={(e) => setForm((p) => ({ ...p, valor: e.target.value }))}
                  placeholder="0,00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Vencimento</label>
                <input type="date" value={form.vencimento} onChange={(e) => setForm((p) => ({ ...p, vencimento: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Link / URL</label>
                <input value={form.link} onChange={(e) => setForm((p) => ({ ...p, link: e.target.value }))}
                  placeholder="https://..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Observações</label>
                <input value={form.observacoes} onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))}
                  placeholder="Plano, créditos, token..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <button type="submit" disabled={salvando}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              Adicionar Ferramenta
            </button>
          </form>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Carregando...</div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Ferramenta</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Tipo</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Valor/mês</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Vencimento</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Obs.</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.ferramentas.map((f) => (
                    <>
                      <tr key={f.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">
                          {f.link ? (
                            <a href={f.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{f.nome}</a>
                          ) : f.nome}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{f.tipo}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {f.valor != null ? `R$ ${f.valor.toFixed(2)}` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <VencimentoBadge vencimento={f.vencimento} />
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{f.observacoes ?? "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => editId === f.id ? setEditId(null) : abrirEdicao(f)}
                              className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded font-medium">
                              {editId === f.id ? "Fechar" : "Editar"}
                            </button>
                            <button onClick={() => excluir(f.id, f.nome)}
                              className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded font-medium">
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                      {editId === f.id && (
                        <tr key={`${f.id}-edit`}>
                          <td colSpan={6} className="px-4 py-4 bg-blue-50">
                            <div className="grid grid-cols-3 gap-3 mb-3">
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Nome</label>
                                <input value={editForm.nome} onChange={(e) => setEditForm((p) => ({ ...p, nome: e.target.value }))}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo</label>
                                <select value={editForm.tipo} onChange={(e) => setEditForm((p) => ({ ...p, tipo: e.target.value }))}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                  {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Valor (R$)</label>
                                <input type="number" step="0.01" value={editForm.valor}
                                  onChange={(e) => setEditForm((p) => ({ ...p, valor: e.target.value }))}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Vencimento</label>
                                <input type="date" value={editForm.vencimento}
                                  onChange={(e) => setEditForm((p) => ({ ...p, vencimento: e.target.value }))}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Link</label>
                                <input value={editForm.link} onChange={(e) => setEditForm((p) => ({ ...p, link: e.target.value }))}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Observações</label>
                                <input value={editForm.observacoes} onChange={(e) => setEditForm((p) => ({ ...p, observacoes: e.target.value }))}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => salvarEdicao(f.id)} disabled={salvando}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                                Salvar
                              </button>
                              <button onClick={() => setEditId(null)}
                                className="bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                                Cancelar
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                  {!data?.ferramentas.length && (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Nenhuma ferramenta cadastrada.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {aba === "whatsapp" && (
        <div className="grid grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 text-center py-8 text-gray-400">Verificando instâncias...</div>
          ) : (
            data?.whatsapp.map((w) => (
              <div key={w.instancia} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${stateColor(w.state)}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">{w.instancia}</div>
                  <div className={`text-xs mt-0.5 ${w.state === "open" ? "text-green-600" : "text-red-500"}`}>
                    {w.state === "open" ? "Conectado" : w.state === "close" ? "Desconectado" : w.state}
                  </div>
                </div>
                {w.state !== "open" && (
                  <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded font-medium">Reconectar</span>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {aba === "atividade" && data && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="text-3xl font-bold text-blue-600">{data.atividade.mensagensHoje}</div>
              <div className="text-sm text-gray-600 mt-1">Respostas Claude hoje</div>
              <div className="text-xs text-gray-400 mt-0.5">Mensagens enviadas pelo bot</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="text-3xl font-bold text-green-600">{data.atividade.leadsHoje}</div>
              <div className="text-sm text-gray-600 mt-1">Leads novos hoje</div>
              <div className="text-xs text-gray-400 mt-0.5">Primeiros contatos do dia</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="text-3xl font-bold text-purple-600">{data.atividade.mensagensMes}</div>
              <div className="text-sm text-gray-600 mt-1">Respostas este mês</div>
              <div className="text-xs text-gray-400 mt-0.5">Total de tokens Claude usados este mês</div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
            Para ver o custo exato de tokens Claude, acesse{" "}
            <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">
              console.anthropic.com
            </a>{" "}
            → Usage.
          </div>
        </div>
      )}
    </div>
  );
}
