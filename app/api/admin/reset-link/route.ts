import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  const telefone = searchParams.get("telefone");

  if (secret !== "crm2026migra") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!telefone) {
    return NextResponse.json({ error: "telefone required" }, { status: 400 });
  }

  const vendedor = await prisma.vendedor.findFirst({
    where: { telefone: { contains: telefone } },
  });

  if (!vendedor) {
    return NextResponse.json({ error: "vendedor nao encontrado" }, { status: 404 });
  }

  const updated = await prisma.vendedor.update({
    where: { id: vendedor.id },
    data: { ultimoLinkPressaoEm: null },
  });

  return NextResponse.json({
    success: true,
    vendedor: { id: updated.id, nome: updated.nome, telefone: updated.telefone },
    resetado: true,
  });
}
