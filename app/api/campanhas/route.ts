import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth";

// GET /api/campanhas - list campaigns with progress
export async function GET(req: NextRequest) {
  const usuario = await getUsuarioLogado();
  if (!usuario) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const empresaId = searchParams.get("empresaId");

  const where: Record<string, unknown> = {};
  if (usuario.perfil === "EMPRESA" && usuario.empresaId) {
    where.empresaId = usuario.empresaId;
  } else if (empresaId) {
    where.empresaId = empresaId;
  }

  const campanhas = await prisma.campanha.findMany({
    where,
    orderBy: { criadoEm: "desc" },
    take: 50,
    include: {
      empresa: { select: { nome: true } },
      _count: { select: { itens: true } },
      itens: {
        select: { status: true },
      },
    },
  });

  type CampanhaRow = (typeof campanhas)[number];
  const result = campanhas.map((c: CampanhaRow) => ({
    id: c.id,
    empresaId: c.empresaId,
    nomeEmpresa: c.empresa.nome,
    mensagem: c.mensagem,
    tipo: c.tipo,
    status: c.status,
    criadoEm: c.criadoEm,
    total: c._count.itens,
    enviados: c.itens.filter((i: { status: string }) => i.status === "ENVIADO").length,
    pendentes: c.itens.filter((i: { status: string }) => i.status === "PENDENTE").length,
    erros: c.itens.filter((i: { status: string }) => i.status === "ERRO").length,
  }));

  return NextResponse.json(result);
}

// POST /api/campanhas - create manual campaign
export async function POST(req: NextRequest) {
  const usuario = await getUsuarioLogado();
  if (!usuario) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { empresaId, mensagem, leadIds } = body as { empresaId: string; mensagem: string; leadIds: string[] };

  if (!empresaId || !mensagem || !leadIds?.length) {
    return NextResponse.json({ error: "empresaId, mensagem e leadIds são obrigatórios" }, { status: 400 });
  }

  if (usuario.perfil === "EMPRESA" && usuario.empresaId !== empresaId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  // Fetch leads with client phone
  const leads = await prisma.lead.findMany({
    where: { id: { in: leadIds }, empresaId },
    include: { cliente: { select: { telefone: true, nome: true } } },
  });

  if (!leads.length) {
    return NextResponse.json({ error: "Nenhum lead encontrado" }, { status: 400 });
  }

  const campanha = await prisma.campanha.create({
    data: {
      empresaId,
      mensagem,
      tipo: "MANUAL",
      itens: {
        create: leads.map((l: (typeof leads)[number]) => ({
          leadId: l.id,
          telefone: l.cliente.telefone,
          nomeCliente: l.cliente.nome,
        })),
      },
    },
    include: { _count: { select: { itens: true } } },
  });

  return NextResponse.json({ ok: true, campanhaId: campanha.id, total: campanha._count.itens });
}
