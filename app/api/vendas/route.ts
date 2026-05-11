import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { leadId, vendedorId, valor, descricao } = body;

  if (!leadId || !vendedorId) {
    return NextResponse.json({ error: "leadId e vendedorId são obrigatórios" }, { status: 400 });
  }

  const [venda, lead] = await prisma.$transaction([
    prisma.venda.create({
      data: {
        leadId,
        vendedorId,
        valor: valor ? Number(valor) : null,
        descricao: descricao || null,
        status: "REALIZADA",
      },
    }),
    prisma.lead.update({
      where: { id: leadId },
      data: { status: "VENDA_REALIZADA" },
      include: {
        cliente: { select: { nome: true, telefone: true, email: true, dataNascimento: true } },
        empresa: { select: { nome: true, instanciaWhatsapp: true } },
      },
    }),
  ]);

  return NextResponse.json({ venda, lead }, { status: 201 });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("leadId");
  const where = leadId ? { leadId } : {};
  const vendas = await prisma.venda.findMany({
    where,
    include: { vendedor: { select: { nome: true } } },
    orderBy: { criadoEm: "desc" },
  });
  return NextResponse.json(vendas);
}
