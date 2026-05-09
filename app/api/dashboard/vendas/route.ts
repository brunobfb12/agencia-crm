import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth";

function getDesde(periodo: string): Date {
  const now = new Date();
  switch (periodo) {
    case "hoje":  { const d = new Date(now); d.setHours(0, 0, 0, 0); return d; }
    case "semana":{ const d = new Date(now); d.setDate(d.getDate() - 7); return d; }
    case "ano":   return new Date(now.getFullYear(), 0, 1);
    default:      return new Date(now.getFullYear(), now.getMonth(), 1);
  }
}

export async function GET(req: Request) {
  const me = await getUsuarioLogado();
  if (!me) return NextResponse.json(null, { status: 401 });

  const { searchParams } = new URL(req.url);
  const de  = searchParams.get("de");
  const ate = searchParams.get("ate");

  let desde: Date;
  let ate_: Date;

  if (de && ate) {
    desde = new Date(de + "T00:00:00");
    ate_  = new Date(ate + "T23:59:59");
  } else {
    const periodo = searchParams.get("periodo") ?? "mes";
    desde = getDesde(periodo);
    ate_  = new Date();
  }

  const empresaFilter = me.perfil === "EMPRESA" && me.empresaId
    ? { lead: { empresaId: me.empresaId } }
    : {};

  const leadEmpresaFilter = me.perfil === "EMPRESA" && me.empresaId
    ? { empresaId: me.empresaId }
    : {};

  const dataFilter = { gte: desde, lte: ate_ };

  const [vendas, totalLeads, leadsConvertidos] = await Promise.all([
    prisma.venda.findMany({
      where: { criadoEm: dataFilter, ...empresaFilter },
      include: {
        lead: { include: { cliente: { select: { nome: true } } } },
        vendedor: { select: { nome: true } },
      },
      orderBy: { criadoEm: "desc" },
    }),
    prisma.lead.count({ where: { criadoEm: dataFilter, ...leadEmpresaFilter } }),
    prisma.lead.count({ where: { criadoEm: dataFilter, status: "VENDA_REALIZADA", ...leadEmpresaFilter } }),
  ]);

  const totalFaturado = vendas.reduce((s, v) => s + (v.valor ?? 0), 0);
  const totalVendas   = vendas.length;
  const ticketMedio   = totalVendas > 0 ? totalFaturado / totalVendas : 0;
  const taxaConversao = totalLeads > 0 ? (leadsConvertidos / totalLeads) * 100 : 0;

  const rankingMap = new Map<string, { nome: string; totalVendas: number; faturamento: number }>();
  for (const v of vendas) {
    const r = rankingMap.get(v.vendedorId) ?? { nome: v.vendedor.nome, totalVendas: 0, faturamento: 0 };
    r.totalVendas++;
    r.faturamento += v.valor ?? 0;
    rankingMap.set(v.vendedorId, r);
  }
  const rankingVendedores = [...rankingMap.values()].sort((a, b) => b.faturamento - a.faturamento);

  const vendasRecentes = vendas.slice(0, 10).map((v) => ({
    id:           v.id,
    clienteNome:  v.lead.cliente.nome,
    vendedorNome: v.vendedor.nome,
    valor:        v.valor,
    descricao:    v.descricao,
    criadoEm:     v.criadoEm,
  }));

  return NextResponse.json({ totalFaturado, totalVendas, ticketMedio, taxaConversao, rankingVendedores, vendasRecentes });
}
