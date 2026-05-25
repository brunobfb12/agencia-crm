---
name: Sistema de Build N8N — nodes/*.js
description: Processo obrigatório para editar o workflow N8N; nunca mais usar patch scripts com string.replace
type: project
originSessionId: f149734d-c602-4e3b-8741-931e91ec958c
---
A partir de 10/05/2026, o workflow N8N é gerenciado com um sistema de build próprio.

**Why:** Patch scripts com `string.replace()` em código JS embutido em JSON causaram 3 regressões no mesmo ponto (número de telefone errado, `const` dentro de object literal, etc.). O custo de bugs silenciosos era alto demais.

**How to apply:** Sempre que precisar editar lógica de um nó Code no workflow, usar o fluxo abaixo.

---

## Fluxo obrigatório para qualquer mudança no N8N

```
1. Editar o arquivo em:  C:\Users\USUARIO\Downloads\print\nodes\*.js
2. node build_workflow.js   → valida sintaxe de todos os nós (aborta se houver erro)
3. node push_n8n.js         → envia wf_built.json para produção
```

**Nunca** criar patch scripts novos com `string.replace()` em jsCode.

---

## Arquivos fonte (nodes/)

| Arquivo | Nó N8N |
|---------|--------|
| `filtrar_e_extrair.js` | Filtrar e Extrair |
| `preparar_audio_bin_rio.js` | Preparar Audio Binário |
| `mesclar_transcri__o.js` | Mesclar Transcrição |
| `montar_prompt_claude.js` | Montar Prompt Claude (maior/mais crítico) |
| `parsear_resposta_ia.js` | Parsear Resposta IA |
| `preparar_imagem.js` | Preparar Imagem |
| `preparar_documento.js` | Preparar Documento |

Caminho base: `C:\Users\USUARIO\Downloads\print\nodes\`

---

## Regras de campo (NUNCA mudar)

- `telefonePrincipal` = número normalizado do CRM → **SEMPRE usar para enviar mensagens**
- `telefone` = número bruto do WhatsApp → pode ter erros, NÃO usar para enviar
- `telefoneSend` = null para @lid (iPhone Business), igual a `telefone` nos demais
- `instancia` = nome da instância Evolution API

---

## Workflow atual

- ID N8N: `YCanhmW5AKNdvICI`
- Nome: "WhatsApp Agencia - Atendimento IA v2 (Audio+Midia)"
- Arquivo local: `C:\Users\USUARIO\Downloads\print\wf_current.json`

## Processo real de atualização (2026-05-14)

`build_workflow.js` e `push_n8n.js` **não existem** como arquivos fixos. O fluxo real é:

1. Editar `nodes/*.js`
2. Criar script `.mjs` temporário que lê `wf_current.json`, aplica a mudança e salva
3. Criar `push_n8n.mjs` temporário com a API key passada como `process.argv[2]`
4. Rodar ambos com `node script.mjs`
5. **Deletar os scripts** — nunca salvar API key em arquivo

Script de referência para push: ver `update_workflow.mjs` (já existente) para o padrão de `PUT /api/v1/workflows/{id}`.

Nota: o `settings` no PUT deve ser apenas `{ executionOrder: 'v1' }` — o N8N rejeita campos extras como `binaryMode`.
