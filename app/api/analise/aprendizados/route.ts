import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
  const body = await req.json();
  const { empresaId, secret } = body;

  if (secret !== "crm2026migra") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!empresaId) {
    return NextResponse.json({ error: "empresaId obrigatorio" }, { status: 400 });
  }

  const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
  if (!empresa) return NextResponse.json({ error: "empresa nao encontrada" }, { status: 404 });

  const since = new Date();
  since.setDate(since.getDate() - 90);

  // Buscar leads concluídos (vitórias e perdas) nos últimos 90 dias
  const [vitorias, derrotas] = await Promise.all([
    prisma.lead.findMany({
      where: {
        empresaId,
        status: { in: ["VENDA_REALIZADA", "POS_VENDA"] },
        atualizadoEm: { gte: since },
      },
      include: {
        cliente: {
          include: {
            conversas: {
              orderBy: { ultimaAtividade: "desc" },
              take: 1,
              include: {
                mensagens: {
                  orderBy: { criadoEm: "asc" },
                  select: { direcao: true, conteudo: true },
                },
              },
            },
          },
        },
        vendas: { orderBy: { criadoEm: "desc" }, take: 1 },
      },
      orderBy: { atualizadoEm: "desc" },
      take: 15,
    }),
    prisma.lead.findMany({
      where: {
        empresaId,
        status: "PERDIDO",
        atualizadoEm: { gte: since },
      },
      include: {
        cliente: {
          include: {
            conversas: {
              orderBy: { ultimaAtividade: "desc" },
              take: 1,
              include: {
                mensagens: {
                  orderBy: { criadoEm: "asc" },
                  select: { direcao: true, conteudo: true },
                },
              },
            },
          },
        },
      },
      orderBy: { atualizadoEm: "desc" },
      take: 15,
    }),
  ]);

  if (vitorias.length + derrotas.length < 3) {
    return NextResponse.json({
      ok: true,
      motivo: "poucos_dados",
      conversas: vitorias.length + derrotas.length,
    });
  }

  // Condensar conversas para o prompt
  function condensa(msgs: { direcao: string; conteudo: string }[]): string {
    const filtradas = msgs.filter(m => m.conteudo && m.conteudo.length > 2);
    // Pegar primeiras 4 + últimas 4 para capturar abertura e fechamento
    const selecionadas = filtradas.length > 8
      ? [...filtradas.slice(0, 4), ...filtradas.slice(-4)]
      : filtradas;
    return selecionadas
      .map(m => `${m.direcao === "ENTRADA" ? "C" : "IA"}: ${m.conteudo.slice(0, 120)}`)
      .join("\n");
  }

  const blocoVitorias = vitorias.map((l, i) => {
    const valor = l.vendas[0]?.valor ? `R$${l.vendas[0].valor.toFixed(0)}` : "valor não registrado";
    const tags = l.cliente.tags.length > 0 ? ` [${l.cliente.tags.join(", ")}]` : "";
    const msgs = l.cliente.conversas[0]?.mensagens ?? [];
    return `[VITÓRIA ${i + 1}] ${valor}${tags}\n${condensa(msgs)}`;
  }).join("\n\n");

  const blocalDerrotas = derrotas.map((l, i) => {
    const motivo = (l.observacoes ?? "").match(/[Mm]otivo[^:]*:\s*([^\n]+)/)?.[1] ?? "não registrado";
    const tags = l.cliente.tags.length > 0 ? ` [${l.cliente.tags.join(", ")}]` : "";
    const msgs = l.cliente.conversas[0]?.mensagens ?? [];
    return `[PERDA ${i + 1}] Motivo: ${motivo}${tags}\n${condensa(msgs)}`;
  }).join("\n\n");

  const prompt = `Você é um analista de vendas especialista em WhatsApp para ${empresa.nome}.

Analise as conversas abaixo e extraia padrões reais e acionáveis para melhorar o atendimento.

== VITÓRIAS (${vitorias.length}) ==
${blocoVitorias || "(nenhuma registrada)"}

== PERDAS (${derrotas.length}) ==
${blocalDerrotas || "(nenhuma registrada)"}

Retorne APENAS os padrões, um por linha, máximo 10 linhas no total.
Formato obrigatório — cada linha começa com [VITORIA] ou [PERDA]:
[VITORIA] padrão específico e acionável (máx 150 chars)
[PERDA] padrão específico e acionável (máx 150 chars)

Regras:
- Seja específico: cite produtos, objeções, linguagem, sequência que funcionou
- Evite generalidades como "seja simpático" ou "responda rápido"
- Se houver diferença por tipo de cliente (tags), mencione
- Foque no que a IA pode replicar ou evitar`;

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY nao configurada" }, { status: 500 });
  }

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    return NextResponse.json({ error: "claude_error", detalhe: err.slice(0, 200) }, { status: 500 });
  }

  const data = await resp.json();
  const texto = data.content?.[0]?.text ?? "";

  // Filtrar apenas linhas válidas com [VITORIA] ou [PERDA]
  const padroes = texto
    .split("\n")
    .map((l: string) => l.trim())
    .filter((l: string) => l.startsWith("[VITORIA]") || l.startsWith("[PERDA]"))
    .slice(0, 10)
    .join("\n---\n");

  if (!padroes) {
    return NextResponse.json({ ok: true, motivo: "sem_padroes_extraidos", raw: texto.slice(0, 300) });
  }

  await prisma.empresa.update({
    where: { id: empresaId },
    data: { aprendizados: padroes },
  });

  return NextResponse.json({
    ok: true,
    empresa: empresa.nome,
    conversasAnalisadas: vitorias.length + derrotas.length,
    padroesExtraidos: padroes.split("\n---\n").length,
  });
  } catch (e: any) {
    return NextResponse.json({ error: "erro_interno", detalhe: e?.message ?? String(e) }, { status: 500 });
  }
}
