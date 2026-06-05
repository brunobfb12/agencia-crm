#!/usr/bin/env node

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const vendedor = await prisma.vendedor.findFirst({
    where: { telefone: { contains: "5562981267589" } },
  });

  if (!vendedor) {
    console.log("❌ Vendedor não encontrado");
    process.exit(1);
  }

  console.log(`📌 Encontrado: ${vendedor.nome}`);
  console.log(`ultimoLinkPressaoEm antes: ${vendedor.ultimoLinkPressaoEm}`);

  const updated = await prisma.vendedor.update({
    where: { id: vendedor.id },
    data: { ultimoLinkPressaoEm: null },
  });

  console.log(`✅ Resetado!`);
  console.log(`ultimoLinkPressaoEm depois: ${updated.ultimoLinkPressaoEm}`);

  process.exit(0);
}

main();
