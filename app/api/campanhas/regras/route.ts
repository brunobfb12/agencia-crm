import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth";

// Store rules in a simple key-value config (reuse or create a Config model)
// For simplicity, store as JSON in a dedicated row using a hacky but workable approach:
// We'll use the existing Ferramenta table with tipo="CONFIG_CAMPANHA"

const CONFIG_KEY = "REGRAS_CAMPANHA";

export async function GET() {
  const usuario = await getUsuarioLogado();
  if (!usuario || usuario.perfil !== "CENTRAL") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const config = await prisma.ferramenta.findFirst({
    where: { tipo: "CONFIG_CAMPANHA", nome: CONFIG_KEY },
  });

  if (!config?.observacoes) {
    return NextResponse.json(defaultRegras());
  }

  try {
    return NextResponse.json(JSON.parse(config.observacoes));
  } catch {
    return NextResponse.json(defaultRegras());
  }
}

export async function PATCH(req: NextRequest) {
  const usuario = await getUsuarioLogado();
  if (!usuario || usuario.perfil !== "CENTRAL") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const regras = await req.json();

  await prisma.ferramenta.upsert({
    where: { id: "config_regras_campanha" },
    create: {
      id: "config_regras_campanha",
      nome: CONFIG_KEY,
      tipo: "CONFIG_CAMPANHA",
      ativo: true,
      observacoes: JSON.stringify(regras),
    },
    update: { observacoes: JSON.stringify(regras) },
  });

  return NextResponse.json({ ok: true });
}

function defaultRegras() {
  return [
    { tipo: "AUTO_SEM_RESPOSTA", diasInativo: 3, ativo: true, mensagem: "Olá {nome}! Notei que não conseguimos conversar. Posso te ajudar com alguma dúvida? 😊" },
    { tipo: "AUTO_AQUECIMENTO",  diasInativo: 7, ativo: false, mensagem: "Oi {nome}! Tudo bem? Ainda está interessado em nossos produtos? Temos novidades para você! 🔥" },
    { tipo: "AUTO_POS_VENDA",    diasInativo: 7, ativo: false, mensagem: "Olá {nome}! Como foi sua experiência com a compra? Podemos te ajudar com algo? ⭐" },
  ];
}
