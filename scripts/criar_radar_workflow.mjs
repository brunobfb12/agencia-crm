// ═══════════════════════════════════════════════════════════════════
// Cria o workflow "Radar de Mercado — FácilCRM" no N8N
// Roda toda segunda-feira às 8h, busca novidades de 6 fontes,
// resume com Claude e envia no WhatsApp do admin.
//
// Uso:
//   node scripts/criar_radar_workflow.mjs <SEU_NUMERO> <N8N_API_KEY>
//   ex: node scripts/criar_radar_workflow.mjs 5562999999999 minha-key
// ═══════════════════════════════════════════════════════════════════

const SEU_NUMERO = process.argv[2];
const N8N_KEY    = process.argv[3];

if (!SEU_NUMERO || !N8N_KEY) {
  console.error("Uso: node criar_radar_workflow.mjs <numero> <n8n_api_key>");
  process.exit(1);
}

const N8N_URL = "https://n8n-n8n.6jgzku.easypanel.host";
const EVO_URL = "http://201.76.43.149:8080";
const INSTANCIA = "o_crm_facil";

// ── Fontes RSS do radar ────────────────────────────────────────────
const FONTES = [
  { nome: "AI News",           url: "https://www.artificialintelligence-news.com/feed/",                          tema: "IA / Claude / LLMs" },
  { nome: "Meta Developers",   url: "https://engineering.fb.com/feed/",                                           tema: "Meta / WhatsApp" },
  { nome: "The Verge AI",      url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",          tema: "IA Geral" },
  { nome: "TechCrunch AI",     url: "https://techcrunch.com/category/artificial-intelligence/feed/",              tema: "IA Geral" },
  { nome: "Canaltech",         url: "https://canaltech.com.br/rss/",                                              tema: "Tech Brasil" },
  { nome: "LGPD News",         url: "https://news.google.com/rss/search?q=LGPD+ANPD+privacidade&hl=pt-BR&gl=BR&ceid=BR:pt-419", tema: "LGPD / Regulação" },
];

// ── Posições dos nodes no canvas ──────────────────────────────────
const POS = {
  trigger:  [0,    0],
  fontes:   [260,  0],   // será calculado por linha
  merge:    [920,  0],
  code:     [1140, 0],
  claude:   [1360, 0],
  formato:  [1580, 0],
  enviar:   [1800, 0],
};

// ── Nodes HTTP para cada fonte RSS ────────────────────────────────
function rssNode(fonte, idx) {
  return {
    id: `rss_${idx}`,
    name: `RSS ${fonte.nome}`,
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.2,
    position: [260, idx * 120 - (FONTES.length * 60) / 2],
    parameters: {
      method: "GET",
      url: fonte.url,
      options: { timeout: 10000, response: { response: { responseFormat: "text" } } },
    },
  };
}

// ── Workflow completo ─────────────────────────────────────────────
const workflow = {
  name: "Radar de Mercado — FácilCRM",
  nodes: [
    // 1. Trigger semanal — segunda-feira 8h
    {
      id: "trigger",
      name: "Toda Segunda 8h",
      type: "n8n-nodes-base.scheduleTrigger",
      typeVersion: 1.2,
      position: POS.trigger,
      parameters: {
        rule: {
          interval: [{ field: "weeks", triggerAtDay: [1], triggerAtHour: 8, triggerAtMinute: 0 }],
        },
      },
    },

    // 2. Buscar cada RSS em paralelo
    ...FONTES.map(rssNode),

    // 3. Merge de todos os RSS
    {
      id: "merge",
      name: "Unir Resultados",
      type: "n8n-nodes-base.merge",
      typeVersion: 3,
      position: POS.merge,
      parameters: { mode: "append" },
    },

    // 4. Code: parsear XML + filtrar últimos 7 dias + montar prompt
    {
      id: "code_parse",
      name: "Parsear e Filtrar",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: POS.code,
      parameters: {
        language: "javaScript",
        jsCode: `
const fontes = ${JSON.stringify(FONTES)};
const items = $input.all();
const seteDias = Date.now() - 7 * 86400000;
const artigos = [];

items.forEach((item, idx) => {
  const fonte = fontes[idx % fontes.length];
  const xml = item.json?.data || "";

  // Extrai itens do RSS com regex simples
  const matches = [...xml.matchAll(/<item[^>]*>([\\s\\S]*?)<\\/item>/gi)];

  matches.slice(0, 3).forEach(m => {
    const get = (tag) => {
      const r = m[1].match(new RegExp('<' + tag + '[^>]*>([\\\\s\\\\S]*?)<\\\\/' + tag + '>', 'i'));
      return r ? r[1].replace(/<[^>]+>/g, '').replace(/<!\\[CDATA\\[|\\]\\]>/g, '').trim() : '';
    };

    const titulo = get('title');
    const link   = get('link') || get('guid');
    const data   = get('pubDate') || get('published') || get('dc:date');
    const desc   = get('description') || get('summary') || get('content:encoded');

    if (!titulo) return;

    const ts = data ? new Date(data).getTime() : Date.now();
    if (ts < seteDias) return; // ignora mais antigos que 7 dias

    artigos.push({
      fonte: fonte.nome,
      tema: fonte.tema,
      titulo: titulo.slice(0, 120),
      desc: desc.slice(0, 300),
      link: link.slice(0, 200),
    });
  });
});

if (!artigos.length) {
  // Sem novidades esta semana
  return [{ json: { semNovidades: true, prompt: '' } }];
}

const lista = artigos.map((a, i) =>
  \`[\${i+1}] [\${a.fonte} — \${a.tema}]\\nTítulo: \${a.titulo}\\nResumo: \${a.desc}\`
).join('\\n\\n');

const prompt = \`Você é um analista de mercado especializado em SaaS, IA e CRM para PMEs no Brasil.

Abaixo estão as novidades da semana de várias fontes de tecnologia e regulação. Filtre APENAS as que são relevantes para um produto como o FácilCRM (CRM com IA para WhatsApp, atendimento automático, campanhas de disparo, PMEs brasileiras, LGPD, WhatsApp Business API, modelos de IA como Claude).

Ignore notícias genéricas de tech que não impactam esse tipo de produto.

Para cada item relevante, escreva em português brasileiro de forma direta e prática. Finalize com 1-2 recomendações de ação concreta.

NOVIDADES DA SEMANA:
\${lista}

Formato da resposta:
🗞️ *RADAR SEMANAL — FácilCRM*
Data: \${new Date().toLocaleDateString('pt-BR')}

[Para cada item relevante:]
📌 *[Fonte]* — Título curto
Impacto: o que isso significa para o FácilCRM (1 frase)

[Se nada relevante:]
✅ Semana tranquila — nenhuma mudança crítica detectada.

---
🎯 *Ação recomendada:*
[1-2 bullets com o que fazer/monitorar]
\`;

return [{ json: { semNovidades: false, prompt, totalArtigos: artigos.length } }];
`,
      },
    },

    // 5. Claude API — resume e filtra o que importa
    {
      id: "claude_api",
      name: "Claude Analisa",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: POS.claude,
      parameters: {
        method: "POST",
        url: "https://api.anthropic.com/v1/messages",
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: "x-api-key",         value: "={{ $env.ANTHROPIC_API_KEY }}" },
            { name: "anthropic-version",  value: "2023-06-01" },
            { name: "content-type",       value: "application/json" },
          ],
        },
        sendBody: true,
        specifyBody: "json",
        jsonBody: `={
  "model": "claude-haiku-4-5-20251001",
  "max_tokens": 1024,
  "messages": [{ "role": "user", "content": {{ JSON.stringify($json.prompt) }} }]
}`,
        options: { timeout: 30000 },
      },
    },

    // 6. Code: formata texto final para WhatsApp
    {
      id: "code_formato",
      name: "Formatar WhatsApp",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: POS.formato,
      parameters: {
        language: "javaScript",
        jsCode: `
const parseItem = $input.first().json;

// Se veio do merge/code anterior com semNovidades=true, pega de lá
// Se veio do Claude, pega o texto da resposta
let texto;

if (parseItem.semNovidades) {
  texto = "🗞️ *RADAR SEMANAL — FácilCRM*\\n\\n✅ Semana tranquila — nenhuma novidade relevante detectada nas fontes monitoradas.";
} else if (parseItem.content) {
  // Resposta direta do Claude
  texto = parseItem.content?.[0]?.text || "Erro ao processar radar.";
} else {
  texto = "Erro ao gerar radar semanal.";
}

return [{ json: { texto } }];
`,
      },
    },

    // 7. Enviar via Evolution API
    {
      id: "enviar_wpp",
      name: "Enviar no WhatsApp",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: POS.enviar,
      parameters: {
        method: "POST",
        url: `${EVO_URL}/message/sendText/${INSTANCIA}`,
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: "apikey",       value: "={{ $env.AUTHENTICATION_API_KEY }}" },
            { name: "content-type", value: "application/json" },
          ],
        },
        sendBody: true,
        specifyBody: "json",
        jsonBody: `={
  "number": "${SEU_NUMERO}",
  "text": {{ JSON.stringify($json.texto) }}
}`,
        options: { timeout: 10000 },
      },
    },
  ],

  settings: {
    executionOrder: "v1",
    saveManualExecutions: true,
    callerPolicy: "workflowsFromSameOwner",
  },

  connections: {
    "Toda Segunda 8h": {
      main: [FONTES.map((_, i) => ({ node: `RSS ${FONTES[i].nome}`, type: "main", index: 0 }))],
    },
    ...Object.fromEntries(
      FONTES.map((f, i) => [
        `RSS ${f.nome}`,
        { main: [[{ node: "Unir Resultados", type: "main", index: i }]] },
      ])
    ),
    "Unir Resultados":   { main: [[{ node: "Parsear e Filtrar",  type: "main", index: 0 }]] },
    "Parsear e Filtrar": { main: [[{ node: "Claude Analisa",     type: "main", index: 0 }]] },
    "Claude Analisa":    { main: [[{ node: "Formatar WhatsApp",  type: "main", index: 0 }]] },
    "Formatar WhatsApp": { main: [[{ node: "Enviar no WhatsApp", type: "main", index: 0 }]] },
  },
};

// ── Criar no N8N ──────────────────────────────────────────────────
console.log("Criando workflow no N8N...");

const res = await fetch(`${N8N_URL}/api/v1/workflows`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-N8N-API-KEY": N8N_KEY,
  },
  body: JSON.stringify(workflow),
});

const data = await res.json();

if (!res.ok) {
  console.error("Erro:", JSON.stringify(data, null, 2));
  process.exit(1);
}

console.log("✅ Workflow criado!");
console.log("   ID:", data.id);
console.log("   Nome:", data.name);
console.log("   Status:", data.active ? "Ativo" : "Inativo");
console.log("");
console.log("   Fontes monitoradas:");
FONTES.forEach(f => console.log(`   • ${f.nome} (${f.tema})`));
console.log("");
console.log(`   Envia para: +${SEU_NUMERO} via instância ${INSTANCIA}`);
console.log("   Frequência: toda segunda-feira às 8h");
console.log("");
console.log("⚠️  Lembre de criar a instância o_crm_facil antes do primeiro disparo!");
