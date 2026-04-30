import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getUsuarioLogado();
  if (!me) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const midia = await prisma.midia.findUnique({ where: { id } });
  if (!midia) return NextResponse.json({ error: "Mídia não encontrada" }, { status: 404 });
  if (me.perfil !== "CENTRAL" && midia.empresaId !== me.empresaId) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const updated = await prisma.midia.update({
    where: { id },
    data: {
      ...(body.etiqueta !== undefined && { etiqueta: body.etiqueta }),
      ...(body.url !== undefined && { url: body.url }),
      ...(body.descricaoUso !== undefined && { descricaoUso: body.descricaoUso }),
      ...(body.tipo !== undefined && { tipo: body.tipo }),
      ...(body.ativo !== undefined && { ativo: body.ativo }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getUsuarioLogado();
  if (!me) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  const midia = await prisma.midia.findUnique({ where: { id } });
  if (!midia) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  if (me.perfil !== "CENTRAL" && midia.empresaId !== me.empresaId) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  await prisma.midia.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
