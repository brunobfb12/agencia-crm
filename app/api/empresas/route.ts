import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  const instancia = searchParams.get("instancia");

  const isCron = secret === "crm2026migra";
  const me = isCron ? null : await getUsuarioLogado();
  if (!isCron && !me) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const where = instancia
    ? { instanciaWhatsapp: instancia }
    : isCron
      ? { ativa: true }
      : me?.perfil !== "CENTRAL" && me?.empresaId
        ? { id: me.empresaId }
        : { ativa: true };

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
    include: { _count: { select: { clientes: true, leads: true } } },
  });
  return NextResponse.json(empresa, { status: 201 });
}
