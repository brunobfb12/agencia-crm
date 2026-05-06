import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Vendor sends "FECHADO 1500" or "FECHADO 1500 descrição do produto"
// to the company WhatsApp → N8N calls this endpoint → CRM registers the sale
export async function POST(req: Request) {
  const { instancia, telefoneVendedor, mensagem } = await req.json();
  if (!instancia || !telefoneVendedor || !mensagem) {
    return NextResponse.json({ ok: false, motivo: "campos obrigatorios ausentes" });
  }

  const empresa = await prisma.empresa.findUnique({ where: { instanciaWhatsapp: instancia } });
  if (!empresa) return NextResponse.json({ ok: false, motivo: "empresa nao encontrada" });

  const vendedor = await prisma.vendedor.findFirst({
    where: { empresaId: empresa.id, telefone: telefoneVendedor, ativo: true },
  });
  if (!vendedor) return NextResponse.json({ ok: false, motivo: "vendedor nao encontrado" });

  // Parse: FECHADO 1500 ou FECHADO 1.500,00 descrição
  const match = mensagem.trim().match(/^FECHADO\s+([\d.,]+)(?:\s+(.+))?/i);
  if (!match) return NextResponse.json({ ok: false, motivo: "formato invalido" });

  const valorStr = match[1].replace(/\./g, "").replace(",", ".");
  const valor = parseFloat(valorStr);
  const descricao = match[2]?.trim() || null;

  if (isNaN(valor) || valor <= 0) {
    return NextResponse.json({ ok: false, motivo: "valor invalido" });
  }

  // Find most recent active lead assigned to this vendor
  const lead = await prisma.lead.findFirst({
    where: {
      vendedorId: vendedor.id,
      empresaId: empresa.id,
      status: { notIn: ["VENDA_REALIZADA", "PERDIDO", "SEM_INTERESSE"] },
    },
    orderBy: { atualizadoEm: "desc" },
    include: { cliente: { select: { nome: true, telefone: true } } },
  });

  if (!lead) {
    return NextResponse.json({ ok: false, motivo: "nenhum lead ativo encontrado para este vendedor" });
  }

  // Update lead + create Venda record
  await prisma.lead.update({
    where: { id: lead.id },
    data: { status: "VENDA_REALIZADA" },
  });

  await prisma.venda.create({
    data: { leadId: lead.id, vendedorId: vendedor.id, valor, descricao },
  });

  const nomeCliente = lead.cliente.nome ?? lead.cliente.telefone;
  return NextResponse.json({
    ok: true,
    confirmacao: `✅ Venda registrada!\nCliente: ${nomeCliente}\nValor: R$ ${valor.toFixed(2).replace(".", ",")}${descricao ? `\nProduto: ${descricao}` : ""}`,
    leadId: lead.id,
    valor,
  });
}
