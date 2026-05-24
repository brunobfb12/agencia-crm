import { redirect } from "next/navigation";
import { getUsuarioLogado } from "@/lib/auth";
import LandingPage from "./_components/LandingPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CRM Fácil — IA que Vende 24h por Você",
  description: "A IA do CRM Fácil atende seus leads no WhatsApp, qualifica, agenda e aquece — e só te chama quando o cliente está pronto pra comprar. 30 dias grátis, sem cartão.",
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const usuario = await getUsuarioLogado();
  if (usuario) redirect("/dashboard");
  return <LandingPage />;
}
