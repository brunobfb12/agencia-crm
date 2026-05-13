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

  if (me.perfil !== "CENTRAL" && me.empresaId) {
    const vendedor = await prisma.vendedor.findUnique({ where: { id }, select: { empresaId: true } });
    if (!vendedor || vendedor.empresaId !== me.empresaId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }
  }

  const body = await req.json();
  const vendedor = await prisma.vendedor.update({
    where: { id },
    data: {
      ...(body.nome && { nome: body.nome }),
      ...(body.telefone && { telefone: body.telefone }),
      ...(body.ordemChamada !== undefined && { ordemChamada: Number(body.ordemChamada) }),
      ...(body.ativo !== undefined && { ativo: body.ativo }),
      ...(body.cargo && { cargo: body.cargo }),
    },
  });
  return NextResponse.json(vendedor);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getUsuarioLogado();
  if (!me) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  if (me.perfil !== "CENTRAL" && me.empresaId) {
    const vendedor = await prisma.vendedor.findUnique({ where: { id }, select: { empresaId: true } });
    if (!vendedor || vendedor.empresaId !== me.empresaId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }
  }

  await prisma.lead.updateMany({ where: { vendedorId: id }, data: { vendedorId: null } });
  await prisma.vendedor.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
