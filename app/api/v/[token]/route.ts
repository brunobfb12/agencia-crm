import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const vendedor: any = await (prisma as any).vendedor.findFirst({
    where: { token },
    include: {
      empresa: { select: { nome: true, instanciaWhatsapp: true, nomeIA: true } },
    },
  });
  if (!vendedor) return NextResponse.json({ error: "Link inválido" }, { status: 404 });

  const corte48h = new Date(Date.now() - 48 * 3600 * 1000);

  const leads = await prisma.lead.findMany({
    where: {
      vendedorId: vendedor.id,
      status: { in: ["INDEFINIDO", "ORCAMENTO_ENVIADO"] },
      atualizadoEm: { lte: corte48h },
      empresa: { ativa: true },
    },
    orderBy: { atualizadoEm: "asc" },
    include: {
      cliente: { select: { nome: true, telefone: true } },
      empresa: { select: { nome: true, instanciaWhatsapp: true } },
    },
  });

  const now = Date.now();
  const leadsFormatados = leads.map(l => ({
    id: l.id,
    clienteNome: l.cliente.nome ?? l.cliente.telefone,
    clienteTelefone: l.cliente.telefone,
    empresaNome: l.empresa.nome,
    instancia: l.empresa.instanciaWhatsapp,
    horasParado: Math.round((now - new Date(l.atualizadoEm).getTime()) / 3600000),
    observacoes: l.observacoes ?? "",
    status: l.status,
    resumoPedido: (() => {
      const obs = l.observacoes ?? "";
      const match = obs.match(/[Pp]edido[:\s]+([^|]+)/);
      if (match) return match[1].trim().slice(0, 100);
      return obs.split("|")[0].trim().slice(0, 100);
    })(),
  }));

  return NextResponse.json({
    vendedorNome: vendedor.nome,
    empresaNome: vendedor.empresa?.nome ?? "",
    leads: leadsFormatados,
    total: leadsFormatados.length,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await req.json();
  const { leadId, acao, valor } = body;

  const vendedor: any = await (prisma as any).vendedor.findFirst({ where: { token } });
  if (!vendedor) return NextResponse.json({ error: "Link inválido" }, { status: 404 });

  const lead = await (prisma as any).lead.findFirst({
    where: { id: leadId, vendedorId: vendedor.id },
    include: {
      cliente: { select: { nome: true, telefone: true } },
      empresa: { select: { nome: true, instanciaWhatsapp: true } },
    },
  }) as any;
  if (!lead) return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });

  if (acao === "venda") {
    const valorNum = valor ? parseFloat(String(valor).replace(",", ".")) : null;
    await prisma.venda.create({
      data: {
        leadId: lead.id,
        vendedorId: vendedor.id,
        valor: valorNum,
        descricao: lead.observacoes ?? "Venda registrada pelo vendedor",
        status: "REALIZADA",
      },
    });
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: "VENDA_REALIZADA", atualizadoEm: new Date() },
    });
    return NextResponse.json({ ok: true, proximoStatus: "VENDA_REALIZADA" });
  }

  if (acao === "balcao") {
    const valorNum = valor ? parseFloat(String(valor).replace(",", ".")) : null;
    await prisma.venda.create({
      data: {
        leadId: lead.id,
        vendedorId: vendedor.id,
        valor: valorNum,
        descricao: "Venda no balcão",
        status: "REALIZADA",
      },
    });
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: "VENDA_REALIZADA", atualizadoEm: new Date() },
    });
    return NextResponse.json({ ok: true, proximoStatus: "VENDA_REALIZADA" });
  }

  if (acao === "derrota") {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: "SEM_RESPOSTA", atualizadoEm: new Date() },
    });
    return NextResponse.json({ ok: true, proximoStatus: "SEM_RESPOSTA" });
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
}
