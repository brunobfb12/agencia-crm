"use client";

import { useEffect, useState } from "react";

interface WhatsAppStatus { instancia: string; state: string; nomeEmpresa: string }
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
  const [qrInstancia, setQrInstancia] = useState<Record<string, string | null>>({});
  const [loadingQr, setLoadingQr] = useState<Record<string, boolean>>({});

  const reconectar = async (instancia: string) => {
    setLoadingQr((p) => ({ ...p, [instancia]: true }));
    const res = await fetch(`/api/central/instancia?instancia=${instancia}`);
    const d = await res.json();
    setQrInstancia((p) => ({ ...p, [instancia]: d.qrcode ?? null }));
    setLoadingQr((p) => ({ ...p, [instancia]: false }));
  };

  const desconectar = async (instancia: string) => {
    if (!confirm(`Desconectar a instância "${instancia}"? O WhatsApp precisará ser escaneado novamente.`)) return;
    await fetch(`/api/central/instancia?instancia=${instancia}`, { method: "DELETE" });
    showMsg(`${instancia} desconectado`);
    carregar();
  };

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
    <div className="h-full overflow-y-auto"><div className="p-8">
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
        <div className="space-y-6">
          <NovaInstancia onCriada={carregar} />
          <div className="grid grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-2 text-center py-8 text-gray-400">Verificando instâncias...</div>
            ) : (
              data?.whatsapp.map((w) => (
                <div key={w.instancia} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${stateColor(w.state)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">{w.nomeEmpresa}</div>
                      <div className="text-xs text-gray-400 truncate">{w.instancia}</div>
                      <div className={`text-xs mt-0.5 ${w.state === "open" ? "text-green-600" : "text-red-500"}`}>
                        {w.state === "open" ? "Conectado" : w.state === "close" ? "Desconectado" : w.state}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 items-end">
                      {w.state !== "open" && (
                        <button
                          onClick={() => reconectar(w.instancia)}
                          disabled={loadingQr[w.instancia]}
                          className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2 py-1 rounded font-medium disabled:opacity-50"
                        >
                          {loadingQr[w.instancia] ? "Aguarde..." : qrInstancia[w.instancia] ? "Atualizar QR" : "Ver QR Code"}
                        </button>
                      )}
                      {w.state === "open" && (
                        <button
                          onClick={() => desconectar(w.instancia)}
                          className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded font-medium"
                        >
                          Desconectar
                        </button>
                      )}
                    </div>
                  </div>
                  {qrInstancia[w.instancia] && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex gap-3 items-start">
                      <img
                        src={qrInstancia[w.instancia]!}
                        alt="QR Code"
                        className="w-36 h-36 border border-gray-200 rounded-lg p-1 bg-white"
                      />
                      <div className="flex-1 text-xs text-gray-500 space-y-1.5">
                        <p className="font-medium text-gray-700">Como conectar:</p>
                        <p>1. Abra o WhatsApp no celular</p>
                        <p>2. Toque em ⋮ → Aparelhos conectados</p>
                        <p>3. Conectar aparelho → Escaneie o QR</p>
                        <p className="text-orange-500 font-medium">QR expira em ~20s — atualize se necessário</p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
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
    </div></div>
  );
}

function NovaInstancia({ onCriada }: { onCriada: () => void }) {
  const [form, setForm] = useState({ instanciaNome: "", empresaNome: "" });
  const [criando, setCriando] = useState(false);
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [instanciaCriada, setInstanciaCriada] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCriando(true);
    setErro("");
    setQrcode(null);
    const res = await fetch("/api/central/instancia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setCriando(false);
    if (!data.ok) { setErro(data.erro ?? "Erro ao criar instância"); return; }
    setQrcode(data.qrcode);
    setInstanciaCriada(data.instancia);
    setSucesso(`Empresa "${data.empresa?.nome}" salva no CRM!`);
    setForm({ instanciaNome: "", empresaNome: "" });
    onCriada();
  };

  const atualizarQr = async () => {
    if (!instanciaCriada) return;
    const res = await fetch(`/api/central/instancia?instancia=${instanciaCriada}`);
    const data = await res.json();
    setQrcode(data.qrcode);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="font-semibold text-gray-900 mb-4">Criar Nova Instância WhatsApp</h3>
      <form onSubmit={criar} className="flex gap-3 mb-4">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Nome da Empresa *</label>
          <input
            required
            value={form.empresaNome}
            onChange={(e) => setForm((p) => ({ ...p, empresaNome: e.target.value }))}
            placeholder="Ex: Loja da Maria"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Nome da Instância * (sem espaços)</label>
          <input
            required
            value={form.instanciaNome}
            onChange={(e) => setForm((p) => ({ ...p, instanciaNome: e.target.value.replace(/\s/g, "_") }))}
            placeholder="Ex: loja_maria"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={criando}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {criando ? "Criando..." : "Criar"}
          </button>
        </div>
      </form>
      {erro && <p className="text-sm text-red-600 mb-3">{erro}</p>}
      {sucesso && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3">{sucesso}</p>}
      {qrcode && (
        <div className="flex gap-4 items-start">
          <div className="bg-white border border-gray-200 rounded-lg p-2">
            <img src={qrcode} alt="QR Code WhatsApp" className="w-48 h-48" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 mb-1">QR Code gerado para <strong>{instanciaCriada}</strong></p>
            <p className="text-xs text-gray-500 mb-3">Abra o WhatsApp no celular → Aparelhos conectados → Conectar aparelho → Escaneie o QR Code</p>
            <button onClick={atualizarQr} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg">
              Atualizar QR Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
}