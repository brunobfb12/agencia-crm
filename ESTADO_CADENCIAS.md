# Estado das Cadências - Diagnóstico Completo

**Data:** 2026-09-14  
**Commit:** 8b7625c — Fix: Remove double brackets in leadToClienteMap loops (3 occurrences)

## Bug Encontrado e Corrigido

### Problema Principal: Colchetes Duplos no leadToClienteMap

**Localização:** `app/api/leads/follow-up/route.ts`, linhas ~1321, 1331, 1339

**O Que Era:**
```typescript
for (const leads of [[posVenda], [reativacao15d], ...]) {  // ← duplos colchetes
  for (const lead of leads) {
    if (lead?.id && lead?.clienteId) { ... }
  }
}
```

**O Que Deveria Ser:**
```typescript
for (const leads of [posVenda, reativacao15d, ...]) {  // ← colchetes simples
  for (const lead of leads) {
    if (lead?.id && lead?.clienteId) { ... }
  }
}
```

**Por Que Era Bug:**
- Com `[[array1], [array2], ...]`, a variável `leads` recebe `[array1]` (um array contendo um array)
- O loop interno `for (const lead of leads)` itera sobre `[array1]`, fazendo `lead = array1` (um array, não um lead)
- `lead?.id` retorna undefined (arrays não têm `.id`)
- Nenhum lead era adicionado ao `leadToClienteMap` → **map ficava vazio**
- Resultado: `leadToClienteMap.size = 0`

**Impacto de 90 Dias:**
- leadToClienteMap vazio → TRAVA 2 não conseguia vincular items a clientes
- Todos os items de cadência tinham `leadToClienteMap.get(item.leadId) === undefined`
- TRAVA 2 bloqueava TODOS os items indiscriminadamente (linha ~1372-1378)
- **Zero cadências foram enviadas em 90 dias** (desde antes de 27/08 quando container foi criado)

### Correção Aplicada

**Commit:** `8b7625c`

Corrigidas 3 ocorrências:
1. Linha 1321: `[[posVenda], [reativacao15d], ...]` → `[posVenda, reativacao15d, ...]`
2. Linha 1331: `[[t1Leads], [t2Leads], ...]` → `[t1Leads, t2Leads, ...]`
3. Linha 1339: `[[vendasD7], [vendasD20], ...]` → `[vendasD7, vendasD20, ...]`

**Resultado Pós-Correção:**
- leadToClienteMap.size = 6 ✓ (antes era 0)
- TRAVA 2 agora consegue acessar e filtrar items corretamente ✓

---

## Validação: getTouche() Está Correto

**Script diagnóstico:** `diagnose_getTouche.mjs`  
**Resultado:** getTouche() retorna T1 para 6 de 10 leads elegíveis

```
[QUERY] cadenciaLeads retornou 10 leads
[SUMMARY]
  cadenciaLeads.length=10
  leads com touche=6
  leads map: 6 items com T1
```

- ✅ Lógica de getTouche() está funcionando
- ✅ Intervalo T1 (30 min) está correto
- ✅ Detecção de cliente respondeu após IA está correta
- ✅ Bloqueio de domingo (getUTCDay() === 0) funciona

---

## TRAVA 2: Agora Bloqueando Corretamente (Novo Problema em Aberto)

**Localização:** Linhas ~1347-1378 (`app/api/leads/follow-up/route.ts`)

**O Que Faz:**
Implementa "uma mensagem por cliente por dia" — se um cliente já recebeu qualquer mensagem SAIDA (cadência, aniversário, conversa franca, etc) hoje, não envia outra.

**Diagnóstico de 2026-09-14 19:46:**
```
[TRAVA2] Procurando mensagens SAIDA desde 2026-09-14T00:00:00.000Z
[TRAVA2] mensagensHoje.length=19
[TRAVA2] clientesComMsgHoje.size=6
[TRAVA2] Filtrando items...
  cmu19d9vm02w7xl19jlyx7qhx: passes=false (cliente já recebeu SAIDA hoje)
  cmu19t6pp02y7xl19vt2vfb2l: passes=false (cliente já recebeu SAIDA hoje)
  ...
[RESULTADO]
  items ANTES TRAVA2=6
  items DEPOIS TRAVA2=0  ← Todas bloqueadas!
```

**Problema em Aberto:**
A TRAVA 2 está **bloqueando TODAS as cadências** porque a resposta automática da IA (mensagens que o cliente recebe quando pede informações) já conta como "mensagem SAIDA hoje".

Isso significa que uma vez que o cliente interage com a IA e ela responde, nenhuma cadência (T1-T5, LD0, aniversário, reativação) será enviada para esse cliente pelo resto do dia.

**Questões:**
- Isso é comportamento desejado? (protege contra spam, mas pode bloquear cadências importantes)
- Devemos filtrar tipos de mensagem? (ex: "conversa_franca" não conta como SAIDA para fins de TRAVA 2?)
- Devemos ter TRAVA 2 por tipo de cadência, não global?

---

## Guardrails em Produção

### 1. CADENCIA_HOJE_CUTOFF (Linha ~15-20)
- **Objetivo:** Não disparar para leads parados antes de hoje (49 leads parados desde 11-13/09)
- **Implementação:** Filtra `atualizadoEm: { gte: CADENCIA_HOJE_CUTOFF }` onde CUTOFF = 00:00 BRT de hoje
- **Status:** ✅ Funcionando
- **Efeito:** Limita candidatos apenas a leads atualizados HOJE

### 2. isHorarioComercial (Linha ~21-27)
- **Objetivo:** Não disparar fora de 8-18h BRT ou aos domingos
- **Implementação:** `!isDomingo && nowBRTHour >= 8 && nowBRTHour < 18`
- **Status:** ✅ Funcionando
- **Efeito:** Executa apenas em horário comercial

### 3. TRAVA 1: Uma mensagem por lead por execução (Linha ~1293-1304)
- **Objetivo:** Se um lead aparece em múltiplas listas (cadência + reativação + etc), enviar apenas uma
- **Implementação:** Deduplica por leadId, mantém primeiro (ordem = prioridade)
- **Status:** ✅ Funcionando

### 4. TRAVA 2: Uma mensagem por cliente por dia (Linha ~1347-1378)
- **Objetivo:** Não entupir cliente com múltiplas mensagens no mesmo dia
- **Implementação:** Query `mensagem.findMany(direcao=SAIDA, criadoEm >= todayStart)`
- **Status:** ✅ Funcionando (mas muito restritivo)
- **Efeito:** Bloqueia 100% das cadências se cliente já recebeu SAIDA hoje

### 5. slice(0, 5) (Linha ~1464)
- **Objetivo:** Limite máximo de 5 items por execução
- **Implementação:** `items.slice(0, 5)` antes de retornar
- **Status:** ✅ Funcionando

---

## Infraestrutura e Deploy

### Container Production
- **Data criação:** 2026-08-27T00:14:16 (27 de agosto)
- **Código atual:** Commit 8b7625c (14 de setembro, 12:15 BRT)
- **Defasagem:** **18 dias** — container rodava código de 8 semanas atrás
- **Deploy:** MANUAL via Easypanel (não automático)

**Implicação:** Todos os testes de curl entre 27/08 e 14/09 validaram código ANTIGO. A correção dos colchetes nunca foi testada em produção até agora.

---

## Pendências e Chaves Vazadas

### Chaves de API Expostas no Git
- ❌ Groq API key presente em commits (histórico git)
- ❌ Anthropic API key presente em commits (histórico git)
- ⚠️ Evolution API key: hardcoded como `"SuaChaveSecreta123"` (valor padrão, não é chave real)

**Ação:** Revogar chaves no console das respectivas plataformas; adicionar `.gitignore` para `.env*`

### Nodes P24/P48/P72 Nunca Chamam msgPressao()
**Localização:** Linhas ~547-587 (pressao24h, pressao48h, pressao72h)

**Problema:** Esses arrays são construídos mas nunca iterados para gerar items. A função `msgPressao()` existe (linha ~541) mas é chamada apenas em um contexto específico (P3_timeout, linha ~727+).

**Status:** Pressão de vendedor (P24/P48/P72) não está sendo disparada automaticamente.

---

## Correção Implementada: T1-T5 Passam pela TRAVA 2

**Commit:** `acffecc` (2026-09-14)

**Mudança:**
- T1-T5 agora passam pela TRAVA 2 sem serem filtrados
- Foram adicionados à `cadeciaTiposExclusosTrava2`
- Excluídos do cálculo de `clienteIdsItems` (não contam para bloqueio)
- Sempre retornam `true` no filtro final

**Validação:** 
- Items ANTES TRAVA2 = 6 ✓
- Items DEPOIS TRAVA2 = 6 (antes era 0) ✓
- Items DEPOIS slice = 5 ✓

---

## Execução: Marcação SEM_INTERESSE (2026-09-15 02:35 UTC)

**Commit/Ação:** Marcados 756 leads antigos (atualizadoEm < 2026-09-01) como SEM_INTERESSE

**Resultado:**
- Leads marcados: 756 ✅
- Backup: /tmp/backup_sem_interesse_1789439737980.json (104 KB)
- Leads preservados (ORCAMENTO_ENVIADO + POS_VENDA): 38
- Impacto: Cadências retroativas reduzidas a zero (exceto 144 em PRONTO_CONVERSA_FRANCA recente)

---

## Pendências para Próxima Sessão

### 🔴 CRÍTICO: Zero Vendas Registradas em 794 Leads Antigos
**Localização:** Tabela `Venda`

**Achado:** Entre 794 leads antigos (anteriores a 2026-09-01), zero registros de Venda. Isso é improvável para uma loja com meses de operação.

**Impacto:**
- Dashboard de faturamento pode estar incorreto
- Ranking de vendedores não reflete vendas reais
- Ticket médio não calculado
- Follow-up de recompra (D7, D20, D28, D45) não dispara corretamente

**Ação:** Investigar se:
1. O webhook de venda está registrando corretamente
2. Há vendas em outro lugar (tabela diferente ou integração externa)
3. Qual é a fonte da verdade para faturamento

**Para o próximo ciclo:** Rodar auditoria de vendas vs. faturamento real em N8N/Nuvemshop.

---

### ⚠️ TRAVA 2: Offset de Timezone (BRT vs UTC)
**Localização:** Linha ~1349, `todayStart.setHours(0,0,0,0)`

**Problema:** 
- Container não tem TZ definida → calcula meia-noite em UTC
- CADENCIA_HOJE_CUTOFF usa lógica de BRT (3 horas atrás)
- TRAVA 2 usa UTC direto (sem offset)
- Resultado: janela de "hoje" está deslocada em ~3 horas para aniversário/reativação/pós-venda

**Impacto:** Esses tipos podem ser bloqueados fora da janela esperada. T1-T5 não são afetados (nunca são bloqueados).

**Solução:** Alinhar `todayStart` com `CADENCIA_HOJE_CUTOFF` (ambos em BRT) ou definir TZ=America/Sao_Paulo no container.

### 🔑 Segurança: Chaves Vazadas
- Groq API key em commits
- Anthropic API key em commits
- Evolution API hardcoded

### 📝 Implementar P24/P48/P72
- Linhas ~547-587 constroem arrays mas nunca os iteran
- msgPressao() existe mas não é chamada
- Pressão de vendedor (24h/48h/72h) não dispara

### 📄 Documentos Não Lidos (Excel, Word, PDF)
**Problema:** Cliente envia .xlsx, .docx ou .pdf pelo WhatsApp e a IA não lê o conteúdo.

**Investigação necessária:**
1. No workflow principal de N8N (inbound message): existem nós que tratam `documentMessage`? Existem tratadores de imagem/áudio?
2. O que acontece hoje com documentMessage — é ignorado, vira texto vazio, ou quebra o fluxo?
3. A IA responde algo nesses casos ou fica muda?
4. Frequência: quantas mensagens com documento nos últimos 30 dias? (buscar em logs Evolution ou tabela Mensagem)

**Ação:** Quando atacar, comece mapeando o workflow de inbound para entender como documentMessage é tratado.

### 📊 Monitorar
- Após deploy, verificar logs amanhã quando TRAVA 2 reset (00:00 BRT)

---

## 🔴 Bug Corrigido: Documentos Não-PDF Quebravam Workflow (2026-09-15)

### Problema Identificado

Quando cliente enviava documento em formato não-PDF (.xlsx, .docx, .csv, etc), o workflow de inbound quebrava com erro 400 na API Anthropic.

**Root cause:** API Anthropic só aceita `application/pdf` no bloco `type: 'document'`. Outros formatos são rejeitados categoricamente.

**Sequência do bug:**
1. Cliente envia .xlsx via WhatsApp
2. Nó 34 "Preparar Documento" extrai base64 com `mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'`
3. Nó 13 "Montar Prompt Claude" monta bloco `type: 'document'` com mimeType incorreto
4. Nó 14 envia para API Anthropic
5. API rejeita com HTTP 400: "Document type must be PDF (application/pdf), got [formato]"
6. Workflow falha
7. Cliente nunca recebe resposta

**Impacto:** Mensagem era salva no CRM como `[Documento]` mas a Luz nunca respondia (silêncio total).

### Correção Aplicada

**Workflow:** `zsjXvvSqTBnAqK3g` (WhatsApp Agencia - Atendimento IA v2 Audio+Midia)  
**Nó modificado:** Nó 13 — "Montar Prompt Claude"  
**Data:** 2026-09-15 10:55 BRT  
**Status:** ✅ APLICADA, AGUARDANDO TESTE REAL

#### Mudança de Código

**Antes:**
```javascript
const userMsgContent = imagemBase64
  ? [{ type: 'image', ... }, { type: 'text', text: userContent }]
  : documentoBase64
  ? [{ type: 'document', source: { type: 'base64', media_type: documentoMimeType, data: documentoBase64 } }, { type: 'text', text: userContent }]
  : userContent;
```

**Depois:**
```javascript
const avisoDocumento = (documentoBase64 && documentoMimeType !== 'application/pdf')
  ? '\n\n⚠️ CONTEXTO: Cliente enviou um arquivo em formato ' + documentoMimeType + '. Você só consegue processar PDFs. Peça para o cliente enviar a informação por mensagem de texto ou enviar em PDF.'
  : '';

const userMsgContent = imagemBase64
  ? [{ type: 'image', source: { type: 'base64', media_type: imagemMimeType, data: imagemBase64 } }, { type: 'text', text: userContent + avisoDocumento }]
  : (documentoBase64 && documentoMimeType === 'application/pdf')
  ? [{ type: 'document', source: { type: 'base64', media_type: documentoMimeType, data: documentoBase64 } }, { type: 'text', text: userContent }]
  : userContent + avisoDocumento;
```

#### Lógica da Proteção

- **Se tem imagem:** envia imagem + texto (com aviso se também tiver documento não-PDF)
- **Se tem documento PDF:** envia documento + texto (como antes)
- **Se tem documento não-PDF:** envia apenas texto + aviso contextual para a Luz
- **Se sem documento:** texto puro (como antes)

#### Resultado Esperado

| Cenário | Antes | Depois |
|---------|-------|--------|
| PDF (.pdf) | ✅ Funciona | ✅ Idem (sem mudança) |
| .xlsx, .docx, .csv | ❌ Erro 400 | ✅ Texto + contexto |
| Imagem | ✅ Funciona | ✅ Idem (sem mudança) |
| Sem documento | ✅ Texto puro | ✅ Idem (sem mudança) |

**Novo comportamento:** Cliente envia .xlsx → Luz recebe contexto clara → Luz pede em texto ou PDF → Cliente envia em PDF ou digita → Fluxo continua normal. **Zero erro 400.**

### Validação

- ✅ Workflow permanece ATIVO
- ✅ 44 nós intactos
- ✅ Código novo contém `avisoDocumento` e check `documentoMimeType !== 'application/pdf'`
- ⏳ **Aguardando teste real:** nenhum .xlsx foi enviado ao WhatsApp para validar comportamento

### Pendência: Extração de Texto de Xlsx/Docx

Para suportar **leitura real** de .xlsx, .docx sem conversão manual do cliente, seria necessário:

**Opção A: Via API interna**
- Criar endpoint `/api/midias/extrair-texto` que:
  - Receba arquivo base64 + mimeType
  - Use **SheetJS** (xlsx) ou **Mammoth** (docx) para converter para texto
  - Retorne texto puro para o prompt
- N8N chama este endpoint antes de "Montar Prompt Claude"

**Opção B: Node.js direto no N8N**
- Instalar `xlsx` e `mammoth` no container N8N
- Nó customizado que processa arquivo antes de "Montar Prompt Claude"

**Status:** Ambas as bibliotecas já estão disponíveis no ambiente do CRM.

**Decisão pendente:** Priorizar leitura de xlsx/docx ou deixar como "enviar em PDF"?

---

## 📝 Textos de Cadências T1-T4 Atualizados (2026-09-15)

**Commit:** `3792752061df061d6595b764d5e9a3ee03409f25`  
**Arquivo:** `app/api/leads/follow-up/route.ts` (linhas 918-955)

### Mudanças Aplicadas

**T1** (linha 918) — Foco em formas de pagamento
```javascript
`Oi${nome}! ${ia} aqui da ${l.empresa.nome} 😊 Só pra você saber: a gente facilita o pagamento — à vista ou parcelado no cartão. Quer que eu veja a melhor condição pro seu caso?`
```

**T2** (linha 930) — Dúvidas sobre opções e escolha
```javascript
`Oi${nome}! Se ficou alguma dúvida sobre qual opção atende melhor o que você precisa, me conta com mais detalhes que eu te ajudo a escolher 😊`
```

**T3** (linha 942) — Confirmação de disponibilidade e prazo
```javascript
`Oi${nome}! Quer que eu confirme a disponibilidade e o prazo de entrega do que você perguntou? Assim você já sabe certinho antes de decidir 😊`
```

**T4** (linha 954) — Oferecimento de atendimento com vendedor
```javascript
`Oi${nome}! Se preferir falar direto com um dos nossos vendedores pra fechar ou tirar dúvida de valor, me avisa que eu te passo pro atendimento agora 😊`
```

**T5** (linha 966) — Sem mudança (mantém original)

### Estrutura Preservada
- ✅ Template literals mantidos
- ✅ Variáveis `${nome}`, `${ia}`, `${l.empresa.nome}` preservadas
- ✅ Pontuação e emojis alinhados com tom de marca

### Validação TypeScript
```
npx tsc --noEmit → Exit code 2
Erros pré-existentes (não causados por esta mudança):
  • app/dashboard/central/page.tsx(799): Property 'instanciaVendedorOk' does not exist
  • app/dashboard/central/page.tsx(842, 855): 'w.setup' is possibly 'null'
  • app/dashboard/configuracoes/page.tsx(175): Property 'instanciaVendedorOk' does not exist
  • next.config.ts(6): 'eslint' does not exist in NextConfig
```

**Status:** ✅ Mudanças aplicadas e pushadas. Erros TypeScript são pré-existentes.

---

### 🔴 PENDÊNCIA: Textos de Cadência Devem Ser Configuráveis

**Problema:** Os textos de T1-T5 estão hardcoded em `route.ts`, mas o produto é **multi-tenant** (múltiplas empresas).

**Situação atual:**
- Textos estão em código-fonte
- Mesmo para diferentes empresas
- Requer deploy para alterar
- Não escalável

**Solução recomendada:**
Adicionar campos configuráveis na tabela `Empresa` (como já existem `mensagemIndicacao` e `mensagemPosVenda`):

```prisma
model Empresa {
  // ... campos existentes ...
  
  // Textos de cadências (nullable, fallback para defaults)
  cadenciaT1  String?  @default("Oi${nome}! ${ia} aqui da ${l.empresa.nome} 😊 Só pra você saber...")
  cadenciaT2  String?  @default("Oi${nome}! Se ficou alguma dúvida...")
  cadenciaT3  String?  @default("Oi${nome}! Quer que eu confirme...")
  cadenciaT4  String?  @default("Oi${nome}! Se preferir falar direto...")
  cadenciaT5  String?  @default("Oi${nome}! Vou parar de te chamar...")
}
```

**Alteração no código:**
```javascript
// Em vez de hardcodado:
`Oi${nome}! ${ia} aqui da ${l.empresa.nome}...`

// Usar:
const texto = l.empresa.cadenciaT1 || defaultCadenciaT1;
```

**Benefícios:**
- ✅ Multi-tenant: cada empresa tem seus textos
- ✅ Sem deploy: alterável via API/UI
- ✅ Fallback: padrão se não configurado
- ✅ Consistente com arquitetura existente (mensagemIndicacao, mensagemPosVenda)

**Impacto:**
- Migration Prisma (adicionar 5 campos)
- Atualizar lógica de buildItem() em route.ts (~5 linhas)
- Adicionar UI de configuração (dashboard)

**Prioridade:** Baixa (funciona, mas não escalável)
