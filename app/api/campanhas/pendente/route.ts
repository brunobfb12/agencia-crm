import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/campanhas/pendente?secret=crm2026migra&instancia=ph_intima
// Called by N8N every minute to get next item to send
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  const instancia = searchParams.get("instancia");

  if (secret !== "crm2026migra") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const where: Record<string, unknown> = { status: "PENDENTE" };

  if (instancia) {
    where.campanha = { empresa: { instanciaWhatsapp: instancia }, status: "ATIVA" };
  } else {
    where.campanha = { status: "ATIVA" };
  }

  const item = await prisma.campanhaItem.findFirst({
    where,
    orderBy: { campanha: { criadoEm: "asc" } },
    include: {
      campanha: {
        include: {
          empresa: { select: { instanciaWhatsapp: true, nome: true } },
        },
      },
    },
  });

  if (!item) return NextResponse.json({ pendente: false });

  return NextResponse.json({
    pendente: true,
    itemId: item.id,
    telefone: item.telefone,
    nomeCliente: item.nomeCliente,
    mensagem: item.campanha.mensagem,
    instancia: item.campanha.empresa.instanciaWhatsapp,
    campanhaId: item.campanhaId,
    tipo: item.campanha.tipo,
  });
}
