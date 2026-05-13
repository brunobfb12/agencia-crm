import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioLogado } from "@/lib/auth";

const EVO_URL = "http://201.76.43.149:8081";
const EVO_KEY = process.env.EVOLUTION_API_KEY ?? "SuaChaveSecreta123";

export async function GET() {
  const me = await getUsuarioLogado();
  if (!me || me.perfil !== "EMPRESA" || !me.empresaId) {
    return NextResponse.json(null);
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id: me.empresaId },
    select: {
      informacoes: true,
      instanciaWhatsapp: true,
      nomeIA: true,
      mensagemPosVenda: true,
      mensagemAniversario: true,
      perguntasQualificacao: true,
      _count: { select: { clientes: true } },
    },
  });

  if (!empresa) return NextResponse.json(null);

  const vendedoresCount = await prisma.vendedor.count({ where: { empresaId: me.empresaId, ativo: true } });

  let whatsappOk = false;
  try {
    const res = await fetch(`${EVO_URL}/instance/connectionState/${empresa.instanciaWhatsapp}`, {
      headers: { apikey: EVO_KEY },
      signal: AbortSignal.timeout(4000),
    });
    const data = await res.json();
    whatsappOk = data?.instance?.state === "open";
  } catch { /* offline */ }

  return NextResponse.json({
    informacoesOk:    !!empresa.informacoes?.trim(),
    whatsappOk,
    vendedoresOk:     vendedoresCount > 0,
    clientesOk:       empresa._count.clientes > 0,
    nomeIAOk:         !!empresa.nomeIA?.trim(),
    posVendaOk:       !!empresa.mensagemPosVenda?.trim(),
    aniversarioOk:    !!empresa.mensagemAniversario?.trim(),
    qualificacaoOk:   !!empresa.perguntasQualificacao?.trim(),
  });
}
