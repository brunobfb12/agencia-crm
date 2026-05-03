import { redirect } from "next/navigation";
import { getUsuarioLogado } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Nav from "./nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await getUsuarioLogado();
  if (!usuario) redirect("/login");

  let nomeEmpresa: string | undefined;
  if (usuario.perfil === "EMPRESA" && usuario.empresaId) {
    const empresa = await prisma.empresa.findUnique({
      where: { id: usuario.empresaId },
      select: { nome: true },
    });
    nomeEmpresa = empresa?.nome ?? undefined;
  }

  return (
    <div className="flex h-full" style={{ background: "#08080e" }}>
      <Nav nome={usuario.nome} perfil={usuario.perfil} empresa={nomeEmpresa} />
      <main className="flex-1 overflow-hidden flex flex-col pt-14 md:pt-0">{children}</main>
    </div>
  );
}
