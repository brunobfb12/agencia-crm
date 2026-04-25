import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const empresa = await prisma.empresa.update({
    where: { id },
    data: {
      ...(body.nome && { nome: body.nome }),
      ...(body.instanciaWhatsapp && { instanciaWhatsapp: body.instanciaWhatsapp }),
      ...(body.ativa !== undefined && { ativa: body.ativa }),
    },
  });
  return NextResponse.json(empresa);
}
