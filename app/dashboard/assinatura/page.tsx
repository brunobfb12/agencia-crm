import { redirect } from "next/navigation";
import { getUsuarioLogado } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AssinaturaClient from "./client";

export default async function AssinaturaPage() {
  const usuario = await getUsuarioLogado();
  if (!usuario) redirect("/login");
  if (!usuario.empresaId) redirect("/dashboard");

  const empresa = await prisma.empresa.findUnique({
    where: { id: usuario.empresaId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: { nome:true, planStatus:true as any, plano:true as any, trialFim:true as any, isenta:true as any },
  });

  if (!empresa) redirect("/dashboard");

  return (
    <AssinaturaClient
      empresaId={usuario.empresaId}
      nome={empresa.nome}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      planStatus={(empresa as any).planStatus as string}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      plano={(empresa as any).plano as string}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      trialFim={(empresa as any).trialFim ? new Date((empresa as any).trialFim).toISOString() : null}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      isenta={(empresa as any).isenta as boolean}
    />
  );
}
