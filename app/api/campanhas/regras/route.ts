import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth";

// Regras armazenadas na tabela Ferramenta com tipo="CONFIG_CAMPANHA"
// Uma linha por empresa: nome="REGRAS_CAMPANHA", link=empresaId
// Fallback global: link=null (usado enquanto empresas não têm regra própria)

function defaultRegras() {
  return [
    { tipo: "AUTO_SEM_RESPOSTA", diasInativo: 3,  ativo: true,  mensagem: "Olá {nome}! Notei que não conseguimos conversar. Posso te ajudar com alguma dúvida? 😊" },
    { tipo: "AUTO_AQUECIMENTO",  diasInativo: 7,  ativo: false, mensagem: "Oi {nome}! Tudo bem? Ainda está interessado em nossos produtos? Temos novidades para você! 🔥" },
    { tipo: "AUTO_POS_VENDA",    diasInativo: 7,  ativo: false, mensagem: "Olá {nome}! Como foi sua experiência com a compra? Podemos te ajudar com algo? ⭐" },
    { tipo: "AUTO_FOLLOW_UP",    diasInativo: 14, ativo: false, mensagem: "Oi {nome}! Passando para saber se posso te ajudar com alguma coisa. 😊" },
  ];
}

function ferramentaId(empresaId: string) {
  return `config_regras_campanha_${empresaId}`;
}

export async function GET(req: NextRequest) {
  const usuario = await getUsuarioLogado();
  if (!usuario) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  // CENTRAL pode ver qualquer empresa via ?empresaId=X
  // EMPRESA só vê a própria
  const { searchParams } = new URL(req.url);
  const queriedId = searchParams.get("empresaId");

  let empresaId: string;
  if (usuario.perfil === "CENTRAL") {
    if (!queriedId) {
      // Retorna regras globais (fallback)
      const global = await prisma.ferramenta.findFirst({
        where: { tipo: "CONFIG_CAMPANHA", nome: "REGRAS_CAMPANHA" },
      });
      return NextResponse.json(global?.observacoes ? JSON.parse(global.observacoes) : defaultRegras());
    }
    empresaId = queriedId;
  } else {
    if (!usuario.empresaId) return NextResponse.json({ error: "Sem empresa" }, { status: 403 });
    empresaId = usuario.empresaId;
  }

  const config = await prisma.ferramenta.findFirst({
    where: { tipo: "CONFIG_CAMPANHA", nome: "REGRAS_CAMPANHA", link: empresaId },
  });
  return NextResponse.json(config?.observacoes ? JSON.parse(config.observacoes) : defaultRegras());
}

export async function PATCH(req: NextRequest) {
  const usuario = await getUsuarioLogado();
  if (!usuario) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const queriedId = searchParams.get("empresaId");

  let empresaId: string;
  if (usuario.perfil === "CENTRAL") {
    if (!queriedId) return NextResponse.json({ error: "empresaId obrigatório" }, { status: 400 });
    empresaId = queriedId;
  } else {
    if (!usuario.empresaId) return NextResponse.json({ error: "Sem empresa" }, { status: 403 });
    empresaId = usuario.empresaId;
  }

  const regras = await req.json();

  await prisma.ferramenta.upsert({
    where: { id: ferramentaId(empresaId) },
    create: {
      id: ferramentaId(empresaId),
      nome: "REGRAS_CAMPANHA",
      tipo: "CONFIG_CAMPANHA",
      link: empresaId,
      ativo: true,
      observacoes: JSON.stringify(regras),
    },
    update: { observacoes: JSON.stringify(regras) },
  });

  return NextResponse.json({ ok: true });
}
