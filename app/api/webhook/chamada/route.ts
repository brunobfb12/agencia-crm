import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizarTelefone(tel: string): string {
  let t = tel.replace(/\D/g, "").replace(/@.*$/, "");
  if (t.startsWith("5555") && t.length > 13) t = "55" + t.slice(4);
  if (!t.startsWith("55")) t = "55" + t;
  if (t.length === 12) t = t.slice(0, 4) + "9" + t.slice(4);
  return t;
}

async function resolverNumeroReal(jid: string, instancia: string): Promise<string | null> {
  try {
    const evoUrl = process.env.EVOLUTION_API_URL ?? "https://evolution-evolution-api.6jgzku.easypanel.host";
    const evoKey = process.env.EVOLUTION_API_KEY ?? "SuaChaveSecreta123";

    const resp = await fetch(`${evoUrl}/chat/whatsappNumbers/${instancia}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: evoKey },
      body: JSON.stringify({ numbers: [jid] }),
    });

    if (!resp.ok) return null;

    const data = await resp.json();
    const item = Array.isArray(data) ? data[0] : data;
    const numeroReal = item?.jid?.replace(/@[^@]+$/, "") || item?.number || null;

    if (numeroReal && numeroReal !== jid.replace(/@[^@]+$/, "")) {
      return normalizarTelefone(numeroReal);
    }
    return null;
  } catch (e) {
    console.error("Erro ao resolver número real:", e);
    return null;
  }
}

async function resolverNomeReal(jidLimpo: string, instancia: string): Promise<string | null> {
  try {
    const evoUrl = process.env.EVOLUTION_API_URL ?? "https://evolution-evolution-api.6jgzku.easypanel.host";
    const evoKey = process.env.EVOLUTION_API_KEY ?? "SuaChaveSecreta123";

    const resp = await fetch(`${evoUrl}/chat/fetchProfile/${instancia}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: evoKey },
      body: JSON.stringify({ wid: jidLimpo }),
    });

    if (!resp.ok) return null;

    const data = await resp.json();
    console.log("CHAMADA fetchProfile resposta:", JSON.stringify(data));

    const nomeResolvido = data?.name || data?.pushName || data?.displayName || null;
    return nomeResolvido?.trim() || null;
  } catch (e) {
    console.error("Erro ao resolver nome:", e);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { instancia, telefone, jid, isVideo } = body;

    console.log("CHAMADA DEBUG:", JSON.stringify({ instancia, telefone, jid, isVideo }));

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

    const jidLimpo = jid || telefone;
    const isLidJid = jidLimpo.includes("@lid");

    // Para iPhone (@lid): tenta resolver o número real via Evolution API
    let telefoneReal: string | null = null;
    if (isLidJid) {
      telefoneReal = await resolverNumeroReal(jidLimpo, instancia);
      console.log("CHAMADA numero real resolvido:", telefoneReal);
    }

    // Se não conseguiu resolver número, tenta resolver nome
    let nomeReal: string | null = null;
    let lidNaoResolvido = false;
    if (isLidJid && !telefoneReal) {
      nomeReal = await resolverNomeReal(jidLimpo, instancia);
      console.log("CHAMADA nome resolvido:", nomeReal);
      if (!nomeReal) lidNaoResolvido = true;
    }

    const telefoneLimpo = isLidJid ? (telefoneReal || null) : normalizarTelefone(telefone);

    // Busca cliente em ordem de prioridade
    let cliente = null;

    // 1. Busca pelo número real (se conseguiu resolver)
    if (telefoneReal) {
      cliente = await prisma.cliente.findFirst({
        where: {
          empresaId: empresa.id,
          OR: [{ telefonePrincipal: telefoneReal }, { telefone: telefoneReal }],
        },
      });
      console.log("CHAMADA busca por numero real:", cliente?.id || "não encontrado");
    }

    // 2. Busca pelo @lid exato
    if (!cliente) {
      cliente = await prisma.cliente.findFirst({
        where: { empresaId: empresa.id, telefone: jidLimpo },
      });
      console.log("CHAMADA busca por lid:", cliente?.id || "não encontrado");
    }

    // 2b. Se @lid e tem nome resolvido, tenta buscar por nome
    if (!cliente && nomeReal) {
      const nomeLimpo = nomeReal.replace(/[^\p{L}\p{N}\s]/gu, "").trim();
      if (nomeLimpo) {
        cliente = await prisma.cliente.findFirst({
          where: {
            empresaId: empresa.id,
            nome: { contains: nomeLimpo, mode: "insensitive" },
          },
          orderBy: { criadoEm: "desc" },
        });
        console.log("CHAMADA busca por nome resolvido:", cliente?.id || "não encontrado");
      }
    }

    // 3. Se achou cliente e tem número real, atualiza telefonePrincipal
    if (cliente && telefoneReal && !cliente.telefonePrincipal) {
      await prisma.cliente.update({
        where: { id: cliente.id },
        data: { telefonePrincipal: telefoneReal },
      });
    }

    // 4. Cria cliente novo apenas se não encontrou
    if (!cliente) {
      cliente = await prisma.cliente.create({
        data: {
          empresaId: empresa.id,
          nome: nomeReal || "Cliente (chamada perdida)",
          telefone: jidLimpo,
          telefonePrincipal: telefoneReal || null,
        },
      });
      console.log("CHAMADA cliente criado:", cliente.id);
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
          observacoes: `[CHAMADA_PERDIDA_${isVideo ? "VIDEO" : "VOZ"}]${lidNaoResolvido ? " [LID_NAO_RESOLVIDO]" : ""}`,
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

    // ====== Notifica CLIENTE ======
    const nomeIAUsado = empresa.nomeIA || "nossa equipe";
    let msgCliente = `Oi! Aqui é a ${nomeIAUsado} da ${empresa.nome}. A gente não atende chamada por aqui no WhatsApp, mas te ajudo rapidinho!`;

    if (empresa.telefoneFixo?.trim()) {
      msgCliente += `\n📞 Pra urgência, liga: ${empresa.telefoneFixo}`;
    }

    msgCliente += `\nOu só me manda sua mensagem aqui que eu já encaminho pro nosso time 😊`;

    try {
      const evoUrl = process.env.EVOLUTION_API_URL ?? "https://evolution-evolution-api.6jgzku.easypanel.host";
      const evoKey = process.env.EVOLUTION_API_KEY ?? "SuaChaveSecreta123";
      const respCliente = await fetch(`${evoUrl}/message/sendText/${instancia}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: evoKey },
        body: JSON.stringify({ number: jidLimpo, text: msgCliente }),
      });
      console.log("CHAMADA mensagem cliente:", jidLimpo, respCliente.status);
    } catch (e) {
      console.error("Erro ao enviar mensagem cliente:", e);
    }

    return NextResponse.json({
      ok: true,
      lead: lead.id,
      cliente: cliente.nome,
      vendedor: lead.vendedor?.nome || null,
      telefoneReal,
    });
  } catch (error) {
    console.error("Erro webhook chamada:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
