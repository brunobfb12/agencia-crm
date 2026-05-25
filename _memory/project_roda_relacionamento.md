---
name: roda-relacionamento
description: "Conceito central do FácilCRM — jornada automática do lead desde a entrada até o pós-venda, gerenciada pela IA com humanos atuando apenas em fechamento e escalações"
metadata: 
  node_type: memory
  type: project
  originSessionId: bd8f7624-589b-4166-a679-a2b7dd46124b
---

## Roda de Relacionamento — Conceito

Termo cunhado pelo usuário para descrever o ciclo contínuo de atendimento do FácilCRM. O lead nunca "some" — ele circula na roda até comprar, ser reativado ou pedir explicitamente para sair.

**Princípios:**
- IA cuida do relacionamento; vendedor só age para fechar orçamento ou confirmar agendamento
- Gerente recebe escalações (reclamações, D+72h sem resposta do vendedor)
- Lead sai da roda SOMENTE se: disser que não quer ser cliente (SEM_INTERESSE) ou ficar inativo (SEM_RESPOSTA)
- IA sempre tenta uma última vez antes de marcar SEM_INTERESSE: "não quer hoje mas tem uma data futura?"
- Aniversário é automático: cliente recebe parabéns + vendedor recebe aviso com resumo do cliente

**Fases da Roda:**
1. ENTRADA → IA qualifica e conhece o lead
2. AQUECIMENTO → IA aquece, oferece agendamento/produto/serviço
3. PRONTO_PARA_COMPRAR → vendedor atua para fechar
4. AGENDADO / NEGOCIAÇÃO → vendedor confirma
5. VENDA_REALIZADA → IA registra e leva para PÓS-VENDA
6. PÓS-VENDA → IA gerencia relacionamento D+7/D+20/D+28/D+45
7. FOLLOW_UP → reativação periódica (D+15, D+30)
8. Se 60 dias sem resposta → reinicia ciclo com modo RELACIONAR recalibrado

**Why:** A maioria das empresas perde o cliente após a primeira venda por falta de relacionamento. A Roda garante que nenhum cliente seja esquecido.
**How to apply:** Toda sugestão de automação deve ser avaliada à luz da Roda — onde o lead está, para onde vai e quem cuida.
