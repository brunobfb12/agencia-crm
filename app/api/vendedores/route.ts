import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const empresaId = searchParams.get("empresaId");

  const vendedores = await prisma.vendedor.findMany({
    where: {
      ativo: true,
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
    },
  });
  return NextResponse.json(vendedor, { status: 201 });
}
