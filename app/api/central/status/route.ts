import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EVOLUTION_URL = "http://201.76.43.149:8081";
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY ?? "SuaChaveSecreta123";

const INSTANCIAS = [
  "ph_intima", "di_charmy", "opus_automotivo", "parede_tintas_1",
  "hoken", "parede_tintas_2", "relancer_cursos", "studio_thaisypolicena",
  "relancer_odontologia", "empresarios_crente", "WPP2",
];

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

  const [whatsappStatus, mensagensHoje, leadsHoje, mensagensMes, ferramentas] = await Promise.all([
    Promise.all(INSTANCIAS.map(checkInstancia)),
    prisma.mensagem.count({ where: { criadoEm: { gte: hoje }, direcao: "SAIDA" } }),
    prisma.lead.count({ where: { criadoEm: { gte: hoje } } }),
    prisma.mensagem.count({
      where: {
        criadoEm: { gte: new Date(hoje.getFullYear(), hoje.getMonth(), 1) },
        direcao: "SAIDA",
      },
    }),
    prisma.ferramenta.findMany({ orderBy: { criadoEm: "asc" } }),
  ]);

  const alertas = ferramentas.filter((f: { vencimento: Date | null }) => {
    if (!f.vencimento) return false;
    const dias = Math.ceil((f.vencimento.getTime() - Date.now()) / 86400000);
    return dias <= 7;
  });

  return NextResponse.json({
    whatsapp: whatsappStatus,
    atividade: { mensagensHoje, leadsHoje, mensagensMes },
    ferramentas,
    alertas,
  });
}
