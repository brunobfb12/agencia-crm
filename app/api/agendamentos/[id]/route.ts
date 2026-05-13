import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getUsuarioLogado();
  if (!me) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  if (me.perfil !== "CENTRAL" && me.empresaId) {
    const ag = await prisma.agendamento.findUnique({
      where: { id },
      select: { cliente: { select: { empresaId: true } } },
    });
    if (!ag || ag.cliente.empresaId !== me.empresaId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }
  }

  const agendamento = await prisma.agendamento.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.googleEventId !== undefined && { googleEventId: body.googleEventId }),
    },
  });
  return NextResponse.json(agendamento);
}
