import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const HOTTOK = process.env.HOTMART_HOTTOK;

// Mapeamento de ucode do produto → PlanoTipo
const UCODE_PLANO: Record<string, string> = {
  X105970507I: "STARTER",
  D105975567P: "PRO",
  M105975917J: "AGENCY",
};

function mapPlano(ucode: string, productName: string): string {
  if (UCODE_PLANO[ucode]) return UCODE_PLANO[ucode];
  const n = productName.toLowerCase();
  if (n.includes("agency") || n.includes("agência")) return "AGENCY";
  if (n.includes("pro")) return "PRO";
  return "STARTER";
}

async function findEmpresaId(srcParam: string | null, buyerEmail: string): Promise<string | null> {
  // Prioridade 1: src passado no checkout (?src=empresaId)
  if (srcParam) {
    const empresa = await prisma.empresa.findUnique({ where: { id: srcParam }, select: { id: true } });
    if (empresa) return empresa.id;
  }
  // Prioridade 2: email do comprador → usuário → empresa
  if (buyerEmail) {
    const usuario = await prisma.usuario.findUnique({
      where: { email: buyerEmail },
      select: { empresaId: true },
    });
    if (usuario?.empresaId) return usuario.empresaId;
  }
  return null;
}

export async function POST(req: Request) {
  // Valida hottok (aceita header ou query param)
  const { searchParams } = new URL(req.url);
  const hottokQuery  = searchParams.get("hottok");
  const hottokHeader = req.headers.get("x-hotmart-hottok");
  if (HOTTOK && hottokQuery !== HOTTOK && hottokHeader !== HOTTOK) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const event: string       = body?.event ?? "";
  const data                = body?.data ?? {};
  const buyerEmail: string  = data?.buyer?.email ?? "";
  const ucode: string       = data?.product?.ucode ?? "";
  const productName: string = data?.product?.name ?? "";
  const srcParam: string    = data?.purchase?.tracking?.source ?? "";
  const assinaturaId: string =
    data?.purchase?.subscription?.subscriber?.code ??
    data?.purchase?.transaction ?? "";

  const empresaId = await findEmpresaId(srcParam || null, buyerEmail);

  if (!empresaId) {
    console.warn(`[hotmart] empresa não encontrada — evento=${event} email=${buyerEmail} src=${srcParam}`);
    return NextResponse.json({ ok: true, aviso: "empresa não encontrada" });
  }

  // Pagamento aprovado → ativa
  if (event === "PURCHASE_APPROVED" || event === "PURCHASE_COMPLETE") {
    const plano = mapPlano(ucode, productName);
    await (prisma.empresa as any).update({
      where: { id: empresaId },
      data: {
        planStatus: "ATIVO",
        plano,
        isenta: false,
        assinaturaId: assinaturaId || null,
        trialFim: null,
      },
    });
    console.log(`[hotmart] ATIVO empresa=${empresaId} plano=${plano}`);
    return NextResponse.json({ ok: true, acao: "ativado", plano, empresaId });
  }

  // Cancelamento → cancela
  if (event === "PURCHASE_CANCELED" || event === "SUBSCRIPTION_CANCELLATION") {
    await (prisma.empresa as any).update({
      where: { id: empresaId },
      data: { planStatus: "CANCELADO" },
    });
    console.log(`[hotmart] CANCELADO empresa=${empresaId}`);
    return NextResponse.json({ ok: true, acao: "cancelado", empresaId });
  }

  // Reembolso / chargeback → bloqueia
  if (event === "PURCHASE_REFUNDED" || event === "PURCHASE_CHARGEBACK" || event === "PURCHASE_DELAYED") {
    await (prisma.empresa as any).update({
      where: { id: empresaId },
      data: { planStatus: "BLOQUEADO" },
    });
    console.log(`[hotmart] BLOQUEADO empresa=${empresaId}`);
    return NextResponse.json({ ok: true, acao: "bloqueado", empresaId });
  }

  // Evento não mapeado — retorna 200 para Hotmart não retentar
  console.log(`[hotmart] evento ignorado: ${event}`);
  return NextResponse.json({ ok: true, aviso: `evento ${event} ignorado` });
}
