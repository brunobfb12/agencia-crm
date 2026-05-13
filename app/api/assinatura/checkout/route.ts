import { NextResponse } from "next/server";
import { getUsuarioLogado } from "@/lib/auth";

const LINKS: Record<string, string | undefined> = {
  STARTER: process.env.HOTMART_CHECKOUT_STARTER,
  PRO:     process.env.HOTMART_CHECKOUT_PRO,
  AGENCY:  process.env.HOTMART_CHECKOUT_AGENCY,
};

export async function GET(req: Request) {
  const me = await getUsuarioLogado();
  if (!me) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const plano = (searchParams.get("plano") ?? "STARTER").toUpperCase();

  const base = LINKS[plano];
  if (!base) {
    return NextResponse.json({ error: "Plano não configurado" }, { status: 503 });
  }

  const url = new URL(base);
  if (me.email) url.searchParams.set("email", me.email);
  url.searchParams.set("checkoutMode", "10");

  return NextResponse.json({ url: url.toString() });
}
