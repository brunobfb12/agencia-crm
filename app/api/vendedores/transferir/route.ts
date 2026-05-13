import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth";

export async function POST(req: Request) {
  const me = await getUsuarioLogado();
  if (!me) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { deVendedorId, paraVendedorId } = await req.json();
  if (!deVendedorId || !paraVendedorId) {
    return NextResponse.json({ error: "deVendedorId e paraVendedorId são obrigatórios" }, { status: 400 });
  }
  if (deVendedorId === paraVendedorId) {
    return NextResponse.json({ error: "Origem e destino não podem ser o mesmo vendedor" }, { status: 400 });
  }

  const [origem, destino] = await Promise.all([
    prisma.vendedor.findUnique({ where: { id: deVendedorId } }),
    prisma.vendedor.findUnique({ where: { id: paraVendedorId } }),
  ]);

  if (!origem) return NextResponse.json({ error: "Vendedor de origem não encontrado" }, { status: 404 });
  if (!destino) return NextResponse.json({ error: "Vendedor de destino não encontrado" }, { status: 404 });
  if (origem.empresaId !== destino.empresaId) {
    return NextResponse.json({ error: "Vendedores precisam ser da mesma empresa" }, { status: 400 });
  }

  const resultado = await prisma.lead.updateMany({
    where: { vendedorId: deVendedorId },
    data: { vendedorId: paraVendedorId },
  });

  return NextResponse.json({
    ok: true,
    leadsTransferidos: resultado.count,
    de: origem.nome,
    para: destino.nome,
  });
}
