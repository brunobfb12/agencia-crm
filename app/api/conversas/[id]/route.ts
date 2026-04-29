import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
  return NextResponse.json(conversa);
}
