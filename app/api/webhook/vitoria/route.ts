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
      empresa: { select: { id: true, nome: true, aprendizados: true, nomeIA: true } },
    },
  });

  if (!lead) return NextResponse.json({ error: "lead não encontrado" }, { status: 404 });

  // Buscar histórico de conversa do cliente
  const conversa = await prisma.conversa.findFirst({
    where: { clienteId: lead.cliente.id },
    include: {
      mensagens: {
        orderBy: { criadoEm: "desc" },
        take: 20,
      },
    },
  });

  if (!conversa || conversa.mensagens.length < 3) {
    return NextResponse.json({ ok: true, msg: "conversa insuficiente para análise" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ ok: true, msg: "ANTHROPIC_API_KEY não configurada" });

  // Montar histórico em ordem cronológica
  const msgs = [...conversa.mensagens].reverse();
  const historico = msgs
    .map(m => `[${m.direcao === "ENTRADA" ? "Cliente" : "IA"}]: ${m.conteudo}`)
    .join("\n");

  const clienteNome = lead.cliente.nome || "o cliente";
  const empresaNome = lead.empresa.nome;

  const anthropic = new Anthropic({ apiKey });

  let novoAprendizado: string;
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [{
        role: "user",
        content: `Analise esta conversa de venda bem-sucedida da empresa "${empresaNome}" com o cliente "${clienteNome}" e extraia UM aprendizado conciso (máximo 1-2 linhas) sobre o que funcionou: abordagem usada, objeção vencida, perfil do cliente ou gatilho que fechou a venda. Responda apenas com o aprendizado, direto ao ponto, em português.

Conversa:
${historico.slice(0, 2000)}`,
      }],
    });
    novoAprendizado = (response.content[0] as { text: string }).text.trim();
  } catch {
    return NextResponse.json({ ok: true, msg: "erro na análise Claude" });
  }

  if (!novoAprendizado) return NextResponse.json({ ok: true, msg: "sem aprendizado extraído" });

  // Acumular aprendizados — manter os últimos MAX_APRENDIZADOS
  const anteriores = lead.empresa.aprendizados
    ? lead.empresa.aprendizados.split("\n---\n").filter(Boolean)
    : [];

  const atualizados = [novoAprendizado, ...anteriores].slice(0, MAX_APRENDIZADOS);
  const aprendizados = atualizados.join("\n---\n");

  await prisma.empresa.update({
    where: { id: lead.empresa.id },
    data: { aprendizados },
  });

  return NextResponse.json({ ok: true, aprendizado: novoAprendizado });
}
