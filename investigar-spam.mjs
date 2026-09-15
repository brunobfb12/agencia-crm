import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function investigate() {
  console.log('=== INVESTIGAÇÃO: LEAD 5562992085907 ===\n');

  const dataHoje = new Date();
  dataHoje.setHours(0, 0, 0, 0);

  try {
    // 1. Encontrar cliente pelo telefone
    console.log('1️⃣  ENCONTRANDO CLIENTE...\n');
    const cliente = await prisma.cliente.findFirst({
      where: {
        telefone: { contains: '5562992085907' }
      }
    });

    if (!cliente) {
      console.log('❌ Cliente não encontrado com telefone 5562992085907');
      process.exit(1);
    }

    console.log(`✅ Cliente encontrado:`);
    console.log(`   ID: ${cliente.id}`);
    console.log(`   Nome: ${cliente.nome}`);
    console.log(`   Telefone: ${cliente.telefone}`);
    console.log(`   Empresa: ${cliente.empresaId}\n`);

    // 2. Listar todas as MENSAGENS SAIDA de hoje
    console.log('2️⃣  MENSAGENS SAIDA DE HOJE:\n');
    const mensagens = await prisma.mensagem.findMany({
      where: {
        conversa: {
          clienteId: cliente.id
        },
        direcao: 'SAIDA',
        criadoEm: { gte: dataHoje }
      },
      orderBy: { criadoEm: 'asc' },
      include: {
        conversa: true
      }
    });

    console.log(`Total: ${mensagens.length} mensagens\n`);

    mensagens.forEach((msg, i) => {
      const time = msg.criadoEm.toLocaleTimeString('pt-BR');
      const date = msg.criadoEm.toLocaleDateString('pt-BR');
      console.log(`${i + 1}. [${time}] ${date}`);
      console.log(`   "${msg.conteudo.substring(0, 100)}${msg.conteudo.length > 100 ? '...' : ''}"`);
      console.log('');
    });

    // 3. Encontrar Lead e suas observações
    console.log('3️⃣  LEAD E OBSERVAÇÕES:\n');
    const lead = await prisma.lead.findFirst({
      where: {
        clienteId: cliente.id
      },
      orderBy: { criadoEm: 'desc' }
    });

    if (!lead) {
      console.log('⚠️  Nenhum lead encontrado para este cliente');
      process.exit(0);
    }

    console.log(`Lead ID: ${lead.id}`);
    console.log(`Status: ${lead.status}`);
    console.log(`Score: ${lead.score}`);
    console.log(`Atualizado em: ${lead.atualizadoEm.toLocaleString('pt-BR')}`);
    console.log(`\nOBSERVAÇÕES:\n${lead.observacoes || '(vazio)'}`);

    // 4. Procurar flags [T1:], [T2:], etc nas observações
    console.log('\n4️⃣  ANÁLISE DE FLAGS:\n');
    const flags = lead.observacoes?.match(/\[T[1-5]:\s*[^\]]*\]/g) || [];

    if (flags.length === 0) {
      console.log('❌ CRÍTICO: Nenhuma flag de cadência encontrada nas observações!');
      console.log('   As cadências estão sendo enviadas mas não estão marcando as flags.');
    } else {
      console.log(`✅ Flags encontradas (${flags.length}):`);
      flags.forEach(flag => console.log(`   ${flag}`));
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

investigate();
