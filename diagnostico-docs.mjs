import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

async function run() {
  try {
    console.log('=== DIAGNÓSTICO: DOCUMENTOS VAZIOS NOS ÚLTIMOS 30 DIAS ===\n');

    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 30);

    // 1. Contar mensagens vazias/nulas
    const mensagensVazias = await prisma.mensagem.findMany({
      where: {
        criadoEm: { gte: dataLimite },
        OR: [
          { conteudo: null },
          { conteudo: '' },
          { conteudo: { equals: '', mode: 'insensitive' } }
        ]
      },
      include: {
        conversa: {
          include: {
            cliente: {
              include: {
                empresa: { select: { nome: true } }
              }
            }
          }
        }
      },
      orderBy: { criadoEm: 'desc' },
      take: 100
    });

    console.log(`\n📊 RESULTADO: ${mensagensVazias.length} mensagens vazias/nulas encontradas\n`);

    if (mensagensVazias.length === 0) {
      console.log('✅ Nenhuma mensagem vazia encontrada nos últimos 30 dias.\n');
    } else {
      console.log('🔴 Exemplos (primeiras 10):');
      console.log('---');
      mensagensVazias.slice(0, 10).forEach((msg, i) => {
        const empresa = msg.conversa.cliente.empresa;
        const cliente = msg.conversa.cliente;
        const data = msg.criadoEm.toLocaleDateString('pt-BR');
        const hora = msg.criadoEm.toLocaleTimeString('pt-BR');

        console.log(`\n${i + 1}. [${data} ${hora}]`);
        console.log(`   Empresa: ${empresa.nome}`);
        console.log(`   Cliente: ${cliente.nome || cliente.telefone}`);
        console.log(`   Conteúdo: "${msg.conteudo}"`);
        console.log(`   Direção: ${msg.direcao}`);
      });
    }

    // 2. Procurar mensagens com apenas marcadores de mídia
    const todasMensagens = await prisma.mensagem.findMany({
      where: { criadoEm: { gte: dataLimite } },
      select: { conteudo: true, criadoEm: true }
    });

    const comMarcadores = todasMensagens.filter(m =>
      m.conteudo && (
        m.conteudo.includes('[imageMessage]') ||
        m.conteudo.includes('[audioMessage]') ||
        m.conteudo.includes('[documentMessage]') ||
        m.conteudo.includes('[videoMessage]') ||
        m.conteudo.includes('[mediaMessage]')
      )
    );

    console.log(`\n📎 Mensagens com APENAS marcadores de mídia: ${comMarcadores.length}`);

  } catch (error) {
    console.error('❌ Erro ao conectar ao banco:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
