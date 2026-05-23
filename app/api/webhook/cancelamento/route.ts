import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Receives Cal.com cancellation webhook via N8N
// POST body: { instancia, nome, email, telefone, servico, dataAgendada, hora }
export async function POST(req: Request) {
  const body = await req.json();
  const { instancia, telefone, email, dataAgendada, hora } = body;

  if (!instancia || !dataAgendada) {
    return NextResponse.json({ ok: false, motivo: "instancia e dataAgendada obrigatorios" }, { status: 400 });
  }

  const empresa = await prisma.empresa.findUnique({
    where: { instanciaWhatsapp: instancia },
  });
  if (!empresa) {
    return NextResponse.json({ ok: false, motivo: "empresa nao encontrada" }, { status: 404 });
  }

  // Find client
  let cliente = null;
  if (telefone) {
    let tel = telefone.replace(/\D/g, "");
    while (tel.startsWith("5555") && tel.length > 13) tel = tel.slice(2);
    cliente = await prisma.cliente.findFirst({
      where: { empresaId: empresa.id, telefone: { endsWith: tel.slice(-9) } },
      orderBy: { criadoEm: "desc" },
    });
  }
  if (!cliente && email) {
    cliente = await prisma.cliente.findFirst({
      where: { empresaId: empresa.id, email },
    });
  }
  if (!cliente) {
    return NextResponse.json({ ok: false, motivo: "cliente nao identificado" }, { status: 422 });
  }

  // Find and cancel the agendamento
  const dateOnly = String(dataAgendada).split("T")[0];
  const dataAgendadaDate = new Date(dateOnly + "T03:00:00.000Z");
  const horaNorm = hora ? String(hora).substring(0, 5) : null;

  const agendamento = await prisma.agendamento.findFirst({
    where: {
      clienteId: cliente.id,
      dataAgendada: dataAgendadaDate,
      ...(horaNorm && { hora: horaNorm }),
      status: "PENDENTE",
    },
  });

  if (!agendamento) {
    return NextResponse.json({ ok: false, motivo: "agendamento nao encontrado ou ja cancelado" });
  }

  await prisma.agendamento.update({
    where: { id: agendamento.id },
    data: { status: "CANCELADO" },
  });

  // Move lead back to AQUECIMENTO
  const lead = await prisma.lead.findFirst({
    where: { clienteId: cliente.id, empresaId: empresa.id, status: "AGENDADO" },
    orderBy: { criadoEm: "desc" },
    include: { vendedor: { select: { id: true, nome: true, telefone: true } } },
  });

  if (lead) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: "AQUECIMENTO" },
    });
  }

  const dataFormatada = dataAgendadaDate.toLocaleDateString("pt-BR");
  const nomeCliente = cliente.nome || "cliente";
  const telefoneLimpo = (cliente.telefone || "").replace(/\D/g, "").replace(/^5555(\d+)$/, "55$1");
  const vendedor = (lead as any)?.vendedor ?? null;

  const mensagemVendedor =
    `⚠️ *AGENDAMENTO CANCELADO*\n\n` +
    `👤 *Cliente:* ${nomeCliente}\n` +
    `📱 *WhatsApp:* https://wa.me/${telefoneLimpo}\n` +
    `📅 *Era para:* ${dataFormatada}${hora ? " às " + hora : ""}\n\n` +
    `Lead movido para *Aquecimento*. Considere entrar em contato para reagendar.`;

  return NextResponse.json({
    ok: true,
    agendamento: { id: agendamento.id, status: "CANCELADO" },
    lead: lead ? { id: lead.id, status: "AQUECIMENTO" } : null,
    vendedor,
    empresa: { instanciaWhatsapp: empresa.instanciaWhatsapp },
    mensagemVendedor,
  });
}
