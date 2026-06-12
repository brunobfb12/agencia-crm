import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth";

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "http://201.76.43.149:8080";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

export async function GET(req: Request) {
  const me = await getUsuarioLogado();
  const { searchParams } = new URL(req.url);

  const empresaId = me?.perfil !== "CENTRAL" && me?.empresaId
    ? me.empresaId
    : (searchParams.get("empresaId") ?? undefined);

  const todos = searchParams.get("todos") === "true";
  const vendedores = await prisma.vendedor.findMany({
    where: {
      ...(todos ? {} : { ativo: true }),
      ...(empresaId && { empresaId }),
    },
    orderBy: { ordemChamada: "asc" },
    include: {
      empresa: { select: { nome: true } },
      _count: { select: { vendas: true } },
    },
  });
  return NextResponse.json(vendedores);
}

export async function POST(req: Request) {
  const body = await req.json();

  const ultimaOrdem = await prisma.vendedor.findFirst({
    where: { empresaId: body.empresaId },
    orderBy: { ordemChamada: "desc" },
    select: { ordemChamada: true },
  });

  const empresa = await prisma.empresa.findUnique({
    where: { id: body.empresaId },
    select: { nome: true },
  });
  if (!empresa) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });

  const vendedor = await (prisma as any).vendedor.create({
    data: {
      nome: body.nome,
      telefone: body.telefone,
      empresaId: body.empresaId,
      ordemChamada: (ultimaOrdem?.ordemChamada ?? 0) + 1,
      ...(body.cargo && { cargo: body.cargo }),
      token: crypto.randomUUID(),
    },
  });

  // Criar instância na Evolution API para o vendedor
  let instanciaVendedor: string | null = null;
  if (EVOLUTION_API_KEY) {
    try {
      const nomeEmpresaSlug = empresa.nome
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

      const instanceName = `vendedor_${nomeEmpresaSlug}_${vendedor.id}`;

      const createRes = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          instanceName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
        }),
      });

      if (createRes.ok) {
        const createData = await createRes.json();
        instanciaVendedor = createData.instance?.name || instanceName;

        // Configurar webhook da instância
        await fetch(`${EVOLUTION_API_URL}/webhook/set/${instanciaVendedor}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: EVOLUTION_API_KEY,
          },
          body: JSON.stringify({
            url: "https://n8n-n8n.6jgzku.easypanel.host/webhook/rastreamento-vendedor",
            events: ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "MESSAGES_DELETE"],
          }),
        });

        // Atualizar vendedor com a instância
        await (prisma as any).vendedor.update({
          where: { id: vendedor.id },
          data: { instanciaVendedor },
        });
      } else {
        console.error(`[Evolution API] Erro ao criar instância: ${createRes.statusText}`);
      }
    } catch (err) {
      console.error("[Evolution API] Erro ao criar instância do vendedor:", err);
    }
  }

  // Retornar vendedor atualizado
  const vendedorAtualizado = await (prisma as any).vendedor.findUnique({
    where: { id: vendedor.id },
    include: {
      empresa: { select: { nome: true } },
    },
  });

  return NextResponse.json(vendedorAtualizado, { status: 201 });
}
