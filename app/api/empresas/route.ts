import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const empresas = await prisma.empresa.findMany({
    orderBy: { nome: "asc" },
    include: {
      _count: { select: { clientes: true, leads: true } },
    },
  });
  return NextResponse.json(empresas);
}

export async function POST(req: Request) {
  const body = await req.json();
  const empresa = await prisma.empresa.create({
    data: {
      nome: body.nome,
      instanciaWhatsapp: body.instanciaWhatsapp,
    },
  });
  return NextResponse.json(empresa, { status: 201 });
}
