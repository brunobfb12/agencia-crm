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

  // Status hierarchy — AI cannot downgrade leads that reached AGENDADO or beyond
  const statusOrder: LeadStatus[] = [
    "LEAD", "AQUECIMENTO", "PRONTO_PARA_COMPRAR", "AGENDADO",
    "NEGOCIACAO", "VENDA_REALIZADA", "POS_VENDA",
  ];
  const terminalStatus: LeadStatus[] = ["PERDIDO", "SEM_INTERESSE", "SEM_RESPOSTA", "FOLLOW_UP"];

  if (leadId && (novoStatus || observacoes)) {
    let statusToApply: LeadStatus | undefined;
    if (novoStatus) {
      const current = await prisma.lead.findUnique({ where: { id: leadId }, select: { status: true } });
      const currentIdx = current ? statusOrder.indexOf(current.status as LeadStatus) : -1;
      const newIdx = statusOrder.indexOf(novoStatus as LeadStatus);
      const isTerminal = terminalStatus.includes(novoStatus as LeadStatus);
      // Only apply if it's a promotion, a terminal status, or current isn't in the ordered list
      if (isTerminal || newIdx === -1 || currentIdx === -1 || newIdx > currentIdx) {
        statusToApply = novoStatus as LeadStatus;
      }
    }
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        ...(statusToApply && { status: statusToApply }),
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
