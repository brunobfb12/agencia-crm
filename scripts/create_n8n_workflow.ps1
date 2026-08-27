param(
    [string]$ApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NThiY2U4Ny0yYTdkLTQxMDItYjU1Ni0wMWExZjJhYWVkOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiM2JjOWYyNjgtYzE4ZC00MTMxLThhYjUtMTgxNzY4Mjg1NzY3IiwiaWF0IjoxNzgwNTMwNzc3fQ.iiyxm66I0Qd7CEJ7Vzbx-nG9KSuZs5ZBnrOBucKUBqg",
    [string]$N8nUrl = "https://n8n-n8n.6jgzku.easypanel.host"
)

$headers = @{
    "X-N8N-API-KEY" = $ApiKey
    "Content-Type" = "application/json"
}

Write-Host "🚀 CRIANDO WORKFLOW NO N8N" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Etapa 1: Criar workflow vazio
Write-Host "📍 Etapa 1: Criando workflow vazio..." -ForegroundColor Yellow

$workflowPayload = @{
    name = "WhatsApp Agencia - Atendimento IA v2"
    active = $false
    nodes = @()
    connections = @{}
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-WebRequest `
        -Uri "$N8nUrl/api/v1/workflows" `
        -Method Post `
        -Headers $headers `
        -Body $workflowPayload `
        -UseBasicParsing `
        -TimeoutSec 30

    $workflow = $response.Content | ConvertFrom-Json
    $workflowId = $workflow.id

    Write-Host "✅ Workflow criado com sucesso!" -ForegroundColor Green
    Write-Host "   ID: $workflowId" -ForegroundColor Green
    Write-Host ""

} catch {
    Write-Host "❌ Erro ao criar workflow:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Etapa 2: Adicionar nós ao workflow
Write-Host "📍 Etapa 2: Adicionando nós ao workflow..." -ForegroundColor Yellow

# Código para os nós
$filtrarExtrairCode = @'
const body = $input.item.json.body || $input.item.json;
const event = ((body.event || '')).toUpperCase();
const data = body.data || {};
const key = data.key || {};

if (key.fromMe === true) return [];
if ((key.remoteJid || '').includes('@g.us')) return [];
if (!['MESSAGES_UPSERT', 'MESSAGES.UPSERT'].includes(event)) return [];

const instancia = body.instance || body.instanceName || '';
const remoteJid = key.remoteJid || '';
const isLid = remoteJid.includes('@lid');

let telefone = remoteJid.replace(/@[^@]+$/, '');
if (!telefone || !instancia) return [];

if (!isLid && telefone.startsWith('55') && telefone.length === 12) {
  telefone = '55' + telefone.slice(2, 4) + '9' + telefone.slice(4);
}

const msg = data.message || {};
const extText = msg.extendedTextMessage || {};
const imgMsg = msg.imageMessage || {};
const vidMsg = msg.videoMessage || {};
const audioMsg = msg.audioMessage || msg.pttMessage || null;
const docMsg = msg.documentMessage || null;
const callMsg = msg.callMessage || null;

let tipo = 'TEXTO';
let mensagem = msg.conversation || extText.text || imgMsg.caption || vidMsg.caption || null;

if (callMsg) {
  tipo = 'CHAMADA';
  mensagem = '[CHAMADA ' + (callMsg.isVideo ? 'DE VIDEO' : 'DE VOZ') + ']';
}

if (!mensagem) {
  if (callMsg) {
    tipo = 'CHAMADA';
    mensagem = '[CHAMADA ' + (callMsg.isVideo ? 'DE VIDEO' : 'DE VOZ') + ']';
  } else if (audioMsg) {
    tipo = 'AUDIO';
    mensagem = '[AUDIO]';
  } else if (docMsg) {
    tipo = 'DOCUMENTO';
    mensagem = '[DOCUMENTO]';
  } else if (imgMsg.url || imgMsg.directPath) {
    tipo = 'IMAGEM';
    mensagem = '[IMAGEM]';
  } else if (vidMsg.url || vidMsg.directPath) {
    tipo = 'VIDEO';
    mensagem = '[VIDEO]';
  } else {
    return [];
  }
}

return [{ json: {
  instancia,
  telefone,
  telefoneSend: isLid ? null : telefone,
  jid: remoteJid,
  isLid,
  mensagem,
  nomeContato: data.pushName || '',
  messageId: key.id || '',
  tipo
}}];
'@

$detectarOptOutCode = @'
const mensagem = ($input.first().json.mensagem || "").trim().toUpperCase();
const instancia = $input.first().json.instancia || "";
const telefone = $input.first().json.telefone || "";

const PALAVRAS_OPTOUT = ["PARAR","SAIR","STOP","CANCELAR","CANCELAR MENSAGENS","NAO QUERO","NÃO QUERO","NAO QUERO MAIS","NÃO QUERO MAIS","DESCADASTRAR","DESCADASTRE","REMOVER","ME REMOVA","PARE","CHEGA","NUNCA MAIS","BLOQUEAR"];

const ehOptOut = PALAVRAS_OPTOUT.some(palavra => {
  if (mensagem === palavra) return true;
  if (mensagem.startsWith(palavra + " ")) return true;
  return false;
});

if (!ehOptOut) {
  return [{ json: { ...$input.first().json, _optout: false } }];
}

let resultado = { ok: false, motivo: "não chamado" };

try {
  const response = await $http.request({
    method: "POST",
    url: "https://ocrmfacil.com.br/api/webhook/optout",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: "crm2026migra",
      instancia: instancia,
      telefone: telefone,
    }),
  });
  resultado = JSON.parse(response.body);
} catch (e) {
  resultado = { ok: false, motivo: String(e.message) };
}

const nomeCliente = resultado.nome || "cliente";
let mensagemResposta;

if (resultado.ok) {
  mensagemResposta = `Olá ${nomeCliente}! ✅ Seu pedido foi registrado com sucesso.\n\nVocê não receberá mais mensagens automáticas de nossa parte.\n\nCaso mude de ideia, é só nos chamar aqui no WhatsApp. 😊`;
} else if (resultado.motivo === "já estava em opt-out") {
  mensagemResposta = `Olá! Você já estava cadastrado para não receber mensagens automáticas.\n\nNão se preocupe — seu desejo continua registrado. 😊`;
} else {
  mensagemResposta = `Recebemos sua solicitação! Vamos retirar você de nossa lista de mensagens automáticas.\n\nEm caso de dúvida, fale com nossa equipe. 😊`;
}

return [{
  json: {
    ...$input.first().json,
    _optout: true,
    _optout_resultado: resultado,
    _mensagem_resposta: mensagemResposta,
  },
}];
'@

# Preparar payload com nós
$nodesPayload = @{
    nodes = @(
        @{
            id = "webhook"
            name = "Webhook"
            type = "n8n-nodes-base.webhook"
            typeVersion = 1
            position = @(50, 150)
            parameters = @{
                httpMethod = "POST"
                path = "whatsapp-agencia-ia"
                responseMode = "lastNode"
            }
        },
        @{
            id = "filtrar_extrair"
            name = "Filtrar e Extrair"
            type = "n8n-nodes-base.code"
            typeVersion = 1
            position = @(300, 150)
            parameters = @{
                jsCode = $filtrarExtrairCode
                language = "javascript"
            }
        },
        @{
            id = "buscar_crm"
            name = "Buscar Cliente no CRM"
            type = "n8n-nodes-base.httpRequest"
            typeVersion = 4
            position = @(600, 150)
            parameters = @{
                method = "GET"
                url = '={{ $env.NEXT_PUBLIC_API_URL }}/api/crm/conversa?telefone={{ $node["Filtrar e Extrair"].json.telefone }}&instancia={{ $node["Filtrar e Extrair"].json.instancia }}'
                authentication = "none"
            }
        },
        @{
            id = "detectar_optout"
            name = "Detectar Opt-Out"
            type = "n8n-nodes-base.code"
            typeVersion = 1
            position = @(900, 150)
            parameters = @{
                jsCode = $detectarOptOutCode
                language = "javascript"
            }
        },
        @{
            id = "montar_prompt"
            name = "Montar Prompt Claude"
            type = "n8n-nodes-base.code"
            typeVersion = 1
            position = @(1200, 150)
            parameters = @{
                jsCode = "// Nó será preenchido com montar_prompt_claude.js"
                language = "javascript"
            }
        },
        @{
            id = "chamar_claude"
            name = "Chamar Claude API"
            type = "n8n-nodes-base.httpRequest"
            typeVersion = 4
            position = @(1500, 150)
            parameters = @{
                method = "POST"
                url = "https://api.anthropic.com/v1/messages"
                sendBody = $true
                bodyParametersJson = $true
                headers = @{
                    "x-api-key" = '={{ $env.ANTHROPIC_API_KEY }}'
                    "anthropic-version" = "2023-06-01"
                    "content-type" = "application/json"
                }
            }
        },
        @{
            id = "parsear_ia"
            name = "Parsear Resposta IA"
            type = "n8n-nodes-base.code"
            typeVersion = 1
            position = @(1800, 150)
            parameters = @{
                jsCode = "// Nó será preenchido com parsear_resposta_ia.js"
                language = "javascript"
            }
        },
        @{
            id = "salvar_crm"
            name = "Salvar no CRM"
            type = "n8n-nodes-base.httpRequest"
            typeVersion = 4
            position = @(2100, 150)
            parameters = @{
                method = "POST"
                url = '={{ $env.NEXT_PUBLIC_API_URL }}/api/crm/conversa'
                sendBody = $true
                bodyParametersJson = $true
            }
        },
        @{
            id = "enviar_resposta"
            name = "Enviar Resposta ao Cliente"
            type = "n8n-nodes-base.httpRequest"
            typeVersion = 4
            position = @(2400, 150)
            parameters = @{
                method = "POST"
                url = 'http://201.76.43.149:8081/message/sendText/{{ $node["Filtrar e Extrair"].json.instancia }}'
                headers = @{
                    "apikey" = '={{ $env.EVOLUTION_API_KEY }}'
                    "Content-Type" = "application/json"
                }
            }
        }
    )
    connections = @{
        "webhook" = @( @{ node = "filtrar_extrair"; type = "main"; index = 0 } )
        "filtrar_extrair" = @( @{ node = "buscar_crm"; type = "main"; index = 0 } )
        "buscar_crm" = @( @{ node = "detectar_optout"; type = "main"; index = 0 } )
        "detectar_optout" = @( @{ node = "montar_prompt"; type = "main"; index = 0 } )
        "montar_prompt" = @( @{ node = "chamar_claude"; type = "main"; index = 0 } )
        "chamar_claude" = @( @{ node = "parsear_ia"; type = "main"; index = 0 } )
        "parsear_ia" = @( @{ node = "salvar_crm"; type = "main"; index = 0 } )
        "salvar_crm" = @( @{ node = "enviar_resposta"; type = "main"; index = 0 } )
    }
} | ConvertTo-Json -Depth 20

try {
    $updateResponse = Invoke-WebRequest `
        -Uri "$N8nUrl/api/v1/workflows/$workflowId" `
        -Method Put `
        -Headers $headers `
        -Body $nodesPayload `
        -UseBasicParsing `
        -TimeoutSec 30

    Write-Host "✅ Nós adicionados com sucesso!" -ForegroundColor Green
    Write-Host ""

    # Retornar ID
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "✅ WORKFLOW CRIADO COM SUCESSO!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "ID do Workflow: $workflowId" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Yellow
    Write-Host "1. Adicionar código dos nós (montar_prompt_claude.js e parsear_resposta_ia.js)" -ForegroundColor Yellow
    Write-Host "2. Adicionar nós para áudio, imagem e documento" -ForegroundColor Yellow
    Write-Host "3. Configurar variáveis de ambiente no N8N" -ForegroundColor Yellow

    # Salvar ID em arquivo
    $workflowId | Out-File -FilePath "C:\Users\USUARIO\agencia-crm\scripts\.workflow_id" -Force
    Write-Host ""
    Write-Host "ID salvo em: scripts/.workflow_id" -ForegroundColor Green

} catch {
    Write-Host "❌ Erro ao adicionar nós:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
