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
      ...(body.calendlyUrl !== undefined && { calendlyUrl: body.calendlyUrl || null }),
      ...(body.perguntasQualificacao !== undefined && { perguntasQualificacao: body.perguntasQualificacao || null }),
      ...(body.tipoAtendimento !== undefined && { tipoAtendimento: body.tipoAtendimento }),
      ...(body.nomeIA !== undefined && { nomeIA: body.nomeIA || null }),
    },
  });
  return NextResponse.json(empresa);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Collect IDs before deleting (FK constraints require ordered cascade)
  const clientes = await prisma.cliente.findMany({ where: { empresaId: id }, select: { id: true } });
  const clienteIds = clientes.map((c) => c.id);
  const leads = await prisma.lead.findMany({ where: { empresaId: id }, select: { id: true } });
  const leadIds = leads.map((l) => l.id);
  const vendedores = await prisma.vendedor.findMany({ where: { empresaId: id }, select: { id: true } });
  const vendedorIds = vendedores.map((v) => v.id);

  await prisma.campanhaItem.deleteMany({ where: { leadId: { in: leadIds } } });
  await prisma.campanha.deleteMany({ where: { empresaId: id } });
  await prisma.venda.deleteMany({ where: { leadId: { in: leadIds } } });
  await prisma.notificacao.deleteMany({ where: { vendedorId: { in: vendedorIds } } });
  await prisma.mensagem.deleteMany({ where: { conversa: { clienteId: { in: clienteIds } } } });
  await prisma.conversa.deleteMany({ where: { clienteId: { in: clienteIds } } });
  await prisma.agendamento.deleteMany({ where: { clienteId: { in: clienteIds } } });
  await prisma.lead.deleteMany({ where: { empresaId: id } });
  await prisma.cliente.deleteMany({ where: { empresaId: id } });
  await prisma.vendedor.deleteMany({ where: { empresaId: id } });
  await prisma.midia.deleteMany({ where: { empresaId: id } });
  await prisma.empresa.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
