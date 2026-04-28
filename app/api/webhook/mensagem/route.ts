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

  const cliente = await prisma.cliente.upsert({
    where: { telefone_empresaId: { telefone, empresaId: empresa.id } },
    create: { telefone, empresaId: empresa.id, nome: nomeContato || null },
    update: nomeContato ? { nome: nomeContato } : {},
  });

  let lead = await prisma.lead.findFirst({
    where: { clienteId: cliente.id, empresaId: empresa.id, status: { not: "PERDIDO" } },
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
    // Cliente já tem vendedor ativo → fidelização
    vendedor = lead.vendedor;
  } else {
    // Round-robin: vendedor ativo com ultimaAtribuicaoEm mais antiga (ou null = prioridade)
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

  return NextResponse.json({
    ok: true,
    empresa: { id: empresa.id, nome: empresa.nome, instanciaWhatsapp: empresa.instanciaWhatsapp },
    cliente: { id: cliente.id, nome: cliente.nome, telefone: cliente.telefone },
    lead: { id: lead.id, status: lead.status, observacoes: lead.observacoes, vendedorId: lead.vendedorId },
    conversa: { id: conversa.id },
    historico,
    vendedor,
  });
}
