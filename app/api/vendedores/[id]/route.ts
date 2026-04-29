import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const vendedor = await prisma.vendedor.update({
    where: { id },
    data: {
      ...(body.nome && { nome: body.nome }),
      ...(body.telefone && { telefone: body.telefone }),
      ...(body.ordemChamada !== undefined && { ordemChamada: Number(body.ordemChamada) }),
      ...(body.ativo !== undefined && { ativo: body.ativo }),
    },
  });
  return NextResponse.json(vendedor);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.lead.updateMany({ where: { vendedorId: id }, data: { vendedorId: null } });
  await prisma.vendedor.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
