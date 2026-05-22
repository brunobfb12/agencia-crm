import { redirect } from "next/navigation";
import { getUsuarioLogado } from "@/lib/auth";
import LandingPageV2 from "./_components/LandingPageV2";

export const dynamic = "force-dynamic";

export default async function Home() {
  const usuario = await getUsuarioLogado();
  if (usuario) redirect("/dashboard");
  return <LandingPageV2 />;
}
