import { redirect } from "next/navigation";
import { getUsuarioLogado } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Nav from "./nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await getUsuarioLogado();
  if (!usuario) redirect("/login");

  let nomeEmpresa: string | undefined;
  let diasTrial: number | null = null;

  if (usuario.empresaId && usuario.perfil !== "CENTRAL") {
    const empresa = await prisma.empresa.findUnique({
      where: { id: usuario.empresaId },
      select: {
        nome: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        planStatus: true as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        trialFim: true as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        isenta: true as any,
      },
    });

    if (empresa) {
      nomeEmpresa = empresa.nome;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const status = (empresa as any).planStatus as string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isenta = (empresa as any).isenta as boolean;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const trialFim = (empresa as any).trialFim as Date | null;

      if (!isenta) {
        if (status === "TRIAL") {
          if (!trialFim || new Date(trialFim) < new Date()) {
            redirect("/assinar");
          }
          const diff = new Date(trialFim).getTime() - Date.now();
          diasTrial = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        } else if (status === "BLOQUEADO" || status === "CANCELADO") {
          redirect("/assinar");
        }
      }
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg)" }}>
      {diasTrial !== null && diasTrial <= 7 && (
        <div
          className="w-full text-center text-[12px] font-medium py-2 px-4 flex items-center justify-center gap-3"
          style={{
            background: diasTrial <= 3 ? "rgba(239,68,68,.12)" : "rgba(251,191,36,.1)",
            borderBottom: diasTrial <= 3 ? "1px solid rgba(239,68,68,.25)" : "1px solid rgba(251,191,36,.2)",
            color: diasTrial <= 3 ? "#f87171" : "#fbbf24",
          }}
        >
          {diasTrial === 0
            ? "Seu teste expira hoje!"
            : `Seu teste expira em ${diasTrial} dia${diasTrial > 1 ? "s" : ""}.`}
          <Link href="/assinar" className="font-bold underline">
            Assinar agora
          </Link>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <Nav nome={usuario.nome} perfil={usuario.perfil} empresa={nomeEmpresa} />
        <main className="flex-1 overflow-hidden flex flex-col pt-14 md:pt-0">{children}</main>
      </div>
    </div>
  );
}
