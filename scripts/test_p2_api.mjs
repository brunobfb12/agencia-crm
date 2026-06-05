#!/usr/bin/env node
/**
 * TESTE P2 via API: Valida P2.1, P2.2, P2.3 sem acesso direto ao BD
 *
 * Cria leads via API CRM e verifica transições chamando o cron follow-up
 *
 * Uso: node scripts/test_p2_api.mjs <CRM_URL>
 * Exemplo: node scripts/test_p2_api.mjs http://localhost:3000
 */

const CRM_URL = process.argv[2] || "http://localhost:3000";
const SECRET = "crm2026migra";

console.log(`🧪 TESTE P2 via API (${CRM_URL})\n`);

async function request(method, endpoint, body = null) {
  const url = `${CRM_URL}${endpoint}`;
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(url, options);
    const data = await res.json();
    if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(data)}`);
    return data;
  } catch (error) {
    console.error(`❌ ${method} ${endpoint}:`, error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log("1️⃣  Criando leads de teste...\n");

    // Criar clientes
    const cliente1 = await request("POST", "/api/clientes", {
      nome: "[TEST] Cliente P2.1 - LEAD",
      telefone: "551199999991",
    });

    const cliente2 = await request("POST", "/api/clientes", {
      nome: "[TEST] Cliente P2.2 - AQUECIMENTO",
      telefone: "551199999992",
    });

    const cliente3 = await request("POST", "/api/clientes", {
      nome: "[TEST] Cliente P2.3 - PRONTO",
      telefone: "551199999993",
    });

    console.log(`  ✅ Cliente P2.1: ${cliente1.id}`);
    console.log(`  ✅ Cliente P2.2: ${cliente2.id}`);
    console.log(`  ✅ Cliente P2.3: ${cliente3.id}`);

    // Criar leads com timings corretos
    const agora = new Date();

    // P2.1: LEAD 36h parado
    const h36 = new Date(agora.getTime() - 36 * 60 * 60 * 1000);
    const lead1 = await request("POST", "/api/leads", {
      clienteId: cliente1.id,
      status: "LEAD",
      atualizadoEm: h36.toISOString(),
      observacoes: "Cliente respondeu — em avaliação",
    });

    // P2.2: AQUECIMENTO 60h parado, score ≥6, CONFIRMADO
    const h60 = new Date(agora.getTime() - 60 * 60 * 60 * 1000);
    const lead2 = await request("POST", "/api/leads", {
      clienteId: cliente2.id,
      status: "AQUECIMENTO",
      atualizadoEm: h60.toISOString(),
      score: 8,
      observacoes: "[P72]\nPedido: Tinta X 18L\nCONFIRMADO",
    });

    // P2.3: PRONTO 100h parado com [P72]
    const h100 = new Date(agora.getTime() - 100 * 60 * 60 * 1000);
    const lead3 = await request("POST", "/api/leads", {
      clienteId: cliente3.id,
      status: "PRONTO_PARA_COMPRAR",
      atualizadoEm: h100.toISOString(),
      observacoes: "[P72]\nPedido: Kit Completo",
    });

    console.log(`  ✅ Lead P2.1 (LEAD): ${lead1.id}`);
    console.log(`  ✅ Lead P2.2 (AQUECIMENTO): ${lead2.id}`);
    console.log(`  ✅ Lead P2.3 (PRONTO): ${lead3.id}\n`);

    // Executar cron follow-up
    console.log("2️⃣  Executando cron follow-up...\n");

    const cronResult = await request("GET", `/api/leads/follow-up?secret=${SECRET}`);
    console.log(`  ✅ Cron executado:`, cronResult);

    // Verificar resultados
    console.log("\n3️⃣  Verificando transições...\n");

    const lead1Check = await request("GET", `/api/leads/${lead1.id}`);
    const lead2Check = await request("GET", `/api/leads/${lead2.id}`);
    const lead3Check = await request("GET", `/api/leads/${lead3.id}`);

    const teste1 = lead1Check.status === "AQUECIMENTO";
    const teste2 = lead2Check.status === "PRONTO_PARA_COMPRAR" && lead2Check.observacoes?.includes("[P2_AUTO_PRONTO]");
    const teste3 = lead3Check.observacoes?.includes("[P72]") && !lead3Check.observacoes?.includes("[PC1]");

    console.log(`
📊 RESULTADOS:

  P2.1 (LEAD → AQUECIMENTO):
    Antes:  LEAD
    Depois: ${lead1Check.status}
    Status: ${teste1 ? "✅ PASSOU" : "❌ FALHOU"}

  P2.2 (AQUECIMENTO → PRONTO):
    Antes:  AQUECIMENTO (score: 8)
    Depois: ${lead2Check.status}
    Flag:   ${lead2Check.observacoes?.includes("[P2_AUTO_PRONTO]") ? "✅ [P2_AUTO_PRONTO]" : "❌ Flag ausente"}
    Status: ${teste2 ? "✅ PASSOU" : "❌ FALHOU"}

  P2.3 (PC1 Ready):
    Status: ${lead3Check.status}
    [P72]:  ${lead3Check.observacoes?.includes("[P72]") ? "✅ Presente" : "❌ Ausente"}
    [PC1]:  ${lead3Check.observacoes?.includes("[PC1]") ? "❌ Já disparado" : "✅ Pendente"}
    Status: ${teste3 ? "✅ PASSOU" : "❌ FALHOU"}
    `);

    // Limpar dados de teste
    console.log("4️⃣  Limpando dados de teste...\n");

    await request("DELETE", `/api/leads/${lead1.id}`);
    await request("DELETE", `/api/leads/${lead2.id}`);
    await request("DELETE", `/api/leads/${lead3.id}`);
    await request("DELETE", `/api/clientes/${cliente1.id}`);
    await request("DELETE", `/api/clientes/${cliente2.id}`);
    await request("DELETE", `/api/clientes/${cliente3.id}`);

    console.log(`  ✅ Dados de teste removidos\n`);

    // Resumo final
    const todosPassaram = teste1 && teste2 && teste3;
    console.log(`
✅ TESTE P2 CONCLUÍDO!

${todosPassaram ? "🎉 TODOS OS TESTES PASSARAM!" : "⚠️  ALGUNS TESTES FALHARAM"}

📋 PRÓXIMOS PASSOS:
  ${todosPassaram
    ? `1. ✅ Deploy em produção (git push → Easypanel)
  2. ✅ Monitorar /api/leads/follow-up nos logs por 24h
  3. ✅ Testar em 2-3 instâncias reais antes de escalar`
    : `1. ❌ Revisar código de P2.1, P2.2, P2.3
  2. ❌ Corrigir transições
  3. ❌ Re-rodar teste`}
    `);

    process.exit(todosPassaram ? 0 : 1);
  } catch (error) {
    console.error("\n❌ ERRO NO TESTE:", error.message);
    process.exit(1);
  }
}

main();
