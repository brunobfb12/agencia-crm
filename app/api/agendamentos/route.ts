import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth";

export async function GET(req: Request) {
  const me = await getUsuarioLogado();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "PENDENTE";

  const empresaId = me?.perfil !== "CENTRAL" && me?.empresaId
    ? me.empresaId
    : (searchParams.get("empresaId") ?? undefined);

  const agendamentos = await prisma.agendamento.findMany({
    where: {
      status: status as "PENDENTE" | "CONCLUIDO" | "CANCELADO",
      ...(empresaId && { cliente: { empresaId } }),
    },
    orderBy: { dataAgendada: "asc" },
    include: {
      cliente: {
        include: { empresa: { select: { nome: true, instanciaWhatsapp: true } } },
      },
    },
  });
  return NextResponse.json(agendamentos);
}

export async function POST(req: Request) {
  const body = await req.json();
  const agendamento = await prisma.agendamento.create({
    data: {
      clienteId: body.clienteId,
      tipo: body.tipo,
      dataAgendada: new Date(body.dataAgendada),
      notas: body.notas,
    },
    include: { cliente: true },
  });
  return NextResponse.json(agendamento, { status: 201 });
}
