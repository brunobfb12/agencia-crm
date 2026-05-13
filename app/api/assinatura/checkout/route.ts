import { NextResponse } from "next/server";
import { getUsuarioLogado } from "@/lib/auth";

const LINKS: Record<string, string | undefined> = {
  STARTER_MENSAL: process.env.HOTMART_CHECKOUT_STARTER_MENSAL,
  STARTER_ANUAL:  process.env.HOTMART_CHECKOUT_STARTER_ANUAL,
  PRO_MENSAL:     process.env.HOTMART_CHECKOUT_PRO_MENSAL,
  PRO_ANUAL:      process.env.HOTMART_CHECKOUT_PRO_ANUAL,
  AGENCY_MENSAL:  process.env.HOTMART_CHECKOUT_AGENCY_MENSAL,
  AGENCY_ANUAL:   process.env.HOTMART_CHECKOUT_AGENCY_ANUAL,
};

export async function GET(req: Request) {
  const me = await getUsuarioLogado();
  if (!me) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const plano = (searchParams.get("plano") ?? "STARTER_ANUAL").toUpperCase();

  const base = LINKS[plano];
  if (!base) {
    return NextResponse.json({ error: "Plano não configurado" }, { status: 503 });
  }

  const url = new URL(base);
  if (me.email) url.searchParams.set("email", me.email);
  url.searchParams.set("checkoutMode", "10");

  return NextResponse.json({ url: url.toString() });
}
