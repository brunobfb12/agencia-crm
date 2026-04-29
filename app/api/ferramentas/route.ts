import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const ferramentas = await prisma.ferramenta.findMany({
    orderBy: { criadoEm: "asc" },
  });
  return NextResponse.json(ferramentas);
}

export async function POST(req: Request) {
  const body = await req.json();
  const ferramenta = await prisma.ferramenta.create({
    data: {
      nome: body.nome,
      tipo: body.tipo,
      valor: body.valor ? Number(body.valor) : null,
      vencimento: body.vencimento ? new Date(body.vencimento) : null,
      link: body.link || null,
      observacoes: body.observacoes || null,
    },
  });
  return NextResponse.json(ferramenta, { status: 201 });
}
