import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LeadStatus } from "@prisma/client";

export async function POST(req: Request) {
  const body = await req.json();
  const { conversaId, leadId, resposta, novoStatus, observacoes, notificarVendedor } = body;

  if (!conversaId || !resposta) {
    return NextResponse.json({ ok: false, motivo: "campos obrigatorios ausentes" });
  }

  await prisma.mensagem.create({
    data: { conversaId, conteudo: resposta, direcao: "SAIDA" },
  });

  await prisma.conversa.update({
    where: { id: conversaId },
    data: { ultimaMensagem: resposta, ultimaAtividade: new Date() },
  });

  if (leadId && (novoStatus || observacoes)) {
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        ...(novoStatus && { status: novoStatus as LeadStatus }),
        ...(observacoes && { observacoes }),
      },
    });
  }

  let vendedor = null;
  if (notificarVendedor && leadId) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (lead) {
      vendedor = await prisma.vendedor.findFirst({
        where: { empresaId: lead.empresaId, ativo: true },
        orderBy: { ordemChamada: "asc" },
        select: { id: true, nome: true, telefone: true },
      });
    }
  }

  return NextResponse.json({ ok: true, vendedor });
}
