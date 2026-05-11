import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const lead = await prisma.lead.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.score !== undefined && { score: body.score }),
      ...(body.observacoes !== undefined && { observacoes: body.observacoes }),
      ...(body.vendedorId !== undefined && { vendedorId: body.vendedorId }),
      ...(body.dataRecontato !== undefined && {
        dataRecontato: body.dataRecontato ? new Date(body.dataRecontato) : null,
      }),
    },
    include: { cliente: true },
  });
  return NextResponse.json(lead);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const lead = await prisma.lead.findUnique({ where: { id }, select: { clienteId: true } });
  if (!lead) return NextResponse.json({ ok: false }, { status: 404 });

  // Apaga mensagens → conversas → lead → cliente (se não tiver outros leads)
  const conversas = await prisma.conversa.findMany({
    where: { clienteId: lead.clienteId },
    select: { id: true },
  });
  const conversaIds = conversas.map((c: { id: string }) => c.id);

  await prisma.mensagem.deleteMany({ where: { conversaId: { in: conversaIds } } });
  await prisma.conversa.deleteMany({ where: { id: { in: conversaIds } } });
  await prisma.lead.delete({ where: { id } });

  // Remove o cliente se não sobrou nenhum outro lead
  const outrosLeads = await prisma.lead.count({ where: { clienteId: lead.clienteId } });
  if (outrosLeads === 0) {
    await prisma.cliente.delete({ where: { id: lead.clienteId } });
  }

  return NextResponse.json({ ok: true });
}
