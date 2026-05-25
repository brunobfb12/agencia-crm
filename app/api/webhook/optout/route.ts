import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/webhook/optout
// Chamado pelo N8N quando cliente envia "PARAR", "SAIR", "STOP" etc.
// Body: { secret, instancia, telefone }
export async function POST(req: Request) {
  const body = await req.json();
  const { secret, instancia, telefone } = body;

  if (secret !== "crm2026migra") {
    return NextResponse.json({ ok: false, motivo: "não autorizado" }, { status: 401 });
  }
  if (!instancia || !telefone) {
    return NextResponse.json({ ok: false, motivo: "instancia e telefone obrigatórios" }, { status: 400 });
  }

  const empresa = await prisma.empresa.findUnique({ where: { instanciaWhatsapp: instancia } });
  if (!empresa) return NextResponse.json({ ok: false, motivo: "empresa não encontrada" }, { status: 404 });

  const tel = String(telefone).replace(/\D/g, "");

  const cliente = await prisma.cliente.findFirst({
    where: { empresaId: empresa.id, telefone: { endsWith: tel.slice(-9) } },
  });
  if (!cliente) return NextResponse.json({ ok: false, motivo: "cliente não encontrado" }, { status: 404 });

  if (cliente.optOutCampanhas) {
    return NextResponse.json({ ok: true, motivo: "já estava em opt-out", nome: cliente.nome });
  }

  await prisma.cliente.update({
    where: { id: cliente.id },
    data: { optOutCampanhas: true, optOutEm: new Date() },
  });

  // Cancelar itens pendentes de campanha deste cliente
  await prisma.campanhaItem.updateMany({
    where: { telefone: { endsWith: tel.slice(-9) }, status: "PENDENTE" },
    data: { status: "ERRO", erro: "opt-out: cliente solicitou não receber mensagens" },
  });

  return NextResponse.json({ ok: true, nome: cliente.nome, mensagem: "Cliente registrado em opt-out. Campanhas pendentes canceladas." });
}
