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
      ...(body.informacoes !== undefined && { informacoes: body.informacoes }),
      ...(body.googleCalendarId !== undefined && { googleCalendarId: body.googleCalendarId || null }),
      ...(body.googleCredentialId !== undefined && { googleCredentialId: body.googleCredentialId || null }),
    },
  });
  return NextResponse.json(empresa);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.empresa.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
