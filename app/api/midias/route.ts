import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth";

const LIST_SELECT = {
  id: true, empresaId: true, etiqueta: true, url: true,
  mimeType: true, descricaoUso: true, tipo: true, ativo: true, criadoEm: true,
};

export async function GET(req: Request) {
  const me = await getUsuarioLogado();
  if (!me) return NextResponse.json([], { status: 401 });

  const { searchParams } = new URL(req.url);
  const empresaId = searchParams.get("empresaId");

  if (me.perfil === "CENTRAL") {
    if (!empresaId) return NextResponse.json({ error: "empresaId obrigatório" }, { status: 400 });
    const midias = await prisma.midia.findMany({
      where: { empresaId },
      select: LIST_SELECT,
      orderBy: { criadoEm: "desc" },
    });
    return NextResponse.json(midias);
  }

  if (!me.empresaId) return NextResponse.json([], { status: 403 });
  const midias = await prisma.midia.findMany({
    where: { empresaId: me.empresaId },
    select: LIST_SELECT,
    orderBy: { criadoEm: "desc" },
  });
  return NextResponse.json(midias);
}

export async function POST(req: Request) {
  const me = await getUsuarioLogado();
  if (!me) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { empresaId, etiqueta, url, descricaoUso, tipo } = body;

  const targetEmpresaId = me.perfil === "CENTRAL" ? empresaId : me.empresaId;
  if (!targetEmpresaId) return NextResponse.json({ error: "empresaId obrigatório" }, { status: 400 });
  if (!etiqueta || !descricaoUso) {
    return NextResponse.json({ error: "etiqueta e descricaoUso são obrigatórios" }, { status: 400 });
  }

  const midia = await prisma.midia.create({
    data: { empresaId: targetEmpresaId, etiqueta, url: url || null, descricaoUso, tipo: tipo || "imagem" },
    select: LIST_SELECT,
  });
  return NextResponse.json(midia, { status: 201 });
}
