import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Receives Cal.com webhook when a booking is confirmed
// Called by N8N after extracting relevant fields from Cal.com payload
// POST body: { instancia, nome, email, telefone, servico, dataAgendada, hora }
export async function POST(req: Request) {
  const body = await req.json();
  const { instancia, nome, email, telefone, servico, dataAgendada, hora } = body;

  if (!instancia || !dataAgendada) {
    return NextResponse.json({ ok: false, motivo: "instancia e dataAgendada sao obrigatorios" }, { status: 400 });
  }

  const empresa = await prisma.empresa.findUnique({
    where: { instanciaWhatsapp: instancia },
  });
  if (!empresa) {
    return NextResponse.json({ ok: false, motivo: "empresa nao encontrada" }, { status: 404 });
  }

  // Find client by phone first, then by email, then create new
  let cliente = null;

  if (telefone) {
    const tel = telefone.replace(/\D/g, "");
    cliente = await prisma.cliente.findFirst({
      where: { empresaId: empresa.id, telefone: { endsWith: tel.slice(-9) } },
      orderBy: { criadoEm: "desc" },
    });
    if (!cliente) {
      cliente = await prisma.cliente.upsert({
        where: { telefone_empresaId: { telefone: tel, empresaId: empresa.id } },
        create: { telefone: tel, empresaId: empresa.id, nome: nome || null, email: email || null },
        update: { ...(nome && { nome }), ...(email && { email }) },
      });
    } else if (nome || email) {
      cliente = await prisma.cliente.update({
        where: { id: cliente.id },
        data: { ...(nome && { nome }), ...(email && { email }) },
      });
    }
  } else if (email) {
    cliente = await prisma.cliente.findFirst({
      where: { empresaId: empresa.id, email },
    });
  }

  if (!cliente) {
    return NextResponse.json({ ok: false, motivo: "cliente nao identificado — forneça telefone ou email" }, { status: 422 });
  }

  // Find or create active lead
  let lead = await prisma.lead.findFirst({
    where: { clienteId: cliente.id, empresaId: empresa.id, status: { notIn: ["PERDIDO", "SEM_INTERESSE"] } },
    orderBy: { criadoEm: "desc" },
    include: { vendedor: { select: { id: true, nome: true, telefone: true } } },
  });
  if (!lead) {
    lead = await prisma.lead.create({
      data: { clienteId: cliente.id, empresaId: empresa.id, status: "AGENDADO" },
      include: { vendedor: { select: { id: true, nome: true, telefone: true } } },
    });
  } else {
    lead = await prisma.lead.update({
      where: { id: lead.id },
      data: { status: "AGENDADO" },
      include: { vendedor: { select: { id: true, nome: true, telefone: true } } },
    });
  }

  // Create Agendamento — catch P2002 (unique violation) when concurrent Cal.com webhooks race
  const dataAgendadaDate = new Date(dataAgendada);
  let agendamento;
  try {
    agendamento = await prisma.agendamento.create({
      data: {
        clienteId: cliente.id,
        tipo: "CONSULTA",
        dataAgendada: dataAgendadaDate,
        hora: hora || null,
        notas: servico || null,
        status: "PENDENTE",
      },
    });
  } catch (e: any) {
    if (e.code !== "P2002") throw e;
    // Another concurrent webhook already created this slot — reuse it
    agendamento = await prisma.agendamento.findFirst({
      where: { clienteId: cliente.id, dataAgendada: dataAgendadaDate, hora: hora || null, status: "PENDENTE" },
    });
  }

  // Round-robin vendor if lead has none
  let vendedor = (lead as any).vendedor;
  if (!vendedor) {
    const proximo = await prisma.vendedor.findFirst({
      where: { empresaId: empresa.id, ativo: true },
      orderBy: [{ ultimaAtribuicaoEm: { sort: "asc", nulls: "first" } }, { ordemChamada: "asc" }],
      select: { id: true, nome: true, telefone: true },
    });
    if (proximo) {
      vendedor = proximo;
      await prisma.vendedor.update({ where: { id: proximo.id }, data: { ultimaAtribuicaoEm: new Date() } });
      await prisma.lead.update({ where: { id: lead.id }, data: { vendedorId: proximo.id } });
    }
  }

  const dataFormatada = new Date(dataAgendada).toLocaleDateString("pt-BR");

  return NextResponse.json({
    ok: true,
    lead: { id: lead.id, status: "AGENDADO" },
    agendamento: { id: agendamento.id, dataAgendada, hora },
    cliente: { id: cliente.id, nome: cliente.nome, telefone: cliente.telefone },
    vendedor,
    empresa: { instanciaWhatsapp: empresa.instanciaWhatsapp },
    mensagemVendedor: `AGENDAMENTO CONFIRMADO via Cal.com\nCliente: ${cliente.nome || "desconhecido"}\nServiço: ${servico || "não informado"}\nData: ${dataFormatada}${hora ? " às " + hora : ""}\nTelefone: ${cliente.telefone}`,
  });
}
