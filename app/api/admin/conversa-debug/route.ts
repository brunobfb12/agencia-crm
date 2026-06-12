import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tel = searchParams.get("tel");
  const token = searchParams.get("token");
  if (token !== "debug2026" || !tel) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const clientes = await prisma.cliente.findMany({
    where: { telefone: { contains: tel.replace(/\D/g, "") } },
    select: { id: true, nome: true, telefone: true },
  });

  if (!clientes.length) return NextResponse.json({ error: "cliente nao encontrado" }, { status: 404 });

  const resultado = await Promise.all(clientes.map(async (c) => {
    const leads = await prisma.lead.findMany({
      where: { clienteId: c.id },
      orderBy: { criadoEm: "desc" },
      select: { id: true, status: true, observacoes: true, criadoEm: true, atualizadoEm: true, empresaId: true },
    });

    const leadsComMensagens = await Promise.all(leads.map(async (l) => {
      const conversas = await prisma.conversa.findMany({
        where: { leadId: l.id },
        select: { id: true },
      });
      const mensagens = await prisma.mensagem.findMany({
        where: { conversaId: { in: conversas.map(cv => cv.id) } },
        orderBy: { criadoEm: "asc" },
        select: { direcao: true, conteudo: true, criadoEm: true },
      });
      return { ...l, mensagens };
    }));

    return { cliente: c, leads: leadsComMensagens };
  }));

  return NextResponse.json(resultado);
}
