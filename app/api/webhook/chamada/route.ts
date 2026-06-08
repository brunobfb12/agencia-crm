import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizarTelefone(tel: string): string {
  let t = tel.replace(/\D/g, "").replace(/@.*$/, "");
  if (t.startsWith("5555") && t.length > 13) t = "55" + t.slice(4);
  if (!t.startsWith("55")) t = "55" + t;
  if (t.length === 12) t = t.slice(0, 4) + "9" + t.slice(4);
  return t;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { instancia, telefone, jid, isVideo } = body;

    if (!instancia || !telefone) {
      return NextResponse.json({ error: "instancia e telefone obrigatórios" }, { status: 400 });
    }

    const empresa = await prisma.empresa.findFirst({
      where: { instanciaWhatsapp: instancia },
      include: {
        vendedores: {
          where: { ativo: true },
          orderBy: { ordemChamada: "asc" },
        },
      },
    });

    if (!empresa) {
      return NextResponse.json({ error: "empresa não encontrada" }, { status: 404 });
    }

    const telefoneLimpo = normalizarTelefone(telefone);
    const jidLimpo = jid || telefone;
    const isLidJid = jidLimpo.includes("@lid");

    // ETAPA 1: busca pelo @lid exato, telefone normalizado ou telefonePrincipal
    let cliente = await prisma.cliente.findFirst({
      where: {
        empresaId: empresa.id,
        OR: [
          { telefone: jidLimpo },
          { telefone: telefoneLimpo },
          { telefonePrincipal: telefoneLimpo },
        ],
      },
    });

    // ETAPA 2: se achou e é iPhone, garante que telefonePrincipal está salvo
    if (cliente && isLidJid && !cliente.telefonePrincipal) {
      await prisma.cliente.update({
        where: { id: cliente.id },
        data: { telefonePrincipal: telefoneLimpo },
      });
    }

    // ETAPA 3: cria cliente novo se não encontrou
    if (!cliente) {
      cliente = await prisma.cliente.create({
        data: {
          empresaId: empresa.id,
          nome: "Cliente (chamada perdida)",
          telefone: jidLimpo,
          telefonePrincipal: telefoneLimpo,
        },
      });
    }

    // Busca lead ativo
    let lead = await prisma.lead.findFirst({
      where: {
        clienteId: cliente.id,
        empresaId: empresa.id,
        status: { notIn: ["PERDIDO", "SEM_INTERESSE", "SEM_RESPOSTA"] },
      },
      include: { vendedor: true },
      orderBy: { criadoEm: "desc" },
    });

    if (!lead) {
      const vendedor = empresa.vendedores.sort((a, b) => {
        const ta = a.ultimaAtribuicaoEm?.getTime() ?? 0;
        const tb = b.ultimaAtribuicaoEm?.getTime() ?? 0;
        return ta - tb;
      })[0] || null;

      lead = await prisma.lead.create({
        data: {
          clienteId: cliente.id,
          empresaId: empresa.id,
          vendedorId: vendedor?.id || null,
          status: "LEAD",
          score: 3,
          observacoes: `[CHAMADA_PERDIDA_${isVideo ? "VIDEO" : "VOZ"}]`,
        },
        include: { vendedor: true },
      });

      if (vendedor) {
        await prisma.vendedor.update({
          where: { id: vendedor.id },
          data: { ultimaAtribuicaoEm: new Date() },
        });
      }
    } else {
      const dataBr = new Date().toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit", month: "2-digit",
        hour: "2-digit", minute: "2-digit",
      });
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          observacoes: `${lead.observacoes ?? ""}\n[CHAMADA_${isVideo ? "VIDEO" : "VOZ"}_${dataBr}]`.trim(),
        },
      });
    }

    // Notifica vendedor
    const vendedor = lead.vendedor;
    let notificado = false;

    if (vendedor?.telefone) {
      const evoUrl = process.env.EVOLUTION_API_URL ?? "https://evolution-evolution-api.6jgzku.easypanel.host";
      const evoKey = process.env.EVOLUTION_API_KEY ?? "SuaChaveSecreta123";
      const nomeCliente = cliente.nome || "Cliente desconhecido";
      const tipoCall = isVideo ? "vídeo" : "voz";

      const msgVendedor = isLidJid
        ? `📞 *Chamada perdida!*\n\n👤 *${nomeCliente}* tentou te ligar via ${tipoCall} (iPhone).\n\n⚡ Abra o WhatsApp da loja e procure a conversa com esse cliente na lista de chats.`
        : `📞 *Chamada perdida!*\n\n👤 *${nomeCliente}* tentou te ligar via ${tipoCall}.\n\n⚡ Chama agora!\n👉 https://wa.me/${telefoneLimpo}`;

      try {
        const resp = await fetch(`${evoUrl}/message/sendText/${instancia}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: evoKey },
          body: JSON.stringify({ number: vendedor.telefone, text: msgVendedor }),
        });
        notificado = resp.ok;
      } catch (e) {
        console.error("Erro ao notificar vendedor:", e);
      }
    }

    return NextResponse.json({
      ok: true,
      lead: lead.id,
      cliente: cliente.nome,
      vendedor: lead.vendedor?.nome || null,
      notificado,
    });
  } catch (error) {
    console.error("Erro webhook chamada:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
