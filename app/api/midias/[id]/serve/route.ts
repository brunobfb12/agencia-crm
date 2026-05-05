import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const API_SECRET = process.env.MIDIAS_API_SECRET || "crm2026midias";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("secret") !== API_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const midia = await prisma.midia.findUnique({
    where: { id },
    select: { base64: true, mimeType: true, ativo: true, url: true },
  });

  if (!midia || !midia.ativo) return new NextResponse("Not found", { status: 404 });

  if (midia.base64) {
    const buf = Buffer.from(midia.base64, "base64");
    return new NextResponse(buf, {
      headers: {
        "Content-Type": midia.mimeType || "application/octet-stream",
        "Content-Length": String(buf.length),
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  if (midia.url) {
    return NextResponse.redirect(midia.url);
  }

  return new NextResponse("No media data", { status: 404 });
}
