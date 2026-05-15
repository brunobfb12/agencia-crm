import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EVOL_URL = process.env.EVOLUTION_API_URL ?? "http://201.76.43.149:8081";
const EVOL_KEY = process.env.EVOLUTION_API_KEY ?? "SuaChaveSecreta123";
const SECRET   = "crm2026migra";

async function enviarWhatsApp(instancia: string, numero: string, texto: string) {
  const res = await fetch(`${EVOL_URL}/message/sendText/${instancia}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: EVOL_KEY },
    body: JSON.stringify({ number: numero, textMessage: { text: texto } }),
  });
  if (!res.ok) throw new Error(`Evolution ${res.status}: ${(await res.text()).slice(0, 120)}`);
}

async function registrarMensagemSaida(clienteId: string, mensagem: string) {
  let conversa = await prisma.conversa.findFirst({
    where: { clienteId },
    orderBy: { ultimaAtividade: "desc" },
  });
  if (!conversa) {
    conversa = await prisma.conversa.create({ data: { clienteId } });
  }
  await prisma.mensagem.create({
    data: { conversaId: conversa.id, conteudo: mensagem, direcao: "SAIDA" },
  });
  await prisma.conversa.update({
    where: { id: conversa.id },
    data: { ultimaMensagem: mensagem, ultimaAtividade: new Date() },
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("secret") !== SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Agendamentos "de hoje" no horário Brasil (UTC-3)
  // Todos os dias são salvos como T03:00:00.000Z (meia-noite Brasil)
  const hoje = new Date();
  const dataInicio = new Date(hoje.toISOString().split("T")[0] + "T03:00:00.000Z");
  const dataFim    = new Date(dataInicio.getTime() + 24 * 60 * 60 * 1000);

  const agendamentos = await prisma.agendamento.findMany({
    where: {
      status: "PENDENTE",
      dataAgendada: { gte: dataInicio, lt: dataFim },
    },
    include: {
      cliente: {
        include: {
          empresa: {
            select: {
              nome: true,
              instanciaWhatsapp: true,
              nomeIA: true,
              mensagemPosVenda: true,
              mensagemAniversario: true,
              ativa: true,
            },
          },
          leads: {
            where: { status: { notIn: ["PERDIDO", "SEM_INTERESSE"] } },
            orderBy: { criadoEm: "desc" },
            take: 1,
            include: { vendedor: { select: { id: true, nome: true, telefone: true } } },
          },
        },
      },
    },
    orderBy: { dataAgendada: "asc" },
  });

  type Resultado = { id: string; tipo: string; status: string; detalhe?: string };
  const resultados: Resultado[] = [];

  for (const ag of agendamentos) {
    const empresa = ag.cliente.empresa;

    if (!empresa.ativa || !empresa.instanciaWhatsapp) {
      resultados.push({ id: ag.id, tipo: ag.tipo, status: "skip", detalhe: "empresa inativa ou sem instância" });
      continue;
    }

    const lead     = ag.cliente.leads[0] ?? null;
    const vendedor = lead?.vendedor ?? null;
    const primeiroNome = ag.cliente.nome ? ag.cliente.nome.split(" ")[0] : "";
    const nome     = primeiroNome ? ` ${primeiroNome}` : "";
    const ia       = empresa.nomeIA ?? "Eu";
    const horaStr  = ag.hora ? ` às ${ag.hora}` : "";

    let mensagem    = "";
    let destinatario = ag.cliente.telefone;
    let ehMensagemCliente = true;

    switch (ag.tipo) {
      case "FOLLOW_UP":
        mensagem = ag.notas
          ? `Oi${nome}! ${ia} aqui, da ${empresa.nome}. ${ag.notas}`
          : `Oi${nome}! ${ia} aqui, da ${empresa.nome}. Conforme combinamos, estou passando para ver como posso te ajudar! 😊 Como posso te atender?`;
        break;

      case "POS_VENDA":
        mensagem = empresa.mensagemPosVenda
          ? empresa.mensagemPosVenda
              .replace(/\{nome\}/g, primeiroNome)
              .replace(/\{ia\}/g, ia)
              .replace(/\{empresa\}/g, empresa.nome)
          : `Oi${nome}! 😊 ${ia} aqui, da ${empresa.nome}. Tudo certo com seu pedido? Precisando de algo, pode me chamar!`;
        break;

      case "REATIVACAO":
        mensagem = ag.notas
          ? `Oi${nome}! ${ia} aqui, da ${empresa.nome}. ${ag.notas}`
          : `Oi${nome}! ${ia} aqui, da ${empresa.nome}. Faz um tempo que não conversamos! 😊 Temos novidades que podem te interessar. Posso te contar?`;
        break;

      case "ANIVERSARIO":
        mensagem = empresa.mensagemAniversario
          ? empresa.mensagemAniversario
              .replace(/\{nome\}/g, primeiroNome)
              .replace(/\{ia\}/g, ia)
              .replace(/\{empresa\}/g, empresa.nome)
          : `Oi${nome}! 🎂 ${ia} aqui, da ${empresa.nome}. Hoje é seu dia especial — feliz aniversário! Que seja um dia incrível! 🥳`;
        break;

      case "CONSULTA":
        mensagem = `Oi${nome}! ✅ Lembrando que temos uma consulta agendada para hoje${horaStr}. Qualquer dúvida, pode me chamar! 😊`;
        break;

      case "TAREFA":
        if (!vendedor?.telefone) {
          resultados.push({ id: ag.id, tipo: ag.tipo, status: "skip", detalhe: "sem vendedor atribuído" });
          continue;
        }
        destinatario = vendedor.telefone;
        ehMensagemCliente = false;
        mensagem = `📋 *Tarefa do dia:* ${ag.notas ?? "verificar com o cliente"}${ag.cliente.nome ? `\n👤 Cliente: ${ag.cliente.nome} · ${ag.cliente.telefone}` : ""}`;
        break;

      default:
        resultados.push({ id: ag.id, tipo: ag.tipo, status: "skip", detalhe: "tipo desconhecido" });
        continue;
    }

    try {
      await enviarWhatsApp(empresa.instanciaWhatsapp, destinatario, mensagem);

      // Registra no histórico da conversa (apenas mensagens ao cliente)
      if (ehMensagemCliente) {
        await registrarMensagemSaida(ag.cliente.id, mensagem);
      }

      // Marca como concluído
      await prisma.agendamento.update({
        where: { id: ag.id },
        data: { status: "CONCLUIDO" },
      });

      resultados.push({ id: ag.id, tipo: ag.tipo, status: "enviado" });
    } catch (e: any) {
      resultados.push({ id: ag.id, tipo: ag.tipo, status: "erro", detalhe: e.message?.slice(0, 120) });
    }
  }

  const enviados = resultados.filter(r => r.status === "enviado").length;
  const erros    = resultados.filter(r => r.status === "erro").length;

  return NextResponse.json({ total: agendamentos.length, enviados, erros, resultados });
}
