import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { texto } = await req.json();

  if (!texto?.trim()) {
    return NextResponse.json({ ok: false, erro: "texto vazio" }, { status: 400 });
  }

  const conversa = await prisma.conversa.findUnique({
    where: { id },
    include: { cliente: { include: { empresa: true } } },
  });
  if (!conversa) return NextResponse.json({ ok: false, erro: "conversa não encontrada" }, { status: 404 });

  const { telefone, empresa } = conversa.cliente;
  const instancia = empresa.instanciaWhatsapp;
  const apiKey = process.env.EVOLUTION_API_KEY ?? "SuaChaveSecreta123";
  const apiUrl = process.env.EVOLUTION_API_URL ?? "http://201.76.43.149:8081";

  const res = await fetch(`${apiUrl}/message/sendText/${instancia}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: apiKey },
    body: JSON.stringify({ number: telefone, textMessage: { text: texto } }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ ok: false, erro: err.slice(0, 100) }, { status: 502 });
  }

  const mensagem = await prisma.mensagem.create({
    data: { conversaId: id, conteudo: texto, direcao: "SAIDA" },
  });

  await prisma.conversa.update({
    where: { id },
    data: { ultimaMensagem: texto, ultimaAtividade: new Date() },
  });

  return NextResponse.json({ ok: true, mensagem });
}
