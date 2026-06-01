import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
  const body = await req.json();
  const { secret, horas = 24 } = body;

  if (secret !== "crm2026migra") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY nao configurada" }, { status: 500 });
  }

  const since = new Date(Date.now() - horas * 60 * 60 * 1000);

  const empresas = await prisma.empresa.findMany({
    where: { ativa: true, instanciaWhatsapp: { not: null } },
    select: { id: true, nome: true, instanciaWhatsapp: true, aprendizados: true, nomeIA: true },
  });

  const resultados: object[] = [];

  for (const empresa of empresas) {
    // Buscar conversas com atividade nas últimas N horas
    const conversas = await prisma.conversa.findMany({
      where: {
        ultimaAtividade: { gte: since },
        cliente: { empresaId: empresa.id },
      },
      include: {
        mensagens: {
          orderBy: { criadoEm: "asc" },
          select: { direcao: true, conteudo: true, criadoEm: true },
        },
        cliente: { select: { nome: true } },
      },
      orderBy: { ultimaAtividade: "desc" },
      take: 6,
    });

    if (conversas.length === 0) {
      resultados.push({ empresa: empresa.nome, status: "sem_atividade" });
      continue;
    }

    // Montar bloco de conversas para análise
    const blocos = conversas.map((cv, i) => {
      const msgs = cv.mensagens.filter(m => m.conteudo && m.conteudo.length > 3);
      if (msgs.length < 2) return null;
      const nomeCliente = cv.cliente.nome ?? "Cliente";
      const linhas = msgs.map(m =>
        `${m.direcao === "ENTRADA" ? nomeCliente : (empresa.nomeIA ?? "IA")}: ${m.conteudo.slice(0, 200)}`
      ).join("\n");
      return `[CONVERSA ${i + 1} — ${nomeCliente}]\n${linhas}`;
    }).filter(Boolean).join("\n\n---\n\n");

    if (!blocos) {
      resultados.push({ empresa: empresa.nome, status: "conversas_vazias" });
      continue;
    }

    const prompt = `Você é um auditor de qualidade de IA de vendas para WhatsApp. Analise as conversas abaixo da empresa "${empresa.nome}" e identifique falhas reais.

CONVERSAS DAS ÚLTIMAS ${horas}H:
${blocos}

Identifique APENAS falhas concretas que você viu nas conversas acima. Retorne JSON válido com esta estrutura exata:
{
  "falhas": [
    {
      "tipo": "json_exposto|empresa_errada|info_errada|oportunidade_perdida|loop_sem_avanco|fallback_ativado|outro",
      "descricao": "descrição objetiva do que aconteceu (máx 200 chars)",
      "conversa": "número da conversa onde ocorreu",
      "correcao": "o que a IA deveria ter feito (máx 200 chars)"
    }
  ],
  "resumo": "1-2 frases resumindo a qualidade geral do atendimento"
}

Regras:
- Se não houver falhas reais, retorne {"falhas":[],"resumo":"Atendimento dentro do esperado."}
- json_exposto = IA enviou JSON bruto na mensagem ao cliente
- empresa_errada = IA mencionou outra empresa ou se identificou errado
- info_errada = IA deu preço/prazo/produto incorreto com base nas informações da empresa
- oportunidade_perdida = cliente sinalizou compra e IA não avançou
- loop_sem_avanco = mesma pergunta repetida 2+ vezes sem resposta satisfatória
- fallback_ativado = IA enviou mensagem genérica de erro/fallback`;

    let falhas: { tipo: string; descricao: string; conversa: string; correcao: string }[] = [];
    let resumo = "";

    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1200,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        let txt = data.content?.[0]?.text ?? "{}";
        txt = txt.replace(/^```[a-z]*\s*/m, "").replace(/\s*```\s*$/m, "").trim();
        const parsed = JSON.parse(txt);
        falhas = parsed.falhas ?? [];
        resumo = parsed.resumo ?? "";
      }
    } catch {
      // análise falhou, continua sem correções
    }

    // Salvar correções críticas em aprendizados (tipos que afetam diretamente o prompt)
    const tiposCriticos = ["json_exposto", "empresa_errada", "info_errada", "fallback_ativado"];
    const correcoesCriticas = falhas.filter(f => tiposCriticos.includes(f.tipo));

    if (correcoesCriticas.length > 0) {
      const novasEntradas = correcoesCriticas.map(f =>
        `[QA] EVITAR: ${f.descricao} → CORRETO: ${f.correcao}`
      ).join("\n---\n");

      const aprendizadosAtuais = empresa.aprendizados ?? "";
      // Remove entradas QA antigas para não acumular duplicatas
      const semQaAntigo = aprendizadosAtuais
        .split("\n---\n")
        .filter(e => !e.startsWith("[QA]"))
        .join("\n---\n");
      const novo = semQaAntigo
        ? semQaAntigo + "\n---\n" + novasEntradas
        : novasEntradas;

      await prisma.empresa.update({
        where: { id: empresa.id },
        data: { aprendizados: novo },
      }).catch(() => null);
    }

    resultados.push({
      empresa: empresa.nome,
      instancia: empresa.instanciaWhatsapp,
      conversasAnalisadas: conversas.length,
      falhasEncontradas: falhas.length,
      correcoesSalvas: correcoesCriticas.length,
      falhas,
      resumo,
    });
  }

  const totalFalhas = resultados.reduce((s: number, r: any) => s + (r.falhasEncontradas ?? 0), 0);
  const totalCorrecoes = resultados.reduce((s: number, r: any) => s + (r.correcoesSalvas ?? 0), 0);

  return NextResponse.json({
    ok: true,
    periodo: `últimas ${horas}h`,
    empresasAnalisadas: empresas.length,
    totalFalhas,
    totalCorrecoesSalvas: totalCorrecoes,
    resultados,
  });
  } catch (e: any) {
    return NextResponse.json({ error: "erro_interno", detalhe: e?.message ?? String(e) }, { status: 500 });
  }
}
