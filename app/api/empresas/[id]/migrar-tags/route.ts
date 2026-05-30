import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/empresas/[id]/migrar-tags
// Body: { de: "TagAntiga", para: "TagNova" | null }
// para=null → remove a tag dos clientes
// para="X"  → renomeia para X
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { de, para } = await req.json();
  if (!de) return NextResponse.json({ error: "campo 'de' obrigatorio" }, { status: 400 });

  const clientes = await prisma.cliente.findMany({
    where: { empresaId: id, tags: { has: de } },
    select: { id: true, tags: true },
  });

  await Promise.all(
    clientes.map((c) => {
      const novasTags = c.tags.filter((t) => t !== de);
      if (para) novasTags.push(para);
      return prisma.cliente.update({ where: { id: c.id }, data: { tags: novasTags } });
    })
  );

  return NextResponse.json({ migrados: clientes.length });
}
