import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";

const prisma = new PrismaClient();

const cutoffDate = new Date("2026-09-01T03:00:00.000Z");

console.log("[EXEC] Marcação SEM_INTERESSE com backup");
console.log("[EXEC] Timestamp: " + new Date().toISOString() + "\n");

// ===== PASSO 1: Selecionar leads a marcar =====
console.log("[PASSO 1] Selecionando 756 leads a marcar...\n");

const leadsParaMarcacao = await prisma.lead.findMany({
  where: {
    atualizadoEm: { lt: cutoffDate },
    status: { notIn: ["VENDA_REALIZADA", "PERDIDO", "SEM_INTERESSE", "ORCAMENTO_ENVIADO", "POS_VENDA"] }
  },
  select: {
    id: true,
    status: true,
    atualizadoEm: true,
    clienteId: true
  }
});

console.log("Leads encontrados: " + leadsParaMarcacao.length);

// ===== PASSO 2: Backup JSON =====
console.log("[PASSO 2] Gerando backup em JSON...\n");

const backupData = {
  timestamp: new Date().toISOString(),
  totalLeads: leadsParaMarcacao.length,
  cutoffDate: cutoffDate.toISOString(),
  leads: leadsParaMarcacao
};

const backupPath = "/tmp/backup_sem_interesse_" + Date.now() + ".json";
await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));

console.log("Backup salvo em: " + backupPath);
console.log("Tamanho: " + (JSON.stringify(backupData).length / 1024).toFixed(2) + " KB\n");

// ===== PASSO 3: Executar UPDATE =====
console.log("[PASSO 3] Executando UPDATE...\n");

const leadIds = leadsParaMarcacao.map(l => l.id);

const resultado = await prisma.lead.updateMany({
  where: {
    id: { in: leadIds }
  },
  data: {
    status: "SEM_INTERESSE"
  }
});

console.log("UPDATE executado com sucesso!");
console.log("Registros atualizados: " + resultado.count);

// ===== PASSO 4: Verificação =====
console.log("\n[PASSO 4] Verificação pós-UPDATE...\n");

const verificacao = await prisma.lead.count({
  where: {
    id: { in: leadIds },
    status: "SEM_INTERESSE"
  }
});

console.log("Registros verificados como SEM_INTERESSE: " + verificacao);
console.log("Confirmação: " + (verificacao === resultado.count ? "✅ OK" : "❌ ERRO") + "\n");

// ===== RESUMO =====
console.log("[RESUMO FINAL]");
console.log("Registros marcados como SEM_INTERESSE: " + resultado.count);
console.log("Backup disponível em: " + backupPath);
console.log("Para reverter: restaurar status ANTERIOR de cada lead do arquivo JSON");

await prisma.$disconnect();
