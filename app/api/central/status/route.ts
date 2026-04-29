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
    select: { instanciaWhatsapp: true, nome: true },
    orderBy: { nome: "asc" },
  });

  const instancias = empresas.map((e: { instanciaWhatsapp: string; nome: string }) => e.instanciaWhatsapp);

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

  // Enrich with empresa name
  const whatsapp = whatsappStatus.map((w: { instancia: string; state: string }) => {
    const empresa = empresas.find((e: { instanciaWhatsapp: string; nome: string }) => e.instanciaWhatsapp === w.instancia);
    return { ...w, nomeEmpresa: empresa?.nome ?? w.instancia };
  });

  return NextResponse.json({
    whatsapp,
    atividade: { mensagensHoje, leadsHoje, mensagensMes },
    ferramentas,
    alertas,
  });
}
