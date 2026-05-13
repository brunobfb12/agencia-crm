import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(part));
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = parseJwtPayload(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // CENTRAL ignora verificação de plano
  if (payload.perfil === "CENTRAL") {
    return NextResponse.next();
  }

  const planStatus = payload.planStatus as string | null;
  const trialFim = payload.trialFim as string | null;

  if (planStatus === "TRIAL") {
    if (!trialFim || new Date(trialFim) < new Date()) {
      return NextResponse.redirect(new URL("/assinar", request.url));
    }
  } else if (planStatus === "BLOQUEADO" || planStatus === "CANCELADO") {
    return NextResponse.redirect(new URL("/assinar", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
