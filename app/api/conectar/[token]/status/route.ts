import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EVO_URL = process.env.EVOLUTION_API_URL || "http://201.76.43.149:8080";
const EVO_KEY = process.env.AUTHENTICATION_API_KEY ?? process.env.EVOLUTION_API_KEY ?? "";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // Validar que o vendedor existe e tem instância
  const vendedor = await prisma.vendedor.findUnique({
    where: { token },
    select: { id: true, instanciaVendedor: true },
  });

  if (!vendedor || !vendedor.instanciaVendedor) {
    return NextResponse.json(
      { error: "Instância não encontrada" },
      { status: 404 }
    );
  }

  // Buscar estado da conexão na Evolution API
  try {
    const res = await fetch(
      `${EVO_URL}/instance/connectionState/${vendedor.instanciaVendedor}`,
      {
        headers: { apikey: EVO_KEY },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { state: null, vendedorId: vendedor.id },
        { status: 200 }
      );
    }

    const data = await res.json();
    const state = data?.instance?.state ?? null;

    return NextResponse.json({ state, vendedorId: vendedor.id });
  } catch (err) {
    console.error("[Status Proxy] Erro:", err);
    return NextResponse.json(
      { state: null, vendedorId: vendedor.id },
      { status: 200 }
    );
  }
}
