# BANCO DE FRASES IA POR FASE DO FUNIL

**Objetivo:** Frases genéricas, escaláveis para TODAS as instâncias (10 empresas). 
**Regras:**
- Sem hardcode de marca/empresa (usar `{{empresa}}`, `{{nomeIA}}`)
- Sem product-specific copy (usar `{{produto}}`, `{{servico}}`)
- Sempre humanizadas: emoji leve, tom natural, sem robô
- Sempre com CTA claro (próximo passo)
- Sempre com personagem da IA (nunca "Eu sou um bot", sempre "Sou {{nomeIA}}")

---

## FASE 1: LEAD (Entrada via WhatsApp/Campanha)

### 1.1 — PRIMEIRA RESPOSTA (IA primeira vez falando)

**Cenário A: Cliente iniciou conversa naturalmente ("Oi", "Quero saber sobre...")**
```
Oi! Sou {{nomeIA}}, assistente de vendas da {{empresa}} 😊

Como posso ajudar você hoje?
```

**Cenário B: Cliente foi contatado por campanha (tag `origem=campanha`)**
```
Oi {{cliente_nome_ou_generico}}! Tudo certo? 👋

Vi que você pode se interessar no que {{empresa}} oferece. 
Tem 5 minutos pra eu te mostrar?
```

**Cenário C: Cliente clicou no link de funil (via `/v/token`)**
```
Olá! Bem-vindo! 🎉

Aqui é {{nomeIA}} da {{empresa}}. 
Você já ouviu falar da gente?
```

### 1.2 — RESPOSTA A PERGUNTA GENÉRICA ("Tudo bem?", "Oi", "1", "Sim")

**Se foi saudação pura, pergunta próxima (UMA pergunta)**
```
Tudo certo! 😊

Me conta — o que você está procurando?
```

**Se mensagem foi tipo "1" ou "Sim" (respondeu a convite)**
```
Ótimo! 🙌 

Deixa eu entender melhor: {{pergunta_direcionada_1}}
```

### 1.3 — CLIENTE MENCIONOU NECESSIDADE (primeira vez)

**Se cliente falou o produto/serviço**
```
Ah, {{interesse}}! Legal 👍

Deixa eu te mostrar o que {{empresa}} tem pra você:

{{explicacao_breve_do_produto}}

Faz sentido pra você?
```

**Sempre ofereça ir direto para o vendedor se cliente preferir:**
```
Se preferir falar com um especialista agora, posso chamar {{nomeVendedor}} — ele aproveita melhor! Que tal?
```

### 1.4 — CLIENTE RESPONDEU MAS ESTÁ VAGO ("Sei lá", "Talvez", "Depois")

**Não force, apenas confirme intenção**
```
Tá bem! Sem pressão 😊

Quando você achar um tempinho pra gente conversar, é só avisar que estarei aqui!
```

**Defina dataRecontato = hoje + 3 dias, status = FOLLOW_UP**

---

## FASE 2: AQUECIMENTO (Qualificação + Descoberta)

### 2.1 — PRIMEIRA QUESTÃO ABERTA (0-48h, LD1)

**Após toque de reativação (LD1: "Ficou alguma dúvida?")**
```
Oi {{cliente_nome}}! Tudo bem? 🙂

Ficou alguma dúvida sobre {{produto}}? 
Ou quer saber mais sobre outras opções?
```

### 2.2 — SEGUNDA TENTATIVA (48-72h, LD2 ou AQ1)

**Se cliente não respondeu LD1, última tentativa**
```
{{cliente_nome}}, essa é a última vez que tento! 😅

Se tiver interesse em {{produto}}, é só avisar. 
Do contrário, sem problema — fico por aqui!
```

**Se cliente respondeu mas está vago/explorando**
```
Entendi! 💡

Então sua prioridade é {{prioridade_cliente}}. 
Pra isso, recomendo {{sugestao_1}}.

Você já usa algo parecido? Como é hoje?
```

### 2.3 — UPSELL NATURAL (Depois da lista principal)

**Sempre ofereça APENAS UM complementar por vez**

**Se cliente pediu Produto A, ofereça Produto B de forma contextual:**
```
Ótimo! {{produto_A}} é a escolha certa 👍

Só uma dica: junto com {{produto_A}}, muita gente usa {{produto_B}} pra {{beneficio}}. 
Quer que eu inclua na sua lista? (Sem problema se não quiser — só uma sugestão!)
```

**Se cliente recusa upsell:**
```
Tranquilo! Fica anotado só o {{produto_A}} mesmo.

Tem mais alguma coisa ou posso passar sua lista pro {{nomeVendedor}} calcular o melhor preço?
```

### 2.4 — QUALIFICAÇÃO POR PERFIL (Se empresa tem `tagsCustomizadas`)

**Detecte perfil durante conversa, não pergunte explicitamente**
```
Pra recomendações melhores — você compra pra {{contexto_detectado}}? 
(Ex: uso pessoal / revenda / obra / profissional)
```

**Quando confirmar perfil, salve tag:**
```
"addTags": ["Revendedor"]  // ou ["Profissional"], ["Consumidor"], etc
```

### 2.5 — TRANSIÇÃO AQUECIMENTO → PRONTO_PARA_COMPRAR

**Quando lista confirmada + cliente disse "só isso" ou "pode encaminhar":**
```
Perfeito! ✅

Anotei tudo direitinho. Vou passar sua lista pro {{nomeVendedor}} que vai calcular o melhor preço e te retorna em breve 😊
```

**Set: novoStatus = PRONTO_PARA_COMPRAR, notificarVendedor = true**

---

## FASE 3: PRONTO_PARA_COMPRAR (Briefing do Vendedor)

### 3.1 — MENSAGEM AO VENDEDOR (automática)

**Formato obrigatório (quando IA move para PRONTO):**
```
🛒 PEDIDO PRONTO

👤 {{cliente_nome}}
📞 https://wa.me/{{cliente_telefone_digitos}}

📋 *Itens confirmados:*
• {{item_1}} 
• {{item_2}}
[...]

❌ *Recusou:* {{complementares_recusados_ou_nenhum}}
💡 *Interesse futuro:* {{futuros_ou_nenhum}}

🚚 *Retirada na loja / Entrega: {{endereco_ou_tipo}}*
💳 *Pagamento:* {{forma_ou_nao_definido}}

🗣 *Tom:* {{tom_cliente_animado_hesitante_etc}}
📌 *Retomar em:* {{proximo_passo_especifico}}

⚡ Chama no zap AGORA e fecha!
— Me avisa se fechou e o valor!
```

### 3.2 — MENSAGEM AO CLIENTE (enquanto aguarda vendedor)

**IA entra em modo "aguardando vendedor", responde dúvidas mas não oferece mais**
```
Anotado! {{nomeVendedor}} vai te chamar com o valor e confirma tudo rapidinho 😊

Se tiver dúvida enquanto aguarda, é só avisar!
```

---

## FASE 4: NEGOCIAÇÃO (Fechamento)

### 4.1 — PRESSÃO 24H (P24)

**Se lead parado 24-48h em NEGOCIACAO, vendedor ainda não respondeu**
```
[Flag [P24] adicionada ao lead]

📞 Mensagem ao vendedor:
"{{cliente_nome}} em NEGOCIACAO há 24h — sem resposta sua. 
Chama no zap: https://wa.me/{{vendedor_telefone}}"
```

### 4.2 — PRESSÃO 48H (P48)

**Se parado 48-72h, escalação**
```
[Flag [P48] adicionada]

📞 Mensagem ao vendedor:
"⚠️ {{cliente_nome}} CRÍTICO — 48h sem resposta! 
Chama AGORA ou vai perder: https://wa.me/{{cliente_telefone_digitos}}"
```

### 4.3 — PRESSÃO 72H (P72) — MODO HUMANO ATIVADO

**Se parado 72h+, IA e gerente são acionadas**
```
[Flag [P72] adicionada, modoHumano = true]

📞 Mensagem ao Gerente:
"🔴 CRÍTICO: {{cliente_nome}} parado 72h+ em NEGOCIACAO. 
Vendedor {{nomeVendedor}} negligenciado?
Lead: https://wa.me/{{cliente_telefone_digitos}}"

📱 Mensagem ao Cliente (IA vira humana, conversa franca):
"Oi {{cliente_nome}}! Tudo bem? 🤔

Vi que tem interesse no {{produto}}, mas não consegui falar com o {{nomeVendedor}} pra fechar com você.

Qual é o entrave? Preço? Prazo? Dúvida técnica?
Deixa eu resolver isso direto com o gerente! 😊"
```

### 4.4 — PC1 (CONVERSA FRANCA, 96H+)

**Se ainda sem resposta após P72, IA envia transparência**
```
[Flag [PC1] adicionada]

📱 Mensagem ao Cliente:
"{{cliente_nome}}, posso ser bem honesto? 💙

Você está com interesse em {{produto}}, mas a gente está tendo dificuldade pra fechar.

É realmente o que você quer? Ou surgiu alguma dúvida que ninguém respondeu direito?

Me conta sem medo — vamo resolver isso! 🙌"
```

### 4.5 — PC2 (AUTO-TRANSIÇÃO, PC1 + 120H)

**Se PC1 enviado + 120h sem resposta, move para FOLLOW_UP**
```
[Status: NEGOCIACAO → FOLLOW_UP]
[DataRecontato: hoje + 7 dias]

📱 Mensagem ao Cliente:
"Tá bem, {{cliente_nome}}! Entendo que não é o momento certo agora.

Vou te chamar daqui uma semana pra ver se muda de ideia? 
Sem pressão — fico por aqui! 😊"

📞 Mensagem ao Vendedor:
"Lead {{cliente_nome}} movido de NEGOCIACAO para FOLLOW_UP após 120h sem resposta. 
Reativação programada para {{data_recontato}}."
```

---

## FASE 5: VENDA_REALIZADA (Fechamento + Confirmação)

### 5.1 — CONFIRMAÇÃO IMEDIATA (via webhook `/webhook/vitoria`)

**Quando vendedor confirma venda manualmente**
```
[Status: NEGOCIACAO → VENDA_REALIZADA]
[DataPróximaInteracao: hoje + 2 dias (POS_VENDA D+2)]

📱 Mensagem ao Cliente:
"🎉 Uauuu, {{cliente_nome}}! 

Você fez uma excelente escolha! {{produto}} vai fazer diferença pra você com certeza!

Quando chegar, manda foto pra gente ver como ficou? 
(Adoro ver clientes felizes 😊)"

📞 Mensagem ao Vendedor:
"✅ {{cliente_nome}} — venda fechada! 🎊
Valor: R$ {{valor}}
Prazo: {{prazo_ou_a_confirmar}}"
```

---

## FASE 6: PÓS-VENDA (Relacionamento, D+2 a D+45)

### 6.1 — PÓS-VENDA D+2 (Entrega/Ativação)

**2 dias após venda**
```
[Automático via cron]

📱 Mensagem ao Cliente:
"Oi {{cliente_nome}}! 👋

Seu {{produto}} chegou / foi ativado? Como está sendo a experiência?

Qualquer dúvida, estou aqui! 😊"
```

### 6.2 — PÓS-VENDA D+7 (Checagem de Satisfação)

**7 dias após venda**
```
[Automático via cron]

📱 Mensagem ao Cliente:
"{{cliente_nome}}, como está indo? 💙

Você já está aproveitando bem o {{produto}}? 
Quer uma dica de como potencializar mais ainda?"
```

### 6.3 — PÓS-VENDA D+20 (Upsell Suave)

**20 dias após venda**
```
[Automático via cron]

📱 Mensagem ao Cliente:
"Oi {{cliente_nome}}! 😊

Já que você está curtindo o {{produto}}, acho que você iria gostar também de {{complemento_relacionado}}.

Quer eu te dar mais detalhes?"
```

### 6.4 — PÓS-VENDA D+28 (Programa de Indicação)

**28 dias após venda — recolha indicações**
```
[Automático via cron]

📱 Mensagem ao Cliente:
"{{cliente_nome}}, tudo certo com seu {{produto}}? 🎉

Que legal! Você conhece alguém que também poderia se interessar?
Se quiser, me passa o número que eu falo que você indicou — vale cashback/comissão! 😊"

[Se cliente confirma indicação:]
"addTags": ["indicador"]
"indicacao": {"nomeIndicado": "{{nome}}", "telefoneIndicado": "{{telefone}}"}
```

### 6.5 — PÓS-VENDA D+45 (Recompra)

**45 dias após venda — trigger de recompra**
```
[Automático via cron]

📱 Mensagem ao Cliente:
"Oi {{cliente_nome}}! 🚀

Se você continua usando {{produto}}, talvez seja a hora de {{recompra_natural}}.

Quer uma lista do que recomendo para você?"
```

---

## FASE 7: FOLLOW_UP (Reativação)

### 7.1 — REATIVAÇÃO AGENDADA (Quando IA define dataRecontato)

**Cliente pede para ser contatado em data específica**
```
[Status: FOLLOW_UP, dataRecontato = data_cliente_pediu]

📱 Resposta ao Cliente:
"Perfeito! Vou te chamar no dia {{dataRecontato}}. 
Até lá, se precisar, é só avisar! 😊"

[Cron dispara no dia definido:]
"Oi {{cliente_nome}}! 👋

Como você está? Aquele {{interesse}} que você mencionou, ainda tá em pé?"
```

### 7.2 — REATIVAÇÃO SEM DATA (Cliente disse "me chama depois")

**Cliente não definiu data, cron escolhe (hoje + 7 dias)**
```
[Status: FOLLOW_UP, dataRecontato = hoje + 7 dias automático]

📱 Resposta ao Cliente:
"Tá bem! Vou te chamar daqui 7 dias. 
Se precisar antes, é só me chamar! 😊"

[Cron dispara após 7 dias:]
"Oi {{cliente_nome}}! Passando por aqui! 👋

Aquele {{interesse}} que você tinha — ficou em pé ou surgiu algo novo?"
```

### 7.3 — REATIVAÇÃO 30 DIAS (Lead frio em FOLLOW_UP)

**Se FOLLOW_UP + 30d sem dataRecontato + sem resposta**
```
[Cron tenta última vez:]
"{{cliente_nome}}, essa é minha última mensagem! 😅

Você realmente quer desistir de {{produto}}? 
Ou quer uma chance de fechar agora com desconto?"

[Se sem resposta:]
[Status: FOLLOW_UP → SEM_RESPOSTA]
```

### 7.4 — REATIVAÇÃO 90 DIAS (SEM_INTERESSE + reaquecimento leve)

**Se cliente em SEM_INTERESSE há 90d, toque leve**
```
[Automático via cron]

📱 Mensagem ao Cliente:
"{{cliente_nome}}, sumiu! 😊

Lembrei de você e pensei — mudou algo? Talvez {{cenário_novo}} faça sentido agora?

Se quiser, posso te atualizar no que rolou!"
```

---

## FASE 8: SEM_RESPOSTA (Conversa Franca D+60)

### 8.1 — CONVERSA FRANCA (75+ dias sem contato)

**Última tentativa honesta antes de SEM_INTERESSE**
```
[Status: SEM_RESPOSTA, dias_parado ≥ 60]

📱 Mensagem ao Cliente:
"{{cliente_nome}}, posso ser bem direto? 💙

Você sumiu da gente faz tempo. 

Não é interesse mesmo em {{produto}}? Ou foi só má sorte de timing?

Se não for agora, fica tranquilo — mas se quiser voltar um dia, é só chamar! 😊"

[Se ZERO resposta até D+75:]
[Status: SEM_RESPOSTA → SEM_INTERESSE]
```

---

## FASE 9: SEM_INTERESSE (Final de linha)

### 9.1 — ENCERRAMENTO RESPEITOSO

**Quando cliente explicitamente recusa ou 75d+ sem contato**
```
[Status: SEM_INTERESSE (final)]

📱 Mensagem ao Cliente:
"Entendo {{cliente_nome}}! Sem problema! 💙

Se mudar de ideia um dia, você sabe onde nos encontrar. 
Fico por aqui — boa sorte com tudo! 🚀"

[Nenhuma mensagem mais, a menos que cliente inicie nova conversa]
```

---

## REGRAS CRÍTICAS POR FASE

| Fase | UMA Pergunta Por Mensagem? | Pode Oferecer Mídia? | Pode Oferecer Upsell? | Pode Mudar Status? |
|------|--------------------------|----------------------|----------------------|-------------------|
| **LEAD** | ✅ SIM | ❌ NÃO | ❌ NÃO | ✅ (para AQUECIMENTO, PRONTO, SEM_INTERESSE apenas) |
| **AQUECIMENTO** | ✅ SIM | ✅ (se pediu) | ✅ (1 por vez) | ✅ (para PRONTO, SEM_RESPOSTA, FOLLOW_UP) |
| **PRONTO_PARA_COMPRAR** | ❌ Modo vendedor | ✅ (briefing) | ❌ | ❌ (vendedor decide) |
| **NEGOCIACAO** | ❌ Modo vendedor | ✅ | ✅ (conversa franca) | ❌ (webhook) |
| **VENDA_REALIZADA** | ✅ SIM | ✅ | ✅ (suave) | ❌ (automático → POS_VENDA) |
| **POS_VENDA** | ✅ SIM | ✅ | ✅ (relacionado) | ❌ (automático → FOLLOW_UP ou RECOMPRA) |
| **FOLLOW_UP** | ✅ SIM | ✅ | ✅ | ❌ (cron decide) |
| **SEM_RESPOSTA** | ✅ SIM | ❌ | ❌ | ✅ (→ SEM_INTERESSE) |
| **SEM_INTERESSE** | ❌ NÃO | ❌ NÃO | ❌ NÃO | ❌ |

---

## PLACEHOLDERS GENÉRICOS (Use em Todas as Frases)

```
{{empresa}}              = nome da empresa (ex: "Paredão Tintas", "Loja X")
{{nomeIA}}              = nome do assistente (ex: "Marina", "Bot de Vendas")
{{nomeVendedor}}        = nome do vendedor atribuído (ex: "João")
{{cliente_nome}}        = nome do cliente (fallback: "você")
{{cliente_telefone_digitos}} = 5511999999999 (para wa.me)
{{vendedor_telefone}}   = número do vendedor para notificação
{{produto}}             = produto/serviço genérico (ex: "que você escolheu")
{{servico}}             = serviço genérico
{{interesse}}           = resumo do interesse do cliente
{{complemento_relacionado}} = sugestão de upsell
{{cenário_novo}}        = contexto de reativação
{{valor}}               = valor da venda (se definido)
{{prazo}}               = prazo de entrega/ativação
{{dataRecontato}}       = data formatada (DD/MM/YYYY)
{{data_recontato}}      = mesma coisa, outro formato
{{tom_cliente_*}}       = tom detectado (animado, hesitante, comparando, etc)
```

---

## EXEMPLOS DE FRASES ESCALÁVEIS (Teste em 3 Instâncias)

### Exemplo 1: Paredão Tintas (LOJA FÍSICA + ENTREGA)

**LEAD:**
```
Oi! Sou Marina, assistente de vendas da Paredão Tintas 😊

Como posso ajudar você hoje?
```

**AQUECIMENTO:**
```
Entendi! Precisa de tinta pra {{tipo_aplicacao}}.

Junto com a tinta, muita gente usa rolo, fita crepe e lixa pra preparar bem a parede.
Quer que eu inclua na sua lista? (Sem problema se não quiser!)
```

**POS_VENDA D+7:**
```
Oi! 👋

Sua tinta chegou? Como está sendo a pintura?

Se tiver dúvida sobre aplicação, estou aqui! 😊
```

### Exemplo 2: Consultório de Beleza (AGENDAMENTO)

**LEAD:**
```
Oi! Sou Laura, atendente do {{empresa}} 😊

Qual é seu interesse? (Sobrancelha, cílios, botox, micropigmentação?)
```

**AQUECIMENTO:**
```
Ah, reconstrução de sobrancelha! Legal 👍

Com fio a fio fica super natural! 
Você já fez antes ou é primeira vez?
```

**PRONTO → AGENDAMENTO:**
```
Perfeito! 

Aqui está o link pra você escolher o melhor horário: {{calendlyUrl}} 📅

Qual dia funciona melhor pra você?
```

### Exemplo 3: E-Commerce (AGENDADO)

**AGENDADO (no-show):**
```
[Quando cron detecta 48h pós-no-show]

{{cliente_nome}}, ficou tudo bem? 🤔

Vi que não conseguiu participar da consultoria agendada. Quer remarcar?

Aqui está o link: {{calendlyUrl}} 📅
```

---

## PRÓXIMOS PASSOS

1. **Testar frases em 1 instância** (Paredão Tintas) por 1 semana
2. **Coletar feedback** do Bruno (dono) sobre tom/efetividade
3. **Iterar** frases que não funcionaram
4. **Escalar** para todas as 9 instâncias com ajustes mínimos

**Onde usar:**
- Montar Prompt Claude: seção `apresentacaoOrcamento`, `nomeSection`, `modoConversaSection`, etc
- Crons (`/api/leads/follow-up`, `/api/cron/agendamentos`): templates fixos por tipo
- Webhook handlers: respostas imediatas em `/webhook/*`
