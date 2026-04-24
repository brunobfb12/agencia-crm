import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const agendamento = await prisma.agendamento.update({
    where: { id: params.id },
    data: { status: body.status },
  });
  return NextResponse.json(agendamento);
}
