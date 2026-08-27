import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const tel = '5562994390146';

const cliente = await prisma.cliente.findFirst({
  where: { telefone: { contains: tel } },
  include: {
    conversas: {
      orderBy: { ultimaAtividade: 'desc' },
      take: 1,
      include: {
        mensagens: { orderBy: { criadoEm: 'asc' }, take: 60 }
      }
    },
    leads: {
      orderBy: { criadoEm: 'desc' },
      take: 1,
      select: { id: true, status: true, observacoes: true, atualizadoEm: true, empresa: { select: { nome: true } } }
    }
  }
});

if (!cliente) { console.log('Cliente não encontrado'); process.exit(0); }

console.log('=== CLIENTE ===');
console.log({ id: cliente.id, nome: cliente.nome, telefone: cliente.telefone });

console.log('\n=== LEAD ===');
console.log(JSON.stringify(cliente.leads[0], null, 2));

const conversa = cliente.conversas[0];
if (!conversa) { console.log('Sem conversa'); process.exit(0); }
console.log('\n=== CONVERSA ===');
console.log({ id: conversa.id, ultimaAtividade: conversa.ultimaAtividade, modoHumano: conversa.modoHumano });

console.log('\n=== MENSAGENS ===');
for (const m of conversa.mensagens) {
  const hora = new Date(m.criadoEm).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  console.log(`[${hora}] ${m.direcao} | ${m.conteudo?.slice(0, 120)}`);
}

await prisma.$disconnect();
