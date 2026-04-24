import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const empresaId = searchParams.get("empresaId");
  const busca = searchParams.get("busca");

  const clientes = await prisma.cliente.findMany({
    where: {
      ...(empresaId && { empresaId }),
      ...(busca && {
        OR: [
          { nome: { contains: busca, mode: "insensitive" } },
          { telefone: { contains: busca } },
        ],
      }),
    },
    orderBy: { criadoEm: "desc" },
    include: {
      leads: { orderBy: { atualizadoEm: "desc" }, take: 1 },
      empresa: { select: { nome: true } },
    },
  });
  return NextResponse.json(clientes);
}

export async function POST(req: Request) {
  const body = await req.json();
  const cliente = await prisma.cliente.upsert({
    where: {
      telefone_empresaId: {
        telefone: body.telefone,
        empresaId: body.empresaId,
      },
    },
    update: { nome: body.nome, tags: body.tags ?? [] },
    create: {
      nome: body.nome,
      telefone: body.telefone,
      empresaId: body.empresaId,
      tags: body.tags ?? [],
    },
  });
  return NextResponse.json(cliente, { status: 201 });
}
