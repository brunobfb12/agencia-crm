import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EVO_URL = "http://201.76.43.149:8081";
const EVO_KEY = process.env.EVOLUTION_API_KEY ?? "SuaChaveSecreta123";
const WEBHOOK_URL = "https://n8n-n8n.6jgzku.easypanel.host/webhook/whatsapp";

export async function POST(req: Request) {
  const { instanciaNome, empresaNome } = await req.json();

  if (!instanciaNome || !empresaNome) {
    return NextResponse.json({ ok: false, erro: "instanciaNome e empresaNome obrigatorios" }, { status: 400 });
  }

  // Create instance in Evolution API
  const createRes = await fetch(`${EVO_URL}/instance/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: EVO_KEY },
    body: JSON.stringify({ instanceName: instanciaNome, qrcode: true }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    return NextResponse.json({ ok: false, erro: `Evolution API: ${err}` }, { status: 500 });
  }

  const createData = await createRes.json();

  // Set webhook
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

  // Create Empresa in CRM (upsert by instancia)
  const empresa = await prisma.empresa.upsert({
    where: { instanciaWhatsapp: instanciaNome },
    create: { nome: empresaNome, instanciaWhatsapp: instanciaNome },
    update: { nome: empresaNome },
  });

  const qrcode = createData?.qrcode?.base64 ?? null;

  return NextResponse.json({ ok: true, empresa, qrcode, instancia: instanciaNome });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const instancia = searchParams.get("instancia");
  if (!instancia) return NextResponse.json({ ok: false }, { status: 400 });

  const res = await fetch(`${EVO_URL}/instance/qrcode/${instancia}?image=true`, {
    headers: { apikey: EVO_KEY },
  });
  const data = await res.json();
  return NextResponse.json({ qrcode: data?.base64 ?? data?.qrcode?.base64 ?? null });
}
