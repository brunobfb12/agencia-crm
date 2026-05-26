export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;

  const { prisma } = await import("@/lib/prisma");

  const migrations = [
    `ALTER TABLE "Vendedor" ADD COLUMN IF NOT EXISTS "ultimaAtribuicaoEm" TIMESTAMP`,
    `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "vendedorId" TEXT`,
    `DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Lead_vendedorId_fkey') THEN
    ALTER TABLE "Lead" ADD CONSTRAINT "Lead_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "Vendedor"(id) ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$`,
    `ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "informacoes" TEXT`,
    `ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "email" TEXT`,
    `ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "dataNascimento" TIMESTAMP`,
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
    `DO $$ BEGIN CREATE TYPE "MensagemDirecao" AS ENUM ('ENTRADA', 'SAIDA'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN CREATE TYPE "VendaStatus" AS ENUM ('REALIZADA', 'POS_VENDA_PENDENTE', 'POS_VENDA_OK', 'CANCELADA'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN CREATE TYPE "AgendamentoTipo" AS ENUM ('FOLLOW_UP', 'POS_VENDA', 'REATIVACAO'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN CREATE TYPE "AgendamentoStatus" AS ENUM ('PENDENTE', 'CONCLUIDO', 'CANCELADO'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `CREATE TABLE IF NOT EXISTS "Conversa" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "clienteId" TEXT NOT NULL,
      "ultimaMensagem" TEXT,
      "ultimaAtividade" TIMESTAMP NOT NULL DEFAULT NOW(),
      "criadoEm" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "Conversa_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"(id) ON DELETE RESTRICT ON UPDATE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "Mensagem" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "conversaId" TEXT NOT NULL,
      "conteudo" TEXT NOT NULL,
      "direcao" "MensagemDirecao" NOT NULL,
      "criadoEm" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "Mensagem_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "Conversa"(id) ON DELETE RESTRICT ON UPDATE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "Venda" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "leadId" TEXT NOT NULL,
      "vendedorId" TEXT NOT NULL,
      "valor" DOUBLE PRECISION,
      "descricao" TEXT,
      "status" "VendaStatus" NOT NULL DEFAULT 'REALIZADA',
      "criadoEm" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "Venda_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT "Venda_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "Vendedor"(id) ON DELETE RESTRICT ON UPDATE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "Agendamento" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "clienteId" TEXT NOT NULL,
      "tipo" "AgendamentoTipo" NOT NULL,
      "dataAgendada" TIMESTAMP NOT NULL,
      "notas" TEXT,
      "status" "AgendamentoStatus" NOT NULL DEFAULT 'PENDENTE',
      "criadoEm" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "Agendamento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"(id) ON DELETE RESTRICT ON UPDATE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "Notificacao" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "vendedorId" TEXT NOT NULL,
      "clienteId" TEXT,
      "tipo" TEXT NOT NULL,
      "mensagem" TEXT NOT NULL,
      "enviada" BOOLEAN NOT NULL DEFAULT false,
      "criadoEm" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "Notificacao_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "Vendedor"(id) ON DELETE RESTRICT ON UPDATE CASCADE
    )`,
    `ALTER TABLE "Conversa" ADD COLUMN IF NOT EXISTS "modoHumano" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TYPE "Perfil" ADD VALUE IF NOT EXISTS 'EMPRESA'`,
    `ALTER TYPE "AgendamentoTipo" ADD VALUE IF NOT EXISTS 'CONSULTA'`,
    `ALTER TYPE "AgendamentoTipo" ADD VALUE IF NOT EXISTS 'ANIVERSARIO'`,
    `ALTER TYPE "AgendamentoTipo" ADD VALUE IF NOT EXISTS 'TAREFA'`,
    `ALTER TABLE "Agendamento" ADD COLUMN IF NOT EXISTS "hora" TEXT`,
    `ALTER TABLE "Agendamento" ADD COLUMN IF NOT EXISTS "googleEventId" TEXT`,
    `ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "googleCalendarId" TEXT`,
    `ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "googleCredentialId" TEXT`,
    `ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "calendlyUrl" TEXT`,
    `CREATE TABLE IF NOT EXISTS "Usuario" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "nome" TEXT NOT NULL,
      "email" TEXT NOT NULL UNIQUE,
      "senha" TEXT NOT NULL,
      "perfil" "Perfil" NOT NULL DEFAULT 'EMPRESA',
      "empresaId" TEXT,
      "ativo" BOOLEAN NOT NULL DEFAULT true,
      "criadoEm" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "Usuario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"(id) ON DELETE SET NULL ON UPDATE CASCADE
    )`,
    `ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'SEM_INTERESSE'`,
    `ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'SEM_RESPOSTA'`,
    `ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'AGENDADO'`,
    `CREATE TABLE IF NOT EXISTS "Midia" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "empresaId" TEXT NOT NULL,
      "etiqueta" TEXT NOT NULL,
      "url" TEXT NOT NULL,
      "descricaoUso" TEXT NOT NULL,
      "tipo" TEXT NOT NULL DEFAULT 'imagem',
      "ativo" BOOLEAN NOT NULL DEFAULT true,
      "criadoEm" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "Midia_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"(id) ON DELETE CASCADE ON UPDATE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS "Midia_empresaId_idx" ON "Midia"("empresaId")`,
    `ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "perguntasQualificacao" TEXT`,
    `CREATE INDEX IF NOT EXISTS "Conversa_clienteId_idx" ON "Conversa"("clienteId")`,
    `CREATE INDEX IF NOT EXISTS "Conversa_ultimaAtividade_idx" ON "Conversa"("ultimaAtividade" DESC)`,
    `CREATE INDEX IF NOT EXISTS "Mensagem_conversaId_idx" ON "Mensagem"("conversaId")`,
    `CREATE INDEX IF NOT EXISTS "Lead_clienteId_idx" ON "Lead"("clienteId")`,
    `CREATE INDEX IF NOT EXISTS "Lead_empresaId_idx" ON "Lead"("empresaId")`,
    `CREATE TABLE IF NOT EXISTS "Campanha" (
  "id" TEXT NOT NULL,
  "empresaId" TEXT NOT NULL,
  "mensagem" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ATIVA',
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Campanha_pkey" PRIMARY KEY ("id")
)`,
    `CREATE TABLE IF NOT EXISTS "CampanhaItem" (
  "id" TEXT NOT NULL,
  "campanhaId" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "telefone" TEXT NOT NULL,
  "nomeCliente" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDENTE',
  "enviadoEm" TIMESTAMP(3),
  "erro" TEXT,
  CONSTRAINT "CampanhaItem_pkey" PRIMARY KEY ("id")
)`,
    `DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Campanha_empresaId_fkey') THEN
    ALTER TABLE "Campanha" ADD CONSTRAINT "Campanha_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$`,
    `DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'CampanhaItem_campanhaId_fkey') THEN
    ALTER TABLE "CampanhaItem" ADD CONSTRAINT "CampanhaItem_campanhaId_fkey" FOREIGN KEY ("campanhaId") REFERENCES "Campanha"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$`,
    `DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'CampanhaItem_leadId_fkey') THEN
    ALTER TABLE "CampanhaItem" ADD CONSTRAINT "CampanhaItem_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$`,
    `CREATE INDEX IF NOT EXISTS "Campanha_empresaId_idx" ON "Campanha"("empresaId")`,
    `CREATE INDEX IF NOT EXISTS "CampanhaItem_campanhaId_idx" ON "CampanhaItem"("campanhaId")`,
    `CREATE INDEX IF NOT EXISTS "CampanhaItem_status_idx" ON "CampanhaItem"("status")`,
    `UPDATE "Agendamento" SET "dataAgendada" = DATE_TRUNC('day', "dataAgendada" - INTERVAL '3 hours') + INTERVAL '3 hours'`,
    `ALTER TABLE "Agendamento" DROP CONSTRAINT IF EXISTS "Agendamento_clienteId_dataAgendada_hora_key"`,
    `DROP INDEX IF EXISTS "Agendamento_clienteId_dataAgendada_hora_key"`,
    `DELETE FROM "Agendamento" WHERE id NOT IN (SELECT id FROM (SELECT DISTINCT ON ("clienteId", "dataAgendada", COALESCE("hora", '')) id FROM "Agendamento" ORDER BY "clienteId", "dataAgendada", "hora", "criadoEm" ASC) sub)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Agendamento_clienteId_dataAgendada_hora_key" ON "Agendamento" ("clienteId", "dataAgendada", COALESCE("hora", ''))`,
    `ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "tipoAtendimento" TEXT NOT NULL DEFAULT 'AGENDAMENTO'`,
    `ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "nomeIA" TEXT`,
    `ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "mensagemPosVenda" TEXT`,
    `ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "mensagemAniversario" TEXT`,
    `ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "aprendizados" TEXT`,
    `DO $$ BEGIN CREATE TYPE "PlanStatus" AS ENUM ('TRIAL', 'ATIVO', 'BLOQUEADO', 'CANCELADO'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN CREATE TYPE "PlanoTipo" AS ENUM ('STARTER', 'PRO', 'AGENCY'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "planStatus" "PlanStatus" NOT NULL DEFAULT 'TRIAL'`,
    `ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "plano" "PlanoTipo" NOT NULL DEFAULT 'STARTER'`,
    `ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "trialFim" TIMESTAMP`,
    `ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "assinaturaId" TEXT`,
    `ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "isenta" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "valorMensal" DOUBLE PRECISION`,
    `ALTER TABLE "Vendedor" ADD COLUMN IF NOT EXISTS "cargo" TEXT NOT NULL DEFAULT 'VENDEDOR'`,
    `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "score" INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "observacoes" TEXT`,
    `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "dataRecontato" TIMESTAMP`,
    `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "atualizadoEm" TIMESTAMP NOT NULL DEFAULT NOW()`,
    `ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "memoriaCliente" TEXT`,
    `ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[]`,
    `ALTER TABLE "Midia" ADD COLUMN IF NOT EXISTS "base64" TEXT`,
    `ALTER TABLE "Midia" ADD COLUMN IF NOT EXISTS "mimeType" TEXT`,
    `ALTER TABLE "Midia" ALTER COLUMN "url" DROP NOT NULL`,
    `ALTER TYPE "Perfil" ADD VALUE IF NOT EXISTS 'DONO'`,
    `ALTER TYPE "Perfil" ADD VALUE IF NOT EXISTS 'VENDEDOR'`,
    `ALTER TYPE "Perfil" ADD VALUE IF NOT EXISTS 'FINANCEIRO'`,
    `ALTER TYPE "Perfil" ADD VALUE IF NOT EXISTS 'COMPRAS'`,
    `ALTER TYPE "Perfil" ADD VALUE IF NOT EXISTS 'LOGISTICA'`,
  ];

  let ok = 0;
  let skip = 0;
  for (const sql of migrations) {
    try {
      await prisma.$executeRawUnsafe(sql);
      ok++;
    } catch {
      skip++;
    }
  }
  console.log(`[migrate] startup: ${ok} ok, ${skip} skip`);
}
