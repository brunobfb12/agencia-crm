import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EVOLUTION_URL = "http://201.76.43.149:8080";
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY ?? "SuaChaveSecreta123";

async function sendWhatsApp(instancia: string, number: string, text: string) {
  await fetch(`${EVOLUTION_URL}/message/sendText/${instancia}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: EVOLUTION_KEY },
    body: JSON.stringify({ number, text, options: { presence: "composing", delay: 2000 } }),
  }).catch(() => null);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const vendedor: any = await (prisma as any).vendedor.findFirst({
    where: { token },
    include: {
      empresa: { select: { nome: true, instanciaWhatsapp: true, nomeIA: true } },
    },
  });
  if (!vendedor) return NextResponse.json({ error: "Link inválido" }, { status: 404 });

  const leads = await prisma.lead.findMany({
    where: {
      vendedorId: vendedor.id,
      status: { in: ["NEGOCIACAO", "PRONTO_PARA_COMPRAR"] },
      empresa: { ativa: true },
    },
    orderBy: { atualizadoEm: "asc" },
    include: {
      cliente: { select: { nome: true, telefone: true } },
      empresa: { select: { nome: true, instanciaWhatsapp: true } },
    },
  });

  const now = Date.now();
  const leadsFormatados = leads.map(l => ({
    id: l.id,
    clienteNome: l.cliente.nome ?? l.cliente.telefone,
    clienteTelefone: l.cliente.telefone,
    empresaNome: l.empresa.nome,
    instancia: l.empresa.instanciaWhatsapp,
    horasParado: Math.round((now - new Date(l.atualizadoEm).getTime()) / 3600000),
    observacoes: l.observacoes ?? "",
    status: l.status,
  }));

  return NextResponse.json({
    vendedorNome: vendedor.nome,
    empresaNome: vendedor.empresa?.nome ?? "",
    leads: leadsFormatados,
    total: leadsFormatados.length,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await req.json();
  const { leadId, acao, valor, motivo } = body;

  const vendedor: any = await (prisma as any).vendedor.findFirst({ where: { token } });
  if (!vendedor) return NextResponse.json({ error: "Link inválido" }, { status: 404 });

  const lead = await (prisma as any).lead.findFirst({
    where: { id: leadId, vendedorId: vendedor.id },
    include: {
      cliente: { select: { nome: true, telefone: true } },
      empresa: { select: { nome: true, instanciaWhatsapp: true, nomeIA: true, mensagemPosVenda: true, aprendizados: true } },
    },
  }) as any;
  if (!lead) return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });

  const instancia = lead.empresa?.instanciaWhatsapp as string;
  const ia = lead.empresa?.nomeIA ?? "Eu";
  const clienteNome = (lead.cliente?.nome as string | null)?.split(" ")[0] ?? "";
  const clienteTel = lead.cliente?.telefone as string;

  if (acao === "venda") {
    const valorNum = valor ? parseFloat(String(valor).replace(",", ".")) : null;
    await prisma.venda.create({
      data: {
        leadId: lead.id,
        vendedorId: vendedor.id,
        valor: valorNum,
        descricao: lead.observacoes ?? "Venda registrada pelo vendedor",
        status: "REALIZADA",
      },
    });
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: "VENDA_REALIZADA", atualizadoEm: new Date() },
    });
    return NextResponse.json({ ok: true, proximoStatus: "VENDA_REALIZADA" });
  }

  if (acao === "derrota") {
    let novoStatus: string;
    let msgCliente: string | null = null;
    let obsExtra = "";

    if (motivo === "1") {
      novoStatus = "SEM_RESPOSTA";
      obsExtra = " | Motivo derrota: cliente não respondeu";
      msgCliente = `Oi${clienteNome ? " " + clienteNome : ""}! ${ia} aqui, da ${lead.empresa.nome}. Vi que ficou algum orçamento em aberto — ainda posso te ajudar com algo? 😊`;
    } else if (motivo === "2") {
      novoStatus = "FOLLOW_UP";
      obsExtra = " | Motivo derrota: achou mais barato";
      const dataRecontato = new Date();
      dataRecontato.setDate(dataRecontato.getDate() + 1);
      await prisma.lead.update({ where: { id: lead.id }, data: { dataRecontato } });
      msgCliente = `Oi${clienteNome ? " " + clienteNome : ""}! ${ia} aqui, da ${lead.empresa.nome}. Vi que você encontrou um preço diferente — a gente cobre qualquer oferta da concorrência mediante orçamento! Me manda o valor que você encontrou que a gente analisa 😊`;
    } else if (motivo === "3") {
      novoStatus = "NEGOCIACAO";
      obsExtra = " | Ainda negociando";
    } else {
      novoStatus = "PERDIDO";
      obsExtra = " | Motivo derrota: produto indisponível";
      const aprendizadoNovo = `[PERDA] Produto indisponível — cliente: ${lead.cliente.nome ?? clienteTel} | Pedido: ${(lead.observacoes ?? "").split("|")[0].replace("Pedido:", "").trim().slice(0, 80)}`;
      const aprendizadosAtuais = lead.empresa.aprendizados ?? "";
      await prisma.empresa.update({
        where: { instanciaWhatsapp: instancia },
        data: { aprendizados: (aprendizadosAtuais + "\n---\n" + aprendizadoNovo).trim() } as any,
      });
    }

    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: novoStatus as any,
        observacoes: ((lead.observacoes ?? "") + obsExtra).trim(),
        atualizadoEm: new Date(),
      },
    });

    if (msgCliente && clienteTel && instancia) {
      await sendWhatsApp(instancia, clienteTel, msgCliente);
    }

    return NextResponse.json({ ok: true, proximoStatus: novoStatus });
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
}
