import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EVOLUTION_URL = "http://201.76.43.149:8081";
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY ?? "SuaChaveSecreta123";

async function checkInstancia(instancia: string) {
  try {
    const res = await fetch(`${EVOLUTION_URL}/instance/connectionState/${instancia}`, {
      headers: { apikey: EVOLUTION_KEY },
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return { instancia, state: data?.instance?.state ?? "unknown" };
  } catch {
    return { instancia, state: "offline" };
  }
}

export async function GET() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Fetch instances from DB — dynamic, includes any company registered via the form
  const empresas = await prisma.empresa.findMany({
    where: { ativa: true },
    select: {
      id: true, instanciaWhatsapp: true, nome: true,
      informacoes: true, nomeIA: true, tipoAtendimento: true,
      calendlyUrl: true, perguntasQualificacao: true,
      _count: { select: { vendedores: { where: { ativo: true } } } },
    },
    orderBy: { nome: "asc" },
  });

  const instancias = empresas.map((e) => e.instanciaWhatsapp);

  // Safe counts — tables may not exist if migration hasn't run yet
  let mensagensHoje = 0, leadsHoje = 0, mensagensMes = 0;
  try {
    [mensagensHoje, leadsHoje, mensagensMes] = await Promise.all([
      prisma.mensagem.count({ where: { criadoEm: { gte: hoje }, direcao: "SAIDA" } }),
      prisma.lead.count({ where: { criadoEm: { gte: hoje } } }),
      prisma.mensagem.count({
        where: {
          criadoEm: { gte: new Date(hoje.getFullYear(), hoje.getMonth(), 1) },
          direcao: "SAIDA",
        },
      }),
    ]);
  } catch { /* migration not yet applied */ }

  const [whatsappStatus, ferramentas] = await Promise.all([
    Promise.all(instancias.map(checkInstancia)),
    prisma.ferramenta.findMany({ orderBy: { criadoEm: "asc" } }),
  ]);

  const alertas = ferramentas.filter((f: { vencimento: Date | null }) => {
    if (!f.vencimento) return false;
    const dias = Math.ceil((f.vencimento.getTime() - Date.now()) / 86400000);
    return dias <= 7;
  });

  const whatsapp = whatsappStatus.map((w) => {
    const empresa = empresas.find((e) => e.instanciaWhatsapp === w.instancia);
    const tipo = empresa?.tipoAtendimento ?? "AGENDAMENTO";
    const precisaCalendly = tipo === "AGENDAMENTO" || tipo === "AMBOS";
    const setup = empresa ? {
      vendedores:    empresa._count.vendedores > 0,
      informacoes:  !!empresa.informacoes?.trim(),
      nomeIA:       !!empresa.nomeIA?.trim(),
      tipoDefinido: true,
      calendly:     !precisaCalendly || !!empresa.calendlyUrl?.trim(),
      qualificacao: !!empresa.perguntasQualificacao?.trim(),
      tipoAtendimento: tipo,
    } : null;
    return { ...w, nomeEmpresa: empresa?.nome ?? w.instancia, setup };
  });

  return NextResponse.json({
    whatsapp,
    atividade: { mensagensHoje, leadsHoje, mensagensMes },
    ferramentas,
    alertas,
  });
}
