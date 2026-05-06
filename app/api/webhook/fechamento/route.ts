import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { instancia, telefoneVendedor, mensagem } = await req.json();
  if (!instancia || !telefoneVendedor || !mensagem) {
    return NextResponse.json({ ok: false, motivo: "campos obrigatorios ausentes" });
  }

  const empresa = await prisma.empresa.findUnique({ where: { instanciaWhatsapp: instancia } });
  if (!empresa) return NextResponse.json({ ok: false, motivo: "empresa nao encontrada" });

  const vendedor = await prisma.vendedor.findFirst({
    where: { empresaId: empresa.id, telefone: telefoneVendedor, ativo: true },
  });
  if (!vendedor) return NextResponse.json({ ok: false, motivo: "vendedor nao encontrado" });

  // Parse: FECHADO 1500 | FECHADO 1.500,00 | FECHADO 1500 João Silva
  const match = mensagem.trim().match(/^FECHADO\s+([\d.,]+)(?:\s+(.+))?/i);
  if (!match) return NextResponse.json({ ok: false, motivo: "formato invalido" });

  const valorStr = match[1].replace(/\./g, "").replace(",", ".");
  const valor = parseFloat(valorStr);
  const termoBusca = match[2]?.trim() || null;

  if (isNaN(valor) || valor <= 0) {
    return NextResponse.json({ ok: false, motivo: "valor invalido" });
  }

  const leadsAtivos = await prisma.lead.findMany({
    where: {
      vendedorId: vendedor.id,
      empresaId: empresa.id,
      status: { notIn: ["VENDA_REALIZADA", "PERDIDO", "SEM_INTERESSE"] },
    },
    orderBy: { atualizadoEm: "desc" },
    include: { cliente: { select: { nome: true, telefone: true } } },
  });

  if (leadsAtivos.length === 0) {
    return NextResponse.json({ ok: false, motivo: "nenhum lead ativo encontrado para este vendedor" });
  }

  let lead = leadsAtivos[0];
  let descricao: string | null = null;

  if (leadsAtivos.length === 1) {
    // único lead ativo — texto extra é descrição do produto
    descricao = termoBusca;
  } else {
    // múltiplos leads — texto extra identifica o cliente
    if (!termoBusca) {
      const lista = leadsAtivos
        .map((l, i) => `${i + 1}. ${l.cliente.nome ?? l.cliente.telefone}`)
        .join("\n");
      return NextResponse.json({
        ok: false,
        motivo: `Você tem ${leadsAtivos.length} leads ativos. Informe o cliente:\nFECHADO ${match[1]} [nome]\n\n${lista}`,
      });
    }

    const termo = termoBusca.toLowerCase();
    const soNumeros = termoBusca.replace(/\D/g, "");
    const encontrados = leadsAtivos.filter((l) =>
      (l.cliente.nome ?? "").toLowerCase().includes(termo) ||
      (soNumeros.length >= 4 && l.cliente.telefone.includes(soNumeros))
    );

    if (encontrados.length === 0) {
      const lista = leadsAtivos
        .map((l, i) => `${i + 1}. ${l.cliente.nome ?? l.cliente.telefone}`)
        .join("\n");
      return NextResponse.json({
        ok: false,
        motivo: `Nenhum lead encontrado para "${termoBusca}". Seus leads ativos:\n\n${lista}`,
      });
    }

    if (encontrados.length > 1) {
      const lista = encontrados
        .map((l, i) => `${i + 1}. ${l.cliente.nome ?? l.cliente.telefone}`)
        .join("\n");
      return NextResponse.json({
        ok: false,
        motivo: `Mais de um cliente para "${termoBusca}", seja mais específico:\n\n${lista}`,
      });
    }

    lead = encontrados[0];
  }

  await prisma.lead.update({
    where: { id: lead.id },
    data: { status: "VENDA_REALIZADA" },
  });

  await prisma.venda.create({
    data: { leadId: lead.id, vendedorId: vendedor.id, valor, descricao },
  });

  const nomeCliente = lead.cliente.nome ?? lead.cliente.telefone;
  return NextResponse.json({
    ok: true,
    confirmacao: `✅ Venda registrada!\nCliente: ${nomeCliente}\nValor: R$ ${valor.toFixed(2).replace(".", ",")}${descricao ? `\nProduto: ${descricao}` : ""}`,
    leadId: lead.id,
    valor,
  });
}
