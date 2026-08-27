import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LeadStatus } from "@prisma/client";

export async function POST(req: Request) {
  const body = await req.json();
  const { conversaId, leadId, resposta, novoStatus, observacoes, notificarVendedor, mensagemVendedor, notificarGerente, dataRecontato, score, memoriaCliente, clienteId } = body;

  if (!conversaId || !resposta) {
    return NextResponse.json({ ok: false, motivo: "campos obrigatorios ausentes" });
  }

  await prisma.mensagem.create({
    data: { conversaId, conteudo: resposta, direcao: "SAIDA" },
  });

  await prisma.conversa.update({
    where: { id: conversaId },
    data: {
      ultimaMensagem: resposta,
      ultimaAtividade: new Date(),
      processando: false,
      processandoEm: null,
    },
  });

  // Status hierarchy — AI cannot downgrade leads that reached AGENDADO or beyond
  const statusOrder: LeadStatus[] = [
    "LEAD", "AQUECIMENTO", "PRONTO_PARA_COMPRAR", "AGENDADO",
    "NEGOCIACAO", "VENDA_REALIZADA", "POS_VENDA",
  ];
  const terminalStatus: LeadStatus[] = ["PERDIDO", "SEM_INTERESSE", "SEM_RESPOSTA", "FOLLOW_UP"];

  // Buscar current sempre para verificação de trava + guardrail
  let current: { status: LeadStatus; briefingEnviadoEm: Date | null; vendedorNotificadoEm: Date | null } | null = null;
  if (leadId && (novoStatus || observacoes || notificarVendedor)) {
    current = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { status: true, briefingEnviadoEm: true, vendedorNotificadoEm: true },
    });
  }

  // CAMADA 2: Trava anti-duplicação de briefing completo (calcula FORA do if novoStatus)
  const ehBriefingCompleto = (mensagemVendedor as string)?.includes?.('🛒 PEDIDO PRONTO');
  const briefingSuprimido = notificarVendedor && ehBriefingCompleto && !!current?.briefingEnviadoEm;

  // CAMADA 3: Trava de re-notificação por tempo (janela 15 min para complementos excluídos)
  const ehComplemento = (mensagemVendedor as string)?.startsWith?.('➕ COMPLEMENTO');
  const minutosDesdeUltima = current?.vendedorNotificadoEm
    ? Math.floor((new Date().getTime() - new Date(current.vendedorNotificadoEm).getTime()) / 60000)
    : null;
  const notificacaoSuprimidaPorTempo = notificarVendedor && !ehComplemento
    && !!current?.vendedorNotificadoEm
    && minutosDesdeUltima !== null
    && minutosDesdeUltima < 15;

  // Marca quando briefing completo PASSA (não foi suprimido) — calcula ANTES do if
  let briefingEnviadoEmUpdate: Date | null | undefined;
  if (notificarVendedor && ehBriefingCompleto && !briefingSuprimido) {
    briefingEnviadoEmUpdate = new Date();
  }

  // Marca quando notificação ao vendedor PASSA (não foi suprimida por tempo nem briefing)
  let vendedorNotificadoEmUpdate: Date | null | undefined;
  if (notificarVendedor && !briefingSuprimido && !notificacaoSuprimidaPorTempo) {
    vendedorNotificadoEmUpdate = new Date();
  }

  if (leadId && (novoStatus || observacoes || briefingEnviadoEmUpdate !== undefined || vendedorNotificadoEmUpdate !== undefined)) {
    let statusToApply: LeadStatus | undefined;
    if (novoStatus) {
      const currentIdx = current ? statusOrder.indexOf(current.status as LeadStatus) : -1;
      const newIdx = statusOrder.indexOf(novoStatus as LeadStatus);
      const isTerminal = terminalStatus.includes(novoStatus as LeadStatus);

      // CAMADA 1: Exceção para novo ciclo de compra
      const ehNovoCiclo = (current?.status === 'POS_VENDA' || current?.status === 'VENDA_REALIZADA')
        && (novoStatus === 'NEGOCIACAO');

      // Only apply if it's a promotion, a terminal status, or current isn't in the ordered list
      if (ehNovoCiclo || isTerminal || newIdx === -1 || currentIdx === -1 || newIdx > currentIdx) {
        statusToApply = novoStatus as LeadStatus;
      }

      // Limpeza: quando lead sai de NEGOCIACAO, reseta o flag para permitir novo ciclo
      if (statusToApply && statusToApply !== 'NEGOCIACAO' && current?.status === 'NEGOCIACAO') {
        briefingEnviadoEmUpdate = null; // Sinal para limpar no update
      }
    }
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        ...(statusToApply && { status: statusToApply }),
        ...(observacoes && { observacoes }),
        ...(score !== undefined && { score: Number(score) }),
        ...(dataRecontato !== undefined && {
          dataRecontato: dataRecontato ? new Date(dataRecontato) : null,
        }),
        ...(briefingEnviadoEmUpdate !== undefined && { briefingEnviadoEm: briefingEnviadoEmUpdate }),
        ...(vendedorNotificadoEmUpdate !== undefined && { vendedorNotificadoEm: vendedorNotificadoEmUpdate }),
      },
    });
  }

  // Atualizar memória do cliente se informada
  if (clienteId && memoriaCliente) {
    await prisma.cliente.update({
      where: { id: clienteId },
      data: { memoriaCliente },
    }).catch(() => null);
  }

  let vendedor = null;
  let gerente = null;
  let aprendizados: string | null = null;

  if (leadId) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { empresa: { select: { aprendizados: true } } },
    });
    if (lead) {
      aprendizados = lead.empresa.aprendizados ?? null;
      // Notificar vendedor APENAS se briefing não foi suprimido E re-notificação não foi suprimida por tempo
      if (notificarVendedor && !briefingSuprimido && !notificacaoSuprimidaPorTempo) {
        if (lead.vendedorId) {
          // Lead já tem vendedor — notifica ele diretamente (ex: acompanhamento, NF, entrega)
          vendedor = await prisma.vendedor.findFirst({
            where: { id: lead.vendedorId, ativo: true },
            select: { id: true, nome: true, telefone: true },
          });
        }
        if (!vendedor) {
          // Round-robin: quem foi atribuído há mais tempo (ou nunca) recebe o próximo lead novo
          vendedor = await prisma.vendedor.findFirst({
            where: { empresaId: lead.empresaId, ativo: true },
            orderBy: [{ ultimaAtribuicaoEm: "asc" }, { ordemChamada: "asc" }],
            select: { id: true, nome: true, telefone: true },
          });
          // Atribui ao lead para que pressão P24/P48/P72 funcione
          if (vendedor) {
            await Promise.all([
              prisma.lead.update({ where: { id: lead.id }, data: { vendedorId: vendedor.id } }),
              prisma.vendedor.update({ where: { id: vendedor.id }, data: { ultimaAtribuicaoEm: new Date() } }),
            ]).catch(() => null);
          }
        }
      }
      if (notificarGerente) {
        gerente = await prisma.vendedor.findFirst({
          where: { empresaId: lead.empresaId, ativo: true, cargo: "GERENTE" },
          select: { id: true, nome: true, telefone: true },
        });
      }
    }
  }

  return NextResponse.json({ ok: true, vendedor, gerente, aprendizados });
}
