import { NextResponse } from "next/server";
import { getUsuarioLogado } from "@/lib/auth";

export async function GET() {
  const me = await getUsuarioLogado();
  if (!me) return NextResponse.json(null, { status: 401 });
  return NextResponse.json({ perfil: me.perfil, empresaId: me.empresaId, nome: me.nome });
}
