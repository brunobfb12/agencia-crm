import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth";

const SECRET = "crm2026migra";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://ocrmfacil.com.br";

function dispararAprendizado(leadId: string, tipo: "vitoria" | "derrota") {
  fetch(`${BASE_URL}/api/webhook/${tipo}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ leadId, secret: SECRET }),
  }).catch(() => {});
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { searchParams } = new URL(req.url);
  const isCron = searchParams.get("secret") === SECRET;
  const me = isCron ? null : await getUsuarioLogado();
  if (!isCron && !me) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  const leadAtual = await prisma.lead.findUnique({ where: { id }, select: { empresaId: true, status: true } });
  if (!leadAtual) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  if (!isCron && me?.perfil !== "CENTRAL" && me?.empresaId && leadAtual.empresaId !== me.empresaId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const lead = await prisma.lead.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.score !== undefined && { score: body.score }),
      ...(body.observacoes !== undefined && { observacoes: body.observacoes }),
      ...(body.vendedorId !== undefined && { vendedorId: body.vendedorId }),
      ...(body.dataRecontato !== undefined && {
        dataRecontato: body.dataRecontato ? new Date(body.dataRecontato) : null,
      }),
    },
    include: { cliente: true },
  });

  // Dispara análise de aprendizado e redireciona status quando necessário
  if (body.status && body.status !== leadAtual.status) {
    if (body.status === "VENDA_REALIZADA") {
      dispararAprendizado(id, "vitoria");
    } else if (body.status === "SEM_INTERESSE") {
      dispararAprendizado(id, "derrota");
    } else if (body.status === "PERDIDO") {
      // PERDIDO = venda não fechou nesta rodada, não é saída permanente
      // Dispara aprendizado e move automaticamente para FOLLOW_UP
      dispararAprendizado(id, "derrota");
      const leadFollowUp = await prisma.lead.update({
        where: { id },
        data: { status: "FOLLOW_UP" },
        include: { cliente: true },
      });
      return NextResponse.json(leadFollowUp);
    }
  }

  return NextResponse.json(lead);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getUsuarioLogado();
  if (!me) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  const lead = await prisma.lead.findUnique({ where: { id }, select: { clienteId: true, empresaId: true } });
  if (!lead) return NextResponse.json({ ok: false }, { status: 404 });

  if (me.perfil !== "CENTRAL" && me.empresaId && lead.empresaId !== me.empresaId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const conversas = await prisma.conversa.findMany({
    where: { clienteId: lead.clienteId },
    select: { id: true },
  });
  const conversaIds = conversas.map((c: { id: string }) => c.id);

  await prisma.mensagem.deleteMany({ where: { conversaId: { in: conversaIds } } });
  await prisma.conversa.deleteMany({ where: { id: { in: conversaIds } } });
  await prisma.lead.delete({ where: { id } });

  const outrosLeads = await prisma.lead.count({ where: { clienteId: lead.clienteId } });
  if (outrosLeads === 0) {
    await prisma.cliente.delete({ where: { id: lead.clienteId } });
  }

  return NextResponse.json({ ok: true });
}
