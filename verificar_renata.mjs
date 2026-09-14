import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const telefone = "5564992027276";
const hoje = new Date();
hoje.setHours(0, 0, 0, 0);

console.log("╔════════════════════════════════════════════════════════════════╗");
console.log("║        INVESTIGAÇÃO: Renata Metalmaster - Conversa Faltante   ║");
console.log("╚════════════════════════════════════════════════════════════════╝\n");

// Buscar cliente
const cliente = await prisma.cliente.findFirst({
  where: { telefone: { contains: telefone } },
  include: {
    leads: {
      include: {
        empresa: { select: { nome: true } },
        vendedor: { select: { nome: true, ativo: true } },
      },
    },
  },
});

if (!cliente) {
  console.log("❌ Cliente NÃO ENCONTRADO com telefone:", telefone);
  console.log("\nBuscando variações...");

  // Tenta sem formatação
  const telefoneNumero = telefone.replace(/\D/g, "");
  const clienteAlt = await prisma.cliente.findFirst({
    where: { telefone: { contains: telefoneNumero } },
  });

  if (clienteAlt) {
    console.log(`\n✅ Encontrado com número limpo: ${clienteAlt.nome} (${clienteAlt.telefone})`);
  } else {
    console.log(`\n❌ Nenhum cliente encontrado com número: ${telefoneNumero}`);
    process.exit(0);
  }
}

console.log("✅ CLIENTE ENCONTRADO\n");
console.log("Nome:     ", cliente.nome);
console.log("Telefone: ", cliente.telefone);
console.log("ID:       ", cliente.id);

// Buscar conversa
const conversa = await prisma.conversa.findFirst({
  where: { clienteId: cliente.id },
  include: {
    mensagens: {
      orderBy: { criadoEm: "desc" },
    },
  },
});

console.log("\n" + "═".repeat(70));
console.log("CONVERSA NO CRM");
console.log("═".repeat(70) + "\n");

if (!conversa) {
  console.log("❌ NENHUMA CONVERSA REGISTRADA para este cliente\n");
} else {
  console.log("✅ CONVERSA ENCONTRADA");
  console.log(`\nID:                ${conversa.id}`);
  console.log(`Última atividade:  ${conversa.ultimaAtividade.toISOString()}`);
  console.log(`Modo humano:       ${conversa.modoHumano}`);
  console.log(`Mensagens totais:  ${conversa.mensagens.length}`);

  if (conversa.mensagens.length > 0) {
    console.log(`\nÚltimas 3 mensagens:`);
    for (let i = 0; i < Math.min(3, conversa.mensagens.length); i++) {
      const msg = conversa.mensagens[i];
      console.log(`  ${i + 1}. [${msg.direcao}] ${msg.criadoEm.toISOString()}`);
      console.log(`     ${msg.conteudo.substring(0, 80)}${msg.conteudo.length > 80 ? "..." : ""}`);
    }
  }

  const hoje_str = hoje.toISOString().split('T')[0];
  const ultimaMsg_date = conversa.ultimaAtividade.toISOString().split('T')[0];

  if (ultimaMsg_date === hoje_str) {
    console.log(`\n✅ Última atividade É HOJE`);
  } else {
    console.log(`\n⚠️  Última atividade não é de hoje (é de ${ultimaMsg_date})`);
  }
}

// Leads do cliente
console.log("\n" + "═".repeat(70));
console.log("LEADS VINCULADOS");
console.log("═".repeat(70) + "\n");

if (cliente.leads.length === 0) {
  console.log("❌ Nenhum lead vinculado a este cliente\n");
} else {
  console.log(`✅ ${cliente.leads.length} lead(s) encontrado(s)\n`);
  for (const lead of cliente.leads) {
    console.log(`ID:         ${lead.id}`);
    console.log(`Status:     ${lead.status}`);
    console.log(`Empresa:    ${lead.empresa.nome}`);
    console.log(`Vendedor:   ${lead.vendedor ? `${lead.vendedor.nome} (${lead.vendedor.ativo ? "ativo" : "INATIVO"})` : "[sem]"}`);
    console.log(`Criado em:  ${lead.criadoEm.toISOString()}`);
    console.log(`Atualizado:${lead.atualizadoEm.toISOString()}`);
    console.log(`Score:      ${lead.score}`);
    console.log("-".repeat(70) + "\n");
  }
}

console.log("═".repeat(70));
console.log("DIAGNÓSTICO");
console.log("═".repeat(70) + "\n");

if (!conversa) {
  console.log("⚠️  PROBLEMA ENCONTRADO:");
  console.log("   → Cliente existe no CRM");
  console.log("   → MAS não tem conversa registrada");
  console.log("\n   Possíveis causas:");
  console.log("   1. Conversa foi deletada manualmente");
  console.log("   2. Erro de sincronização com WhatsApp");
  console.log("   3. Cliente novo que recebeu mensagem fora da plataforma\n");
} else if (conversa.ultimaAtividade.toISOString().split('T')[0] !== hoje.toISOString().split('T')[0]) {
  console.log("⚠️  AVISO:");
  console.log("   → Conversa existe no CRM");
  console.log("   → MAS última atividade não é de hoje");
  console.log(`   → Última registrada: ${conversa.ultimaAtividade.toISOString()}\n`);
} else {
  console.log("✅ TUDO OK:");
  console.log("   → Cliente tem conversa registrada");
  console.log("   → Última atividade é de HOJE\n");
}

await prisma.$disconnect();
