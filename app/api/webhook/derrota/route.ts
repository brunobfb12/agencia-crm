import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const MAX_APRENDIZADOS = 10;

export async function POST(req: Request) {
  const body = await req.json();
  const { leadId, secret } = body;

  if (secret !== "crm2026migra") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!leadId) {
    return NextResponse.json({ error: "leadId obrigatório" }, { status: 400 });
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      cliente: { select: { id: true, nome: true } },
      empresa: { select: { id: true, nome: true, aprendizados: true } },
    },
  });

  if (!lead) return NextResponse.json({ error: "lead não encontrado" }, { status: 404 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ ok: true, msg: "ANTHROPIC_API_KEY não configurada" });

  // Extract loss reason from observacoes
  const motivoMatch = lead.observacoes?.match(/Motivo perda:\s*(.+)/i);
  const motivoPerda = motivoMatch ? motivoMatch[1].trim() : null;

  // Fetch conversation history for additional context
  const conversa = await prisma.conversa.findFirst({
    where: { clienteId: lead.cliente.id },
    include: {
      mensagens: {
        orderBy: { criadoEm: "desc" },
        take: 20,
      },
    },
  });

  const msgs = conversa ? [...conversa.mensagens].reverse() : [];
  const historico = msgs
    .map(m => `[${m.direcao === "ENTRADA" ? "Cliente" : "IA"}]: ${m.conteudo}`)
    .join("\n");

  const clienteNome = lead.cliente.nome || "o cliente";
  const empresaNome = lead.empresa.nome;

  const contexto = [
    motivoPerda ? `Motivo da perda informado pelo vendedor: ${motivoPerda}` : "",
    historico ? `Conversa com o cliente:\n${historico.slice(0, 2000)}` : "",
  ].filter(Boolean).join("\n\n");

  if (!contexto) {
    return NextResponse.json({ ok: true, msg: "sem contexto suficiente para análise" });
  }

  const anthropic = new Anthropic({ apiKey });

  let novoAprendizado: string;
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [{
        role: "user",
        content: `A empresa "${empresaNome}" perdeu o cliente "${clienteNome}". Analise o contexto abaixo e extraia UM aprendizado conciso (máximo 1-2 linhas) sobre a objeção que causou a perda e como quebrá-la no futuro. Responda apenas com o aprendizado, direto ao ponto, em português. Foco em: qual foi a objeção real e como contorná-la na próxima oportunidade.

${contexto}`,
      }],
    });
    novoAprendizado = (response.content[0] as { text: string }).text.trim();
  } catch {
    return NextResponse.json({ ok: true, msg: "erro na análise Claude" });
  }

  if (!novoAprendizado) return NextResponse.json({ ok: true, msg: "sem aprendizado extraído" });

  const prefixado = `[PERDA] ${novoAprendizado}`;

  const anteriores = lead.empresa.aprendizados
    ? lead.empresa.aprendizados.split("\n---\n").filter(Boolean)
    : [];

  const atualizados = [prefixado, ...anteriores].slice(0, MAX_APRENDIZADOS);
  const aprendizados = atualizados.join("\n---\n");

  await prisma.empresa.update({
    where: { id: lead.empresa.id },
    data: { aprendizados },
  });

  return NextResponse.json({ ok: true, aprendizado: prefixado });
}
