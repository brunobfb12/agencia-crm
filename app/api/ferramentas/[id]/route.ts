import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const ferramenta = await prisma.ferramenta.update({
    where: { id },
    data: {
      ...(body.nome !== undefined && { nome: body.nome }),
      ...(body.tipo !== undefined && { tipo: body.tipo }),
      ...(body.valor !== undefined && { valor: body.valor ? Number(body.valor) : null }),
      ...(body.vencimento !== undefined && { vencimento: body.vencimento ? new Date(body.vencimento) : null }),
      ...(body.link !== undefined && { link: body.link || null }),
      ...(body.observacoes !== undefined && { observacoes: body.observacoes || null }),
      ...(body.ativo !== undefined && { ativo: body.ativo }),
    },
  });
  return NextResponse.json(ferramenta);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.ferramenta.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
