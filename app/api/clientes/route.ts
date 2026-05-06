import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth";

export async function GET(req: Request) {
  const me = await getUsuarioLogado();
  const { searchParams } = new URL(req.url);
  const busca = searchParams.get("busca");
  const aniversarioHoje = searchParams.get("aniversarioHoje") === "true";

  const empresaId = me?.perfil !== "CENTRAL" && me?.empresaId
    ? me.empresaId
    : (searchParams.get("empresaId") ?? null);

  if (aniversarioHoje) {
    type AnivRow = { id: string; nome: string | null; telefone: string; empresaId: string; empresaNome: string; instanciaWhatsapp: string; vendedorTelefone: string | null; vendedorNome: string | null };
    let rows: AnivRow[];
    if (empresaId) {
      rows = await prisma.$queryRaw<AnivRow[]>`
        SELECT DISTINCT ON (c.id) c.id, c.nome, c.telefone, c."empresaId", e.nome as "empresaNome", e."instanciaWhatsapp",
               v.telefone as "vendedorTelefone", v.nome as "vendedorNome"
        FROM "Cliente" c
        JOIN "Empresa" e ON e.id = c."empresaId"
        LEFT JOIN "Lead" l ON l."clienteId" = c.id AND l."vendedorId" IS NOT NULL
        LEFT JOIN "Vendedor" v ON v.id = l."vendedorId" AND v.ativo = true
        WHERE c."dataNascimento" IS NOT NULL
          AND EXTRACT(MONTH FROM c."dataNascimento") = EXTRACT(MONTH FROM NOW())
          AND EXTRACT(DAY FROM c."dataNascimento") = EXTRACT(DAY FROM NOW())
          AND c."empresaId" = ${empresaId}
        ORDER BY c.id, l."atualizadoEm" DESC
      `;
    } else {
      rows = await prisma.$queryRaw<AnivRow[]>`
        SELECT DISTINCT ON (c.id) c.id, c.nome, c.telefone, c."empresaId", e.nome as "empresaNome", e."instanciaWhatsapp",
               v.telefone as "vendedorTelefone", v.nome as "vendedorNome"
        FROM "Cliente" c
        JOIN "Empresa" e ON e.id = c."empresaId"
        LEFT JOIN "Lead" l ON l."clienteId" = c.id AND l."vendedorId" IS NOT NULL
        LEFT JOIN "Vendedor" v ON v.id = l."vendedorId" AND v.ativo = true
        WHERE c."dataNascimento" IS NOT NULL
          AND EXTRACT(MONTH FROM c."dataNascimento") = EXTRACT(MONTH FROM NOW())
          AND EXTRACT(DAY FROM c."dataNascimento") = EXTRACT(DAY FROM NOW())
        ORDER BY c.id, l."atualizadoEm" DESC
      `;
    }
    return NextResponse.json(rows);
  }

  const clientes = await prisma.cliente.findMany({
    where: {
      ...(empresaId && { empresaId }),
      ...(busca && {
        OR: [
          { nome: { contains: busca, mode: "insensitive" } },
          { telefone: { contains: busca } },
        ],
      }),
    },
    orderBy: { criadoEm: "desc" },
    include: {
      leads: { orderBy: { atualizadoEm: "desc" }, take: 1 },
      empresa: { select: { nome: true } },
    },
  });
  return NextResponse.json(clientes);
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.telefone || !body.empresaId) {
    return NextResponse.json({ error: "telefone e empresaId são obrigatórios" }, { status: 400 });
  }
  const extra = {
    ...(body.email    !== undefined && body.email    !== "" && { email: body.email }),
    ...(body.dataNascimento && { dataNascimento: new Date(body.dataNascimento) }),
  };
  const cliente = await prisma.cliente.upsert({
    where: { telefone_empresaId: { telefone: body.telefone, empresaId: body.empresaId } },
    update: { nome: body.nome, tags: body.tags ?? [], ...extra },
    create: { nome: body.nome, telefone: body.telefone, empresaId: body.empresaId, tags: body.tags ?? [], ...extra },
  });

  if (body.vendedorId) {
    const leadExiste = await prisma.lead.findFirst({
      where: { clienteId: cliente.id, empresaId: body.empresaId, status: { notIn: ["PERDIDO", "SEM_INTERESSE"] } },
    });
    if (leadExiste) {
      await prisma.lead.update({ where: { id: leadExiste.id }, data: { vendedorId: body.vendedorId } });
    } else {
      await prisma.lead.create({
        data: { clienteId: cliente.id, empresaId: body.empresaId, vendedorId: body.vendedorId },
      });
    }
  }

  return NextResponse.json(cliente, { status: 201 });
}
