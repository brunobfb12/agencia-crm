/**
 * Cria os workflows de Agendamentos e Aniversários no N8N via API.
 * Uso: node scripts/criar_workflows_n8n.mjs <N8N_API_KEY>
 */

const N8N_BASE = "https://n8n-n8n.6jgzku.easypanel.host";
const CRM_BASE = "https://ocrmfacil.com.br";
const EVO_BASE = "http://201.76.43.149:8081";

const N8N_KEY = process.argv[2];
if (!N8N_KEY) { console.error("Uso: node criar_workflows_n8n.mjs <N8N_API_KEY>"); process.exit(1); }

const headers = { "Content-Type": "application/json", "X-N8N-API-KEY": N8N_KEY };

// ─── Workflow 1: Cron Diário — Lembretes de Agendamentos ───────────────────
const wfLembretes = {
  name: "CRM - Lembretes Diários (Agendamentos)",
  nodes: [
    {
      id: "trigger",
      name: "Cron 8h",
      type: "n8n-nodes-base.scheduleTrigger",
      typeVersion: 1.1,
      position: [0, 0],
      parameters: {
        rule: { interval: [{ field: "cronExpression", expression: "0 8 * * *" }] }
      }
    },
    {
      id: "buscarAgendamentos",
      name: "Buscar Agendamentos Hoje",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [240, 0],
      parameters: {
        method: "GET",
        url: `${CRM_BASE}/api/agendamentos?status=PENDENTE&dataHoje=true`,
        options: {}
      }
    },
    {
      id: "temAgendamentos",
      name: "Tem Agendamentos?",
      type: "n8n-nodes-base.if",
      typeVersion: 2,
      position: [480, 0],
      parameters: {
        conditions: {
          options: { caseSensitive: true, leftValue: "", typeValidation: "loose" },
          conditions: [{ leftValue: "={{ $json.length }}", rightValue: 0, operator: { type: "number", operation: "gt" } }],
          combinator: "and"
        }
      }
    },
    {
      id: "loopAgendamentos",
      name: "Para cada Agendamento",
      type: "n8n-nodes-base.splitInBatches",
      typeVersion: 3,
      position: [720, -100],
      parameters: { batchSize: 1, options: {} }
    },
    {
      id: "montarMsg",
      name: "Montar Mensagem",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [960, -100],
      parameters: {
        jsCode: `
const a = $input.item.json;
const nome = a.cliente?.nome ?? a.cliente?.telefone ?? "Cliente";
const empresa = a.cliente?.empresa?.nome ?? "";
const instancia = a.cliente?.empresa?.instanciaWhatsapp ?? "";
const hora = a.hora ? \` às \${a.hora}\` : "";

const mensagens = {
  FOLLOW_UP:   \`Olá, \${nome}! 👋 Passando para saber se posso te ajudar com algo. Quando tiver um minutinho, me chama!\`,
  POS_VENDA:   \`Olá, \${nome}! 🤝 Como está sendo a sua experiência com a gente? Estamos aqui se precisar de algo!\`,
  REATIVACAO:  \`Olá, \${nome}! Faz um tempo que não nos falamos. Temos novidades que podem te interessar — quer conferir?\`,
  CONSULTA:    \`Olá, \${nome}! 📅 Lembramos que você tem uma consulta hoje\${hora}. Até logo!\`,
  ANIVERSARIO: \`Feliz aniversário, \${nome}! 🎂 Toda a equipe da \${empresa} deseja um dia especial para você! 🎉\`,
  TAREFA:      null,
};

const texto = a.notas
  ? \`Olá, \${nome}! \${a.notas}\`
  : (mensagens[a.tipo] ?? \`Olá, \${nome}! Temos um agendamento para hoje.\`);

return [{ json: { ...a, mensagem: texto, instancia, telefone: a.cliente?.telefone } }];
        `
      }
    },
    {
      id: "ehTarefa",
      name: "É Tarefa Interna?",
      type: "n8n-nodes-base.if",
      typeVersion: 2,
      position: [1200, -100],
      parameters: {
        conditions: {
          options: { caseSensitive: true, leftValue: "", typeValidation: "loose" },
          conditions: [{ leftValue: "={{ $json.tipo }}", rightValue: "TAREFA", operator: { type: "string", operation: "equals" } }],
          combinator: "and"
        }
      }
    },
    {
      id: "enviarWhatsApp",
      name: "Enviar WhatsApp",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [1440, -200],
      parameters: {
        method: "POST",
        url: `=${EVO_BASE}/message/sendText/{{ $json.instancia }}`,
        sendBody: true,
        contentType: "json",
        body: {
          mode: "raw",
          rawValue: `={{ JSON.stringify({ number: $json.telefone, textMessage: { text: $json.mensagem } }) }}`
        },
        options: {}
      }
    },
  ],
  connections: {
    "Cron 8h":                    { main: [[{ node: "Buscar Agendamentos Hoje", type: "main", index: 0 }]] },
    "Buscar Agendamentos Hoje":   { main: [[{ node: "Tem Agendamentos?",       type: "main", index: 0 }]] },
    "Tem Agendamentos?":          { main: [[{ node: "Para cada Agendamento",   type: "main", index: 0 }], []] },
    "Para cada Agendamento":      { main: [[{ node: "Montar Mensagem",         type: "main", index: 0 }]] },
    "Montar Mensagem":            { main: [[{ node: "É Tarefa Interna?",       type: "main", index: 0 }]] },
    "É Tarefa Interna?":          { main: [[], [{ node: "Enviar WhatsApp",     type: "main", index: 0 }]] },
    "Enviar WhatsApp":            { main: [[{ node: "Para cada Agendamento",   type: "main", index: 0 }]] },
  },
  settings: { executionOrder: "v1" },
  active: false,
};

// ─── Workflow 2: Cron Diário — Aniversários ────────────────────────────────
const wfAniversarios = {
  name: "CRM - Aniversários do Dia",
  nodes: [
    {
      id: "trigger",
      name: "Cron 8h30",
      type: "n8n-nodes-base.scheduleTrigger",
      typeVersion: 1.1,
      position: [0, 0],
      parameters: {
        rule: { interval: [{ field: "cronExpression", expression: "30 8 * * *" }] }
      }
    },
    {
      id: "buscarAniversariantes",
      name: "Buscar Aniversariantes",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [240, 0],
      parameters: {
        method: "GET",
        url: `${CRM_BASE}/api/clientes?aniversarioHoje=true`,
        options: {}
      }
    },
    {
      id: "temAniversariantes",
      name: "Tem Aniversariantes?",
      type: "n8n-nodes-base.if",
      typeVersion: 2,
      position: [480, 0],
      parameters: {
        conditions: {
          options: { caseSensitive: true, leftValue: "", typeValidation: "loose" },
          conditions: [{ leftValue: "={{ $json.length }}", rightValue: 0, operator: { type: "number", operation: "gt" } }],
          combinator: "and"
        }
      }
    },
    {
      id: "loop",
      name: "Para cada Aniversariante",
      type: "n8n-nodes-base.splitInBatches",
      typeVersion: 3,
      position: [720, -100],
      parameters: { batchSize: 1, options: {} }
    },
    {
      id: "enviarParabens",
      name: "Enviar Parabéns",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [960, -100],
      parameters: {
        method: "POST",
        url: `=${EVO_BASE}/message/sendText/{{ $json.instanciaWhatsapp }}`,
        sendBody: true,
        contentType: "json",
        body: {
          mode: "raw",
          rawValue: `={{ JSON.stringify({ number: $json.telefone, textMessage: { text: "Feliz aniversário, " + ($json.nome ?? "querido cliente") + "! 🎂🎉 Toda a equipe da " + $json.empresaNome + " deseja a você um dia incrível e cheio de alegrias! 🥳" } }) }}`
        },
        options: {}
      }
    },
  ],
  connections: {
    "Cron 8h30":               { main: [[{ node: "Buscar Aniversariantes",    type: "main", index: 0 }]] },
    "Buscar Aniversariantes":  { main: [[{ node: "Tem Aniversariantes?",      type: "main", index: 0 }]] },
    "Tem Aniversariantes?":    { main: [[{ node: "Para cada Aniversariante",  type: "main", index: 0 }], []] },
    "Para cada Aniversariante":{ main: [[{ node: "Enviar Parabéns",           type: "main", index: 0 }]] },
    "Enviar Parabéns":         { main: [[{ node: "Para cada Aniversariante",  type: "main", index: 0 }]] },
  },
  settings: { executionOrder: "v1" },
  active: false,
};

// ─── Workflow 3: Google Calendar Sync ─────────────────────────────────────
const wfCalendar = {
  name: "CRM - Google Calendar Sync (Consultas)",
  nodes: [
    {
      id: "trigger",
      name: "Cron a cada 10min",
      type: "n8n-nodes-base.scheduleTrigger",
      typeVersion: 1.1,
      position: [0, 0],
      parameters: {
        rule: { interval: [{ field: "cronExpression", expression: "*/10 * * * *" }] }
      }
    },
    {
      id: "buscarConsultas",
      name: "Buscar Consultas sem Google Event",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [240, 0],
      parameters: {
        method: "GET",
        url: `${CRM_BASE}/api/agendamentos?status=PENDENTE&tipo=CONSULTA`,
        options: {}
      }
    },
    {
      id: "filtrarSemSync",
      name: "Filtrar sem GoogleEventId",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [480, 0],
      parameters: {
        jsCode: `
const itens = $input.all();
const semSync = itens.filter(i =>
  !i.json.googleEventId &&
  i.json.cliente?.empresa?.googleCalendarId
);
return semSync;
        `
      }
    },
    {
      id: "temConsultas",
      name: "Tem Consultas para Sincronizar?",
      type: "n8n-nodes-base.if",
      typeVersion: 2,
      position: [720, 0],
      parameters: {
        conditions: {
          options: { caseSensitive: true, leftValue: "", typeValidation: "loose" },
          conditions: [{ leftValue: "={{ $input.all().length }}", rightValue: 0, operator: { type: "number", operation: "gt" } }],
          combinator: "and"
        }
      }
    },
    {
      id: "loop",
      name: "Para cada Consulta",
      type: "n8n-nodes-base.splitInBatches",
      typeVersion: 3,
      position: [960, -100],
      parameters: { batchSize: 1, options: {} }
    },
    {
      id: "criarEvento",
      name: "Criar Evento Google Calendar",
      type: "n8n-nodes-base.googleCalendar",
      typeVersion: 1.1,
      position: [1200, -100],
      parameters: {
        operation: "create",
        calendar: { __rl: true, value: "={{ $json.cliente.empresa.googleCalendarId }}", mode: "id" },
        start: "={{ $json.dataAgendada.split('T')[0] + ($json.hora ? 'T' + $json.hora + ':00' : 'T09:00:00') }}",
        end: "={{ $json.dataAgendada.split('T')[0] + ($json.hora ? 'T' + String(parseInt($json.hora.split(':')[0]) + 1).padStart(2,'0') + ':' + $json.hora.split(':')[1] + ':00' : 'T10:00:00') }}",
        summary: "={{ ($json.cliente.nome ?? $json.cliente.telefone) + ' — ' + ($json.notas ?? 'Consulta') }}",
        additionalFields: {
          description: `={{ "Cliente: " + ($json.cliente.nome ?? "") + "\\nTelefone: " + $json.cliente.telefone + "\\nEmpresa: " + $json.cliente.empresa.nome }}`,
        }
      }
    },
    {
      id: "salvarEventId",
      name: "Salvar Google Event ID no CRM",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [1440, -100],
      parameters: {
        method: "PATCH",
        url: `=${CRM_BASE}/api/agendamentos/{{ $('Para cada Consulta').item.json.id }}`,
        sendBody: true,
        contentType: "json",
        body: {
          mode: "raw",
          rawValue: `={{ JSON.stringify({ googleEventId: $json.id }) }}`
        },
        options: {}
      }
    },
  ],
  connections: {
    "Cron a cada 10min":                 { main: [[{ node: "Buscar Consultas sem Google Event", type: "main", index: 0 }]] },
    "Buscar Consultas sem Google Event": { main: [[{ node: "Filtrar sem GoogleEventId",          type: "main", index: 0 }]] },
    "Filtrar sem GoogleEventId":         { main: [[{ node: "Tem Consultas para Sincronizar?",    type: "main", index: 0 }]] },
    "Tem Consultas para Sincronizar?":   { main: [[{ node: "Para cada Consulta",                 type: "main", index: 0 }], []] },
    "Para cada Consulta":                { main: [[{ node: "Criar Evento Google Calendar",        type: "main", index: 0 }]] },
    "Criar Evento Google Calendar":      { main: [[{ node: "Salvar Google Event ID no CRM",      type: "main", index: 0 }]] },
    "Salvar Google Event ID no CRM":     { main: [[{ node: "Para cada Consulta",                 type: "main", index: 0 }]] },
  },
  settings: { executionOrder: "v1" },
  active: false,
};

// ─── Deploy ────────────────────────────────────────────────────────────────
async function criar(workflow) {
  const res = await fetch(`${N8N_BASE}/api/v1/workflows`, {
    method: "POST",
    headers,
    body: JSON.stringify(workflow),
  });
  const data = await res.json();
  if (res.ok) {
    console.log(`✅ Criado: "${workflow.name}" — ID: ${data.id}`);
  } else {
    console.error(`❌ Erro em "${workflow.name}":`, JSON.stringify(data));
  }
}

console.log("Criando workflows no N8N...\n");
await criar(wfLembretes);
await criar(wfAniversarios);
await criar(wfCalendar);
console.log("\nPronto! Ative os workflows em https://n8n-n8n.6jgzku.easypanel.host");
