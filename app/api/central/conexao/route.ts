import { NextResponse } from "next/server";

const EVO_URL = "http://201.76.43.149:8081";
const EVO_KEY = process.env.EVOLUTION_API_KEY ?? "SuaChaveSecreta123";
const WEBHOOK_URL = "https://n8n-n8n.6jgzku.easypanel.host/webhook/whatsapp";

async function criarInstancia(instancia: string) {
  await fetch(`${EVO_URL}/instance/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: EVO_KEY },
    body: JSON.stringify({ instanceName: instancia, integration: "WHATSAPP-BAILEYS", qrcode: true }),
    signal: AbortSignal.timeout(10000),
  });
  await fetch(`${EVO_URL}/webhook/set/${instancia}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: EVO_KEY },
    body: JSON.stringify({
      webhook: {
        enabled: true,
        url: WEBHOOK_URL,
        events: ["MESSAGES_UPSERT"],
        webhook_by_events: false,
        webhook_base64: false,
      },
    }),
    signal: AbortSignal.timeout(8000),
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const instancia = searchParams.get("instancia");
  if (!instancia) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    const stateRes = await fetch(`${EVO_URL}/instance/connectionState/${instancia}`, {
      headers: { apikey: EVO_KEY },
      signal: AbortSignal.timeout(5000),
    });
    const stateData = await stateRes.json();
    const state: string = stateData?.instance?.state ?? "";

    if (state === "open") {
      return NextResponse.json({ state: "open", qrcode: null });
    }

    // Instância não existe na Evolution API — cria automaticamente
    if (!state || stateData?.error || !stateRes.ok) {
      try { await criarInstancia(instancia); } catch { /* ignora */ }
    }

    const qrRes = await fetch(`${EVO_URL}/instance/connect/${instancia}`, {
      headers: { apikey: EVO_KEY },
      signal: AbortSignal.timeout(8000),
    });
    const qrData = await qrRes.json();
    const qrcode: string | null = qrData?.base64 ?? null;

    return NextResponse.json({ state: state || "close", qrcode });
  } catch {
    return NextResponse.json({ state: "unknown", qrcode: null });
  }
}
