import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getUsuarioLogado();
  if (!me) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  const conversa = await prisma.conversa.findUnique({
    where: { id },
    include: {
      mensagens: {
        orderBy: { criadoEm: "asc" },
        select: { id: true, conteudo: true, direcao: true, criadoEm: true },
      },
      cliente: {
        select: {
          id: true,
          nome: true,
          telefone: true,
          email: true,
          dataNascimento: true,
          empresa: { select: { id: true, nome: true, instanciaWhatsapp: true } },
          leads: {
            where: { status: { not: "PERDIDO" } },
            orderBy: { criadoEm: "desc" },
            take: 1,
            select: {
              id: true,
              status: true,
              score: true,
              observacoes: true,
              vendedor: { select: { id: true, nome: true, telefone: true } },
            },
          },
        },
      },
    },
  });

  if (!conversa) return NextResponse.json({ erro: "não encontrada" }, { status: 404 });

  if (me.perfil !== "CENTRAL" && me.empresaId && conversa.cliente.empresa.id !== me.empresaId) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  return NextResponse.json(conversa);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getUsuarioLogado();
  if (!me) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  if (me.perfil !== "CENTRAL" && me.empresaId) {
    const conversa = await prisma.conversa.findUnique({
      where: { id },
      select: { cliente: { select: { empresaId: true } } },
    });
    if (!conversa || conversa.cliente.empresaId !== me.empresaId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }
  }

  const { modoHumano } = await req.json();
  const conversa = await prisma.conversa.update({
    where: { id },
    data: { modoHumano },
  });
  return NextResponse.json({ ok: true, modoHumano: conversa.modoHumano });
}
