import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const count = await prisma.usuario.count();
  if (count > 0) {
    return NextResponse.json({ error: "Setup já realizado" }, { status: 403 });
  }

  const { nome, email, senha } = await req.json();
  const hash = await bcrypt.hash(senha, 12);

  const usuario = await prisma.usuario.create({
    data: { nome, email, senha: hash, perfil: "CENTRAL" },
  });

  return NextResponse.json({ ok: true, id: usuario.id }, { status: 201 });
}
