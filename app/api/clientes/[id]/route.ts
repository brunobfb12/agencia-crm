import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.nome !== undefined) data.nome = body.nome;
  if (body.email !== undefined) data.email = body.email;
  if (body.dataNascimento !== undefined) {
    // Append T12:00:00 to date-only strings to avoid UTC-midnight shifting the day
    // in UTC-3 browsers (e.g. "1983-11-08" → midnight UTC → Nov 7 in Brazil)
    if (body.dataNascimento) {
      const raw = String(body.dataNascimento);
      data.dataNascimento = new Date(/T/.test(raw) ? raw : raw + "T12:00:00Z");
    } else {
      data.dataNascimento = null;
    }
  }
  if (body.tags !== undefined) data.tags = body.tags;
  if (body.memoriaCliente !== undefined) data.memoriaCliente = body.memoriaCliente;

  const cliente = await prisma.cliente.update({
    where: { id },
    data,
  });
  return NextResponse.json(cliente);
}
