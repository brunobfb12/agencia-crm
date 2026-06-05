# Tratamento de Chamadas WhatsApp

## Fluxo Implementado (06/05/2026)

### 1. Detecção (N8N - filtrar_e_extrair.js)
```js
if (callMsg) {
  tipo = 'CHAMADA';
  mensagem = '[CHAMADA DE VOZ]' ou '[CHAMADA DE VIDEO]';
}
```

### 2. Workflow N8N (WhatsApp Agencia - Atendimento IA v2)

**Condição:** Se `tipo === 'CHAMADA'`

**Ação:**
- ❌ NÃO enviar resposta automática
- ✅ Criar/atualizar lead com observação: `[CLIENTE_TENTOU_LIGAR_HORA]`
- ✅ Notificar vendedor atribuído (WhatsApp):

```
📞 *CHAMADA DO CLIENTE!*

👤 *[NOME_CLIENTE]*
📱 *Telefone:* [TELEFONE]
🕐 *Hora:* [HORA_CHAMADA]

Tipo: [VOZ / VIDEO]

⚠️ *Ação:* Ligue para o cliente AGORA!
Link: https://wa.me/[TELEFONE]
```

### 3. No Painel do CRM

- Lead mostra flag `[CLIENTE_TENTOU_LIGAR]` em observações
- Vendedor vê no histórico que cliente tentou ligar
- Permite rastrear clientes que tentam entrar em contato

### 4. Casos de Uso

**Exemplo 1:** Cliente (62) 98128-2288 liga para Jhiovana
- Sistema detecta chamada
- Notifica Jhiovana no WhatsApp
- Registra no lead: `[CLIENTE_TENTOU_LIGAR_2026-06-05_14:30]`

**Exemplo 2:** Lead em FOLLOW_UP liga
- Sistema identifica que é um follow-up que virou ativo
- Pode escalar para NEGOCIACAO se houver resposta

---

## TODO: Implementar em N8N

1. Node: Verificar se `tipo === 'CHAMADA'`
2. Node: Buscar lead por telefone
3. Node: Atualizar observacoes com flag `[CLIENTE_TENTOU_LIGAR]`
4. Node: Enviar WhatsApp para vendedor atribuído
5. Node: Registrar em histórico/leads

---

**Status:** Filtro implementado ✅ | Workflow N8N pendente ⏳
