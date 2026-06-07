import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth";

const SECRET = "crm2026migra";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { searchParams } = new URL(req.url);
  const isCron = searchParams.get("secret") === SECRET;
  const me = isCron ? null : await getUsuarioLogado();
  if (!isCron && !me) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { flag } = body;

  if (!flag || typeof flag !== "string" || !flag.match(/^\[[\w]+\]$/)) {
    return NextResponse.json(
      { error: "Flag inválida. Formato: [FLAG]" },
      { status: 400 }
    );
  }

  const leadAtual = await prisma.lead.findUnique({
    where: { id },
    select: { id: true, empresaId: true, observacoes: true },
  });

  if (!leadAtual) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  }

  if (
    !isCron &&
    me?.perfil !== "CENTRAL" &&
    me?.empresaId &&
    leadAtual.empresaId !== me.empresaId
  ) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  // Verificar se flag já existe
  if (leadAtual.observacoes?.includes(flag)) {
    return NextResponse.json({
      ok: true,
      message: "Flag já existe",
      lead: leadAtual,
    });
  }

  // Adicionar flag
  const novasObservacoes = (leadAtual.observacoes ?? "") + "\n" + flag;
  const lead = await prisma.lead.update({
    where: { id },
    data: { observacoes: novasObservacoes.trim() },
    select: { id: true, observacoes: true, status: true },
  });

  return NextResponse.json({
    ok: true,
    message: `Flag ${flag} adicionada`,
    lead,
  });
}
