import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.nome !== undefined) data.nome = body.nome;
  if (body.email !== undefined) data.email = body.email;
  if (body.dataNascimento !== undefined) {
    data.dataNascimento = body.dataNascimento ? new Date(body.dataNascimento) : null;
  }
  if (body.tags !== undefined) data.tags = body.tags;

  const cliente = await prisma.cliente.update({
    where: { id },
    data,
  });
  return NextResponse.json(cliente);
}
