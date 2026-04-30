import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth";

export async function GET(req: Request) {
  const me = await getUsuarioLogado();
  const { searchParams } = new URL(req.url);
  const busca = searchParams.get("busca") ?? undefined;

  const empresaId = me?.perfil !== "CENTRAL" && me?.empresaId
    ? me.empresaId
    : (searchParams.get("empresaId") ?? undefined);

  const conversas = await prisma.conversa.findMany({
    where: {
      cliente: {
        ...(empresaId && { empresaId }),
        ...(busca && {
          OR: [
            { nome: { contains: busca, mode: "insensitive" } },
            { telefone: { contains: busca } },
          ],
        }),
      },
    },
    orderBy: { ultimaAtividade: "desc" },
    take: 100,
    select: {
      id: true,
      ultimaMensagem: true,
      ultimaAtividade: true,
      criadoEm: true,
      modoHumano: true,
      cliente: {
        select: {
          id: true,
          nome: true,
          telefone: true,
          empresa: { select: { id: true, nome: true, instanciaWhatsapp: true } },
          leads: {
            where: { status: { not: "PERDIDO" } },
            orderBy: { criadoEm: "desc" },
            take: 1,
            select: { id: true, status: true, vendedor: { select: { nome: true } } },
          },
        },
      },
      _count: { select: { mensagens: true } },
    },
  });

  return NextResponse.json(conversas);
}
