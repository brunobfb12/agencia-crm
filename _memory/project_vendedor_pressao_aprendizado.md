---
name: vendedor-press-o-ativa-e-aprendizado-com-perdas
description: Sistema de cobrança automática ao vendedor (24h/48h/72h) e aprendizado com perdas via Haiku — implementado e testado 2026-05-14
metadata: 
  node_type: memory
  type: project
  originSessionId: 3c72a184-9763-41f6-b0d4-185b65c54d70
---

## O que foi implementado

### 1. Aprendizado com perdas (`/api/webhook/derrota`)

Arquivo: `app/api/webhook/derrota/route.ts`

- Chamado automaticamente pelo `webhook/vendedor` após registrar `PERDIDO`
- Lê motivo de perda de `lead.observacoes` (formato: `Motivo perda: <texto>`)
- Busca histórico de conversa (até 20 mensagens)
- Chama Claude Haiku para extrair padrão de objeção e como quebrá-la
- Salva em `empresa.aprendizados` com prefixo `[PERDA] `
- Máximo 10 aprendizados, separados por `\n---\n`

### 2. Prompt do Haiku com aprendizados (`aprendizadosSection`)

Arquivo: `nodes/montar_prompt_claude.js`

- Lê `empresa.aprendizados` (vem em `crm.empresa.aprendizados`)
- Separa por `\n---\n`, filtra por prefixo `[PERDA]` vs sem prefixo
- Seção "O QUE JA FUNCIONOU" (vitórias) + "OBJEÇÕES FREQUENTES" (perdas)
- Inserida após `vendasSection` no systemPrompt

A empresa agora precisa passar `aprendizados` na resposta do `webhook/mensagem`:
- Arquivo: `app/api/webhook/mensagem/route.ts` — `empresa.aprendizados ?? null`

### 3. Pressão ao vendedor (`leads/follow-up`)

Arquivo: `app/api/leads/follow-up/route.ts`

Três janelas de tempo calculadas a partir de `atualizadoEm` do lead:
- **24–48h**: `pressao_vendedor_24h` — lembrete gentil
- **48–72h**: `pressao_vendedor_48h` — urgente
- **+72h**: `pressao_vendedor_72h` — alerta crítico + `pressao_gerente_72h` se cargo=GERENTE existe

Status elegíveis: `NEGOCIACAO`, `PRONTO_PARA_COMPRAR`, `AGENDADO` com `vendedorId NOT NULL`.

`clienteTelefone` nos itens de pressão = telefone do **vendedor** (não do cliente).

### 4. N8N follow-up (`Cc9Gg7jV1IUH9qJE`)

Novo nó `É Pressão Vendedor?` (id: `fu-node-pressao-check`) inserido após `Enviar WhatsApp`:
- Condição: `$json.tipo` starts with `pressao_`
- YES → fim (não salva no CRM, não atualiza lead)
- NO → `Salvar Mensagem no CRM` → fluxo normal

## Testes realizados (2026-05-14)

- **Ciclo de perda completo**: Thaísy disse "não" → motivo "cliente achou caro" → PERDIDO → Haiku extraiu aprendizado sobre valor percebido → salvo como `[PERDA]` ✅
- **Ciclo de venda completo**: Thaísy disse "sim fechei" → valor "80" → VENDA_REALIZADA R$80 → Haiku aprendeu sobre engajamento → 2 padrões acumulados ✅
- **Pressão follow-up**: lead com `atualizadoEm - 25h` → endpoint retornou `pressao_vendedor_24h` → WhatsApp enviado para vendedor → CRM não atualizado ✅

**Why:** Fechar o ciclo de aprendizado contínuo — a IA melhora com cada venda e perda, e o vendedor recebe cobrança automática antes de perder a oportunidade.

**How to apply:** Sistema funciona sem intervenção. Monitorar `empresa.aprendizados` para ver padrões acumulando. Se um vendedor não tem cargo=GERENTE, escalada 72h vai só para o próprio vendedor.
