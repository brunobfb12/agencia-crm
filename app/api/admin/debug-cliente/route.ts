import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  const telefone = searchParams.get("telefone");

  if (secret !== "crm2026migra") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!telefone) {
    return NextResponse.json({ error: "telefone required" }, { status: 400 });
  }

  // Buscar cliente
  const cliente = await prisma.cliente.findFirst({
    where: { telefone: { contains: telefone } },
    include: {
      conversas: {
        include: { mensagens: { orderBy: { criadoEm: "asc" } } },
      },
      leads: true,
    },
  });

  if (!cliente) {
    return NextResponse.json({
      encontrado: false,
      mensagem: `Cliente com telefone contendo "${telefone}" não encontrado`,
    });
  }

  return NextResponse.json({
    encontrado: true,
    cliente: {
      id: cliente.id,
      nome: cliente.nome,
      telefone: cliente.telefone,
      criadoEm: cliente.criadoEm,
    },
    conversas: cliente.conversas.map(c => ({
      id: c.id,
      mensagens: c.mensagens.length,
      ultimaAtividade: c.ultimaAtividade,
      modoHumano: c.modoHumano,
      ultimaMensagem: c.ultimaMensagem,
      primeiraMsg: c.mensagens[0],
    })),
    leads: cliente.leads.map(l => ({
      id: l.id,
      status: l.status,
      atualizadoEm: l.atualizadoEm,
    })),
  });
}
