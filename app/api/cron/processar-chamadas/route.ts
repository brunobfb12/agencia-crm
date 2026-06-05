import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("secret") !== "crm2026migra") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const chamadaProcessada = "[CHAMADA_PROCESSADA]";

  // Buscar conversas com mensagens de chamada não processadas
  const conversas = await prisma.conversa.findMany({
    where: {
      ultimaMensagem: { contains: "[CHAMADA" },
      NOT: { ultimaMensagem: { contains: chamadaProcessada } },
    },
    include: {
      cliente: { select: { id: true, nome: true, telefone: true, empresaId: true } },
      mensagens: { orderBy: { criadoEm: "desc" }, take: 1 },
    },
  });

  if (conversas.length === 0) {
    return NextResponse.json({ total: 0, processadas: [] });
  }

  const processadas: any[] = [];
  const evoUrl = process.env.EVOLUTION_API_URL ?? "http://201.76.43.149:8080";
  const evoKey = process.env.EVOLUTION_API_KEY ?? "SuaChaveSecreta123";

  for (const conversa of conversas) {
    const cliente = conversa.cliente;
    const primeiraMsg = conversa.mensagens[0];
    const mensagem = primeiraMsg?.conteudo || "";

    // Detectar tipo de chamada
    const isVideo = mensagem.includes("VIDEO");
    const tipoStr = isVideo ? "DE VIDEO" : "DE VOZ";

    // Buscar lead do cliente
    const lead = await prisma.lead.findFirst({
      where: { clienteId: cliente.id, empresaId: cliente.empresaId },
      orderBy: { atualizadoEm: "desc" },
      take: 1,
      include: {
        vendedor: { select: { nome: true, telefone: true } },
        empresa: { select: { nome: true, instanciaWhatsapp: true } },
      },
    });

    if (!lead) continue;

    const dataStr = now.toLocaleDateString("pt-BR");
    const horaStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    // Atualizar conversa para marcar como processada
    await prisma.conversa.update({
      where: { id: conversa.id },
      data: {
        ultimaMensagem: `${conversa.ultimaMensagem}\n${chamadaProcessada}`,
      },
    });

    // Atualizar lead
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        observacoes: `${lead.observacoes ?? ""}\n[CLIENTE_TENTOU_LIGAR_${dataStr}_${horaStr}]`.trim(),
      },
    });

    // Notificar vendedor se atribuído
    if (lead.vendedor?.telefone && lead.empresa.instanciaWhatsapp) {
      const nomeCliente = cliente.nome || cliente.telefone;
      const msgVendedor = `📞 *CHAMADA DO CLIENTE!*\n\n👤 *${nomeCliente}*\n📱 *${cliente.telefone}*\n🕐 *${horaStr} - ${dataStr}*\n\n*Tipo:* Chamada ${tipoStr}\n\n⚡ Ligue de volta AGORA!\n👉 https://wa.me/${cliente.telefone.replace(/\D/g, "")}`;

      await fetch(`${evoUrl}/message/sendText/${lead.empresa.instanciaWhatsapp}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: evoKey },
        body: JSON.stringify({
          number: lead.vendedor.telefone,
          text: msgVendedor,
          options: { presence: "composing", delay: 2000 },
        }),
      }).catch(() => null);
    }

    processadas.push({
      conversa: conversa.id,
      cliente: nomeCliente || cliente.telefone,
      lead: lead.id,
      vendedor: lead.vendedor?.nome || "não atribuído",
      notificado: lead.vendedor?.telefone ? true : false,
    });
  }

  return NextResponse.json({
    total: processadas.length,
    processadas,
  });
}
