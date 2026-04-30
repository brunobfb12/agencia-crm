import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth";

export async function GET(req: Request) {
  const me = await getUsuarioLogado();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "PENDENTE";
  const dataHoje = searchParams.get("dataHoje") === "true";

  const empresaId = me?.perfil !== "CENTRAL" && me?.empresaId
    ? me.empresaId
    : (searchParams.get("empresaId") ?? undefined);

  let dataInicio: Date | undefined;
  let dataFim: Date | undefined;
  if (dataHoje) {
    dataInicio = new Date(); dataInicio.setHours(0, 0, 0, 0);
    dataFim = new Date(); dataFim.setHours(23, 59, 59, 999);
  }

  const agendamentos = await prisma.agendamento.findMany({
    where: {
      status: status as "PENDENTE" | "CONCLUIDO" | "CANCELADO",
      ...(empresaId && { cliente: { empresaId } }),
      ...(dataHoje && { dataAgendada: { gte: dataInicio, lte: dataFim } }),
    },
    orderBy: { dataAgendada: "asc" },
    include: {
      cliente: {
        include: { empresa: { select: { nome: true, instanciaWhatsapp: true, googleCalendarId: true, googleCredentialId: true } } },
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
      hora: body.hora ?? null,
      notas: body.notas ?? null,
    },
    include: { cliente: { include: { empresa: { select: { nome: true, instanciaWhatsapp: true, googleCalendarId: true } } } } },
  });
  return NextResponse.json(agendamento, { status: 201 });
}
