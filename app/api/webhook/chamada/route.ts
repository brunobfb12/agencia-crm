import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { instancia, telefone, tipo } = body;

  if (!instancia || !telefone || tipo !== "CHAMADA") {
    return NextResponse.json({ error: "invalid chamada" }, { status: 400 });
  }

  const now = new Date();
  const tipoLegivel = body.isVideo ? "DE VIDEO" : "DE VOZ";

  // Buscar empresa
  const empresa = await prisma.empresa.findUnique({
    where: { instanciaWhatsapp: instancia },
  });

  if (!empresa) {
    return NextResponse.json({ error: "empresa nao encontrada" }, { status: 404 });
  }

  // Buscar cliente e lead
  const cliente = await prisma.cliente.findFirst({
    where: { telefone, empresaId: empresa.id },
    include: { leads: { where: { empresaId: empresa.id }, orderBy: { atualizadoEm: "desc" }, take: 1 } },
  });

  if (!cliente || !cliente.leads[0]) {
    return NextResponse.json({ ok: true, motivo: "cliente ou lead nao encontrado" });
  }

  const lead = cliente.leads[0];
  const horaBr = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const horaStr = horaBr.toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const dataStr = horaBr.toLocaleDateString("pt-BR");

  // Atualizar lead com flag de chamada
  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      observacoes: `${lead.observacoes ?? ""}\n[CLIENTE_TENTOU_LIGAR_${dataStr}_${horaStr}]`.trim(),
    },
  });

  // Notificar vendedor se atribuído
  if (lead.vendedorId) {
    const vendedor = await prisma.vendedor.findUnique({
      where: { id: lead.vendedorId },
      include: { empresa: { select: { instanciaWhatsapp: true } } },
    });

    if (vendedor?.telefone && empresa.instanciaWhatsapp) {
      const evoUrl = process.env.EVOLUTION_API_URL ?? "http://201.76.43.149:8080";
      const evoKey = process.env.EVOLUTION_API_KEY ?? "SuaChaveSecreta123";

      const nomeCliente = cliente.nome || telefone;
      const msgVendedor = `📞 *CHAMADA DO CLIENTE!*\n\n👤 *${nomeCliente}*\n📱 *${telefone}*\n🕐 *${horaStr}*\n\n*Tipo:* Chamada ${tipoLegivel}\n\n⚡ Ligue de volta AGORA!\n👉 https://wa.me/${telefone.replace(/\D/g, "")}`;

      await fetch(`${evoUrl}/message/sendText/${empresa.instanciaWhatsapp}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: evoKey },
        body: JSON.stringify({
          number: vendedor.telefone,
          text: msgVendedor,
          options: { presence: "composing", delay: 2000 },
        }),
      }).catch(() => null);
    }
  }

  return NextResponse.json({
    ok: true,
    lead: lead.id,
    cliente: cliente.nome || telefone,
    notificado: lead.vendedorId ? true : false,
  });
}
