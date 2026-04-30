import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth";

export async function GET() {
  const me = await getUsuarioLogado();

  const where = me?.perfil !== "CENTRAL" && me?.empresaId
    ? { id: me.empresaId }
    : {};

  const empresas = await prisma.empresa.findMany({
    where,
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
