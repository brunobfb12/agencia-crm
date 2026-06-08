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

    // Busca pelo @lid exato ou pelo telefone normalizado
    let cliente = await prisma.cliente.findFirst({
      where: {
        empresaId: empresa.id,
        OR: [{ telefone: jidLimpo }, { telefone: telefoneLimpo }],
      },
    });

    // Fallback: busca pelo telefonePrincipal
    if (!cliente) {
      cliente = await prisma.cliente.findFirst({
        where: { empresaId: empresa.id, telefonePrincipal: telefoneLimpo },
      });
    }

    // Cria cliente novo se não encontrou
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
      // Round-robin: pega o vendedor com atribuição mais antiga
      const vendedores = empresa.vendedores;
      const vendedor =
        vendedores.sort((a, b) => {
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
      const horaBr = new Date(Date.now() - 3 * 60 * 60 * 1000);
      const horaStr = horaBr.toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const dataStr = horaBr.toLocaleDateString("pt-BR");
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          observacoes: `${lead.observacoes ?? ""}\n[CHAMADA_${isVideo ? "VIDEO" : "VOZ"}_${dataStr}_${horaStr}]`.trim(),
        },
      });
    }

    // Notifica vendedor
    const vendedor = lead.vendedor;
    let notificado = false;

    if (vendedor?.telefone) {
      const evoUrl = process.env.EVOLUTION_API_URL ?? "https://evolution-evolution-api.6jgzku.easypanel.host";
      const evoKey = process.env.EVOLUTION_API_KEY ?? "SuaChaveSecreta123";
      const nomeCliente = cliente.nome || telefone;
      const tipoCall = isVideo ? "vídeo" : "voz";
      const isLidJid = (jid || "").includes("@lid");
      const linkContato = isLidJid
        ? `https://wa.me/${jid}`
        : `https://wa.me/${telefoneLimpo}`;
      const msgVendedor = `📞 *Chamada perdida!*\n\n👤 *${nomeCliente}* tentou te ligar via ${tipoCall} no WhatsApp.\n\n⚡ Chama agora!\n👉 ${linkContato}`;

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
