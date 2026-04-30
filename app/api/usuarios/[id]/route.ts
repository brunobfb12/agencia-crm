import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getUsuarioLogado();
  if (me?.perfil !== "CENTRAL") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { id } = await params;
  const { nome, email, senha, ativo } = await req.json();

  const data: Record<string, unknown> = {};
  if (nome) data.nome = nome;
  if (email) data.email = email;
  if (ativo !== undefined) data.ativo = ativo;
  if (senha) data.senha = await bcrypt.hash(senha, 12);

  const usuario = await prisma.usuario.update({
    where: { id },
    data,
    select: { id: true, nome: true, email: true, ativo: true },
  });
  return NextResponse.json(usuario);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getUsuarioLogado();
  if (me?.perfil !== "CENTRAL") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { id } = await params;
  await prisma.usuario.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
