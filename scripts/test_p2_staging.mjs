#!/usr/bin/env node
/**
 * TESTE P2: Validar P2.1, P2.2, P2.3 em Staging
 *
 * Cria leads de teste com timings específicos e verifica se as transições ocorrem.
 *
 * Uso: node scripts/test_p2_staging.mjs
 * Ambiente: Requer DATABASE_URL e autenticação no Prisma
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

console.log("🧪 TESTE P2 — Transições Automáticas do Funil\n");

// ============================================================================
// Criar dados de teste
// ============================================================================

async function criarLeadsTest() {
  console.log("1️⃣  Criando leads de teste...\n");

  // Buscar empresa ativa para teste (usar primeira)
  const empresa = await prisma.empresa.findFirst({
    where: { ativa: true },
  });
  if (!empresa) {
    console.error("❌ Erro: Nenhuma empresa ativa encontrada!");
    process.exit(1);
  }

  // Buscar vendedor (usar primeiro)
  const vendedor = await prisma.vendedor.findFirst({
    where: { empresaId: empresa.id, ativo: true },
  });
  if (!vendedor) {
    console.error("❌ Erro: Nenhum vendedor ativo encontrado!");
    process.exit(1);
  }

  // Criar clientes de teste
  const cliente1 = await prisma.cliente.create({
    data: {
      nome: "[TEST] Cliente P2.1 - LEAD",
      telefone: "551199999991",
      empresaId: empresa.id,
    },
  });

  const cliente2 = await prisma.cliente.create({
    data: {
      nome: "[TEST] Cliente P2.2 - AQUECIMENTO Quente",
      telefone: "551199999992",
      empresaId: empresa.id,
    },
  });

  const cliente3 = await prisma.cliente.create({
    data: {
      nome: "[TEST] Cliente P2.3 - PC1",
      telefone: "551199999993",
      empresaId: empresa.id,
    },
  });

  // Criar conversa para P2.1 (lead com histórico)
  const conversa1 = await prisma.conversa.create({
    data: {
      clienteId: cliente1.id,
      empresaId: empresa.id,
      ultimaAtividade: new Date(),
    },
  });

  // P2.1: LEAD parado 24-48h
  const agora = new Date();
  const h36Atras = new Date(agora.getTime() - 36 * 60 * 60 * 1000);

  const lead1 = await prisma.lead.create({
    data: {
      clienteId: cliente1.id,
      empresaId: empresa.id,
      vendedorId: vendedor.id,
      status: "LEAD",
      atualizadoEm: h36Atras,
      observacoes: "Lead respondeu — esperando qualificação",
    },
  });

  console.log(`  ✅ P2.1 (LEAD 36h parado): ${lead1.id}`);

  // P2.2: AQUECIMENTO "quente" (score ≥6 + CONFIRMADO + P72 + 24-48h)
  const h60Atras = new Date(agora.getTime() - 60 * 60 * 60 * 1000);

  const lead2 = await prisma.lead.create({
    data: {
      clienteId: cliente2.id,
      empresaId: empresa.id,
      vendedorId: vendedor.id,
      status: "AQUECIMENTO",
      atualizadoEm: h60Atras,
      score: 8,
      observacoes: "[P72]\nPedido: Tinta X 18L\nCONFIRMADO | Cliente pronto",
    },
  });

  console.log(`  ✅ P2.2 (AQUECIMENTO quente 60h parado): ${lead2.id}`);

  // P2.3: PRONTO_PARA_COMPRAR com [P72] (96h+)
  const h100Atras = new Date(agora.getTime() - 100 * 60 * 60 * 1000);

  const lead3 = await prisma.lead.create({
    data: {
      clienteId: cliente3.id,
      empresaId: empresa.id,
      vendedorId: vendedor.id,
      status: "PRONTO_PARA_COMPRAR",
      atualizadoEm: h100Atras,
      observacoes: "[P72]\nPedido: Kit Completo\nConfirmado com cliente",
    },
  });

  console.log(`  ✅ P2.3 (PRONTO 100h parado): ${lead3.id}`);

  return { lead1, lead2, lead3, empresa, vendedor };
}

// ============================================================================
// Simular o cron follow-up (rodar as queries + transições)
// ============================================================================

async function rodarTransicoes({ lead1, lead2, lead3 }) {
  console.log("\n2️⃣  Rodando transições automáticas...\n");

  // P2.1: LEAD → AQUECIMENTO (parado 24-48h)
  const agora = new Date();
  const h48 = new Date(agora.getTime() - 48 * 60 * 60 * 1000);
  const h24 = new Date(agora.getTime() - 24 * 60 * 60 * 1000);

  const leadParaAquecimento = await prisma.lead.findMany({
    where: {
      status: "LEAD",
      atualizadoEm: { gte: h48, lt: h24 },
      empresa: { ativa: true },
      cliente: { telefone: { not: "" } },
    },
  });

  if (leadParaAquecimento.length > 0) {
    await prisma.lead.updateMany({
      where: { id: { in: leadParaAquecimento.map(l => l.id) } },
      data: { status: "AQUECIMENTO" },
    });
    console.log(`  ✅ P2.1: ${leadParaAquecimento.length} lead(s) LEAD → AQUECIMENTO`);
  } else {
    console.log(`  ⚠️  P2.1: Nenhum lead encontrado (esperado: 1)`);
  }

  // P2.2: AQUECIMENTO "quente" → PRONTO_PARA_COMPRAR
  const h72 = new Date(agora.getTime() - 72 * 60 * 60 * 1000);

  const aquecimentoParaProto = await prisma.lead.findMany({
    where: {
      status: "AQUECIMENTO",
      score: { gte: 6 },
      observacoes: { contains: "CONFIRMADO" },
      atualizadoEm: { gte: h72, lt: h48 },
      empresa: { ativa: true },
      vendedorId: { not: null },
    },
  });

  if (aquecimentoParaProto.length > 0) {
    await Promise.all(
      aquecimentoParaProto.map(l =>
        prisma.lead.update({
          where: { id: l.id },
          data: {
            status: "PRONTO_PARA_COMPRAR",
            observacoes: ((l.observacoes ?? "") + "\n[P2_AUTO_PRONTO]").trim(),
          },
        })
      )
    );
    console.log(`  ✅ P2.2: ${aquecimentoParaProto.length} lead(s) AQUECIMENTO → PRONTO_PARA_COMPRAR`);
  } else {
    console.log(`  ⚠️  P2.2: Nenhum lead encontrado (esperado: 1)`);
  }

  // P2.3: Verificar se PC1 será disparado (leads PRONTO com [P72] + 96h+)
  const h96 = new Date(agora.getTime() - 96 * 60 * 60 * 1000);

  const prontoParaPC1 = await prisma.lead.findMany({
    where: {
      status: { in: ["PRONTO_PARA_COMPRAR", "NEGOCIACAO"] },
      observacoes: { contains: "[P72]" },
      NOT: { observacoes: { contains: "[PC1]" } },
      atualizadoEm: { lt: h96 },
      empresa: { ativa: true },
    },
  });

  if (prontoParaPC1.length > 0) {
    console.log(`  ✅ P2.3: ${prontoParaPC1.length} lead(s) elegível(is) para PC1`);
  } else {
    console.log(`  ⚠️  P2.3: Nenhum lead encontrado (esperado: 1)`);
  }
}

// ============================================================================
// Verificar resultados
// ============================================================================

async function verificarResultados({ lead1, lead2, lead3 }) {
  console.log("\n3️⃣  Verificando resultados...\n");

  const l1Atualizado = await prisma.lead.findUnique({ where: { id: lead1.id } });
  const l2Atualizado = await prisma.lead.findUnique({ where: { id: lead2.id } });
  const l3Atualizado = await prisma.lead.findUnique({ where: { id: lead3.id } });

  console.log(`📊 RESULTADOS:`);
  console.log(`
  P2.1 (LEAD → AQUECIMENTO):
    Antes:  LEAD
    Depois: ${l1Atualizado?.status}
    Status: ${l1Atualizado?.status === "AQUECIMENTO" ? "✅ PASSOU" : "❌ FALHOU"}

  P2.2 (AQUECIMENTO → PRONTO):
    Antes:  AQUECIMENTO (score: 8, CONFIRMADO)
    Depois: ${l2Atualizado?.status}
    Status: ${l2Atualizado?.status === "PRONTO_PARA_COMPRAR" ? "✅ PASSOU" : "❌ FALHOU"}
    Obs:    ${l2Atualizado?.observacoes?.includes("[P2_AUTO_PRONTO]") ? "✅ Flag [P2_AUTO_PRONTO]" : "❌ Flag ausente"}

  P2.3 (PC1 Ready):
    Status: ${l3Atualizado?.status}
    Obs:    ${l3Atualizado?.observacoes?.includes("[P72]") ? "✅ [P72] presente" : "❌ [P72] ausente"}
    Pronto: ${l3Atualizado?.observacoes?.includes("[PC1]") ? "❌ PC1 já disparado" : "✅ PC1 pendente"}
  `);

  return { l1: l1Atualizado, l2: l2Atualizado, l3: l3Atualizado };
}

// ============================================================================
// Limpar dados de teste
// ============================================================================

async function limparTeste({ lead1, lead2, lead3 }) {
  console.log("\n4️⃣  Limpando dados de teste...\n");

  await prisma.lead.deleteMany({
    where: { id: { in: [lead1.id, lead2.id, lead3.id] } },
  });

  const clientes = await prisma.cliente.findMany({
    where: { nome: { contains: "[TEST]" } },
  });

  if (clientes.length > 0) {
    await prisma.cliente.deleteMany({
      where: { id: { in: clientes.map(c => c.id) } },
    });
  }

  console.log(`  ✅ Dados de teste removidos`);
}

// ============================================================================
// Executar teste completo
// ============================================================================

async function main() {
  try {
    const dados = await criarLeadsTest();
    await rodarTransicoes(dados);
    await verificarResultados(dados);
    await limparTeste(dados);

    console.log("\n✅ TESTE P2 CONCLUÍDO!\n");
    console.log("📋 PRÓXIMOS PASSOS:");
    console.log("  1. Revisar resultados acima");
    console.log("  2. Se todos passaram: fazer deploy em produção");
    console.log("  3. Monitorar /api/leads/follow-up nos logs por 24h\n");
  } catch (error) {
    console.error("❌ Erro durante teste:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
