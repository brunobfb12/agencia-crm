import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EVOLUTION_URL = "http://201.76.43.149:8081";
const EVOLUTION_KEY = "SuaChaveSecreta123";

export async function POST(req: Request) {
  const { clienteId, mensagemInicial } = await req.json();
  if (!clienteId) return NextResponse.json({ error: "clienteId obrigatório" }, { status: 400 });

  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    include: { empresa: true },
  });
  if (!cliente) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

  const { empresa } = cliente;
  if (!empresa.instanciaWhatsapp) return NextResponse.json({ error: "Empresa sem instância WhatsApp" }, { status: 400 });

  // Cria ou localiza lead ativo
  let lead = await prisma.lead.findFirst({
    where: { clienteId, empresaId: empresa.id, status: { notIn: ["PERDIDO", "SEM_INTERESSE"] } },
    orderBy: { criadoEm: "desc" },
  });
  if (!lead) {
    lead = await prisma.lead.create({
      data: { clienteId, empresaId: empresa.id, status: "LEAD" },
    });
  }

  // Monta mensagem inicial
  const nomeCliente = cliente.nome ? ` ${cliente.nome.split(" ")[0]}` : "";
  const nomeIA = empresa.nomeIA || null;
  const saudacao = mensagemInicial?.trim() ||
    (nomeIA
      ? `Oi${nomeCliente}! Tudo bem? Sou ${nomeIA} da ${empresa.nome}. Como posso te ajudar hoje?`
      : `Oi${nomeCliente}! Tudo bem? Sou da ${empresa.nome}. Como posso te ajudar hoje?`);

  // Envia via Evolution API
  const resp = await fetch(`${EVOLUTION_URL}/message/sendText/${empresa.instanciaWhatsapp}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: EVOLUTION_KEY },
    body: JSON.stringify({ number: cliente.telefone, textMessage: { text: saudacao } }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    return NextResponse.json({ error: "Falha ao enviar mensagem", detalhe: err }, { status: 500 });
  }

  return NextResponse.json({ ok: true, leadId: lead.id, mensagem: saudacao });
}
