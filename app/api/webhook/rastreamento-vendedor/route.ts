import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseValor(text: string): number | null {
  const clean = text.replace(/r\$\s*/gi, "").replace(/\./g, "").replace(",", ".");
  const match = clean.match(/\d+(\.\d+)?/);
  if (!match) return null;
  const v = parseFloat(match[0]);
  return isNaN(v) || v <= 0 ? null : v;
}

const PALAVRAS_VENDA = [
  "fechei", "fechou", "vendeu", "comprou", "pagou",
  "efetuei", "confirmei", "venda feita", "deu certo",
  "foi vendido", "negócio feito",
];

function detectaVendaNoAudio(texto: string): boolean {
  return PALAVRAS_VENDA.some(p => texto.includes(p));
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    instanciaVendedor, telefoneContato,
    isOrcamento, isAudioVendedor, isComprovante,
    transcricao, msgText,
  } = body;

  if (!instanciaVendedor || !telefoneContato) {
    return NextResponse.json({ ok: false, motivo: "campos obrigatorios ausentes" });
  }

  const vendedor = await prisma.vendedor.findFirst({
    where: { instanciaVendedor },
    select: {
      id: true, nome: true, telefone: true,
      empresa: {
        select: { id: true, instanciaWhatsapp: true },
      },
    },
  });

  if (!vendedor) {
    return NextResponse.json({ ok: false, motivo: "vendedor nao encontrado para esta instancia" });
  }

  const sufixo = telefoneContato.replace(/\D/g, "").slice(-9);
  const lead = await prisma.lead.findFirst({
    where: {
      vendedorId: vendedor.id,
      status: { in: ["NEGOCIACAO", "PRONTO_PARA_COMPRAR", "AGENDADO", "ORCAMENTO_ENVIADO"] },
      cliente: {
        OR: [
          { telefonePrincipal: { endsWith: sufixo } },
          { telefone: { endsWith: sufixo } },
        ],
      },
    },
    orderBy: { atualizadoEm: "desc" },
    include: { cliente: { select: { id: true, nome: true, telefone: true } } },
  });

  if (!lead) {
    return NextResponse.json({ ok: false, motivo: "lead ativo nao encontrado para este telefone" });
  }

  const nomeCliente = lead.cliente.nome ?? lead.cliente.telefone;

  // ── Cenário A — orçamento enviado pelo vendedor ──────────────────────────
  if (isOrcamento) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: "ORCAMENTO_ENVIADO", dataOrcamento: new Date() },
    });
    return NextResponse.json({ ok: true, acao: "orcamento_registrado", leadId: lead.id, nomeCliente });
  }

  // ── Cenário B — áudio do vendedor (Groq já transcreveu no N8N) ───────────
  if (isAudioVendedor) {
    const texto = (transcricao ?? msgText ?? "").toLowerCase();
    const temVenda = detectaVendaNoAudio(texto);
    const valor = parseValor(texto);

    if (temVenda) {
      await prisma.venda.create({
        data: {
          leadId: lead.id,
          vendedorId: vendedor.id,
          ...(valor !== null && { valor }),
          descricao: `Áudio: "${(transcricao ?? "").slice(0, 100)}"`,
        },
      });
      await prisma.lead.update({
        where: { id: lead.id },
        data: { status: "VENDA_REALIZADA" },
      });
      await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL ?? "https://ocrmfacil.com.br"}/api/webhook/vitoria`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId: lead.id, secret: "crm2026migra" }),
        }
      ).catch(() => null);
      return NextResponse.json({ ok: true, acao: "venda_registrada", leadId: lead.id, nomeCliente, valor });
    }

    return NextResponse.json({ ok: true, acao: "audio_sem_venda", leadId: lead.id });
  }

  // ── Cenário C — comprovante recebido do cliente ──────────────────────────
  if (isComprovante) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: "ORCAMENTO_ENVIADO" },
    });

    const evoUrl = process.env.EVOLUTION_API_URL ?? "http://201.76.43.149:8080";
    const evoKey = process.env.AUTHENTICATION_API_KEY ?? process.env.EVOLUTION_API_KEY ?? "";

    await fetch(`${evoUrl}/message/sendText/${vendedor.empresa.instanciaWhatsapp}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: evoKey },
      body: JSON.stringify({
        number: vendedor.telefone,
        text: `Vi que *${nomeCliente}* te mandou um comprovante. A venda foi realizada? Me manda o valor aqui. 💰`,
        options: { presence: "composing", delay: 2000 },
      }),
    }).catch(() => null);

    return NextResponse.json({ ok: true, acao: "comprovante_aguardando_confirmacao", leadId: lead.id, nomeCliente });
  }

  return NextResponse.json({ ok: true, acao: "nenhuma_acao", leadId: lead.id });
}
