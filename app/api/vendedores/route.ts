import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth";

export async function GET(req: Request) {
  const me = await getUsuarioLogado();
  const { searchParams } = new URL(req.url);

  const empresaId = me?.perfil !== "CENTRAL" && me?.empresaId
    ? me.empresaId
    : (searchParams.get("empresaId") ?? undefined);

  const todos = searchParams.get("todos") === "true";
  const vendedores = await prisma.vendedor.findMany({
    where: {
      ...(todos ? {} : { ativo: true }),
      ...(empresaId && { empresaId }),
    },
    orderBy: { ordemChamada: "asc" },
    include: {
      empresa: { select: { nome: true } },
      _count: { select: { vendas: true } },
    },
  });
  return NextResponse.json(vendedores);
}

export async function POST(req: Request) {
  const body = await req.json();

  const ultimaOrdem = await prisma.vendedor.findFirst({
    where: { empresaId: body.empresaId },
    orderBy: { ordemChamada: "desc" },
    select: { ordemChamada: true },
  });

  const vendedor = await prisma.vendedor.create({
    data: {
      nome: body.nome,
      telefone: body.telefone,
      empresaId: body.empresaId,
      ordemChamada: (ultimaOrdem?.ordemChamada ?? 0) + 1,
      ...(body.cargo && { cargo: body.cargo }),
    },
  });
  return NextResponse.json(vendedor, { status: 201 });
}
