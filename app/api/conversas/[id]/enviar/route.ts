import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getUsuarioLogado();
  if (!me) return NextResponse.json({ ok: false, erro: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { texto, tipo, base64, mimeType, fileName, legenda } = body;

  const conversa = await prisma.conversa.findUnique({
    where: { id },
    include: { cliente: { include: { empresa: true } } },
  });
  if (!conversa) return NextResponse.json({ ok: false, erro: "conversa não encontrada" }, { status: 404 });

  if (me.perfil !== "CENTRAL" && me.empresaId && conversa.cliente.empresa.id !== me.empresaId) {
    return NextResponse.json({ ok: false, erro: "Não autorizado" }, { status: 403 });
  }

  const { telefone, empresa } = conversa.cliente;
  const instancia = empresa.instanciaWhatsapp;
  const apiKey = process.env.EVOLUTION_API_KEY ?? "SuaChaveSecreta123";
  const apiUrl = process.env.EVOLUTION_API_URL ?? "http://201.76.43.149:8080";

  // ── Texto ─────────────────────────────────────────────────────────────
  if (!tipo || tipo === "texto") {
    if (!texto?.trim()) return NextResponse.json({ ok: false, erro: "texto vazio" }, { status: 400 });

    const res = await fetch(`${apiUrl}/message/sendText/${instancia}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: apiKey },
      body: JSON.stringify({ number: telefone, text: texto }),
    });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ ok: false, erro: err.slice(0, 100) }, { status: 502 });
    }

    const mensagem = await prisma.mensagem.create({
      data: { conversaId: id, conteudo: texto, direcao: "SAIDA" },
    });
    await prisma.conversa.update({ where: { id }, data: { ultimaMensagem: texto, ultimaAtividade: new Date() } });
    return NextResponse.json({ ok: true, mensagem });
  }

  // ── Áudio (voz) ───────────────────────────────────────────────────────
  if (tipo === "audio") {
    if (!base64) return NextResponse.json({ ok: false, erro: "base64 ausente" }, { status: 400 });

    const audioData = base64.startsWith("data:") ? base64 : `data:audio/ogg;base64,${base64}`;

    const res = await fetch(`${apiUrl}/message/sendWhatsAppAudio/${instancia}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: apiKey },
      body: JSON.stringify({ number: telefone, audio: audioData, encoding: true }),
    });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ ok: false, erro: err.slice(0, 100) }, { status: 502 });
    }

    const mensagem = await prisma.mensagem.create({
      data: { conversaId: id, conteudo: "[ÁUDIO]", direcao: "SAIDA" },
    });
    await prisma.conversa.update({ where: { id }, data: { ultimaMensagem: "[ÁUDIO]", ultimaAtividade: new Date() } });
    return NextResponse.json({ ok: true, mensagem });
  }

  // ── Imagem / Documento ────────────────────────────────────────────────
  if (tipo === "imagem" || tipo === "documento") {
    if (!base64 || !mimeType) return NextResponse.json({ ok: false, erro: "base64/mimeType ausente" }, { status: 400 });

    const mediaBase64 = base64.includes(",") ? base64.split(",")[1] : base64;
    const mediatype = tipo === "imagem" ? "image" : "document";

    const res = await fetch(`${apiUrl}/message/sendMedia/${instancia}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: apiKey },
      body: JSON.stringify({
        number: telefone,
        mediatype,
        mimetype: mimeType,
        caption: legenda ?? "",
        media: mediaBase64,
        fileName: fileName ?? (tipo === "imagem" ? "imagem.jpg" : "arquivo"),
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ ok: false, erro: err.slice(0, 100) }, { status: 502 });
    }

    const conteudo = tipo === "imagem"
      ? (legenda ? `[IMAGEM] ${legenda}` : "[IMAGEM]")
      : `[ARQUIVO] ${fileName ?? "arquivo"}`;

    const mensagem = await prisma.mensagem.create({
      data: { conversaId: id, conteudo, direcao: "SAIDA" },
    });
    await prisma.conversa.update({ where: { id }, data: { ultimaMensagem: conteudo, ultimaAtividade: new Date() } });
    return NextResponse.json({ ok: true, mensagem });
  }

  return NextResponse.json({ ok: false, erro: "tipo inválido" }, { status: 400 });
}
