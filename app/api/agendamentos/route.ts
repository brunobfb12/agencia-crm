import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "PENDENTE";
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const agendamentos = await prisma.agendamento.findMany({
    where: {
      status: status as "PENDENTE" | "CONCLUIDO" | "CANCELADO",
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
