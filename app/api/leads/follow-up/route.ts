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

  const [posVenda, reativacao15d, reativacao30d, recontatos, allAniversarios, semResposta60d, inativos30d, semInteresse75d, reativacao90d] = await Promise.all([
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
    // #4: LEAD/AQUECIMENTO sem atividade 30+ dias → auto SEM_RESPOSTA
    prisma.lead.findMany({
      where: {
        status: { in: ["LEAD", "AQUECIMENTO"] },
        atualizadoEm: { lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
        empresa: { ativa: true },
      },
      select: { id: true },
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
  const h24 = new Date(now); h24.setHours(h24.getHours() - 24);
  const h48 = new Date(now); h48.setHours(h48.getHours() - 48);
  const h72 = new Date(now); h72.setHours(h72.getHours() - 72);

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

  // #4: LEAD/AQUECIMENTO sem atividade 30+ dias → SEM_RESPOSTA
  if (inativos30d.length > 0) {
    await prisma.lead.updateMany({
      where: { id: { in: inativos30d.map(l => l.id) } },
      data: { status: "SEM_RESPOSTA" },
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

  for (const l of pressao24h) {
    if (!l.empresa.instanciaWhatsapp || !l.vendedor?.telefone) continue;
    const nc = l.cliente.nome || l.cliente.telefone;
    items.push({
      tipo: "pressao_vendedor_24h", leadId: l.id,
      clienteTelefone: l.vendedor.telefone, clienteNome: l.vendedor.nome,
      instancia: l.empresa.instanciaWhatsapp, empresaNome: l.empresa.nome,
      mensagem: msgPressao(l.vendedor.nome, nc, 24, (l as any).observacoes),
    });
  }

  for (const l of pressao48h) {
    if (!l.empresa.instanciaWhatsapp || !l.vendedor?.telefone) continue;
    const nc = l.cliente.nome || l.cliente.telefone;
    items.push({
      tipo: "pressao_vendedor_48h", leadId: l.id,
      clienteTelefone: l.vendedor.telefone, clienteNome: l.vendedor.nome,
      instancia: l.empresa.instanciaWhatsapp, empresaNome: l.empresa.nome,
      mensagem: msgPressao(l.vendedor.nome, nc, 48, (l as any).observacoes),
    });
  }

  for (const l of pressao72h) {
    if (!l.empresa.instanciaWhatsapp) continue;
    const nc = l.cliente.nome || l.cliente.telefone;
    if (l.vendedor?.telefone) {
      items.push({
        tipo: "pressao_vendedor_72h", leadId: l.id,
        clienteTelefone: l.vendedor.telefone, clienteNome: l.vendedor.nome,
        instancia: l.empresa.instanciaWhatsapp, empresaNome: l.empresa.nome,
        mensagem: msgPressao(l.vendedor.nome, nc, 72, (l as any).observacoes) + "\n\n⚠️ *72h sem resposta* — agora ou nunca!",
      });
    }
    const gerente = gerenteMap.get(l.empresa.id);
    if (gerente?.telefone) {
      items.push({
        tipo: "pressao_gerente_72h", leadId: l.id,
        clienteTelefone: gerente.telefone, clienteNome: gerente.nome,
        instancia: l.empresa.instanciaWhatsapp, empresaNome: l.empresa.nome,
        mensagem: `🚨 Lead *${nc}* (vendedor: ${l.vendedor?.nome ?? "não atribuído"}) sem atualização há +72h. Verifique antes de perder essa oportunidade.`,
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

  return NextResponse.json({ total: items.length, items });
}
