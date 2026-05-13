import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, senha } = await req.json();

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || !usuario.ativo) {
    return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 });
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha);
  if (!senhaValida) {
    return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 });
  }

  let planStatus: string | null = null;
  let trialFim: string | null = null;
  if (usuario.empresaId) {
    const empresa = await prisma.empresa.findUnique({
      where: { id: usuario.empresaId },
      select: { planStatus: true, trialFim: true },
    });
    planStatus = empresa?.planStatus ?? null;
    trialFim = empresa?.trialFim?.toISOString() ?? null;
  }

  const token = signToken({
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
    empresaId: usuario.empresaId,
    planStatus,
    trialFim,
  });

  const response = NextResponse.json({ ok: true, perfil: usuario.perfil });
  response.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return response;
}
