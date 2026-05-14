import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Markers stored in lead.observacoes to track vendor conversation state
const ESTADO_CONFIRMACAO = "[V:AGUARDANDO_CONFIRMACAO]";
const ESTADO_VALOR       = "[V:AGUARDANDO_VALOR]";
const ESTADO_MOTIVO      = "[V:AGUARDANDO_MOTIVO]";

function getEstado(obs: string | null): "AGUARDANDO_CONFIRMACAO" | "AGUARDANDO_VALOR" | "AGUARDANDO_MOTIVO" | "INICIAL" {
  if (!obs) return "INICIAL";
  if (obs.includes(ESTADO_VALOR))       return "AGUARDANDO_VALOR";
  if (obs.includes(ESTADO_MOTIVO))      return "AGUARDANDO_MOTIVO";
  if (obs.includes(ESTADO_CONFIRMACAO)) return "AGUARDANDO_CONFIRMACAO";
  return "INICIAL";
}

function setEstado(obs: string | null, estado: string | null): string {
  const base = (obs ?? "")
    .replace(/\[V:[^\]]*\]/g, "")
    .trim();
  return estado ? `${base}\n${estado}`.trim() : base;
}

function detectarIntencao(msg: string): "VENDA" | "PERDA" | "VALOR" | null {
  const m = msg.toLowerCase().trim();
  // Monetary value anywhere in message
  if (/[\d]/.test(m) && /[,.]?\d{2}$|^\d+$/.test(m.replace(/[r$\s.]/g, ""))) {
    const num = parseValor(msg);
    if (num && num > 0) return "VALOR";
  }
  if (/\b(sim|s\b|yes|vend|fechei|fechou|deu certo|aconteceu|confirmo|efetuei)\b/.test(m)) return "VENDA";
  if (/\b(não|nao|n\b|no\b|perdeu|perdi|não rolou|nao rolou|desistiu|cancelou|sem interesse)\b/.test(m)) return "PERDA";
  return null;
}

function parseValor(msg: string): number | null {
  const clean = msg.replace(/r\$\s*/gi, "").replace(/\./g, "").replace(",", ".");
  const match = clean.match(/\d+(\.\d+)?/);
  if (!match) return null;
  const v = parseFloat(match[0]);
  return isNaN(v) || v <= 0 ? null : v;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { instancia, telefone, mensagem, nomeContato } = body;

  if (!instancia || !telefone || !mensagem) {
    return NextResponse.json({ ok: false, motivo: "campos obrigatorios ausentes" });
  }

  const empresa = await prisma.empresa.findUnique({ where: { instanciaWhatsapp: instancia } });
  if (!empresa) return NextResponse.json({ ok: false, motivo: "empresa nao encontrada" });

  // Normalize phone — @lid JIDs (iPhones) come as numeric IDs, not real phone numbers
  const telNorm = telefone.replace(/\D/g, "");
  const isLid = !telefone.startsWith("55") && telNorm.length > 13;

  let vendedor = await prisma.vendedor.findFirst({
    where: {
      empresaId: empresa.id,
      ativo: true,
      telefone: { contains: telNorm.slice(-9) },
    },
  });

  // @lid fallback: match by name when phone is a numeric JID
  if (!vendedor && isLid && nomeContato) {
    const nomeLimpo = nomeContato.replace(/[^\p{L}\p{N}\s]/gu, "").trim().split(/\s+/)[0];
    if (nomeLimpo) {
      vendedor = await prisma.vendedor.findFirst({
        where: {
          empresaId: empresa.id,
          ativo: true,
          nome: { contains: nomeLimpo, mode: "insensitive" },
        },
      });
    }
  }

  if (!vendedor) {
    return NextResponse.json({ ok: false, motivo: "nao e vendedor desta empresa" });
  }

  // Find the most recently updated NEGOCIACAO lead assigned to this vendor
  const lead = await prisma.lead.findFirst({
    where: {
      vendedorId: vendedor.id,
      empresaId: empresa.id,
      status: { in: ["NEGOCIACAO", "PRONTO_PARA_COMPRAR", "AGENDADO"] },
    },
    orderBy: { atualizadoEm: "desc" },
    include: { cliente: { select: { id: true, nome: true, telefone: true } } },
  });

  if (!lead) {
    return NextResponse.json({
      ok: true,
      isVendedor: true,
      resposta: `Oi ${vendedor.nome}! Não encontrei nenhum lead ativo em negociação no seu nome agora. Se fechar uma venda, me avisa! 😊`,
    });
  }

  const nomeCliente = lead.cliente.nome ?? lead.cliente.telefone;
  const estado = getEstado(lead.observacoes);
  const intencao = detectarIntencao(mensagem);

  // ── ESTADO: INICIAL — ainda não perguntamos ──────────────────────────────
  if (estado === "INICIAL") {
    // Vendedor already saying something about the lead without being asked
    if (intencao === "VENDA") {
      // Update to awaiting value
      await prisma.lead.update({
        where: { id: lead.id },
        data: { observacoes: setEstado(lead.observacoes, ESTADO_VALOR) },
      });
      return NextResponse.json({
        ok: true, isVendedor: true, leadId: lead.id, clienteNome: nomeCliente,
        estado: "AGUARDANDO_VALOR",
        resposta: `Que ótimo, ${vendedor.nome}! Parabéns pela venda com ${nomeCliente}! 🎉 Qual foi o valor?`,
      });
    }
    if (intencao === "PERDA") {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { observacoes: setEstado(lead.observacoes, ESTADO_MOTIVO) },
      });
      return NextResponse.json({
        ok: true, isVendedor: true, leadId: lead.id, clienteNome: nomeCliente,
        estado: "AGUARDANDO_MOTIVO",
        resposta: `Entendido ${vendedor.nome}. Qual foi o motivo da perda com ${nomeCliente}? Vou registrar aqui.`,
      });
    }
    // Unknown — just greet and ask
    await prisma.lead.update({
      where: { id: lead.id },
      data: { observacoes: setEstado(lead.observacoes, ESTADO_CONFIRMACAO) },
    });
    return NextResponse.json({
      ok: true, isVendedor: true, leadId: lead.id, clienteNome: nomeCliente,
      estado: "AGUARDANDO_CONFIRMACAO",
      resposta: `Oi ${vendedor.nome}! Tenho o cliente *${nomeCliente}* no seu funil em negociação. A venda aconteceu?`,
    });
  }

  // ── ESTADO: AGUARDANDO_CONFIRMACAO ──────────────────────────────────────
  if (estado === "AGUARDANDO_CONFIRMACAO") {
    if (intencao === "VENDA") {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { observacoes: setEstado(lead.observacoes, ESTADO_VALOR) },
      });
      return NextResponse.json({
        ok: true, isVendedor: true, leadId: lead.id, clienteNome: nomeCliente,
        estado: "AGUARDANDO_VALOR",
        resposta: `Arrasou ${vendedor.nome}! 🎉 Qual foi o valor da venda com ${nomeCliente}?`,
      });
    }
    if (intencao === "PERDA") {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { observacoes: setEstado(lead.observacoes, ESTADO_MOTIVO) },
      });
      return NextResponse.json({
        ok: true, isVendedor: true, leadId: lead.id, clienteNome: nomeCliente,
        estado: "AGUARDANDO_MOTIVO",
        resposta: `Tudo bem ${vendedor.nome}, acontece! Qual foi o motivo da perda com ${nomeCliente}?`,
      });
    }
    return NextResponse.json({
      ok: true, isVendedor: true, leadId: lead.id, clienteNome: nomeCliente,
      estado: "AGUARDANDO_CONFIRMACAO",
      resposta: `${vendedor.nome}, a venda com *${nomeCliente}* aconteceu? Responda sim ou não 😊`,
    });
  }

  // ── ESTADO: AGUARDANDO_VALOR ─────────────────────────────────────────────
  if (estado === "AGUARDANDO_VALOR") {
    const valor = parseValor(mensagem);
    if (valor) {
      // Register sale
      await prisma.venda.create({
        data: { leadId: lead.id, vendedorId: vendedor.id, valor },
      });
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          status: "VENDA_REALIZADA",
          observacoes: setEstado(lead.observacoes, null),
        },
      });
      // Learn from win
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "https://ocrmfacil.com.br"}/api/webhook/vitoria`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id, secret: "crm2026migra" }),
      }).catch(() => null);

      return NextResponse.json({
        ok: true, isVendedor: true, leadId: lead.id, clienteNome: nomeCliente,
        estado: "VENDA_REGISTRADA", valor,
        resposta: `Perfeito! ✅ Venda de *R$ ${valor.toFixed(2).replace(".", ",")}* com *${nomeCliente}* registrada! Vou cuidar do pós-venda com ele agora. Bora pras próximas! 🚀`,
      });
    }
    return NextResponse.json({
      ok: true, isVendedor: true, leadId: lead.id, clienteNome: nomeCliente,
      estado: "AGUARDANDO_VALOR",
      resposta: `Qual foi o valor exato da venda com ${nomeCliente}? Me manda só o número, ex: 1500`,
    });
  }

  // ── ESTADO: AGUARDANDO_MOTIVO ────────────────────────────────────────────
  if (estado === "AGUARDANDO_MOTIVO") {
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: "PERDIDO",
        observacoes: setEstado(lead.observacoes, null) + `\nMotivo perda: ${mensagem}`.trim(),
      },
    });
    return NextResponse.json({
      ok: true, isVendedor: true, leadId: lead.id, clienteNome: nomeCliente,
      estado: "PERDA_REGISTRADA",
      resposta: `Anotado, ${vendedor.nome}. Registrei *${nomeCliente}* como perdido. Obrigado pelo feedback — vou usar isso pra melhorar o próximo atendimento! 💪`,
    });
  }

  return NextResponse.json({ ok: true, isVendedor: true });
}
