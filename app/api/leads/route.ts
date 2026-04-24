import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LeadStatus } from "@prisma/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const empresaId = searchParams.get("empresaId");
  const status = searchParams.get("status") as LeadStatus | null;

  const leads = await prisma.lead.findMany({
    where: {
      ...(empresaId && { empresaId }),
      ...(status && { status }),
    },
    orderBy: { atualizadoEm: "desc" },
    include: {
      cliente: true,
      empresa: { select: { nome: true, instanciaWhatsapp: true } },
    },
  });
  return NextResponse.json(leads);
}

export async function POST(req: Request) {
  const body = await req.json();
  const lead = await prisma.lead.create({
    data: {
      clienteId: body.clienteId,
      empresaId: body.empresaId,
      status: body.status ?? "LEAD",
      observacoes: body.observacoes,
    },
    include: { cliente: true },
  });
  return NextResponse.json(lead, { status: 201 });
}
