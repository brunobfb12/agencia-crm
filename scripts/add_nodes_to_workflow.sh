#!/bin/bash

API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZjg5NmRlNS1jNTQ3LTQ2ZmMtOGUxMC00ODZkOWJhZjRmYzgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMGY5OWViNTItNTExZC00OGQzLTg2NjItODBkNTZiOTE2YWM0IiwiaWF0IjoxNzgwODQ1NjYyfQ.Q25suaqjXq_yzf4J3FJF1kBkN2siaf-rRH1dVN4N4u4"
N8N_URL="https://n8n-n8n.6jgzku.easypanel.host"
WORKFLOW_ID="jbP7ifuGO2SKHAJK"

echo "📍 Adicionando nós ao workflow: $WORKFLOW_ID"
echo ""

# Ler códigos dos nós
FILTRAR_CODE=$(cat /c/Users/USUARIO/agencia-crm/n8n/nodes/filtrar_e_extrair.js | python3 -c "import sys, json; print(json.dumps(sys.stdin.read()))")
OPTOUT_CODE=$(cat /c/Users/USUARIO/agencia-crm/scripts/n8n_optout_node.js | python3 -c "import sys, json; print(json.dumps(sys.stdin.read()))")
MONTAR_CODE=$(cat /c/Users/USUARIO/agencia-crm/n8n/nodes/montar_prompt_claude.js | python3 -c "import sys, json; print(json.dumps(sys.stdin.read()))")
PARSEAR_CODE=$(cat /c/Users/USUARIO/agencia-crm/n8n/nodes/parsear_resposta_ia.js | python3 -c "import sys, json; print(json.dumps(sys.stdin.read()))")
PREP_AUDIO_CODE=$(cat /c/Users/USUARIO/agencia-crm/n8n/nodes/preparar_audio_bin_rio.js | python3 -c "import sys, json; print(json.dumps(sys.stdin.read()))")
PREP_IMG_CODE=$(cat /c/Users/USUARIO/agencia-crm/n8n/nodes/preparar_imagem.js | python3 -c "import sys, json; print(json.dumps(sys.stdin.read()))")
MESCLAR_CODE=$(cat /c/Users/USUARIO/agencia-crm/n8n/nodes/mesclar_transcri_o.js | python3 -c "import sys, json; print(json.dumps(sys.stdin.read()))")

echo "✅ Códigos dos nós lidos com sucesso"

# Construir payload com todos os nós
read -r -d '' NODES_PAYLOAD << 'PAYLOAD'
{
  "nodes": [
    {
      "id": "webhook",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [50, 150],
      "parameters": {
        "httpMethod": "POST",
        "path": "whatsapp-agencia-ia-v2",
        "responseMode": "lastNode"
      }
    },
    {
      "id": "filtrar_extrair",
      "name": "Filtrar e Extrair",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [350, 150],
      "parameters": {
        "jsCode": FILTRAR_CODE
      }
    },
    {
      "id": "buscar_crm",
      "name": "Buscar Cliente no CRM",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [650, 150],
      "parameters": {
        "method": "GET",
        "url": "={{ $env.NEXT_PUBLIC_API_URL }}/api/crm/conversa?telefone={{ $node[\"Filtrar e Extrair\"].json.telefone }}&instancia={{ $node[\"Filtrar e Extrair\"].json.instancia }}"
      }
    },
    {
      "id": "detectar_optout",
      "name": "Detectar Opt-Out",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [950, 150],
      "parameters": {
        "jsCode": OPTOUT_CODE
      }
    },
    {
      "id": "montar_prompt",
      "name": "Montar Prompt Claude",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [1250, 150],
      "parameters": {
        "jsCode": MONTAR_CODE
      }
    },
    {
      "id": "chamar_claude",
      "name": "Chamar Claude API",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [1550, 150],
      "parameters": {
        "method": "POST",
        "url": "https://api.anthropic.com/v1/messages",
        "sendBody": true,
        "bodyParametersJson": true,
        "headers": {
          "x-api-key": "={{ $env.ANTHROPIC_API_KEY }}",
          "anthropic-version": "2023-06-01"
        }
      }
    },
    {
      "id": "parsear_ia",
      "name": "Parsear Resposta IA",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [1850, 150],
      "parameters": {
        "jsCode": PARSEAR_CODE
      }
    },
    {
      "id": "salvar_crm",
      "name": "Salvar no CRM",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [2150, 150],
      "parameters": {
        "method": "POST",
        "url": "={{ $env.NEXT_PUBLIC_API_URL }}/api/crm/conversa",
        "sendBody": true,
        "bodyParametersJson": true
      }
    },
    {
      "id": "enviar_resposta",
      "name": "Enviar Resposta ao Cliente",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [2450, 150],
      "parameters": {
        "method": "POST",
        "url": "http://201.76.43.149:8081/message/sendText/{{ $node[\"Filtrar e Extrair\"].json.instancia }}",
        "sendBody": true,
        "bodyParametersJson": true,
        "headers": {
          "apikey": "={{ $env.EVOLUTION_API_KEY }}"
        }
      }
    },
    {
      "id": "preparar_audio",
      "name": "Preparar Áudio Binário",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [650, 400],
      "parameters": {
        "jsCode": PREP_AUDIO_CODE
      }
    },
    {
      "id": "transcrever_audio",
      "name": "Transcrever Audio (Groq)",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [950, 400],
      "parameters": {
        "method": "POST",
        "url": "https://api.groq.com/openai/v1/audio/transcriptions",
        "sendBody": true,
        "bodyParametersJson": true,
        "headers": {
          "Authorization": "Bearer {{ $env.GROQ_API_KEY }}"
        }
      }
    },
    {
      "id": "mesclar_transcricao",
      "name": "Mesclar Transcrição",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [1250, 400],
      "parameters": {
        "jsCode": MESCLAR_CODE
      }
    },
    {
      "id": "preparar_imagem",
      "name": "Preparar Imagem",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [650, 650],
      "parameters": {
        "jsCode": PREP_IMG_CODE
      }
    },
    {
      "id": "if_tipo_audio",
      "name": "IF - Tipo Audio?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [350, 400],
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $node[\"Filtrar e Extrair\"].json.tipo }}",
              "operation": "equals",
              "value2": "AUDIO"
            }
          ]
        }
      }
    },
    {
      "id": "if_tipo_imagem",
      "name": "IF - Tipo Imagem?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [350, 650],
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $node[\"Filtrar e Extrair\"].json.tipo }}",
              "operation": "equals",
              "value2": "IMAGEM"
            }
          ]
        }
      }
    }
  ],
  "connections": {
    "webhook": [{"node": "filtrar_extrair", "type": "main", "index": 0}],
    "filtrar_extrair": [
      {"node": "buscar_crm", "type": "main", "index": 0},
      {"node": "if_tipo_audio", "type": "main", "index": 0},
      {"node": "if_tipo_imagem", "type": "main", "index": 0}
    ],
    "if_tipo_audio": [{"node": "preparar_audio", "type": "main", "index": 0}],
    "preparar_audio": [{"node": "transcrever_audio", "type": "main", "index": 0}],
    "transcrever_audio": [{"node": "mesclar_transcricao", "type": "main", "index": 0}],
    "mesclar_transcricao": [{"node": "buscar_crm", "type": "main", "index": 0}],
    "if_tipo_imagem": [{"node": "preparar_imagem", "type": "main", "index": 0}],
    "preparar_imagem": [{"node": "buscar_crm", "type": "main", "index": 0}],
    "buscar_crm": [{"node": "detectar_optout", "type": "main", "index": 0}],
    "detectar_optout": [{"node": "montar_prompt", "type": "main", "index": 0}],
    "montar_prompt": [{"node": "chamar_claude", "type": "main", "index": 0}],
    "chamar_claude": [{"node": "parsear_ia", "type": "main", "index": 0}],
    "parsear_ia": [{"node": "salvar_crm", "type": "main", "index": 0}],
    "salvar_crm": [{"node": "enviar_resposta", "type": "main", "index": 0}]
  }
}
PAYLOAD

echo "Payload preparado. Enviando para N8N..."

# Fazer update do workflow com os nós
curl -s -X PUT "$N8N_URL/api/v1/workflows/$WORKFLOW_ID" \
  -H "X-N8N-API-KEY: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "$NODES_PAYLOAD" > /tmp/update_response.json

echo "✅ Nós adicionados com sucesso!"
cat /tmp/update_response.json

echo ""
echo "=========================================="
echo "✨ WORKFLOW CRIADO COM SUCESSO!"
echo "=========================================="
echo "ID: $WORKFLOW_ID"
echo "URL: $N8N_URL/edit/$WORKFLOW_ID"
