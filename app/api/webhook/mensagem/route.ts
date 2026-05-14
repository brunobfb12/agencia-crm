import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { instancia, telefone, mensagem, nomeContato } = body;

  if (!instancia || !telefone || !mensagem) {
    return NextResponse.json({ ok: false, motivo: "campos obrigatorios ausentes" });
  }

  const empresa = await prisma.empresa.findUnique({
    where: { instanciaWhatsapp: instancia },
  });
  if (!empresa) {
    return NextResponse.json({ ok: false, motivo: "empresa nao encontrada" });
  }

  // @lid resolution: iPhones with WhatsApp Business send a numeric @lid JID
  // (e.g. 58136828342503) instead of a real Brazilian phone (always starts with "55").
  // When @lid is detected, look for an existing client with the same name in this empresa.
  // If found, reuse that client so iPhone and WhatsApp Web share the same conversation.
  const isLid = !telefone.startsWith("55");
  let clientePrincipal: { id: string; nome: string | null; telefone: string; email: string | null; dataNascimento: Date | null; memoriaCliente: string | null } | null = null;
  let telefonePrincipal = telefone;

  if (isLid && nomeContato) {
    const nomeLimpo = nomeContato.replace(/[^\p{L}\p{N}\s]/gu, "").trim();
    if (nomeLimpo) {
      const encontrado = await prisma.cliente.findFirst({
        where: {
          empresaId: empresa.id,
          nome: { contains: nomeLimpo, mode: "insensitive" },
          telefone: { startsWith: "55" },
        },
        orderBy: { criadoEm: "desc" },
        select: { id: true, nome: true, telefone: true, email: true, dataNascimento: true, memoriaCliente: true },
      });
      if (encontrado) {
        clientePrincipal = encontrado;
        telefonePrincipal = encontrado.telefone;
      }
    }
  }

  // Use merged client if found, otherwise upsert by telefone
  const cliente = clientePrincipal ?? await prisma.cliente.upsert({
    where: { telefone_empresaId: { telefone, empresaId: empresa.id } },
    create: { telefone, empresaId: empresa.id, nome: nomeContato || null },
    update: nomeContato ? { nome: nomeContato } : {},
    select: { id: true, nome: true, telefone: true, email: true, dataNascimento: true, memoriaCliente: true },
  });

  let lead = await prisma.lead.findFirst({
    where: { clienteId: cliente.id, empresaId: empresa.id, status: { notIn: ["PERDIDO", "SEM_INTERESSE"] } },
    orderBy: { criadoEm: "desc" },
    include: { vendedor: { select: { id: true, nome: true, telefone: true, ativo: true } } },
  });
  if (!lead) {
    lead = await prisma.lead.create({
      data: { clienteId: cliente.id, empresaId: empresa.id },
      include: { vendedor: { select: { id: true, nome: true, telefone: true, ativo: true } } },
    });
  }

  let conversa = await prisma.conversa.findFirst({
    where: { clienteId: cliente.id },
    orderBy: { ultimaAtividade: "desc" },
  });
  if (!conversa) {
    conversa = await prisma.conversa.create({
      data: { clienteId: cliente.id },
    });
  }

  await prisma.mensagem.create({
    data: { conversaId: conversa.id, conteudo: mensagem, direcao: "ENTRADA" },
  });

  conversa = await prisma.conversa.update({
    where: { id: conversa.id },
    data: { ultimaMensagem: mensagem, ultimaAtividade: new Date() },
  });

  const historico = await prisma.mensagem.findMany({
    where: { conversaId: conversa.id },
    orderBy: { criadoEm: "asc" },
    take: 20,
    select: { direcao: true, conteudo: true },
  });

  // Atribuição de vendedor: fidelização ou round-robin
  let vendedor = null;

  if (lead.vendedor?.ativo) {
    vendedor = lead.vendedor;
  } else {
    const proximo = await prisma.vendedor.findFirst({
      where: { empresaId: empresa.id, ativo: true },
      orderBy: [
        { ultimaAtribuicaoEm: { sort: "asc", nulls: "first" } },
        { ordemChamada: "asc" },
      ],
      select: { id: true, nome: true, telefone: true },
    });

    if (proximo) {
      vendedor = proximo;
      await prisma.vendedor.update({
        where: { id: proximo.id },
        data: { ultimaAtribuicaoEm: new Date() },
      });
      await prisma.lead.update({
        where: { id: lead.id },
        data: { vendedorId: proximo.id },
      });
    }
  }

  const vendas = await prisma.venda.findMany({
    where: { lead: { clienteId: cliente.id, empresaId: empresa.id } },
    orderBy: { criadoEm: "desc" },
    take: 5,
    select: { valor: true, criadoEm: true },
  });

  const midias = await prisma.midia.findMany({
    where: { empresaId: empresa.id, ativo: true },
    select: { id: true, etiqueta: true, mimeType: true, descricaoUso: true, tipo: true },
    orderBy: { criadoEm: "desc" },
  });

  const agendamentos = await prisma.agendamento.findMany({
    where: { clienteId: cliente.id, status: "PENDENTE" },
    select: { tipo: true, dataAgendada: true, hora: true, notas: true },
    orderBy: { dataAgendada: "asc" },
    take: 3,
  });

  // Normalize phone before returning — DB may store "55+55..." or "5555..." from old bookings
  let tpNorm = telefonePrincipal.replace(/\D/g, "");
  while (tpNorm.startsWith("5555") && tpNorm.length > 13) tpNorm = tpNorm.slice(2);

  return NextResponse.json({
    ok: true,
    modoHumano: conversa.modoHumano,
    empresa: {
      id: empresa.id,
      nome: empresa.nome,
      instanciaWhatsapp: empresa.instanciaWhatsapp,
      informacoes: empresa.informacoes,
      calendlyUrl: empresa.calendlyUrl ?? null,
      perguntasQualificacao: empresa.perguntasQualificacao ?? null,
      tipoAtendimento: empresa.tipoAtendimento,
      nomeIA: empresa.nomeIA ?? null,
    },
    cliente: {
      id: cliente.id,
      nome: cliente.nome,
      telefone: cliente.telefone,
      email: cliente.email ?? null,
      dataNascimento: cliente.dataNascimento ?? null,
      memoriaCliente: cliente.memoriaCliente ?? null,
    },
    lead: { id: lead.id, status: lead.status, observacoes: lead.observacoes, vendedorId: lead.vendedorId },
    conversa: { id: conversa.id },
    historico,
    vendedor,
    telefonePrincipal: tpNorm,
    midias,
    agendamentos,
    vendas,
  });
}
