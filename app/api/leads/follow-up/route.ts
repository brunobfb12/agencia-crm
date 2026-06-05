import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("secret") !== "crm2026migra") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const windowStart = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days - 1);
    return d;
  };
  const windowEnd = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d;
  };

  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const baseInclude = {
    cliente: { select: { nome: true, telefone: true } },
    empresa: { select: { nome: true, instanciaWhatsapp: true, nomeIA: true, mensagemPosVenda: true, mensagemAniversario: true } },
    vendedor: { select: { nome: true } },
  };

  const d60 = new Date(now);
  d60.setDate(d60.getDate() - 60);
  const d75 = new Date(now);
  d75.setDate(d75.getDate() - 75);
  const d90 = new Date(now);
  d90.setDate(d90.getDate() - 90);

  const h24 = new Date(now); h24.setHours(h24.getHours() - 24);
  const h48 = new Date(now); h48.setHours(h48.getHours() - 48);
  const h72 = new Date(now); h72.setHours(h72.getHours() - 72);
  const h96 = new Date(now); h96.setHours(h96.getHours() - 96);
  const h120 = new Date(now); h120.setHours(h120.getHours() - 120);

  const [posVenda, reativacao15d, reativacao30d, recontatos, allAniversarios, semResposta60d, inativos30d, aquecimentoD1, aquecimentoD2, aquecimentoSemResposta, semInteresse75d, reativacao90d] = await Promise.all([
    prisma.lead.findMany({
      where: {
        status: "VENDA_REALIZADA",
        atualizadoEm: { gte: windowStart(2), lt: windowEnd(2) },
        empresa: { ativa: true },
        cliente: { telefone: { not: "" } },
      },
      include: baseInclude,
    }),
    prisma.lead.findMany({
      where: {
        status: "FOLLOW_UP",
        dataRecontato: null,
        atualizadoEm: { gte: windowStart(15), lt: windowEnd(15) },
        empresa: { ativa: true },
        cliente: { telefone: { not: "" } },
      },
      include: baseInclude,
    }),
    prisma.lead.findMany({
      where: {
        status: "FOLLOW_UP",
        dataRecontato: null,
        atualizadoEm: { gte: windowStart(30), lt: windowEnd(30) },
        empresa: { ativa: true },
        cliente: { telefone: { not: "" } },
      },
      include: baseInclude,
    }),
    prisma.lead.findMany({
      where: {
        status: { notIn: ["PERDIDO", "SEM_INTERESSE", "SEM_RESPOSTA", "VENDA_REALIZADA", "POS_VENDA", "AGENDADO", "NEGOCIACAO"] },
        dataRecontato: { lte: todayEnd },
        empresa: { ativa: true },
        cliente: { telefone: { not: "" } },
      },
      include: baseInclude,
    }),
    // Birthday: leads with dataNascimento set, not lost
    prisma.lead.findMany({
      where: {
        status: { notIn: ["PERDIDO", "SEM_INTERESSE", "SEM_RESPOSTA"] },
        empresa: { ativa: true },
        cliente: { dataNascimento: { not: null }, telefone: { not: "" } },
      },
      include: {
        cliente: { select: { nome: true, telefone: true, dataNascimento: true } },
        empresa: { select: { nome: true, instanciaWhatsapp: true, nomeIA: true, mensagemPosVenda: true, mensagemAniversario: true } },
        vendedor: { select: { nome: true, telefone: true } },
      },
    }),
    // Conversa Franca: SEM_RESPOSTA há 60+ dias — IA pergunta diretamente se ainda há interesse
    prisma.lead.findMany({
      where: {
        status: "SEM_RESPOSTA",
        atualizadoEm: { lt: d60 },
        empresa: { ativa: true },
        cliente: { telefone: { not: "" } },
      },
      include: baseInclude,
    }),
    // LEAD sem atividade 30+ dias → auto SEM_RESPOSTA (nunca chegou a ter contato)
    prisma.lead.findMany({
      where: {
        status: "LEAD",
        atualizadoEm: { lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
        empresa: { ativa: true },
      },
      select: { id: true },
    }),
    // AQUECIMENTO D+1: parado entre 24-48h → primeiro toque
    prisma.lead.findMany({
      where: {
        status: "AQUECIMENTO",
        atualizadoEm: { gte: h48, lt: h24 },
        empresa: { ativa: true },
        cliente: { telefone: { not: "" } },
      },
      include: baseInclude,
    }),
    // AQUECIMENTO D+2: parado entre 48-72h → segundo toque
    prisma.lead.findMany({
      where: {
        status: "AQUECIMENTO",
        atualizadoEm: { gte: h72, lt: h48 },
        empresa: { ativa: true },
        cliente: { telefone: { not: "" } },
      },
      include: baseInclude,
    }),
    // AQUECIMENTO 72h+ sem atividade → SEM_RESPOSTA (dois toques ignorados)
    // Leads com score ≥ 6 ou pedido confirmado ficam retidos — vão para pressão do vendedor
    prisma.lead.findMany({
      where: {
        status: "AQUECIMENTO",
        atualizadoEm: { lt: h72 },
        empresa: { ativa: true },
      },
      select: { id: true, score: true, observacoes: true, vendedorId: true,
        cliente: { select: { nome: true, telefone: true } },
        empresa: { select: { id: true, nome: true, instanciaWhatsapp: true, nomeIA: true } },
        vendedor: { select: { nome: true, telefone: true } },
      },
    }),
    // #4: SEM_RESPOSTA 75+ dias → auto SEM_INTERESSE (conversa franca ignorada há 15d+)
    prisma.lead.findMany({
      where: {
        status: "SEM_RESPOSTA",
        atualizadoEm: { lt: d75 },
        empresa: { ativa: true },
      },
      select: { id: true },
    }),
    // #6: SEM_INTERESSE 90+ dias → mensagem leve de reativação
    prisma.lead.findMany({
      where: {
        status: "SEM_INTERESSE",
        atualizadoEm: { lt: d90 },
        empresa: { ativa: true },
        cliente: { telefone: { not: "" } },
      },
      include: baseInclude,
    }),
  ]);

  // P2.1: LEAD → AQUECIMENTO (respondeu + parado 24-48h)
  const leadParaAquecimento = await prisma.lead.findMany({
    where: {
      status: "LEAD",
      atualizadoEm: { gte: h48, lt: h24 },
      empresa: { ativa: true },
      cliente: { telefone: { not: "" } },
    },
    include: baseInclude,
  });

  const [leadD1, leadD2] = await Promise.all([
    prisma.lead.findMany({
      where: { status: "LEAD", atualizadoEm: { gte: h48, lt: h24 }, empresa: { ativa: true }, cliente: { telefone: { not: "" } } },
      include: baseInclude,
    }),
    prisma.lead.findMany({
      where: { status: "LEAD", atualizadoEm: { gte: h72, lt: h48 }, empresa: { ativa: true }, cliente: { telefone: { not: "" } } },
      include: baseInclude,
    }),
  ]);

  // P2.2: AQUECIMENTO "quente" → PRONTO_PARA_COMPRAR (score ≥6 + CONFIRMADO + P72 + 24-48h)
  const aquecimentoParaProto = await prisma.lead.findMany({
    where: {
      status: "AQUECIMENTO",
      score: { gte: 6 },
      observacoes: { contains: "CONFIRMADO" },
      atualizadoEm: { gte: h72, lt: h48 },
      empresa: { ativa: true },
      vendedorId: { not: null },
      cliente: { telefone: { not: "" } },
    },
    include: {
      cliente: { select: { nome: true, telefone: true } },
      empresa: { select: { id: true, nome: true, instanciaWhatsapp: true } },
      vendedor: { select: { nome: true, telefone: true } },
    },
  });

  // P3.1: AGENDADO 48h+ sem resposta → FOLLOW_UP (no-show)
  const agendadoNoShow = await prisma.lead.findMany({
    where: {
      status: "AGENDADO",
      atualizadoEm: { lt: new Date(now.getTime() - 48 * 60 * 60 * 1000) },
      empresa: { ativa: true },
      cliente: { telefone: { not: "" } },
    },
    include: baseInclude,
  });

  // P3.2: NEGOCIACAO parado 14d+ (P72 + 7d) → FOLLOW_UP
  const negociacaoTimeout = await prisma.lead.findMany({
    where: {
      status: "NEGOCIACAO",
      observacoes: { contains: "[P72]" },
      atualizadoEm: { lt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) },
      empresa: { ativa: true },
      vendedorId: { not: null },
      cliente: { telefone: { not: "" } },
    },
    include: {
      cliente: { select: { nome: true, telefone: true } },
      empresa: { select: { id: true, nome: true, instanciaWhatsapp: true } },
      vendedor: { select: { nome: true, telefone: true } },
    },
  });

  // P3.3: FOLLOW_UP com dataRecontato vencido 7d+ → SEM_RESPOSTA
  const followupVencido = await prisma.lead.findMany({
    where: {
      status: "FOLLOW_UP",
      dataRecontato: { lte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      atualizadoEm: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      empresa: { ativa: true },
      cliente: { telefone: { not: "" } },
    },
    include: baseInclude,
  });

  // PRONTO_PARA_COMPRAR / NEGOCIACAO parado:
  //   PC1 = 96h+ com [P72] → conversa franca pro cliente
  //   PC2 = 120h+ com [PC1] sem resposta → FOLLOW_UP
  const [prontoConversa, prontoFollowUp] = await Promise.all([
    prisma.lead.findMany({
      where: {
        status: { in: ["PRONTO_PARA_COMPRAR", "NEGOCIACAO"] },
        observacoes: { contains: "[P72]" },
        NOT: { observacoes: { contains: "[PC1]" } },
        atualizadoEm: { lt: h96 },
        empresa: { ativa: true },
        cliente: { telefone: { not: "" } },
      },
      include: baseInclude,
    }),
    prisma.lead.findMany({
      where: {
        status: { in: ["PRONTO_PARA_COMPRAR", "NEGOCIACAO"] },
        observacoes: { contains: "[PC1]" },
        NOT: { observacoes: { contains: "[PC2]" } },
        atualizadoEm: { lt: h120 },
        empresa: { ativa: true },
      },
      select: { id: true, observacoes: true },
    }),
  ]);

  // Calendário de relacionamento por compra — D+7, D+20, D+28, D+45 desde última venda
  const [vendasD7, vendasD20, vendasD28, vendasD45] = await Promise.all([
    prisma.venda.findMany({
      where: {
        criadoEm: { gte: windowStart(7), lt: windowEnd(7) },
        status: { not: "CANCELADA" },
        lead: { status: { in: ["POS_VENDA", "FOLLOW_UP"] }, empresa: { ativa: true }, cliente: { telefone: { not: "" } } },
      },
      include: { lead: { include: { cliente: { select: { nome: true, telefone: true } }, empresa: { select: { nome: true, instanciaWhatsapp: true, nomeIA: true } } } } },
    }),
    prisma.venda.findMany({
      where: {
        criadoEm: { gte: windowStart(20), lt: windowEnd(20) },
        status: { not: "CANCELADA" },
        lead: { status: { in: ["POS_VENDA", "FOLLOW_UP"] }, empresa: { ativa: true }, cliente: { telefone: { not: "" } } },
      },
      include: { lead: { include: { cliente: { select: { nome: true, telefone: true } }, empresa: { select: { nome: true, instanciaWhatsapp: true, nomeIA: true } } } } },
    }),
    prisma.venda.findMany({
      where: {
        criadoEm: { gte: windowStart(28), lt: windowEnd(28) },
        status: { not: "CANCELADA" },
        lead: { status: { in: ["POS_VENDA", "FOLLOW_UP"] }, empresa: { ativa: true }, cliente: { telefone: { not: "" } } },
      },
      include: { lead: { include: { cliente: { select: { nome: true, telefone: true } }, empresa: { select: { nome: true, instanciaWhatsapp: true, nomeIA: true } } } } },
    }),
    prisma.venda.findMany({
      where: {
        criadoEm: { gte: windowStart(45), lt: windowEnd(45) },
        status: { not: "CANCELADA" },
        lead: { status: { in: ["POS_VENDA", "FOLLOW_UP"] }, empresa: { ativa: true }, cliente: { telefone: { not: "" } } },
      },
      include: { lead: { include: { cliente: { select: { nome: true, telefone: true } }, empresa: { select: { nome: true, instanciaWhatsapp: true, nomeIA: true } } } } },
    }),
  ]);

  const pressaoInclude = {
    cliente: { select: { nome: true, telefone: true } },
    empresa: { select: { id: true, nome: true, instanciaWhatsapp: true } },
    vendedor: { select: { nome: true, telefone: true } },
  };

  function resumoPedido(obs: string | null): string {
    if (!obs) return "";
    const match = obs.match(/[Pp]edido[:\s]+([^|\\n]+)/);
    if (match) return match[1].trim().slice(0, 120);
    return obs.split(/[|\n]/)[0].trim().slice(0, 120);
  }

  function msgPressao(vendedorNome: string, clienteNome: string, horas: number, obs: string | null): string {
    const pedido = resumoPedido(obs);
    const pedidoStr = pedido ? `\n📋 *Pedido:* ${pedido}\n` : "\n";
    return `Oi ${vendedorNome}! 👋\n\nO lead *${clienteNome}* aguarda há ${horas}h.${pedidoStr}\nFechou a venda?\n*1* ✅ Sim — me fala o valor\n*2* ❌ Não fechei\n*3* ⏳ Ainda negociando`;
  }

  const [pressao24h, pressao48h, pressao72h] = await Promise.all([
    prisma.lead.findMany({
      where: { status: { in: ["NEGOCIACAO", "PRONTO_PARA_COMPRAR", "AGENDADO"] }, vendedorId: { not: null }, atualizadoEm: { gte: h48, lt: h24 }, empresa: { ativa: true } },
      include: pressaoInclude,
    }),
    prisma.lead.findMany({
      where: { status: { in: ["NEGOCIACAO", "PRONTO_PARA_COMPRAR", "AGENDADO"] }, vendedorId: { not: null }, atualizadoEm: { gte: h72, lt: h48 }, empresa: { ativa: true } },
      include: pressaoInclude,
    }),
    prisma.lead.findMany({
      where: { status: { in: ["NEGOCIACAO", "PRONTO_PARA_COMPRAR", "AGENDADO"] }, vendedorId: { not: null }, atualizadoEm: { lt: h72 }, empresa: { ativa: true } },
      include: pressaoInclude,
    }),
  ]);

  // Item G: modoHumano automático para leads parados há 72h+
  if (pressao72h.length > 0) {
    const clienteIds72h = pressao72h.map(l => (l as any).clienteId).filter(Boolean);
    if (clienteIds72h.length > 0) {
      const conversas72h = await prisma.conversa.findMany({
        where: { clienteId: { in: clienteIds72h } },
        orderBy: { ultimaAtividade: "desc" },
        distinct: ["clienteId"],
        select: { id: true },
      });
      if (conversas72h.length > 0) {
        await prisma.conversa.updateMany({
          where: { id: { in: conversas72h.map((c: { id: string }) => c.id) } },
          data: { modoHumano: true },
        });
      }
    }
  }

  const empresaIds72h = [...new Set(pressao72h.map(l => l.empresa.id))];
  const gerentes72h = empresaIds72h.length > 0
    ? await prisma.vendedor.findMany({
        where: { empresaId: { in: empresaIds72h }, cargo: "GERENTE", ativo: true },
        select: { empresaId: true, nome: true, telefone: true },
      })
    : [];
  const gerenteMap = new Map(gerentes72h.map(g => [g.empresaId, g]));

  // Auto-transição: VENDA_REALIZADA → POS_VENDA ao detectar para envio
  if (posVenda.length > 0) {
    await prisma.lead.updateMany({
      where: { id: { in: posVenda.map(l => l.id) } },
      data: { status: "POS_VENDA" },
    });
  }

  // Auto-transição: FOLLOW_UP sem resposta há 30 dias → SEM_RESPOSTA (limite de tentativas)
  if (reativacao30d.length > 0) {
    await prisma.lead.updateMany({
      where: { id: { in: reativacao30d.map(l => l.id) } },
      data: { status: "SEM_RESPOSTA" },
    });
  }

  // LEAD sem atividade 30+ dias → SEM_RESPOSTA
  if (inativos30d.length > 0) {
    await prisma.lead.updateMany({
      where: { id: { in: inativos30d.map(l => l.id) } },
      data: { status: "SEM_RESPOSTA" },
    });
  }

  // PC2: PRONTO_PARA_COMPRAR + [PC1] + sem resposta 1 dia → FOLLOW_UP
  if (prontoFollowUp.length > 0) {
    await Promise.all(
      prontoFollowUp.map((l: any) => prisma.lead.update({
        where: { id: l.id },
        data: {
          status: "FOLLOW_UP",
          observacoes: ((l.observacoes ?? "") + "\n[PC2]").trim(),
        },
      }))
    );
  }

  // AQUECIMENTO 72h+ → SEM_RESPOSTA, mas protege leads com interesse confirmado
  type AqLead = { id: string; score: number; observacoes: string | null; vendedorId: string | null;
    cliente: { nome: string | null; telefone: string }; empresa: { id: string; nome: string; instanciaWhatsapp: string | null; nomeIA: string | null };
    vendedor: { nome: string; telefone: string } | null };
  const aqLeads = aquecimentoSemResposta as unknown as AqLead[];

  // Quentes: score ≥ 6 OU observacoes tem "CONFIRMADO" → retém, notifica vendedor
  const aqQuentes = aqLeads.filter(l =>
    (l.score ?? 0) >= 6 || (l.observacoes ?? "").includes("CONFIRMADO")
  );
  // Frios: sem sinal de interesse real → SEM_RESPOSTA normalmente
  const aqFrios = aqLeads.filter(l =>
    (l.score ?? 0) < 6 && !(l.observacoes ?? "").includes("CONFIRMADO")
  );

  if (aqFrios.length > 0) {
    await prisma.lead.updateMany({
      where: { id: { in: aqFrios.map(l => l.id) } },
      data: { status: "SEM_RESPOSTA" },
    });
  }

  // P2.1: Auto-transição LEAD → AQUECIMENTO
  if (leadParaAquecimento.length > 0) {
    await prisma.lead.updateMany({
      where: { id: { in: leadParaAquecimento.map(l => l.id) } },
      data: { status: "AQUECIMENTO" },
    });
  }

  // P3.1: Auto-transição AGENDADO no-show (48h) → FOLLOW_UP
  if (agendadoNoShow.length > 0) {
    await Promise.all(
      agendadoNoShow.map(l =>
        prisma.lead.update({
          where: { id: l.id },
          data: {
            status: "FOLLOW_UP",
            dataRecontato: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
            observacoes: ((l.observacoes ?? "") + "\n[P3_NOSHOW_REACTIVE]").trim(),
          },
        })
      )
    );
  }

  // P3.2: Auto-transição NEGOCIACAO timeout (14d) → FOLLOW_UP + notifica gerente
  if (negociacaoTimeout.length > 0) {
    await Promise.all(
      negociacaoTimeout.map(l =>
        prisma.lead.update({
          where: { id: l.id },
          data: {
            status: "FOLLOW_UP",
            dataRecontato: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            observacoes: ((l.observacoes ?? "") + "\n[P3_TIMEOUT_VEND]").trim(),
          },
        })
      )
    );

    // Notificar gerente sobre vendedores negligenciados
    const gerentesP3 = await prisma.vendedor.findMany({
      where: { cargo: "GERENTE", ativo: true },
      select: { empresaId: true, nome: true, telefone: true },
    });
    const gerenteMapP3 = new Map(gerentesP3.map(g => [g.empresaId, g]));

    for (const l of negociacaoTimeout) {
      const gerente = gerenteMapP3.get(l.empresa.id);
      if (gerente?.telefone) {
        const nc = l.cliente.nome || l.cliente.telefone;
        items.push({
          tipo: "pressao_p3_timeout",
          leadId: l.id,
          clienteTelefone: gerente.telefone,
          clienteNome: gerente.nome,
          instancia: l.empresa.instanciaWhatsapp!,
          empresaNome: l.empresa.nome,
          mensagem: `🔴 CRÍTICO: Lead *${nc}* parado 14d+ em NEGOCIACAO. Vendedor ${l.vendedor?.nome ?? "não atribuído"} negligenciado. Movido para FOLLOW_UP automático.`,
        });
      }
    }
  }

  // P3.3: Auto-transição FOLLOW_UP dataRecontato vencido (7d) → SEM_RESPOSTA
  if (followupVencido.length > 0) {
    await Promise.all(
      followupVencido.map(l =>
        prisma.lead.update({
          where: { id: l.id },
          data: {
            status: "SEM_RESPOSTA",
            observacoes: ((l.observacoes ?? "") + "\n[P3_FOLLOWUP_VENCIDO]").trim(),
          },
        })
      )
    );
  }

  // P2.2: Auto-transição AQUECIMENTO "quente" → PRONTO_PARA_COMPRAR + notificar vendedor
  if (aquecimentoParaProto.length > 0) {
    await Promise.all(
      aquecimentoParaProto.map(l =>
        prisma.lead.update({
          where: { id: l.id },
          data: {
            status: "PRONTO_PARA_COMPRAR",
            observacoes: ((l.observacoes ?? "") + "\n[P2_AUTO_PRONTO]").trim(),
          },
        })
      )
    );

    for (const l of aquecimentoParaProto) {
      if (!l.empresa.instanciaWhatsapp || !l.vendedor?.telefone) continue;
      const nc = l.cliente.nome || l.cliente.telefone;
      const pedido = resumoPedido(l.observacoes);
      const pedidoStr = pedido ? `\n📋 *Pedido:* ${pedido}` : "";
      items.push({
        tipo: "pressao_p2_quente_pronto",
        leadId: l.id,
        clienteTelefone: l.vendedor.telefone,
        clienteNome: l.vendedor.nome,
        instancia: l.empresa.instanciaWhatsapp,
        empresaNome: l.empresa.nome,
        mensagem: `🚀 Oi ${l.vendedor.nome}! O lead *${nc}* foi movido para PRONTO_PARA_COMPRAR!${pedidoStr}\n\nO pedido está confirmado — chama AGORA! ⚡`,
      });
    }
  }

  // Quentes: notifica vendedor e mantém em AQUECIMENTO
  for (const l of aqQuentes) {
    if (!l.empresa.instanciaWhatsapp || !l.vendedorId || !l.vendedor?.telefone) continue;
    const nc = l.cliente.nome || l.cliente.telefone;
    const pedido = resumoPedido(l.observacoes);
    const pedidoStr = pedido ? `\n📋 *Pedido:* ${pedido}` : "";
    items.push({
      tipo: "pressao_vendedor_aquecimento",
      leadId: l.id,
      clienteTelefone: l.vendedor.telefone,
      clienteNome: l.vendedor.nome,
      instancia: l.empresa.instanciaWhatsapp,
      empresaNome: l.empresa.nome,
      mensagem: `⚠️ Oi ${l.vendedor.nome}! O lead *${nc}* está parado há 72h mas tem pedido confirmado.${pedidoStr}\n\nEntre em contato agora antes de perder essa venda! 👊`,
    });
  }

  // #4: SEM_RESPOSTA 75+ dias sem resposta → SEM_INTERESSE (conversas_franca enviada e ignorada)
  if (semInteresse75d.length > 0) {
    await prisma.lead.updateMany({
      where: { id: { in: semInteresse75d.map(l => l.id) } },
      data: { status: "SEM_INTERESSE" },
    });
  }

  // Filter birthday leads for today (month + day match) — use UTC to match stored dates
  const todayMonth = now.getUTCMonth() + 1;
  const todayDay = now.getUTCDate();
  const aniversarios = allAniversarios.filter(l => {
    if (!l.cliente.dataNascimento || !l.empresa.instanciaWhatsapp) return false;
    const d = new Date(l.cliente.dataNascimento);
    return (d.getUTCMonth() + 1) === todayMonth && d.getUTCDate() === todayDay;
  });

  type Item = {
    tipo: string;
    leadId: string;
    clienteTelefone: string;
    clienteNome: string;
    instancia: string;
    empresaNome: string;
    mensagem: string;
  };

  const buildItem = (lead: typeof posVenda[0], tipo: string, mensagem: string): Item => ({
    tipo,
    leadId: lead.id,
    clienteTelefone: lead.cliente.telefone,
    clienteNome: lead.cliente.nome ?? lead.cliente.telefone,
    instancia: lead.empresa.instanciaWhatsapp!,
    empresaNome: lead.empresa.nome,
    mensagem,
  });

  const items: Item[] = [
    ...posVenda
      .filter(l => l.empresa.instanciaWhatsapp)
      .map(l => {
        const primeiroNome = l.cliente.nome ? l.cliente.nome.split(" ")[0] : "";
        const nome = primeiroNome ? ` ${primeiroNome}` : "";
        const ia = l.empresa.nomeIA ?? "Eu";
        const mensagem = l.empresa.mensagemPosVenda
          ? l.empresa.mensagemPosVenda
              .replace(/\{nome\}/g, primeiroNome)
              .replace(/\{ia\}/g, ia)
              .replace(/\{empresa\}/g, l.empresa.nome)
          : `Oi${nome}! 😊 ${ia} aqui, da ${l.empresa.nome}. Tudo certo com seu pedido? Se tiver qualquer dúvida ou precisar de algo, estou à disposição!`;
        return buildItem(l, "pos_venda", mensagem);
      }),

    ...reativacao15d
      .filter(l => l.empresa.instanciaWhatsapp)
      .map(l => {
        const nome = l.cliente.nome ? ` ${l.cliente.nome.split(" ")[0]}` : "";
        const ia = l.empresa.nomeIA ?? "Eu";
        return buildItem(l, "reativacao_15d",
          `Oi${nome}! ${ia} aqui, da ${l.empresa.nome}. Faz um tempo que não conversamos! 😊 Temos novidades que podem te interessar. Quer dar uma olhada?`
        );
      }),

    ...reativacao30d
      .filter(l => l.empresa.instanciaWhatsapp)
      .map(l => {
        const nome = l.cliente.nome ? ` ${l.cliente.nome.split(" ")[0]}` : "";
        const ia = l.empresa.nomeIA ?? "Eu";
        return buildItem(l, "reativacao_30d",
          `Oi${nome}! Sentimos sua falta por aqui! 🙏 Preparamos uma condição especial pensando em você. Posso te contar?`
        );
      }),

    ...recontatos
      .filter(l => l.empresa.instanciaWhatsapp)
      .map(l => {
        const nome = l.cliente.nome ? ` ${l.cliente.nome.split(" ")[0]}` : "";
        const ia = l.empresa.nomeIA ?? "Eu";
        return buildItem(l, "recontato_agendado",
          `Oi${nome}! 😊 ${ia} aqui, da ${l.empresa.nome}. Passando pra ver se consigo te ajudar a agendar ou se ficou alguma dúvida! Como posso te atender?`
        );
      }),

    ...aquecimentoD1
      .filter((l: typeof posVenda[0]) => l.empresa.instanciaWhatsapp && !(((l as any).observacoes ?? "").includes("[AQ1]")))
      .map((l: typeof posVenda[0]) => {
        const nome = l.cliente.nome ? ` ${l.cliente.nome.split(" ")[0]}` : "";
        const ia = l.empresa.nomeIA ?? "Eu";
        return buildItem(l, "aquecimento_d1",
          `Oi${nome}! ${ia} aqui, da ${l.empresa.nome}. Vi que conversamos ontem — ficou alguma dúvida ou posso te ajudar a finalizar? 😊`
        );
      }),

    ...aquecimentoD2
      .filter((l: typeof posVenda[0]) => l.empresa.instanciaWhatsapp && !(((l as any).observacoes ?? "").includes("[AQ2]")))
      .map((l: typeof posVenda[0]) => {
        const nome = l.cliente.nome ? ` ${l.cliente.nome.split(" ")[0]}` : "";
        const ia = l.empresa.nomeIA ?? "Eu";
        return buildItem(l, "aquecimento_d2",
          `Oi${nome}! Última tentativa por aqui — se ainda precisar de algo da ${l.empresa.nome}, é só me chamar! 🙌`
        );
      }),

  ];

  // Birthday items
  for (const l of aniversarios) {
    if (!l.empresa.instanciaWhatsapp) continue;

    const primeiroNome = l.cliente.nome ? l.cliente.nome.split(" ")[0] : "";
    const nome = primeiroNome ? ` ${primeiroNome}` : "";
    const ia = l.empresa.nomeIA ?? "Eu";
    const idade = l.cliente.dataNascimento
      ? now.getFullYear() - new Date(l.cliente.dataNascimento).getFullYear()
      : null;

    // Message to the client
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tmplAniv: string | null | undefined = (l.empresa as any).mensagemAniversario;
    const mensagemAniv = tmplAniv
      ? tmplAniv.replace(/\{nome\}/g, primeiroNome).replace(/\{ia\}/g, ia).replace(/\{empresa\}/g, l.empresa.nome)
      : `Oi${nome}! 🎂 ${ia} aqui, da ${l.empresa.nome}. Hoje é um dia muito especial — feliz aniversário! Que seja um dia incrível! 🥳`;

    items.push({
      tipo: "aniversario",
      leadId: l.id,
      clienteTelefone: l.cliente.telefone,
      clienteNome: l.cliente.nome ?? l.cliente.telefone,
      instancia: l.empresa.instanciaWhatsapp,
      empresaNome: l.empresa.nome,
      mensagem: mensagemAniv,
    });

    // Notification to the vendor (if assigned and has phone)
    if (l.vendedor?.telefone) {
      const nomeCliente = l.cliente.nome || "o cliente";
      const idadeStr = idade ? ` Ele(a) faz ${idade} anos.` : "";
      items.push({
        tipo: "aniversario_vendedor",
        leadId: l.id,
        clienteTelefone: l.vendedor.telefone,
        clienteNome: l.vendedor.nome,
        instancia: l.empresa.instanciaWhatsapp,
        empresaNome: l.empresa.nome,
        mensagem: `🎂 Hoje é aniversário de *${nomeCliente}*!${idadeStr} Ligue ou mande uma mensagem especial para ele(a). 😊`,
      });
    }
  }

  // Deduplicação de pressão: só envia se o flag ainda não estiver no observacoes
  const p24Novos = pressao24h.filter(l =>
    l.empresa.instanciaWhatsapp && l.vendedor?.telefone &&
    !(((l as any).observacoes ?? "").includes("[P24]"))
  );
  const p48Novos = pressao48h.filter(l =>
    l.empresa.instanciaWhatsapp && l.vendedor?.telefone &&
    !(((l as any).observacoes ?? "").includes("[P48]"))
  );
  const p72Novos = pressao72h.filter(l =>
    l.empresa.instanciaWhatsapp &&
    !(((l as any).observacoes ?? "").includes("[P72]"))
  );

  // Marcar todos como enviados antes de retornar (evita duplicatas em crons simultâneos)
  const aq1Novos = aquecimentoD1.filter((l: typeof posVenda[0]) => l.empresa.instanciaWhatsapp && !(((l as any).observacoes ?? "").includes("[AQ1]")));
  const aq2Novos = aquecimentoD2.filter((l: typeof posVenda[0]) => l.empresa.instanciaWhatsapp && !(((l as any).observacoes ?? "").includes("[AQ2]")));
  const ld1Novos = (leadD1 as any[]).filter(l => l.empresa?.instanciaWhatsapp && !((l.observacoes ?? "").includes("[LD1]")));
  const ld2Novos = (leadD2 as any[]).filter(l => l.empresa?.instanciaWhatsapp && !((l.observacoes ?? "").includes("[LD2]")));

  const pc1Novos = (prontoConversa as any[]).filter(l => l.empresa?.instanciaWhatsapp && !((l.observacoes ?? "").includes("[PC1]")));

  if (p24Novos.length > 0 || p48Novos.length > 0 || p72Novos.length > 0 || aq1Novos.length > 0 || aq2Novos.length > 0 || ld1Novos.length > 0 || ld2Novos.length > 0 || pc1Novos.length > 0) {
    await Promise.all([
      ...p24Novos.map(l => prisma.lead.update({ where: { id: l.id }, data: { observacoes: (((l as any).observacoes ?? "") + "\n[P24]").trim() } })),
      ...p48Novos.map(l => prisma.lead.update({ where: { id: l.id }, data: { observacoes: (((l as any).observacoes ?? "") + "\n[P48]").trim() } })),
      ...p72Novos.map(l => prisma.lead.update({ where: { id: l.id }, data: { observacoes: (((l as any).observacoes ?? "") + "\n[P72]").trim() } })),
      ...aq1Novos.map((l: typeof posVenda[0]) => prisma.lead.update({ where: { id: l.id }, data: { observacoes: (((l as any).observacoes ?? "") + "\n[AQ1]").trim() } })),
      ...aq2Novos.map((l: typeof posVenda[0]) => prisma.lead.update({ where: { id: l.id }, data: { observacoes: (((l as any).observacoes ?? "") + "\n[AQ2]").trim() } })),
      ...ld1Novos.map((l: any) => prisma.lead.update({ where: { id: l.id }, data: { observacoes: ((l.observacoes ?? "") + "\n[LD1]").trim() } })),
      ...ld2Novos.map((l: any) => prisma.lead.update({ where: { id: l.id }, data: { observacoes: ((l.observacoes ?? "") + "\n[LD2]").trim() } })),
      ...pc1Novos.map((l: any) => prisma.lead.update({ where: { id: l.id }, data: { observacoes: ((l.observacoes ?? "") + "\n[PC1]").trim() } })),
    ]);
  }

  // Consolidar pressão por vendedor: P24 + P48 + P72 → 1 link por vendedor
  const pressaoPorVendedor = new Map<string, { vendedor: any; qtd: number; instancia: string; empresaNome: string }>();

  for (const l of [...p24Novos, ...p48Novos, ...p72Novos]) {
    if (!l.vendedor?.telefone || !l.vendedor.token) continue;
    if (!pressaoPorVendedor.has(l.vendedorId!)) {
      pressaoPorVendedor.set(l.vendedorId!, {
        vendedor: l.vendedor,
        qtd: 0,
        instancia: l.empresa.instanciaWhatsapp!,
        empresaNome: l.empresa.nome,
      });
    }
    const entry = pressaoPorVendedor.get(l.vendedorId!)!;
    entry.qtd++;
  }

  // Enviar link para cada vendedor com leads em pressão
  const evoUrl = process.env.EVOLUTION_API_URL ?? "http://201.76.43.149:8080";
  const evoKey = process.env.AUTHENTICATION_API_KEY ?? process.env.EVOLUTION_API_KEY ?? "SuaChaveSecreta123";

  for (const [vendedorId, entry] of pressaoPorVendedor) {
    if (!entry.vendedor.token || !entry.instancia) continue;
    const msg = `⚡ *${entry.vendedor.nome}*, você tem *${entry.qtd} orçamento${entry.qtd !== 1 ? "s" : ""}* esperando sua resposta!\n\nClique e responda em 1 minuto:\n👉 https://ocrmfacil.com.br/v/${entry.vendedor.token}`;

    // Enviar via Evolution API
    await fetch(`${evoUrl}/message/sendText/${entry.instancia}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: evoKey },
      body: JSON.stringify({
        number: entry.vendedor.telefone,
        text: msg,
        options: { presence: "composing", delay: 2000 },
      }),
    }).catch(() => null);

    // Atualizar ultimoLinkPressaoEm
    await prisma.vendedor.update({
      where: { id: vendedorId },
      data: { ultimoLinkPressaoEm: now },
    }).catch(() => null);
  }

  for (const l of ld1Novos) {
    const nome = l.cliente.nome ? ` ${l.cliente.nome.split(" ")[0]}` : "";
    const ia = l.empresa.nomeIA ?? "Eu";
    items.push({
      tipo: "lead_d1", leadId: l.id,
      clienteTelefone: l.cliente.telefone,
      clienteNome: l.cliente.nome ?? l.cliente.telefone,
      instancia: l.empresa.instanciaWhatsapp,
      empresaNome: l.empresa.nome,
      mensagem: `Oi${nome}! ${ia} aqui, da ${l.empresa.nome}. Vi que você entrou em contato — ficou alguma dúvida? Ainda tem interesse?`,
    });
  }

  for (const l of ld2Novos) {
    const nome = l.cliente.nome ? ` ${l.cliente.nome.split(" ")[0]}` : "";
    const ia = l.empresa.nomeIA ?? "Eu";
    items.push({
      tipo: "lead_d2", leadId: l.id,
      clienteTelefone: l.cliente.telefone,
      clienteNome: l.cliente.nome ?? l.cliente.telefone,
      instancia: l.empresa.instanciaWhatsapp,
      empresaNome: l.empresa.nome,
      mensagem: `Oi${nome}! ${ia} aqui, da ${l.empresa.nome}. Última tentativa — Podemos encerrar esse contato? Se precisar de algo é só chamar aqui!`,
    });
  }

  // PC1: conversa franca para leads PRONTO_PARA_COMPRAR parados 96h+
  for (const l of pc1Novos) {
    const nome = l.cliente.nome ? ` ${l.cliente.nome.split(" ")[0]}` : "";
    const ia = l.empresa.nomeIA ?? "Eu";
    items.push({
      tipo: "pronto_conversa_franca", leadId: l.id,
      clienteTelefone: l.cliente.telefone,
      clienteNome: l.cliente.nome ?? l.cliente.telefone,
      instancia: l.empresa.instanciaWhatsapp,
      empresaNome: l.empresa.nome,
      mensagem: `Oi${nome}! ${ia} aqui, da ${l.empresa.nome}. Quero ser transparente com você — tínhamos um pedido em andamento e queria entender o que aconteceu.\n\nO que precisa acontecer para a gente fechar esse pedido? Me conta sem compromisso, pode ser agora ou numa data melhor 😊`,
    });

    // P2.3: Re-notificar vendedor que PC1 será disparado ao cliente (última chance)
    if (l.vendedor?.telefone) {
      const nc = l.cliente.nome || l.cliente.telefone;
      const pedido = resumoPedido((l as any).observacoes);
      const pedidoStr = pedido ? `\n📋 *Pedido:* ${pedido}` : "";
      items.push({
        tipo: "pressao_pc1_vendor", leadId: l.id,
        clienteTelefone: l.vendedor.telefone, clienteNome: l.vendedor.nome,
        instancia: l.empresa.instanciaWhatsapp!, empresaNome: l.empresa.nome,
        mensagem: `⚠️ Oi ${l.vendedor.nome}! O lead *${nc}* está parado há 96h.${pedidoStr}\n\nVou enviar uma CONVERSA FRANCA ao cliente AGORA. Você tem 24h para fechar antes dele ser movido para FOLLOW_UP!\n\nÉ a última chance! 🔥`,
      });
    }
  }

  // Calendário de relacionamento: D+7, D+20, D+28, D+45 desde última compra
  // Deduplicação por leadId — prioridade para compra mais recente (janela menor)
  const seenVendaLeadIds = new Set<string>();

  for (const venda of vendasD7) {
    if (!venda.lead.empresa.instanciaWhatsapp) continue;
    seenVendaLeadIds.add(venda.leadId);
    const primeiroNome = venda.lead.cliente.nome ? venda.lead.cliente.nome.split(" ")[0] : "";
    const nome = primeiroNome ? ` ${primeiroNome}` : "";
    const ia = venda.lead.empresa.nomeIA ?? "Eu";
    items.push({
      tipo: "valor_d7", leadId: venda.lead.id,
      clienteTelefone: venda.lead.cliente.telefone,
      clienteNome: venda.lead.cliente.nome ?? venda.lead.cliente.telefone,
      instancia: venda.lead.empresa.instanciaWhatsapp,
      empresaNome: venda.lead.empresa.nome,
      mensagem: `Oi${nome}! 😊 ${ia} aqui, da ${venda.lead.empresa.nome}. Passando pra saber como está sendo sua experiência! Ficou com alguma dúvida ou tem algo que posso te ajudar?`,
    });
  }

  for (const venda of vendasD20) {
    if (!venda.lead.empresa.instanciaWhatsapp || seenVendaLeadIds.has(venda.leadId)) continue;
    seenVendaLeadIds.add(venda.leadId);
    const primeiroNome = venda.lead.cliente.nome ? venda.lead.cliente.nome.split(" ")[0] : "";
    const nome = primeiroNome ? ` ${primeiroNome}` : "";
    const ia = venda.lead.empresa.nomeIA ?? "Eu";
    items.push({
      tipo: "toque_d20", leadId: venda.lead.id,
      clienteTelefone: venda.lead.cliente.telefone,
      clienteNome: venda.lead.cliente.nome ?? venda.lead.cliente.telefone,
      instancia: venda.lead.empresa.instanciaWhatsapp,
      empresaNome: venda.lead.empresa.nome,
      mensagem: `Oi${nome}! ${ia} aqui, da ${venda.lead.empresa.nome}. Temos algumas novidades que chegaram por aqui e lembrei de você! Quer dar uma olhada? 👀`,
    });
  }

  for (const venda of vendasD28) {
    if (!venda.lead.empresa.instanciaWhatsapp || seenVendaLeadIds.has(venda.leadId)) continue;
    seenVendaLeadIds.add(venda.leadId);
    const primeiroNome = venda.lead.cliente.nome ? venda.lead.cliente.nome.split(" ")[0] : "";
    const nome = primeiroNome ? ` ${primeiroNome}` : "";
    const ia = venda.lead.empresa.nomeIA ?? "Eu";
    items.push({
      tipo: "recompra_d28", leadId: venda.lead.id,
      clienteTelefone: venda.lead.cliente.telefone,
      clienteNome: venda.lead.cliente.nome ?? venda.lead.cliente.telefone,
      instancia: venda.lead.empresa.instanciaWhatsapp,
      empresaNome: venda.lead.empresa.nome,
      mensagem: `Oi${nome}! 😊 ${ia} aqui, da ${venda.lead.empresa.nome}. Já faz um tempinho desde seu último pedido — está precisando repor? Me fala que te ajudo rapidinho!`,
    });
  }

  for (const venda of vendasD45) {
    if (!venda.lead.empresa.instanciaWhatsapp || seenVendaLeadIds.has(venda.leadId)) continue;
    seenVendaLeadIds.add(venda.leadId);
    const primeiroNome = venda.lead.cliente.nome ? venda.lead.cliente.nome.split(" ")[0] : "";
    const nome = primeiroNome ? ` ${primeiroNome}` : "";
    const ia = venda.lead.empresa.nomeIA ?? "Eu";
    items.push({
      tipo: "oferta_d45", leadId: venda.lead.id,
      clienteTelefone: venda.lead.cliente.telefone,
      clienteNome: venda.lead.cliente.nome ?? venda.lead.cliente.telefone,
      instancia: venda.lead.empresa.instanciaWhatsapp,
      empresaNome: venda.lead.empresa.nome,
      mensagem: `Oi${nome}! 🎁 ${ia} aqui, da ${venda.lead.empresa.nome}. Preparamos uma condição especial exclusiva para clientes fiéis como você! Quer saber mais?`,
    });
  }

  // Item F: Conversa Franca — SEM_RESPOSTA 60+ dias (exceto os que já serão SEM_INTERESSE)
  const semInteresse75dIds = new Set(semInteresse75d.map(l => l.id));
  for (const l of semResposta60d) {
    if (!l.empresa.instanciaWhatsapp) continue;
    if (semInteresse75dIds.has(l.id)) continue;
    const nome = l.cliente.nome ? ` ${l.cliente.nome.split(" ")[0]}` : "";
    const dias = Math.floor((now.getTime() - new Date((l as any).atualizadoEm).getTime()) / (1000 * 60 * 60 * 24));
    items.push({
      tipo: "conversa_franca",
      leadId: l.id,
      clienteTelefone: l.cliente.telefone,
      clienteNome: l.cliente.nome ?? l.cliente.telefone,
      instancia: l.empresa.instanciaWhatsapp,
      empresaNome: l.empresa.nome,
      mensagem: `Oi${nome}! Quero ser honesto com você: já faz ${dias} dias que não conversamos. Você ainda tem algum interesse em ser nosso cliente? Pode ser agora ou no futuro — me diga sem compromisso. Se preferir que eu entre em contato numa data melhor, é só me falar que agendo aqui! 😊`,
    });
  }

  // #6: Reativação leve — SEM_INTERESSE 90+ dias sem contato
  for (const l of reativacao90d) {
    if (!l.empresa.instanciaWhatsapp) continue;
    const nome = l.cliente.nome ? ` ${l.cliente.nome.split(" ")[0]}` : "";
    const ia = l.empresa.nomeIA ?? "Eu";
    items.push({
      tipo: "reativacao_sem_interesse",
      leadId: l.id,
      clienteTelefone: l.cliente.telefone,
      clienteNome: l.cliente.nome ?? l.cliente.telefone,
      instancia: l.empresa.instanciaWhatsapp,
      empresaNome: l.empresa.nome,
      mensagem: `Oi${nome}! ${ia} aqui, da ${l.empresa.nome}. Faz tempo que não conversamos — tudo bem? Se um dia precisar de nós, pode nos chamar, estamos aqui! 😊`,
    });
  }

  // Bump atualizadoEm para não re-enviar por 90 dias
  if (reativacao90d.length > 0) {
    await prisma.lead.updateMany({
      where: { id: { in: reativacao90d.map(l => l.id) } },
      data: { status: "SEM_INTERESSE" },
    });
  }

  // Painel do vendedor — envia link 1x/dia quando há leads em NEGOCIACAO pendentes
  const h24ago = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const vendedoresComPendentes: any[] = await (prisma as any).vendedor.findMany({
    where: {
      ativo: true,
      OR: [
        { ultimoLinkPressaoEm: null },
        { ultimoLinkPressaoEm: { lt: h24ago } },
      ],
      leads: {
        some: { status: { in: ["NEGOCIACAO", "PRONTO_PARA_COMPRAR"] }, empresa: { ativa: true } },
      },
    },
    include: {
      empresa: { select: { instanciaWhatsapp: true, nome: true } },
      leads: {
        where: { status: { in: ["NEGOCIACAO", "PRONTO_PARA_COMPRAR"] }, empresa: { ativa: true } },
        select: { id: true },
      },
    },
  });

  for (const v of vendedoresComPendentes) {
    if (!v.telefone || !v.token || !v.empresa?.instanciaWhatsapp) continue;
    const qtd = v.leads.length;
    const msg = `⚡ *${v.nome}*, você tem *${qtd} orçamento${qtd !== 1 ? "s" : ""}* esperando sua resposta!\n\nClique e responda em 1 minuto:\n👉 https://ocrmfacil.com.br/v/${v.token}`;
    items.push({
      tipo: "painel_vendedor",
      leadId: v.leads[0]?.id ?? "",
      clienteTelefone: v.telefone,
      clienteNome: v.nome,
      instancia: v.empresa.instanciaWhatsapp,
      empresaNome: v.empresa.nome,
      mensagem: msg,
    });
    await (prisma as any).vendedor.update({
      where: { id: v.id },
      data: { ultimoLinkPressaoEm: now },
    });
  }

  return NextResponse.json({ total: items.length, items });
}
