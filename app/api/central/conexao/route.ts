import { NextResponse } from "next/server";

const EVO_URL = "http://201.76.43.149:8081";
const EVO_KEY = process.env.EVOLUTION_API_KEY ?? "SuaChaveSecreta123";

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
    const state: string = stateData?.instance?.state ?? "close";

    if (state === "open") {
      return NextResponse.json({ state: "open", qrcode: null });
    }

    const qrRes = await fetch(`${EVO_URL}/instance/connect/${instancia}`, {
      headers: { apikey: EVO_KEY },
      signal: AbortSignal.timeout(8000),
    });
    const qrData = await qrRes.json();
    const qrcode: string | null = qrData?.base64 ?? null;

    return NextResponse.json({ state, qrcode });
  } catch {
    return NextResponse.json({ state: "unknown", qrcode: null });
  }
}
