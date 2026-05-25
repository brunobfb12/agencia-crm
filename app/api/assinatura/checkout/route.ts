import { NextResponse } from "next/server";
import { getUsuarioLogado } from "@/lib/auth";

const LINKS: Record<string, string> = {
  STARTER_MENSAL: "https://pay.hotmart.com/X105970507I?off=gl10cife",
  STARTER_ANUAL:  "https://pay.hotmart.com/X105970507I?off=4vylb80p",
  PRO_MENSAL:     "https://pay.hotmart.com/D105975567P?off=aeumfwka",
  PRO_ANUAL:      "https://pay.hotmart.com/D105975567P?off=7vl7g284",
  AGENCY_MENSAL:  "https://pay.hotmart.com/M105975917J",
  AGENCY_ANUAL:   "https://pay.hotmart.com/M105975917J?off=i6ul1rjy",
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
