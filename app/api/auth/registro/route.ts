import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

const EVO_URL = "http://201.76.43.149:8080";
const EVO_KEY = process.env.AUTHENTICATION_API_KEY ?? "";
const WEBHOOK_URL = "https://n8n-n8n.6jgzku.easypanel.host/webhook/whatsapp";

async function criarInstanciaEvo(instancia: string) {
  try {
    await fetch(`${EVO_URL}/instance/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: EVO_KEY },
      body: JSON.stringify({ instanceName: instancia, integration: "WHATSAPP-BAILEYS", qrcode: true }),
      signal: AbortSignal.timeout(10000),
    });
  } catch { /* Evolution API indisponível — não bloqueia o registro */ }

  try {
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
  } catch { /* ignora falha no webhook */ }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/, "");
}

export async function POST(req: Request) {
  const { nomeEmpresa, nome, email, telefone, senha } = await req.json();

  if (!nomeEmpresa?.trim() || !nome?.trim() || !email?.trim() || !telefone?.trim() || !senha) {
    return NextResponse.json({ error: "Preencha todos os campos" }, { status: 400 });
  }
  if (senha.length < 8) {
    return NextResponse.json({ error: "Senha deve ter pelo menos 8 caracteres" }, { status: 400 });
  }

  const emailExiste = await prisma.usuario.findUnique({ where: { email } });
  if (emailExiste) {
    return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 });
  }

  const base = slugify(nomeEmpresa.trim()) || "empresa";
  let instancia = base;
  let sufixo = 1;
  while (await prisma.empresa.findUnique({ where: { instanciaWhatsapp: instancia } })) {
    instancia = `${base}_${sufixo}`;
    sufixo++;
  }

  const trialFim = new Date();
  trialFim.setDate(trialFim.getDate() + 30);

  const senhaCriptografada = await bcrypt.hash(senha, 10);

  const empresa = await prisma.empresa.create({
    data: {
      nome: nomeEmpresa.trim(),
      instanciaWhatsapp: instancia,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      planStatus: "TRIAL" as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      plano: "STARTER" as any,
      trialFim,
    },
  });

  // Cria instância na Evolution API em background — falha silenciosa
  criarInstanciaEvo(instancia);

  const usuario = await prisma.usuario.create({
    data: {
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      senha: senhaCriptografada,
      telefone: telefone.trim(),
      perfil: "DONO",
      empresaId: empresa.id,
    },
  });

  const token = signToken({
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
    empresaId: usuario.empresaId,
    planStatus: "TRIAL",
    trialFim: trialFim.toISOString(),
    isenta: false,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return response;
}
