import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CADENCIA_CUTOFF_DATE = '2026-08-19';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("secret") !== "crm2026migra") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const nowBRTHour = (now.getUTCHours() - 3 + 24) % 24;
  const nowBRTDay = new Date(now.getTime() - 3 * 60 * 60 * 1000).getUTCDay();
  const isDomingo = nowBRTDay === 0;

  // TODO: hardcoded até existir campo de dias de funcionamento por empresa (Sessão 5).
  // Hoje nenhum cliente ativo trabalha domingo.
  const isHorarioComercial = !isDomingo && nowBRTHour >= 8 && nowBRTHour < 18;
  const isHorarioLD0 = isHorarioComercial;

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
  const h2 = new Date(now); h2.setHours(h2.getHours() - 2);

  const [posVenda, reativacao15d, reativacao30d, recontatos, allAniversarios, semResposta60d, inativos30d, aquecimentoSemResposta, semInteresse75d, reativacao90d] = await Promise.all([
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

  const lembreteLD0Candidatos: any[] = isHorarioLD0 ? await prisma.lead.findMany({
    where: {
      status: "AQUECIMENTO",
      NOT: { observacoes: { contains: "[LD0]" } },
      empresa: { ativa: true },
      cliente: { telefone: { not: "" } },
    },
    include: {
      cliente: {
        include: {
          conversas: {
            orderBy: { ultimaAtividade: "desc" },
            take: 1,
            include: {
              mensagens: { orderBy: { criadoEm: "desc" }, take: 1 },
            },
          },
        },
      },
      empresa: { select: { nome: true, instanciaWhatsapp: true, nomeIA: true } },
    },
  }) : [];

  const lembreteLD0Novos = lembreteLD0Candidatos.filter((l: any) => {
    const lastMsg = l.cliente?.conversas?.[0]?.mensagens?.[0];
    if (!lastMsg || lastMsg.direcao !== "SAIDA") return false;
    return new Date(lastMsg.criadoEm) <= h2;
  });

  // CADENCIA T1-T5: Leads LEAD/AQUECIMENTO parados antes de NEGOCIACAO
  // Busca com cumulative baseado em atualizadoEm (última mensagem da IA)
  // Filtra leads sem resposta do cliente após último flag

  const cutoffDate = new Date(CADENCIA_CUTOFF_DATE);

  // Helper: Extrai timestamp da flag ou retorna null
  function getTimestampFromFlag(obs: string, flagPrefix: string): Date | null {
    const regex = new RegExp(`\\[${flagPrefix}:([^\\]]+)\\]`);
    const match = obs.match(regex);
    if (!match) return null;
    try {
      return new Date(match[1]);
    } catch {
      return null;
    }
  }

  // Helper: Calcula qual toque o lead deveria receber
  function getTouche(lead: any): { toque: number; flag: string } | null {
    // Procura últimas msgs para achar última da IA (SAIDA)
    const conversas = lead.cliente?.conversas ?? [];
    if (conversas.length === 0) return null;

    const mensagens = conversas[0]?.mensagens ?? [];
    let ultimaMsgIA: any = null;
    for (const msg of mensagens) {
      if (msg.direcao === "SAIDA") {
        ultimaMsgIA = msg;
        break;
      }
    }
    if (!ultimaMsgIA) return null;

    const ultimaMsgIATime = new Date(ultimaMsgIA.criadoEm).getTime();
    const agora = now.getTime();
    const minusDecorridos = (agora - ultimaMsgIATime) / (1000 * 60);

    // Verifica se cliente respondeu após última msg da IA
    let clienteRespondeu = false;
    for (const msg of mensagens) {
      if (msg.direcao === "ENTRADA" && new Date(msg.criadoEm).getTime() > ultimaMsgIATime) {
        clienteRespondeu = true;
        break;
      }
    }
    if (clienteRespondeu) return null; // Cancelar sequência

    // Determina toque com validação de INTERVALO MÍNIMO entre toques
    const obs = lead.observacoes ?? "";

    const temT5 = obs.includes("[T5:");
    const temT4 = obs.includes("[T4:");
    const temT3 = obs.includes("[T3:");
    const temT2 = obs.includes("[T2:");
    const temT1 = obs.includes("[T1:");

    // T1: 30min desde última msg da IA (única que olha a msg da IA)
    if (!temT1 && minusDecorridos >= 30) {
      return { toque: 1, flag: `[T1:${now.toISOString()}]` };
    }

    // T2: >= 90min desde T1
    if (!temT2 && temT1) {
      const t1Time = getTimestampFromFlag(obs, "T1");
      const minsSinceT1 = t1Time ? (agora - t1Time.getTime()) / (1000 * 60) : 0;
      if (minsSinceT1 >= 90) {
        return { toque: 2, flag: `[T2:${now.toISOString()}]` };
      }
    }

    // T3: >= 4h (240min) desde T2
    if (!temT3 && temT2) {
      const t2Time = getTimestampFromFlag(obs, "T2");
      const minsSinceT2 = t2Time ? (agora - t2Time.getTime()) / (1000 * 60) : 0;
      if (minsSinceT2 >= 240) {
        return { toque: 3, flag: `[T3:${now.toISOString()}]` };
      }
    }

    // T4: >= 18h (1080min) desde T3
    if (!temT4 && temT3) {
      const t3Time = getTimestampFromFlag(obs, "T3");
      const minsSinceT3 = t3Time ? (agora - t3Time.getTime()) / (1000 * 60) : 0;
      if (minsSinceT3 >= 1080) {
        return { toque: 4, flag: `[T4:${now.toISOString()}]` };
      }
    }

    // T5: >= 48h (2880min) desde T4
    if (!temT5 && temT4) {
      const t4Time = getTimestampFromFlag(obs, "T4");
      const minsSinceT4 = t4Time ? (agora - t4Time.getTime()) / (1000 * 60) : 0;
      if (minsSinceT4 >= 2880) {
        return { toque: 5, flag: `[T5:${now.toISOString()}]` };
      }
    }

    return null;
  }

  // Buscar todos os candidatos para T1-T5 em um batch único
  const cadenciaLeads = await prisma.lead.findMany({
    where: {
      status: { in: ["LEAD", "AQUECIMENTO"] },
      atualizadoEm: { gte: cutoffDate },
      empresa: { ativa: true },
      cliente: { telefone: { not: "" } },
    },
    include: {
      cliente: {
        include: {
          conversas: {
            orderBy: { ultimaAtividade: "desc" },
            take: 1,
            include: {
              mensagens: {
                orderBy: { criadoEm: "desc" },
                take: 10,
              },
            },
          },
        },
      },
      empresa: { select: { nome: true, instanciaWhatsapp: true, nomeIA: true } },
      vendedor: { select: { nome: true } },
    },
  });

  // Agrupar leads por toque
  const t1Leads: any[] = [];
  const t2Leads: any[] = [];
  const t3Leads: any[] = [];
  const t4Leads: any[] = [];
  const t5Leads: any[] = [];

  for (const lead of cadenciaLeads) {
    if (!isHorarioComercial) break;

    const touche = getTouche(lead);
    if (!touche) continue;

    if (touche.toque === 1) t1Leads.push({ ...lead, flag: touche.flag });
    else if (touche.toque === 2) t2Leads.push({ ...lead, flag: touche.flag });
    else if (touche.toque === 3) t3Leads.push({ ...lead, flag: touche.flag });
    else if (touche.toque === 4) t4Leads.push({ ...lead, flag: touche.flag });
    else if (touche.toque === 5) t5Leads.push({ ...lead, flag: touche.flag });
  }

  // Lógica: leads com T5 marcado há mais de 24h → SEM_RESPOSTA
  const t5Timeout = isHorarioComercial ? cadenciaLeads.filter((lead: any) => {
    const obs = lead.observacoes ?? "";
    if (!obs.includes("[T5:")) return false;

    const t5Time = getTimestampFromFlag(obs, "T5");
    if (!t5Time) return false;

    const minsSinceT5 = (now.getTime() - t5Time.getTime()) / (1000 * 60);
    return minsSinceT5 >= 1440; // 24h
  }) : [];

  if (t5Timeout.length > 0) {
    await prisma.lead.updateMany({
      where: { id: { in: t5Timeout.map(l => l.id) } },
      data: { status: "SEM_RESPOSTA" },
    });
  }

  // P2.2: AQUECIMENTO "quente" → PRONTO_PARA_COMPRAR (score ≥6 + CONFIRMADO + P72 + 24-48h)
  const aquecimentoParaProto = isHorarioComercial ? await prisma.lead.findMany({
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
  }) : [];

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
  const negociacaoTimeout = isHorarioComercial ? await prisma.lead.findMany({
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
  }) : [];

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

  // NO-SHOW via dataAgendada: agendamentos PENDENTES com data passada (janela 7 dias)
  const d7ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const agendamentosPassados = isHorarioComercial ? await prisma.agendamento.findMany({
    where: {
      status: 'PENDENTE',
      dataAgendada: { lte: now, gte: d7ago },
    },
    select: { clienteId: true, dataAgendada: true },
    orderBy: { dataAgendada: 'desc' },
  }) : [];
  const agendMapPassado = new Map<string, Date>();
  for (const a of agendamentosPassados) {
    if (!agendMapPassado.has(a.clienteId)) {
      agendMapPassado.set(a.clienteId, a.dataAgendada);
    }
  }
  const noShowLeads = isHorarioComercial && agendMapPassado.size > 0
    ? await prisma.lead.findMany({
        where: {
          status: 'AGENDADO',
          clienteId: { in: [...agendMapPassado.keys()] },
          NOT: { observacoes: { contains: '[NO_SHOW]' } },
          empresa: { ativa: true },
          cliente: { telefone: { not: '' } },
        },
        include: baseInclude,
      })
    : [];

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
  if (isHorarioComercial && pressao72h.length > 0) {
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

  // Definir type e inicializar items (será populado durante o processamento)
  type Item = {
    tipo: string;
    leadId: string;
    clienteTelefone: string;
    clienteNome: string;
    instancia: string;
    empresaNome: string;
    mensagem: string;
  };
  const items: Item[] = [];

  // Auto-transição: VENDA_REALIZADA → POS_VENDA ao detectar para envio
  if (isHorarioComercial && posVenda.length > 0) {
    await prisma.lead.updateMany({
      where: { id: { in: posVenda.map(l => l.id) } },
      data: { status: "POS_VENDA" },
    });
  }

  // Auto-transição: FOLLOW_UP sem resposta há 30 dias → SEM_RESPOSTA (limite de tentativas)
  if (isHorarioComercial && reativacao30d.length > 0) {
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
  if (isHorarioComercial && agendadoNoShow.length > 0) {
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

  // NO-SHOW via dataAgendada → FOLLOW_UP + flag [NO_SHOW]
  if (noShowLeads.length > 0) {
    await Promise.all(
      noShowLeads.map((l: any) => {
        const dataAgend = agendMapPassado.get(l.clienteId);
        const dataStr = dataAgend
          ? new Date(dataAgend).toLocaleDateString('pt-BR')
          : 'data nao registrada';
        return prisma.lead.update({
          where: { id: l.id },
          data: {
            status: 'FOLLOW_UP',
            dataRecontato: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
            observacoes: ((l.observacoes ?? '') + '\n[NO_SHOW] Cliente nao compareceu em ' + dataStr).trim(),
          },
        });
      })
    );
  }

  // P3.2: Auto-transição NEGOCIACAO timeout (14d) → FOLLOW_UP + notifica gerente
  if (isHorarioComercial && negociacaoTimeout.length > 0) {
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
        const obs = l.observacoes ?? "";
        const lastP3T = getTimestampFromFlag(obs, "P3T");
        const minsSinceP3T = lastP3T ? (now.getTime() - lastP3T.getTime()) / (1000 * 60) : Infinity;

        if (minsSinceP3T >= 1440) {
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

          await prisma.lead.update({
            where: { id: l.id },
            data: { observacoes: ((l.observacoes ?? "") + `\n[P3T:${now.toISOString()}]`).trim() },
          }).catch(() => null);
        }
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
  if (isHorarioComercial && aquecimentoParaProto.length > 0) {
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
  if (isHorarioComercial) {
    for (const l of aqQuentes) {
      if (!l.empresa.instanciaWhatsapp || !l.vendedorId || !l.vendedor?.telefone) continue;
      const obs = l.observacoes ?? "";
      const lastPVA = getTimestampFromFlag(obs, "PVA");
      const minsSincePVA = lastPVA ? (now.getTime() - lastPVA.getTime()) / (1000 * 60) : Infinity;

      if (minsSincePVA >= 1440) {
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

        await prisma.lead.update({
          where: { id: l.id },
          data: { observacoes: ((l.observacoes ?? "") + `\n[PVA:${now.toISOString()}]`).trim() },
        }).catch(() => null);
      }
    }
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

  const buildItem = (lead: typeof posVenda[0], tipo: string, mensagem: string): Item => ({
    tipo,
    leadId: lead.id,
    clienteTelefone: lead.cliente.telefone,
    clienteNome: lead.cliente.nome ?? lead.cliente.telefone,
    instancia: lead.empresa.instanciaWhatsapp!,
    empresaNome: lead.empresa.nome,
    mensagem,
  });

  items.push(
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
      })
  );

  items.push(
    ...reativacao15d
      .filter(l => l.empresa.instanciaWhatsapp)
      .map(l => {
        const nome = l.cliente.nome ? ` ${l.cliente.nome.split(" ")[0]}` : "";
        const ia = l.empresa.nomeIA ?? "Eu";
        return buildItem(l, "reativacao_15d",
          `Oi${nome}! ${ia} aqui, da ${l.empresa.nome}. Faz um tempo que não conversamos! 😊 Temos novidades que podem te interessar. Quer dar uma olhada?`
        );
      })
  );

  items.push(
    ...reativacao30d
      .filter(l => l.empresa.instanciaWhatsapp)
      .map(l => {
        const nome = l.cliente.nome ? ` ${l.cliente.nome.split(" ")[0]}` : "";
        const ia = l.empresa.nomeIA ?? "Eu";
        return buildItem(l, "reativacao_30d",
          `Oi${nome}! Sentimos sua falta por aqui! 🙏 Preparamos uma condição especial pensando em você. Posso te contar?`
        );
      })
  );

  items.push(
    ...recontatos
      .filter(l => l.empresa.instanciaWhatsapp)
      .map(l => {
        const nome = l.cliente.nome ? ` ${l.cliente.nome.split(" ")[0]}` : "";
        const ia = l.empresa.nomeIA ?? "Eu";
        return buildItem(l, "recontato_agendado",
          `Oi${nome}! 😊 ${ia} aqui, da ${l.empresa.nome}. Passando pra ver se consigo te ajudar a agendar ou se ficou alguma dúvida! Como posso te atender?`
        );
      })
  );

  items.push(
    ...t1Leads
      .filter((l: any) => l.empresa.instanciaWhatsapp)
      .map((l: any) => {
        const nome = l.cliente.nome ? ` ${l.cliente.nome.split(" ")[0]}` : "";
        const ia = l.empresa.nomeIA ?? "Eu";
        return buildItem(l, "cadencia_t1",
          `Oi${nome}! ${ia} aqui, da ${l.empresa.nome}. Passando pra tirar qualquer dúvida! 😊`
        );
      })
  );

  items.push(
    ...t2Leads
      .filter((l: any) => l.empresa.instanciaWhatsapp)
      .map((l: any) => {
        const nome = l.cliente.nome ? ` ${l.cliente.nome.split(" ")[0]}` : "";
        const ia = l.empresa.nomeIA ?? "Eu";
        return buildItem(l, "cadencia_t2",
          `Oi${nome}! Ainda por aqui pra ajudar 😊 Ficou algo em dúvida?`
        );
      })
  );

  items.push(
    ...t3Leads
      .filter((l: any) => l.empresa.instanciaWhatsapp)
      .map((l: any) => {
        const nome = l.cliente.nome ? ` ${l.cliente.nome.split(" ")[0]}` : "";
        const ia = l.empresa.nomeIA ?? "Eu";
        return buildItem(l, "cadencia_t3",
          `Oi${nome}! ${ia} aqui, da ${l.empresa.nome}. Você ainda tem interesse? Gostaria de finalizar? 👊`
        );
      })
  );

  items.push(
    ...t4Leads
      .filter((l: any) => l.empresa.instanciaWhatsapp)
      .map((l: any) => {
        const nome = l.cliente.nome ? ` ${l.cliente.nome.split(" ")[0]}` : "";
        const ia = l.empresa.nomeIA ?? "Eu";
        return buildItem(l, "cadencia_t4",
          `Oi${nome}! ${ia} aqui, da ${l.empresa.nome}. Consegui te ajudar com o que precisava? Se quiser retomar, é só me chamar 😊`
        );
      })
  );

  items.push(
    ...t5Leads
      .filter((l: any) => l.empresa.instanciaWhatsapp)
      .map((l: any) => {
        const nome = l.cliente.nome ? ` ${l.cliente.nome.split(" ")[0]}` : "";
        const ia = l.empresa.nomeIA ?? "Eu";
        return buildItem(l, "cadencia_t5",
          `Oi${nome}! Vou parar de te chamar pra não incomodar, mas fico por aqui — se precisar de material a qualquer momento, é só mandar mensagem! 👋`
        );
      })
  );

  // BUG 1 FIX: Limpar dataRecontato após envio de recontato_agendado
  if (recontatos.length > 0) {
    await prisma.lead.updateMany({
      where: { id: { in: recontatos.map(l => l.id) } },
      data: { dataRecontato: null },
    });
  }

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
  const p24Novos = isHorarioComercial ? pressao24h.filter(l =>
    l.empresa.instanciaWhatsapp && l.vendedor?.telefone &&
    !(((l as any).observacoes ?? "").includes("[P24]"))
  ) : [];
  const p48Novos = isHorarioComercial ? pressao48h.filter(l =>
    l.empresa.instanciaWhatsapp && l.vendedor?.telefone &&
    !(((l as any).observacoes ?? "").includes("[P48]"))
  ) : [];
  const p72Novos = isHorarioComercial ? pressao72h.filter(l =>
    l.empresa.instanciaWhatsapp &&
    !(((l as any).observacoes ?? "").includes("[P72]"))
  ) : [];

  // Marcar todos como enviados antes de retornar (evita duplicatas em crons simultâneos)
  // getTouche já garante que leads em t*Leads não têm o flag, então só filtra por instancia
  const t1Novos = isHorarioComercial ? t1Leads.filter((l: any) => l.empresa?.instanciaWhatsapp) : [];
  const t2Novos = isHorarioComercial ? t2Leads.filter((l: any) => l.empresa?.instanciaWhatsapp) : [];
  const t3Novos = isHorarioComercial ? t3Leads.filter((l: any) => l.empresa?.instanciaWhatsapp) : [];
  const t4Novos = isHorarioComercial ? t4Leads.filter((l: any) => l.empresa?.instanciaWhatsapp) : [];
  const t5Novos = isHorarioComercial ? t5Leads.filter((l: any) => l.empresa?.instanciaWhatsapp) : [];
  const ld0Novos = isHorarioComercial ? lembreteLD0Novos : [];

  const pc1Novos = isHorarioComercial ? (prontoConversa as any[]).filter(l => l.empresa?.instanciaWhatsapp && !((l.observacoes ?? "").includes("[PC1]"))) : [];

  // Declaração inicial das flags finais (serão preenchidas após travas)
  let finalT1: any[] = [];
  let finalT2: any[] = [];
  let finalT3: any[] = [];
  let finalT4: any[] = [];
  let finalT5: any[] = [];
  let finalLD0: any[] = [];
  let finalPC1: any[] = [];
  const finalItemsByLeadId = new Map<string, Item>();

  if (isHorarioComercial && (p24Novos.length > 0 || p48Novos.length > 0 || p72Novos.length > 0 || finalT1.length > 0 || finalT2.length > 0 || finalT3.length > 0 || finalT4.length > 0 || finalT5.length > 0 || finalLD0.length > 0 || finalPC1.length > 0)) {
    await Promise.all([
      ...p24Novos.map(l => prisma.lead.update({ where: { id: l.id }, data: { observacoes: (((l as any).observacoes ?? "") + "\n[P24]").trim() } })),
      ...p48Novos.map(l => prisma.lead.update({ where: { id: l.id }, data: { observacoes: (((l as any).observacoes ?? "") + "\n[P48]").trim() } })),
      ...p72Novos.map(l => prisma.lead.update({ where: { id: l.id }, data: { observacoes: (((l as any).observacoes ?? "") + "\n[P72]").trim() } })),
      ...finalT1.map((l: any) => prisma.lead.update({ where: { id: l.id }, data: { observacoes: ((l.observacoes ?? "") + `\n${l.flag}`).trim() } })),
      ...finalT2.map((l: any) => prisma.lead.update({ where: { id: l.id }, data: { observacoes: ((l.observacoes ?? "") + `\n${l.flag}`).trim() } })),
      ...finalT3.map((l: any) => prisma.lead.update({ where: { id: l.id }, data: { observacoes: ((l.observacoes ?? "") + `\n${l.flag}`).trim() } })),
      ...finalT4.map((l: any) => prisma.lead.update({ where: { id: l.id }, data: { observacoes: ((l.observacoes ?? "") + `\n${l.flag}`).trim() } })),
      ...finalT5.map((l: any) => prisma.lead.update({ where: { id: l.id }, data: { observacoes: ((l.observacoes ?? "") + `\n${l.flag}`).trim() } })),
      ...finalPC1.map((l: any) => prisma.lead.update({ where: { id: l.id }, data: { observacoes: ((l.observacoes ?? "") + "\n[PC1]").trim() } })),
    ]);
  }

  if (isHorarioComercial) {
    for (const l of lembreteLD0Novos) {
    const primeiroNome = l.cliente.nome ? l.cliente.nome.split(" ")[0] : "";
    const nomeStr = primeiroNome ? ` ${primeiroNome}` : "";
    items.push({
      tipo: "lembrete_ld0",
      leadId: l.id,
      clienteTelefone: l.cliente.telefone,
      clienteNome: l.cliente.nome ?? l.cliente.telefone,
      instancia: l.empresa.instanciaWhatsapp!,
      empresaNome: l.empresa.nome,
        mensagem: `👋 Oi${nomeStr}! Estou aqui aguardando sua confirmação para finalizar seu orçamento 😊`,
      });
    }

    if (finalLD0.length > 0) {
      await Promise.all(
        finalLD0.map((l: any) => prisma.lead.update({
          where: { id: l.id },
          data: { observacoes: ((l.observacoes ?? "") + `\n[LD0:${now.toISOString()}]`).trim() },
        }))
      );
    }

    // NO-SHOW: mensagem ao cliente perguntando se quer reagendar
    for (const l of noShowLeads) {
    if (!l.empresa.instanciaWhatsapp) continue;
    const nome = l.cliente.nome ? ` ${l.cliente.nome.split(' ')[0]}` : '';
    const ia = l.empresa.nomeIA ?? 'Eu';
    items.push({
      tipo: 'noshow_reagendar',
      leadId: l.id,
      clienteTelefone: l.cliente.telefone,
      clienteNome: l.cliente.nome ?? l.cliente.telefone,
      instancia: l.empresa.instanciaWhatsapp,
      empresaNome: l.empresa.nome,
        mensagem: `Oi${nome}! ${ia} aqui, da ${l.empresa.nome}. Vi que você tinha um horário agendado conosco — tudo certo? Ainda gostaria de reagendar? 😊`,
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
      }).catch(() => null);
    }
  }

  // ===== TRAVA 1: Uma mensagem por lead por execução =====
  // Mantém só o primeiro item de cada leadId (a ordem já define prioridade)
  const seenLeadsExecucao = new Set<string>();
  const itemsFiltrados: Item[] = [];
  for (const item of items) {
    if (!seenLeadsExecucao.has(item.leadId)) {
      seenLeadsExecucao.add(item.leadId);
      itemsFiltrados.push(item);
    }
  }
  items.length = 0;
  items.push(...itemsFiltrados);

  // Guardrail: retorna items vazio fora do horário comercial (antes de salvar no banco)
  if (!isHorarioComercial) {
    items.length = 0;
  }

  // BUG 2 FIX: Salvar todas as mensagens disparadas na tabela Mensagem
  const clienteMessageTypes = new Set([
    "pos_venda", "reativacao_15d", "reativacao_30d", "recontato_agendado",
    "cadencia_t1", "cadencia_t2", "cadencia_t3", "cadencia_t4", "cadencia_t5",
    "aniversario", "pronto_conversa_franca", "valor_d7", "toque_d20", "recompra_d28", "oferta_d45",
    "conversa_franca", "reativacao_sem_interesse", "lembrete_ld0", "noshow_reagendar"
  ]);

  // Mapa de leadId → clienteId para vincular mensagens
  const leadToClienteMap = new Map<string, string>();
  for (const leads of [[posVenda], [reativacao15d], [reativacao30d], [recontatos],
    [aniversarios], [prontoConversa],
    [semResposta60d], [reativacao90d], [noShowLeads], [t1Leads], [t2Leads], [t3Leads], [t4Leads], [t5Leads]]) {
    for (const lead of leads) {
      if (lead?.id && (lead as any)?.clienteId) {
        leadToClienteMap.set(lead.id, (lead as any).clienteId);
      }
    }
  }
  // Vendas também possuem leads
  for (const vendas of [[vendasD7], [vendasD20], [vendasD28], [vendasD45]]) {
    for (const venda of vendas) {
      if (venda?.lead?.id && (venda as any)?.lead?.clienteId) {
        leadToClienteMap.set(venda.lead.id, (venda as any).lead.clienteId);
      }
    }
  }

  // DEBUG: Check if test leads are in leadToClienteMap
  const debugIds = ["cmszylfb1000xtlkxvlk0h4e2", "cmt0y8p8t004jwul4vtxk8q2n"];
  for (const id of debugIds) {
    console.log("[DEBUG-CADENCIA]", id, "clienteId no map:", leadToClienteMap.get(id));
  }

  // ===== TRAVA 2: Uma mensagem por lead por dia (dedup com BD) =====
  // Busca todas as Mensagens SAIDA criadas hoje para os clientes dos items finais
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const clienteIdsItems = new Set<string>();
  for (const item of items.filter(it => clienteMessageTypes.has(it.tipo))) {
    const clienteId = leadToClienteMap.get(item.leadId);
    if (clienteId) clienteIdsItems.add(clienteId);
  }

  const mensagensHoje = clienteIdsItems.size > 0
    ? await prisma.mensagem.findMany({
        where: {
          direcao: "SAIDA",
          criadoEm: { gte: todayStart },
          conversa: { clienteId: { in: Array.from(clienteIdsItems) } },
        },
        select: { conversa: { select: { clienteId: true } } },
      })
    : [];

  const clientesComMsgHoje = new Set(mensagensHoje.map(m => m.conversa.clienteId));

  // Aplicar TRAVA 2: remover items cujo cliente já recebeu msg SAIDA hoje
  const itemsApposTrava2 = items.filter(it => {
    if (!clienteMessageTypes.has(it.tipo)) return true; // Mantém items de vendedor/gerente
    const clienteId = leadToClienteMap.get(it.leadId);
    return clienteId && !clientesComMsgHoje.has(clienteId);
  });
  items.length = 0;
  items.push(...itemsApposTrava2);

  // DEBUG: Check if test leads' items survived TRAVA 2
  for (const id of debugIds) {
    const item = items.find(it => it.leadId === id);
    console.log("[DEBUG-CADENCIA]", id, "item exists before finalItemsByLeadId rebuild:", !!item, "tipo:", item?.tipo);
  }
  const idsQueVaoSobreviver = items.map(it => it.leadId);
  for (const id of debugIds) {
    console.log("[DEBUG-CADENCIA]", id, "sobrevive trava2:", idsQueVaoSobreviver.includes(id));
  }

  // Recalcular mapa de items finais com array correto (crítico!)
  finalItemsByLeadId.clear();
  for (const item of items) {
    finalItemsByLeadId.set(item.leadId, item);
  }

  // Recalcular flags finais após trava 2
  finalT1.length = 0;
  finalT1.push(...t1Leads.filter(l => finalItemsByLeadId.get(l.id)?.tipo === "cadencia_t1"));
  finalT2.length = 0;
  finalT2.push(...t2Leads.filter(l => finalItemsByLeadId.get(l.id)?.tipo === "cadencia_t2"));
  finalT3.length = 0;
  finalT3.push(...t3Leads.filter(l => finalItemsByLeadId.get(l.id)?.tipo === "cadencia_t3"));
  finalT4.length = 0;
  finalT4.push(...t4Leads.filter(l => finalItemsByLeadId.get(l.id)?.tipo === "cadencia_t4"));
  finalT5.length = 0;
  finalT5.push(...t5Leads.filter(l => finalItemsByLeadId.get(l.id)?.tipo === "cadencia_t5"));
  finalLD0.length = 0;
  finalLD0.push(...lembreteLD0Novos.filter(l => finalItemsByLeadId.get(l.id)?.tipo === "lembrete_ld0"));
  finalPC1.length = 0;
  finalPC1.push(...pc1Novos.filter(l => finalItemsByLeadId.get(l.id)?.tipo === "pronto_conversa_franca"));

  // Agrupar mensagens por clienteId para buscar/criar Conversa
  const mensagensPorCliente = new Map<string, Array<{ item: Item; mensagem: string }>>();
  for (const item of items.filter(it => clienteMessageTypes.has(it.tipo))) {
    const clienteId = leadToClienteMap.get(item.leadId);
    if (clienteId) {
      if (!mensagensPorCliente.has(clienteId)) {
        mensagensPorCliente.set(clienteId, []);
      }
      mensagensPorCliente.get(clienteId)!.push({ item, mensagem: item.mensagem });
    }
  }

  // PC1: reset modoHumano APÓS travas — IA volta a responder o cliente apenas para os que vão receber a msg
  if (finalPC1.length > 0) {
    const clienteIdsPC1Final = finalPC1.map((l: any) => l.clienteId).filter(Boolean);
    if (clienteIdsPC1Final.length > 0) {
      const conversasPC1 = await prisma.conversa.findMany({
        where: { clienteId: { in: clienteIdsPC1Final } },
        orderBy: { ultimaAtividade: "desc" },
        distinct: ["clienteId"],
        select: { id: true },
      });
      if (conversasPC1.length > 0) {
        await prisma.conversa.updateMany({
          where: { id: { in: conversasPC1.map((c: { id: string }) => c.id) } },
          data: { modoHumano: false },
        });
      }
    }
  }

  // Buscar/criar Conversa e salvar Mensagens
  for (const [clienteId, msgs] of mensagensPorCliente) {
    let conversa = await prisma.conversa.findFirst({
      where: { clienteId },
      orderBy: { ultimaAtividade: "desc" },
    });

    if (!conversa) {
      conversa = await prisma.conversa.create({
        data: { clienteId },
      });
    }

    // Criar Mensagens para esta Conversa
    for (const { item, mensagem } of msgs) {
      await prisma.mensagem.create({
        data: { conversaId: conversa.id, conteudo: mensagem, direcao: "SAIDA" },
      }).catch(() => null);
    }

    // Atualizar Conversa com última atividade (como faz o webhook)
    await prisma.conversa.update({
      where: { id: conversa.id },
      data: {
        ultimaMensagem: msgs[msgs.length - 1].mensagem,
        ultimaAtividade: new Date(),
      },
    }).catch(() => null);
  }

  return NextResponse.json({ total: items.length, items });
}
