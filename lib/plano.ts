import { prisma } from "@/lib/prisma";

const LIMITES: Record<string, number> = {
  STARTER: 500,
  PRO: 1000,
  AGENCY: 5000,
};

export async function verificarLimiteLeads(empresaId: string): Promise<{
  bloqueado: boolean;
  total: number;
  limite: number | null;
  plano: string;
}> {
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: { plano: true as any, isenta: true as any },
  });
  if (!empresa) return { bloqueado: false, total: 0, limite: null, plano: "STARTER" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isenta = (empresa as any).isenta as boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plano = ((empresa as any).plano as string) ?? "STARTER";

  if (isenta) return { bloqueado: false, total: 0, limite: null, plano };

  const limite = LIMITES[plano] ?? 500;
  const total = await prisma.lead.count({ where: { empresaId } });

  return { bloqueado: total >= limite, total, limite, plano };
}
