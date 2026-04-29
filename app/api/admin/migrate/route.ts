import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { secret, sql: customSql } = body;
  if (secret !== process.env.MIGRATION_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  if (customSql) {
    try {
      await prisma.$executeRawUnsafe(customSql);
      return NextResponse.json({ ok: true, result: "OK" });
    } catch (e: any) {
      return NextResponse.json({ ok: false, result: e.message });
    }
  }

  const results: string[] = [];

  const migrations = [
    `ALTER TABLE "Vendedor" ADD COLUMN IF NOT EXISTS "ultimaAtribuicaoEm" TIMESTAMP`,
    `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "vendedorId" TEXT`,
    `ALTER TABLE "Lead" ADD CONSTRAINT IF NOT EXISTS "Lead_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "Vendedor"(id) ON DELETE SET NULL ON UPDATE CASCADE`,
    `ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "informacoes" TEXT`,
    `CREATE TABLE IF NOT EXISTS "Ferramenta" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "nome" TEXT NOT NULL,
      "tipo" TEXT NOT NULL,
      "valor" DOUBLE PRECISION,
      "vencimento" TIMESTAMP,
      "link" TEXT,
      "observacoes" TEXT,
      "ativo" BOOLEAN NOT NULL DEFAULT true,
      "criadoEm" TIMESTAMP NOT NULL DEFAULT NOW()
    )`,
  ];

  for (const sql of migrations) {
    try {
      await prisma.$executeRawUnsafe(sql);
      results.push(`OK: ${sql.slice(0, 60)}...`);
    } catch (e: any) {
      results.push(`SKIP: ${e.message.slice(0, 80)}`);
    }
  }

  return NextResponse.json({ ok: true, results });
}
