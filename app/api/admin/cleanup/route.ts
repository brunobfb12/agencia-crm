import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/admin/cleanup  { "secret": "crm2026migra" }
// Removes: orphan clients (no leads), their conversations and messages
export async function POST(req: Request) {
  const { secret } = await req.json();
  if (secret !== process.env.MIGRATION_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  // Find clients with no leads at all
  const orphans = await prisma.cliente.findMany({
    where: { leads: { none: {} } },
    select: { id: true, nome: true, telefone: true },
  });

  const orphanIds = orphans.map((c) => c.id);

  // Delete messages inside their conversations
  const conversas = await prisma.conversa.findMany({
    where: { clienteId: { in: orphanIds } },
    select: { id: true },
  });
  const conversaIds = conversas.map((c) => c.id);

  const deletedMensagens = await prisma.mensagem.deleteMany({
    where: { conversaId: { in: conversaIds } },
  });
  const deletedConversas = await prisma.conversa.deleteMany({
    where: { id: { in: conversaIds } },
  });
  const deletedClientes = await prisma.cliente.deleteMany({
    where: { id: { in: orphanIds } },
  });

  return NextResponse.json({
    ok: true,
    removidos: {
      clientes: deletedClientes.count,
      conversas: deletedConversas.count,
      mensagens: deletedMensagens.count,
      detalhes: orphans.map((c) => `${c.nome ?? "?"} (${c.telefone})`),
    },
  });
}
