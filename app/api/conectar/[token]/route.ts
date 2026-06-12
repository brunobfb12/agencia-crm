import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const vendedor = await prisma.vendedor.findUnique({
    where: { token },
    select: {
      id: true,
      nome: true,
      instanciaVendedor: true,
      empresa: { select: { nome: true } },
    },
  });

  if (!vendedor) {
    return NextResponse.json({ error: "Vendedor não encontrado" }, { status: 404 });
  }

  if (!vendedor.instanciaVendedor) {
    return NextResponse.json(
      { error: "Instância não configurada. Contate o suporte." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    id: vendedor.id,
    nome: vendedor.nome,
    instanciaVendedor: vendedor.instanciaVendedor,
    empresaNome: vendedor.empresa.nome,
  });
}
