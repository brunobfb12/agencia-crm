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

const MOTIVOS_NUMERADOS: Record<string, string> = {
  "1": "Lead não respondeu",
  "2": "Falou que está caro",
  "3": "Não tinha o produto que ele queria",
  "4": "Ainda negociando — retomar depois",
};

function detectarIntencao(msg: string): "VENDA" | "PERDA" | "NEGOCIANDO" | "VALOR" | null {
  const m = msg.toLowerCase().trim();
  if (/[\d]/.test(m) && /[,.]?\d{2}$|^\d+$/.test(m.replace(/[r$\s.]/g, ""))) {
    const num = parseValor(msg);
    if (num && num > 0) return "VALOR";
  }
  if (/\b(sim|s\b|yes|vend|fechei|fechou|deu certo|aconteceu|confirmo|efetuei|1\b)\b/.test(m)) return "VENDA";
  if (/\b(ainda|negociando|negociação|pensando|prazo|retornar|depois|volto|3\b)\b/.test(m)) return "NEGOCIANDO";
  if (/\b(não|nao|n\b|no\b|perdeu|perdi|não rolou|nao rolou|desistiu|cancelou|sem interesse|2\b)\b/.test(m)) return "PERDA";
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

  // @lid fallback: match by name in JS to handle diacritics (e.g. "Thaisy" matches "Thaísy")
  if (!vendedor && isLid && nomeContato) {
    // eslint-disable-next-line no-misleading-character-class
    const normalizar = (s: string) =>
      s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
    const primeiroNomeBusca = normalizar(nomeContato).split(/\s+/)[0];
    if (primeiroNomeBusca.length >= 3) {
      const todosVendedores = await prisma.vendedor.findMany({
        where: { empresaId: empresa.id, ativo: true },
      });
      vendedor = todosVendedores.find(v => {
        const primeiroNomeVend = normalizar(v.nome).split(/\s+/)[0];
        return primeiroNomeVend === primeiroNomeBusca || primeiroNomeVend.startsWith(primeiroNomeBusca) || primeiroNomeBusca.startsWith(primeiroNomeVend);
      }) ?? null;
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
      status: { in: ["NEGOCIACAO", "PRONTO_PARA_COMPRAR", "AGENDADO", "ORCAMENTO_ENVIADO"] },
    },
    orderBy: { atualizadoEm: "desc" },
    include: { cliente: { select: { id: true, nome: true, telefone: true } } },
  });

  if (!lead) {
    return NextResponse.json({
      ok: true,
      isVendedor: true, vendedorTelefone: vendedor.telefone,
      resposta: `Oi ${vendedor.nome}! Não encontrei nenhum lead ativo em negociação no seu nome agora. Se fechar uma venda, me avisa! 😊`,
    });
  }

  const nomeCliente = lead.cliente.nome ?? lead.cliente.telefone;
  const estado = getEstado(lead.observacoes);
  const intencao = detectarIntencao(mensagem);

  // Dentro de 12h do PEDIDO PRONTO o vendedor pode estar apenas reagindo à notificação.
  // Só processa se: passou 12h OU mensagem contém valor explícito (venda imediata).
  const horasEmNegociacao = (Date.now() - new Date((lead as any).atualizadoEm).getTime()) / (1000 * 60 * 60);
  const valorImediato = intencao === "VALOR" && parseValor(mensagem) !== null;
  if (horasEmNegociacao < 12 && !valorImediato) {
    // Limpar estado parcial para não travar em AGUARDANDO_CONFIRMACAO/VALOR
    if (estado !== "INICIAL") {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { observacoes: setEstado(lead.observacoes, null) },
      }).catch(() => null);
    }
    return NextResponse.json({
      ok: true, isVendedor: true, vendedorTelefone: vendedor.telefone, leadId: lead.id,
      resposta: `Oi ${vendedor.nome}! 👋 Recebi sua mensagem sobre *${nomeCliente}*. O pedido já está no sistema — quando fechar é só mandar o valor aqui! 💪`,
    });
  }

  // ── ESTADO: INICIAL — ainda não perguntamos ──────────────────────────────
  if (estado === "INICIAL") {
    if (intencao === "NEGOCIANDO") {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { observacoes: setEstado(lead.observacoes, null) },
      });
      return NextResponse.json({
        ok: true, isVendedor: true, vendedorTelefone: vendedor.telefone, leadId: lead.id,
        resposta: `Ok ${vendedor.nome}! Anotei que *${nomeCliente}* ainda está em negociação. Te aviso novamente em 24h. 💪`,
      });
    }
    if (intencao === "VENDA") {
      // Update to awaiting value
      await prisma.lead.update({
        where: { id: lead.id },
        data: { observacoes: setEstado(lead.observacoes, ESTADO_VALOR) },
      });
      return NextResponse.json({
        ok: true, isVendedor: true, vendedorTelefone: vendedor.telefone, leadId: lead.id, clienteNome: nomeCliente,
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
        ok: true, isVendedor: true, vendedorTelefone: vendedor.telefone, leadId: lead.id, clienteNome: nomeCliente,
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
      ok: true, isVendedor: true, vendedorTelefone: vendedor.telefone, leadId: lead.id, clienteNome: nomeCliente,
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
        ok: true, isVendedor: true, vendedorTelefone: vendedor.telefone, leadId: lead.id, clienteNome: nomeCliente,
        estado: "AGUARDANDO_VALOR",
        resposta: `Arrasou ${vendedor.nome}! 🎉 Qual foi o valor da venda com *${nomeCliente}*? (só o número, ex: 1500)`,
      });
    }
    if (intencao === "NEGOCIANDO") {
      await prisma.lead.update({ where: { id: lead.id }, data: { observacoes: setEstado(lead.observacoes, null) } });
      return NextResponse.json({
        ok: true, isVendedor: true, vendedorTelefone: vendedor.telefone, leadId: lead.id,
        resposta: `Ok! *${nomeCliente}* continua em negociação. Te lembro novamente em 24h. 💪`,
      });
    }
    if (intencao === "PERDA") {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { observacoes: setEstado(lead.observacoes, ESTADO_MOTIVO) },
      });
      return NextResponse.json({
        ok: true, isVendedor: true, vendedorTelefone: vendedor.telefone, leadId: lead.id, clienteNome: nomeCliente,
        estado: "AGUARDANDO_MOTIVO",
        resposta: `Tudo bem, acontece! Qual foi o motivo da perda com *${nomeCliente}*?\n\n*1* Lead não respondeu\n*2* Falou que está caro\n*3* Não tinha o produto\n*4* Outro motivo`,
      });
    }
    return NextResponse.json({
      ok: true, isVendedor: true, vendedorTelefone: vendedor.telefone, leadId: lead.id, clienteNome: nomeCliente,
      estado: "AGUARDANDO_CONFIRMACAO",
      resposta: `${vendedor.nome}, a venda com *${nomeCliente}* aconteceu?\n\n*1* ✅ Sim — me fala o valor\n*2* ❌ Não fechei\n*3* ⏳ Ainda negociando`,
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
        ok: true, isVendedor: true, vendedorTelefone: vendedor.telefone, leadId: lead.id, clienteNome: nomeCliente,
        estado: "VENDA_REGISTRADA", valor,
        resposta: `Perfeito! ✅ Venda de *R$ ${valor.toFixed(2).replace(".", ",")}* com *${nomeCliente}* registrada! Vou cuidar do pós-venda com ele agora. Bora pras próximas! 🚀`,
      });
    }
    return NextResponse.json({
      ok: true, isVendedor: true, vendedorTelefone: vendedor.telefone, leadId: lead.id, clienteNome: nomeCliente,
      estado: "AGUARDANDO_VALOR",
      resposta: `Qual foi o valor exato da venda com ${nomeCliente}? Me manda só o número, ex: 1500`,
    });
  }

  // ── ESTADO: AGUARDANDO_MOTIVO ────────────────────────────────────────────
  if (estado === "AGUARDANDO_MOTIVO") {
    const numMotivo = mensagem.trim();
    const motivoNumerado = MOTIVOS_NUMERADOS[numMotivo];
    const motivo = motivoNumerado ?? mensagem.trim();

    // "4" ou "ainda negociando" → mantém em negociação
    if (numMotivo === "4" || intencao === "NEGOCIANDO") {
      await prisma.lead.update({ where: { id: lead.id }, data: { observacoes: setEstado(lead.observacoes, null) } });
      return NextResponse.json({
        ok: true, isVendedor: true, vendedorTelefone: vendedor.telefone, leadId: lead.id,
        resposta: `Ok! *${nomeCliente}* continua em negociação. Vou lembrar você novamente em 24h. 💪`,
      });
    }

    // "1" = Lead não respondeu → FOLLOW_UP + reengajamento automático via WhatsApp
    if (numMotivo === "1" || motivo.toLowerCase().includes("não respondeu") || motivo.toLowerCase().includes("nao respondeu")) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { status: "FOLLOW_UP", observacoes: setEstado(lead.observacoes, null) + `\nVendedor: lead não respondeu`.trim() },
      });

      const primeiroNome = lead.cliente.nome ? lead.cliente.nome.split(" ")[0] : "";
      const nomeIA = empresa.nomeIA ?? "Eu";
      const msgReengajamento = `Oi${primeiroNome ? ` ${primeiroNome}` : ""}! ${nomeIA} aqui, da ${empresa.nome}. Vi que nosso time tentou falar com você sobre seu pedido. Ainda tem interesse? Já fechou em outro lugar? O que precisa acontecer para fecharmos esse pedido? 😊`;

      const evoUrl = process.env.EVOLUTION_API_URL ?? "http://201.76.43.149:8080";
      const evoKey = process.env.AUTHENTICATION_API_KEY ?? process.env.EVOLUTION_API_KEY ?? "SuaChaveSecreta123";

      await fetch(`${evoUrl}/message/sendText/${empresa.instanciaWhatsapp}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: evoKey },
        body: JSON.stringify({
          number: lead.cliente.telefone,
          text: msgReengajamento,
          options: { presence: "composing", delay: 3000 },
        }),
      }).catch(() => null);

      return NextResponse.json({
        ok: true, isVendedor: true, vendedorTelefone: vendedor.telefone, leadId: lead.id,
        resposta: `Anotado! Já mandei uma mensagem pro *${nomeCliente}* perguntando se ainda tem interesse. Se ele responder, te aviso! 🎯`,
      });
    }

    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: "PERDIDO",
        observacoes: setEstado(lead.observacoes, null) + `\nMotivo perda: ${motivo}`.trim(),
      },
    });
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "https://ocrmfacil.com.br"}/api/webhook/derrota`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: lead.id, secret: "crm2026migra" }),
    }).catch(() => null);
    return NextResponse.json({
      ok: true, isVendedor: true, vendedorTelefone: vendedor.telefone, leadId: lead.id, clienteNome: nomeCliente,
      estado: "PERDA_REGISTRADA",
      resposta: `Anotado! *${nomeCliente}* registrado como perdido — motivo: _${motivo}_. Obrigado pelo feedback, isso vai melhorar os próximos atendimentos! 💪`,
    });
  }

  return NextResponse.json({ ok: true, isVendedor: true, vendedorTelefone: vendedor.telefone });
}
