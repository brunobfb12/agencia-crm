import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const lead = await prisma.lead.update({
    where: { id: params.id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.score !== undefined && { score: body.score }),
      ...(body.observacoes !== undefined && { observacoes: body.observacoes }),
    },
    include: { cliente: true },
  });
  return NextResponse.json(lead);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  await prisma.lead.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
