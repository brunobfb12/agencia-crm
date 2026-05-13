import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getUsuarioLogado();
  if (!me) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  if (me.perfil !== "CENTRAL" && me.empresaId) {
    const cliente = await prisma.cliente.findUnique({ where: { id }, select: { empresaId: true } });
    if (!cliente || cliente.empresaId !== me.empresaId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.nome !== undefined) data.nome = body.nome;
  if (body.email !== undefined) data.email = body.email;
  if (body.dataNascimento !== undefined) {
    if (body.dataNascimento) {
      const raw = String(body.dataNascimento);
      data.dataNascimento = new Date(/T/.test(raw) ? raw : raw + "T12:00:00Z");
    } else {
      data.dataNascimento = null;
    }
  }
  if (body.tags !== undefined) data.tags = body.tags;
  if (body.memoriaCliente !== undefined) data.memoriaCliente = body.memoriaCliente;

  const cliente = await prisma.cliente.update({ where: { id }, data });
  return NextResponse.json(cliente);
}
