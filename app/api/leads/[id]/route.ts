import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const lead = await prisma.lead.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.score !== undefined && { score: body.score }),
      ...(body.observacoes !== undefined && { observacoes: body.observacoes }),
      ...(body.vendedorId !== undefined && { vendedorId: body.vendedorId }),
    },
    include: { cliente: true },
  });
  return NextResponse.json(lead);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.lead.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
