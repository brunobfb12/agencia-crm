import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/campanhas/item/[id] - mark as sent or error
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { secret, status, erro } = await req.json() as { secret: string; status: string; erro?: string };

  if (secret !== "crm2026migra") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const item = await prisma.campanhaItem.update({
    where: { id },
    data: {
      status,
      enviadoEm: status === "ENVIADO" ? new Date() : undefined,
      erro: erro ?? null,
    },
    include: {
      campanha: { select: { mensagem: true, tipo: true } },
      lead: { include: { cliente: { select: { id: true } } } },
    },
  });

  // Salva mensagem da campanha no histórico de conversas para que a IA
  // veja o que foi enviado quando o cliente responder
  if (status === "ENVIADO" && item.lead?.cliente) {
    const clienteId = item.lead.cliente.id;
    const mensagem = item.campanha.mensagem;

    let conversa = await prisma.conversa.findFirst({
      where: { clienteId },
      orderBy: { ultimaAtividade: "desc" },
    });
    if (!conversa) {
      conversa = await prisma.conversa.create({ data: { clienteId } });
    }

    await prisma.mensagem.create({
      data: { conversaId: conversa.id, conteudo: mensagem, direcao: "SAIDA" },
    });
    await prisma.conversa.update({
      where: { id: conversa.id },
      data: { ultimaMensagem: mensagem, ultimaAtividade: new Date() },
    });
  }

  // Marca campanha como concluída quando todos os itens forem processados
  const pendentes = await prisma.campanhaItem.count({
    where: { campanhaId: item.campanhaId, status: "PENDENTE" },
  });

  if (pendentes === 0) {
    await prisma.campanha.update({
      where: { id: item.campanhaId },
      data: { status: "CONCLUIDA" },
    });
  }

  return NextResponse.json({ ok: true });
}
