import { redirect } from "next/navigation";
import { getUsuarioLogado } from "@/lib/auth";
import Nav from "./nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await getUsuarioLogado();
  if (!usuario) redirect("/login");

  return (
    <div className="flex h-full">
      <Nav nome={usuario.nome} perfil={usuario.perfil} />
      <main className="flex-1 overflow-hidden flex flex-col">{children}</main>
    </div>
  );
}
