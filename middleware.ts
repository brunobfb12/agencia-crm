import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(part));
  } catch { return null; }
}

function isAcessoLiberado(payload: Record<string, unknown>): boolean {
  // Admin central nunca é bloqueado
  if (payload.perfil === "CENTRAL") return true;
  // Empresa isenta (plano grátis permanente)
  if (payload.isenta === true) return true;
  // Assinatura ativa
  if (payload.planStatus === "ATIVO") return true;
  // Trial dentro do prazo
  if (payload.planStatus === "TRIAL" && payload.trialFim) {
    return new Date(payload.trialFim as string) > new Date();
  }
  return false;
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.redirect(new URL("/login", request.url));

  const payload = parseJwtPayload(token);
  if (!payload) return NextResponse.redirect(new URL("/login", request.url));

  // Já está na página de planos — deixa passar para não criar loop
  if (request.nextUrl.pathname.startsWith("/planos")) return NextResponse.next();

  if (!isAcessoLiberado(payload)) {
    return NextResponse.redirect(new URL("/planos", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
