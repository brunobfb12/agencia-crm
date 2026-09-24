import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const conversaId = searchParams.get("conversaId");
  const token = searchParams.get("token");

  if (token !== "debug2026") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (!conversaId) {
    return NextResponse.json({ error: "conversaId required" }, { status: 400 });
  }

  const ultimas = await prisma.mensagem.findMany({
    where: { conversaId },
    orderBy: { criadoEm: "desc" },
    take: 30,
    select: { direcao: true, conteudo: true },
  });
  const historico = ultimas.reverse();

  return NextResponse.json({ historico });
}
