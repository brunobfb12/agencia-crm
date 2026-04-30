import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth";

export async function GET() {
  const me = await getUsuarioLogado();
  if (me?.perfil !== "CENTRAL") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const usuarios = await prisma.usuario.findMany({
    where: { perfil: "EMPRESA" },
    select: { id: true, nome: true, email: true, ativo: true, empresaId: true, criadoEm: true,
      empresa: { select: { nome: true } } },
    orderBy: { criadoEm: "asc" },
  });
  return NextResponse.json(usuarios);
}

export async function POST(req: Request) {
  const me = await getUsuarioLogado();
  if (me?.perfil !== "CENTRAL") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { nome, email, senha, empresaId } = await req.json();
  if (!nome || !email || !senha || !empresaId) {
    return NextResponse.json({ error: "Campos obrigatórios: nome, email, senha, empresaId" }, { status: 400 });
  }

  const hash = await bcrypt.hash(senha, 12);
  try {
    const usuario = await prisma.usuario.create({
      data: { nome, email, senha: hash, perfil: "EMPRESA", empresaId },
      select: { id: true, nome: true, email: true, empresaId: true },
    });
    return NextResponse.json(usuario, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Erro ao criar usuário" }, { status: 500 });
  }
}
