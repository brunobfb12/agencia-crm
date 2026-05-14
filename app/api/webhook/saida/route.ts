import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Salva mensagem enviada pelo cron de follow-up na conversa do cliente
// para que a IA veja o histórico completo quando o cliente responder
export async function POST(req: Request) {
  const body = await req.json();
  const { instancia, telefone, mensagem, secret, leadId, novoStatus, score, memoriaCliente } = body;

  if (secret !== "crm2026migra") {
    return NextResponse.json({ ok: false, motivo: "unauthorized" }, { status: 401 });
  }
  if (!instancia || !telefone || !mensagem) {
    return NextResponse.json({ ok: false, motivo: "campos obrigatorios ausentes" });
  }

  const empresa = await prisma.empresa.findUnique({ where: { instanciaWhatsapp: instancia } });
  if (!empresa) return NextResponse.json({ ok: false, motivo: "empresa nao encontrada" });

  // Normaliza telefone igual ao webhook/mensagem
  let telNorm = telefone.replace(/\D/g, "");
  while (telNorm.startsWith("5555") && telNorm.length > 13) telNorm = telNorm.slice(2);

  // Encontra cliente — não cria (mensagem saída só tem sentido se o cliente existe)
  const cliente = await prisma.cliente.findFirst({
    where: { empresaId: empresa.id, telefone: { contains: telNorm.slice(-10) } },
    orderBy: { criadoEm: "desc" },
  });
  if (!cliente) return NextResponse.json({ ok: false, motivo: "cliente nao encontrado" });

  let conversa = await prisma.conversa.findFirst({
    where: { clienteId: cliente.id },
    orderBy: { ultimaAtividade: "desc" },
  });
  if (!conversa) {
    conversa = await prisma.conversa.create({ data: { clienteId: cliente.id } });
  }

  await prisma.mensagem.create({
    data: { conversaId: conversa.id, conteudo: mensagem, direcao: "SAIDA" },
  });

  await prisma.conversa.update({
    where: { id: conversa.id },
    data: { ultimaMensagem: mensagem, ultimaAtividade: new Date() },
  });

  // Atualizar lead (status, score) se informado
  if (leadId && (novoStatus || score !== undefined)) {
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        ...(novoStatus && { status: novoStatus }),
        ...(score !== undefined && { score: Number(score) }),
      },
    }).catch(() => null);
  }

  // Atualizar memória do cliente se informada
  if (memoriaCliente && cliente) {
    await prisma.cliente.update({
      where: { id: cliente.id },
      data: { memoriaCliente },
    }).catch(() => null);
  }

  return NextResponse.json({ ok: true, conversaId: conversa.id, clienteNome: cliente.nome });
}
