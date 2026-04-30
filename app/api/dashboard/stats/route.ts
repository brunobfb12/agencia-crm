import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth";

export async function GET(req: Request) {
  const me = await getUsuarioLogado();
  const { searchParams } = new URL(req.url);

  const empresaId = me?.perfil !== "CENTRAL" && me?.empresaId
    ? me.empresaId
    : (searchParams.get("empresaId") ?? undefined);

  const [
    totalClientes,
    totalLeads,
    leadsAtivos,
    vendasRealizadas,
    agendamentosPendentes,
    leadsPorStatus,
  ] = await Promise.all([
    prisma.cliente.count({ where: { empresaId } }),
    prisma.lead.count({ where: { empresaId } }),
    prisma.lead.count({
      where: {
        empresaId,
        status: { in: ["LEAD", "AQUECIMENTO", "PRONTO_PARA_COMPRAR", "NEGOCIACAO"] },
      },
    }),
    prisma.venda.count({
      where: { lead: { empresaId } },
    }),
    prisma.agendamento.count({
      where: { status: "PENDENTE", cliente: { empresaId } },
    }),
    prisma.lead.groupBy({
      by: ["status"],
      where: { empresaId },
      _count: { status: true },
    }),
  ]);

  return NextResponse.json({
    totalClientes,
    totalLeads,
    leadsAtivos,
    vendasRealizadas,
    agendamentosPendentes,
    leadsPorStatus,
  });
}
