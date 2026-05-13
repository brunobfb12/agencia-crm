import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const HOTTOK = process.env.HOTMART_HOTTOK;

function mapPlano(productName: string): string {
  const n = productName.toLowerCase();
  if (n.includes("agency") || n.includes("agência")) return "AGENCY";
  if (n.includes("pro")) return "PRO";
  return "STARTER";
}

export async function POST(req: Request) {
  // Verifica hottok
  const { searchParams } = new URL(req.url);
  const hottok = searchParams.get("hottok");
  if (HOTTOK && hottok !== HOTTOK) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const event: string = body?.event ?? "";
  const email: string = body?.data?.buyer?.email ?? "";
  const productName: string = body?.data?.product?.name ?? "";
  const subscriberCode: string = body?.data?.subscription?.subscriber?.code ?? body?.data?.purchase?.transaction ?? "";

  if (!email) {
    return NextResponse.json({ ok: false, erro: "email não encontrado no payload" }, { status: 400 });
  }

  // Busca usuário pelo email → empresa
  const usuario = await prisma.usuario.findUnique({
    where: { email },
    select: { empresaId: true },
  });

  if (!usuario?.empresaId) {
    // Comprador ainda não tem conta no CRM — ignora silenciosamente
    return NextResponse.json({ ok: true, aviso: "usuário não encontrado" });
  }

  const empresaId = usuario.empresaId;

  if (event === "PURCHASE_APPROVED") {
    const plano = mapPlano(productName);
    await prisma.empresa.update({
      where: { id: empresaId },
      data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        planStatus: "ATIVO" as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        plano: plano as any,
        assinaturaId: subscriberCode || null,
        trialFim: null,
      },
    });
    return NextResponse.json({ ok: true, acao: "ativado", plano, empresaId });
  }

  if (event === "PURCHASE_CANCELED" || event === "SUBSCRIPTION_CANCELLATION") {
    await prisma.empresa.update({
      where: { id: empresaId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { planStatus: "CANCELADO" as any },
    });
    return NextResponse.json({ ok: true, acao: "cancelado", empresaId });
  }

  if (event === "PURCHASE_REFUNDED" || event === "PURCHASE_CHARGEBACK" || event === "PURCHASE_DELAYED") {
    await prisma.empresa.update({
      where: { id: empresaId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { planStatus: "BLOQUEADO" as any },
    });
    return NextResponse.json({ ok: true, acao: "bloqueado", empresaId });
  }

  // Evento não mapeado — ignora
  return NextResponse.json({ ok: true, aviso: `evento ${event} ignorado` });
}
