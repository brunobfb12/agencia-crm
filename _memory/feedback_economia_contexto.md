---
name: Economia de Contexto e Uso de Subagentes
description: Padrão obrigatório para preservar contexto — subagentes para tarefas pesadas, respostas curtas
type: feedback
originSessionId: cd0631a0-6d87-456e-8dc6-cb25c20d93e9
---
Usar subagentes (Agent tool) por padrão para tarefas que envolvem múltiplos arquivos grandes ou reescritas extensas. O contexto principal deve ficar leve.

**Why:** Sessões longas com muitos arquivos lidos/escritos esgotam o contexto e travam o trabalho por horas ou dias. O usuário não quer se preocupar com isso.

**How to apply:**
- Sempre que a tarefa envolver reescrita de 2+ arquivos grandes → delegar para subagente (Agent tool)
- Usar Explore/subagente para leitura exploratória em vez de Read direto no contexto principal
- Usar Grep/Glob antes de Read — só ler o arquivo se necessário
- Respostas curtas e diretas: sem sumários de final de turno, sem eco de código já escrito, sem confirmações longas
- Quando o usuário pedir escopo grande de uma vez → executar tudo em agente paralelo
- Nunca narrar o processo em detalhes — só reportar resultado
