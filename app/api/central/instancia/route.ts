import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EVO_URL = "http://201.76.43.149:8080";
const EVO_KEY = process.env.EVOLUTION_API_KEY ?? "SuaChaveSecreta123";
const WEBHOOK_URL = "https://n8n-n8n.6jgzku.easypanel.host/webhook/whatsapp";

export async function POST(req: Request) {
  const { instanciaNome, empresaNome } = await req.json();

  if (!instanciaNome || !empresaNome) {
    return NextResponse.json({ ok: false, erro: "instanciaNome e empresaNome obrigatorios" }, { status: 400 });
  }

  const empresa = await prisma.empresa.upsert({
    where: { instanciaWhatsapp: instanciaNome },
    create: { nome: empresaNome, instanciaWhatsapp: instanciaNome },
    update: { nome: empresaNome },
  });

  let qrcode: string | null = null;
  const createRes = await fetch(`${EVO_URL}/instance/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: EVO_KEY },
    body: JSON.stringify({ instanceName: instanciaNome, integration: "WHATSAPP-BAILEYS", qrcode: true }),
  });

  await fetch(`${EVO_URL}/webhook/set/${instanciaNome}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: EVO_KEY },
    body: JSON.stringify({
      enabled: true,
      url: WEBHOOK_URL,
      events: ["MESSAGES_UPSERT"],
      webhook_by_events: false,
      webhook_base64: false,
    }),
  });

  if (createRes.ok) {
    const createData = await createRes.json();
    qrcode = createData?.qrcode?.base64 ?? null;
  }

  if (!qrcode) {
    const qrRes = await fetch(`${EVO_URL}/instance/connect/${instanciaNome}`, {
      headers: { apikey: EVO_KEY },
    });
    if (qrRes.ok) {
      const qrData = await qrRes.json();
      qrcode = qrData?.base64 ?? null;
    }
  }

  return NextResponse.json({ ok: true, empresa, qrcode, instancia: instanciaNome });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const instancia = searchParams.get("instancia");
  if (!instancia) return NextResponse.json({ ok: false }, { status: 400 });

  const res = await fetch(`${EVO_URL}/instance/connect/${instancia}`, {
    headers: { apikey: EVO_KEY },
  });
  const data = await res.json();
  return NextResponse.json({ qrcode: data?.base64 ?? null });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const instancia = searchParams.get("instancia");
  if (!instancia) return NextResponse.json({ ok: false }, { status: 400 });

  const res = await fetch(`${EVO_URL}/instance/delete/${instancia}`, {
    method: "DELETE",
    headers: { apikey: EVO_KEY },
  });

  return NextResponse.json({ ok: res.ok });
}
