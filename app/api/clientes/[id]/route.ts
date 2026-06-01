import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Chamadas internas do N8N usam secret — sem sessão de usuário
  const secret = req.nextUrl.searchParams.get("secret");
  const isInternal = secret === "crm2026migra";

  if (!isInternal) {
    const me = await getUsuarioLogado();
    if (!me) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    if (me.perfil !== "CENTRAL" && me.empresaId) {
      const cliente = await prisma.cliente.findUnique({ where: { id }, select: { empresaId: true } });
      if (!cliente || cliente.empresaId !== me.empresaId) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
      }
    }
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.nome !== undefined) data.nome = body.nome;
  if (body.email !== undefined) data.email = body.email;
  if (body.dataNascimento !== undefined) {
    if (body.dataNascimento) {
      const raw = String(body.dataNascimento);
      data.dataNascimento = new Date(/T/.test(raw) ? raw : raw + "T12:00:00Z");
    } else {
      data.dataNascimento = null;
    }
  }
  if (body.tags !== undefined) data.tags = body.tags;
  if (body.memoriaCliente !== undefined) data.memoriaCliente = body.memoriaCliente;
  if (body.optOutCampanhas !== undefined) data.optOutCampanhas = body.optOutCampanhas;

  // addTags: union — adiciona tags sem remover as existentes (usado pela IA)
  if (body.addTags && Array.isArray(body.addTags) && body.addTags.length > 0) {
    const current = await prisma.cliente.findUnique({ where: { id }, select: { tags: true } });
    const merged = [...new Set([...(current?.tags ?? []), ...body.addTags])];
    data.tags = merged;
  }

  const cliente = await prisma.cliente.update({ where: { id }, data });

  // Processar indicação: criar lead do indicado e disparar mensagem
  if (isInternal && body.indicacao?.telefoneIndicado && body.indicacao?.nomeIndicado) {
    const { nomeIndicado, telefoneIndicado } = body.indicacao;
    const telLimpo = String(telefoneIndicado).replace(/\D/g, "");
    if (telLimpo.length >= 10) {
      try {
        const clienteOrigem = await prisma.cliente.findUnique({
          where: { id },
          select: { nome: true, empresaId: true, empresa: { select: { instanciaWhatsapp: true, nomeIA: true, nome: true, mensagemIndicacao: true } } },
        });
        if (clienteOrigem) {
          const empresa = clienteOrigem.empresa;
          const nomeIndicador = clienteOrigem.nome ?? "Um cliente";
          const tagIndicacao = `indicado_por_${nomeIndicador.split(" ")[0]}`;

          // Criar ou encontrar cliente indicado
          const clienteIndicado = await prisma.cliente.upsert({
            where: { telefone_empresaId: { telefone: telLimpo, empresaId: clienteOrigem.empresaId } },
            create: { telefone: telLimpo, empresaId: clienteOrigem.empresaId, nome: nomeIndicado, tags: [tagIndicacao] },
            update: { nome: nomeIndicado, tags: { push: tagIndicacao } },
            select: { id: true },
          });

          // Criar lead para o indicado
          const leadExistente = await prisma.lead.findFirst({
            where: { clienteId: clienteIndicado.id, empresaId: clienteOrigem.empresaId, status: { notIn: ["PERDIDO", "SEM_INTERESSE"] } },
          });
          if (!leadExistente) {
            await prisma.lead.create({
              data: { clienteId: clienteIndicado.id, empresaId: clienteOrigem.empresaId, status: "LEAD", observacoes: `Indicado por ${nomeIndicador}` },
            });
          }

          // Disparar mensagem via Evolution API
          const ia = empresa.nomeIA ?? "Assistente";
          const msgTemplate = empresa.mensagemIndicacao ??
            `Oi ${nomeIndicado}! Sou ${ia}, da ${empresa.nome}. ${nomeIndicador} me passou seu contato e disse que você pode se interessar nos nossos produtos! Gostaria de saber como posso te ajudar? 😊\n\n1️⃣ Sim, me conta mais!\n2️⃣ Agora não, me chama em 7 dias\n3️⃣ Não, obrigado(a)`;
          const msg = msgTemplate
            .replace(/\{nome\}/g, nomeIndicado)
            .replace(/\{ia\}/g, ia)
            .replace(/\{empresa\}/g, empresa.nome)
            .replace(/\{indicador\}/g, nomeIndicador);

          const EVOLUTION_URL = "http://201.76.43.149:8080";
          const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY ?? "SuaChaveSecreta123";
          await fetch(`${EVOLUTION_URL}/message/sendText/${empresa.instanciaWhatsapp}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: EVOLUTION_KEY },
            body: JSON.stringify({ number: telLimpo, text: msg, options: { presence: "composing", delay: 3000 } }),
          }).catch(() => null);
        }
      } catch { /* não bloqueia a resposta principal */ }
    }
  }

  return NextResponse.json(cliente);
}
