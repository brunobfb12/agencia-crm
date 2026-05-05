import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const API_SECRET = process.env.MIDIAS_API_SECRET || "crm2026midias";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("secret") !== API_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const midia = await prisma.midia.findUnique({
    where: { id },
    select: { id: true, base64: true, url: true, mimeType: true, tipo: true, etiqueta: true, ativo: true },
  });

  if (!midia) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  if (!midia.ativo) return NextResponse.json({ error: "Mídia inativa" }, { status: 403 });

  return NextResponse.json({
    id: midia.id,
    base64: midia.base64,
    url: midia.url,
    mimeType: midia.mimeType,
    tipo: midia.tipo,
    etiqueta: midia.etiqueta,
  });
}
