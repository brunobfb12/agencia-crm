import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const vendedor = await (prisma as any).vendedor.update({
    where: { id },
    data: {
      ...(body.instanciaConectadaEm !== undefined && {
        instanciaConectadaEm: body.instanciaConectadaEm ? new Date(body.instanciaConectadaEm) : null,
      }),
      ...(body.ativo !== undefined && { ativo: body.ativo }),
      ...(body.nome !== undefined && { nome: body.nome }),
      ...(body.telefone !== undefined && { telefone: body.telefone }),
      ...(body.cargo !== undefined && { cargo: body.cargo }),
      ...(body.ordemChamada !== undefined && { ordemChamada: body.ordemChamada }),
    },
  });

  return NextResponse.json(vendedor);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await (prisma as any).vendedor.delete({ where: { id } });
    return NextResponse.json({ ok: true, tipo: "excluido" });
  } catch (e: any) {
    if (e.code === "P2003") {
      await (prisma as any).vendedor.update({ where: { id }, data: { ativo: false } });
      return NextResponse.json({ ok: true, tipo: "desativado", motivo: "possui historico vinculado (vendas/notificacoes)" });
    }
    return NextResponse.json({ ok: false, erro: e.message }, { status: 500 });
  }
}
