import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth";

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

const STATUS_LABELS: Record<string, string> = {
  LEAD: "Novos Leads", AQUECIMENTO: "Aquecimento",
  PRONTO_PARA_COMPRAR: "Pronto p/ Comprar", AGENDADO: "Agendado",
  NEGOCIACAO: "Em Negociação", VENDA_REALIZADA: "Venda Realizada",
  POS_VENDA: "Pós-Venda", FOLLOW_UP: "Follow-up",
  PERDIDO: "Perdido", SEM_INTERESSE: "Sem Interesse", SEM_RESPOSTA: "Sem Resposta",
};
const STATUS_COLORS: Record<string, string> = {
  LEAD: "#94a3b8", AQUECIMENTO: "#fb923c", PRONTO_PARA_COMPRAR: "#fbbf24",
  AGENDADO: "#a78bfa", NEGOCIACAO: "#60a5fa", VENDA_REALIZADA: "#34d399",
  POS_VENDA: "#c084fc", FOLLOW_UP: "#22d3ee", PERDIDO: "#f87171",
  SEM_INTERESSE: "#fb7185", SEM_RESPOSTA: "#fbbf24",
};
const STATUS_ORDER = [
  "LEAD","AQUECIMENTO","PRONTO_PARA_COMPRAR","AGENDADO","NEGOCIACAO",
  "VENDA_REALIZADA","POS_VENDA","FOLLOW_UP","SEM_RESPOSTA","SEM_INTERESSE","PERDIDO",
];

export async function GET(req: Request) {
  const me = await getUsuarioLogado();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const periodo = searchParams.get("periodo") || "30d";
  const empresaId = me.perfil !== "CENTRAL" ? me.empresaId : (searchParams.get("empresaId") || null);

  const now = new Date();
  let dataInicio: Date | null = null;
  if (periodo === "7d") { dataInicio = new Date(now); dataInicio.setDate(dataInicio.getDate() - 7); }
  else if (periodo === "30d") { dataInicio = new Date(now); dataInicio.setDate(dataInicio.getDate() - 30); }
  else if (periodo === "90d") { dataInicio = new Date(now); dataInicio.setDate(dataInicio.getDate() - 90); }

  const leadWhere = {
    ...(empresaId && { empresaId }),
    ...(dataInicio && { criadoEm: { gte: dataInicio } }),
  };
  const vendaWhere = {
    ...(empresaId && { lead: { empresaId } }),
    ...(dataInicio && { criadoEm: { gte: dataInicio } }),
  };
  const statusWhere = { ...(empresaId && { empresaId }) };

  const [totalLeads, leadsByStatus, vendas, vendedores] = await Promise.all([
    prisma.lead.count({ where: leadWhere }),
    prisma.lead.groupBy({ by: ["status"], where: statusWhere, _count: { status: true } }),
    prisma.venda.findMany({
      where: vendaWhere,
      select: { valor: true, criadoEm: true, vendedor: { select: { nome: true } } },
    }),
    prisma.vendedor.findMany({
      where: { ativo: true, ...(empresaId && { empresaId }) },
      select: {
        id: true, nome: true,
        leads: {
          where: { ...(empresaId && { empresaId }) },
          select: { id: true },
        },
        vendas: {
          where: { ...(dataInicio && { criadoEm: { gte: dataInicio } }) },
          select: { valor: true },
        },
      },
    }),
  ]);

  const vendasRealizadas = vendas.length;
  const receitaTotal = vendas.reduce((s, v) => s + (v.valor ?? 0), 0);
  const ticketMedio = vendasRealizadas > 0 ? receitaTotal / vendasRealizadas : 0;
  const taxaConversao = totalLeads > 0 ? (vendasRealizadas / totalLeads) * 100 : 0;

  // Vendas por mês — últimos 6 meses
  const mesesMap: Record<string, { mes: string; vendas: number; receita: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = `${MESES[d.getMonth()]}${d.getFullYear() !== now.getFullYear() ? ` ${d.getFullYear()}` : ""}`;
    mesesMap[key] = { mes: label, vendas: 0, receita: 0 };
  }
  for (const v of vendas) {
    const d = new Date(v.criadoEm);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (mesesMap[key]) {
      mesesMap[key].vendas++;
      mesesMap[key].receita += v.valor ?? 0;
    }
  }
  const vendasPorMes = Object.values(mesesMap);

  // Funil por status (todos os tempos para mostrar distribuição atual)
  const statusMap: Record<string, number> = {};
  for (const g of leadsByStatus) statusMap[g.status] = g._count.status;
  const funil = STATUS_ORDER.map(s => ({
    status: s,
    label: STATUS_LABELS[s] || s,
    count: statusMap[s] || 0,
    hex: STATUS_COLORS[s] || "#94a3b8",
  })).filter(s => s.count > 0);

  // Ranking vendedores
  const ranking = vendedores
    .map(v => ({
      nome: v.nome,
      leads: v.leads.length,
      vendas: v.vendas.length,
      receita: v.vendas.reduce((s, x) => s + (x.valor ?? 0), 0),
      conversao: v.leads.length > 0 ? (v.vendas.length / v.leads.length) * 100 : 0,
    }))
    .filter(v => v.leads > 0 || v.vendas > 0)
    .sort((a, b) => b.vendas - a.vendas || b.receita - a.receita);

  return NextResponse.json({ kpis: { totalLeads, vendasRealizadas, taxaConversao, receitaTotal, ticketMedio }, funil, vendasPorMes, ranking });
}
