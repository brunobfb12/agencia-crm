import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const vendedor = await (prisma as any).vendedor.update({
    where: { id },
    data: {
      ...(body.instanciaConectadaEm !== undefined && {
        instanciaConectadaEm: body.instanciaConectadaEm ? new Date(body.instanciaConectadaEm) : null,
      }),
    },
  });

  return NextResponse.json(vendedor);
}
