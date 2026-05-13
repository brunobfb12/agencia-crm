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

  const [posVenda, reativacao15d, reativacao30d, recontatos, allAniversarios] = await Promise.all([
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
        status: "FOLLOW_UP",
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
  ]);

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
          `Oi${nome}! 😊 ${ia} aqui, da ${l.empresa.nome}. Conforme combinamos, estou passando pra saber se posso te ajudar agora! Como posso te atender?`
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

  return NextResponse.json({ total: items.length, items });
}
