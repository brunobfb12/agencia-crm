import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/campanhas/item/[id] - mark as sent or error
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { secret, status, erro } = await req.json() as { secret: string; status: string; erro?: string };

  if (secret !== "crm2026migra") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const item = await prisma.campanhaItem.update({
    where: { id },
    data: {
      status,
      enviadoEm: status === "ENVIADO" ? new Date() : undefined,
      erro: erro ?? null,
    },
  });

  // Check if all items in campaign are done
  const pendentes = await prisma.campanhaItem.count({
    where: { campanhaId: item.campanhaId, status: "PENDENTE" },
  });

  if (pendentes === 0) {
    await prisma.campanha.update({
      where: { id: item.campanhaId },
      data: { status: "CONCLUIDA" },
    });
  }

  return NextResponse.json({ ok: true });
}
