import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/campanhas/auto - called by N8N daily cron to create auto campaigns
// Body: { secret, regras: [{ tipo, diasInativo, mensagem, empresaId? }] }
export async function POST(req: NextRequest) {
  const body = await req.json() as {
    secret: string;
    regras: { tipo: string; diasInativo: number; mensagem: string; empresaId?: string }[];
  };

  if (body.secret !== "crm2026migra") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const criadas: string[] = [];

  for (const regra of body.regras) {
    const corte = new Date(Date.now() - regra.diasInativo * 86400000);

    const statusMap: Record<string, string[]> = {
      AUTO_SEM_RESPOSTA:   ["SEM_RESPOSTA"],
      AUTO_AQUECIMENTO:    ["AQUECIMENTO"],
      AUTO_POS_VENDA:      ["VENDA_REALIZADA"],
      AUTO_FOLLOW_UP:      ["FOLLOW_UP"],
    };

    const statuses = statusMap[regra.tipo];
    if (!statuses) continue;

    const whereEmpresa = regra.empresaId ? { empresaId: regra.empresaId } : {};

    const leads = await prisma.lead.findMany({
      where: {
        ...whereEmpresa,
        status: { in: statuses as never[] },
        atualizadoEm: { lte: corte },
        // Don't re-send to leads that already have a pending campaign item
        campanhaItens: { none: { status: "PENDENTE" } },
      },
      include: { cliente: { select: { telefone: true, nome: true } }, empresa: { select: { id: true } } },
      take: 100,
    });

    if (!leads.length) continue;

    // Group by empresa
    const porEmpresa: Record<string, typeof leads> = {};
    for (const l of leads) {
      const eid = l.empresa.id;
      if (!porEmpresa[eid]) porEmpresa[eid] = [];
      porEmpresa[eid].push(l);
    }

    for (const [empId, empLeads] of Object.entries(porEmpresa)) {
      const c = await prisma.campanha.create({
        data: {
          empresaId: empId,
          mensagem: regra.mensagem,
          tipo: regra.tipo,
          itens: {
            create: empLeads.map((l) => ({
              leadId: l.id,
              telefone: l.cliente.telefone,
              nomeCliente: l.cliente.nome,
            })),
          },
        },
      });
      criadas.push(c.id);
    }
  }

  return NextResponse.json({ ok: true, criadas: criadas.length });
}
