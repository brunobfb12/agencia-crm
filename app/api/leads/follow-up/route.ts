import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Returns leads due for automated follow-up messages.
// Called daily by N8N cron at 9am.
// Secret protects the endpoint from unauthorized access.
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

  const [posVenda, reativacao15d, reativacao30d] = await Promise.all([
    // VENDA_REALIZADA updated exactly 2 days ago — satisfaction check
    prisma.lead.findMany({
      where: {
        status: "VENDA_REALIZADA",
        atualizadoEm: { gte: windowStart(2), lt: windowEnd(2) },
        empresa: { ativa: true },
        cliente: { telefone: { not: "" } },
      },
      include: {
        cliente: { select: { nome: true, telefone: true } },
        empresa: { select: { nome: true, instanciaWhatsapp: true, nomeIA: true } },
        vendedor: { select: { nome: true } },
      },
    }),

    // FOLLOW_UP updated exactly 15 days ago — first reactivation
    prisma.lead.findMany({
      where: {
        status: "FOLLOW_UP",
        atualizadoEm: { gte: windowStart(15), lt: windowEnd(15) },
        empresa: { ativa: true },
        cliente: { telefone: { not: "" } },
      },
      include: {
        cliente: { select: { nome: true, telefone: true } },
        empresa: { select: { nome: true, instanciaWhatsapp: true, nomeIA: true } },
        vendedor: { select: { nome: true } },
      },
    }),

    // FOLLOW_UP updated exactly 30 days ago — second reactivation
    prisma.lead.findMany({
      where: {
        status: "FOLLOW_UP",
        atualizadoEm: { gte: windowStart(30), lt: windowEnd(30) },
        empresa: { ativa: true },
        cliente: { telefone: { not: "" } },
      },
      include: {
        cliente: { select: { nome: true, telefone: true } },
        empresa: { select: { nome: true, instanciaWhatsapp: true, nomeIA: true } },
        vendedor: { select: { nome: true } },
      },
    }),
  ]);

  const buildItem = (lead: typeof posVenda[0], tipo: string, mensagem: string) => ({
    tipo,
    leadId: lead.id,
    clienteTelefone: lead.cliente.telefone,
    clienteNome: lead.cliente.nome ?? lead.cliente.telefone,
    instancia: lead.empresa.instanciaWhatsapp,
    empresaNome: lead.empresa.nome,
    mensagem,
  });

  const items = [
    ...posVenda
      .filter(l => l.empresa.instanciaWhatsapp)
      .map(l => {
        const nome = l.cliente.nome ? ` ${l.cliente.nome.split(" ")[0]}` : "";
        const ia = l.empresa.nomeIA ?? "Eu";
        return buildItem(l, "pos_venda",
          `Oi${nome}! 😊 ${ia} aqui, da ${l.empresa.nome}. Tudo certo com seu pedido? Se tiver qualquer dúvida ou precisar de algo, estou à disposição!`
        );
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
  ];

  return NextResponse.json({ total: items.length, items });
}
