# update_n8n_filtrar.ps1 — Atualiza o nó "Filtrar e Extrair" no N8N
# Uso: .\scripts\update_n8n_filtrar.ps1 <token>

param(
    [string]$Token = $env:N8N_TOKEN
)

if (-not $Token) {
    Write-Host "ERRO: informe o token N8N como parametro ou variavel N8N_TOKEN" -ForegroundColor Red
    Write-Host "Uso: .\scripts\update_n8n_filtrar.ps1 <eyJhbGci...>" -ForegroundColor Yellow
    exit 1
}

$WorkflowId = "zsjXvvSqTBnAqK3g"
$NodeName = "Filtrar e Extrair"
$BaseUrl = "https://n8n-n8n.6jgzku.easypanel.host"

Write-Host "Buscando workflow $WorkflowId..." -ForegroundColor Cyan

try {
    $workflow = Invoke-RestMethod -Uri "$BaseUrl/api/v1/workflows/$WorkflowId" `
        -Headers @{"X-N8N-API-KEY" = $Token} `
        -Method GET
} catch {
    Write-Host "ERRO ao buscar workflow: $_" -ForegroundColor Red
    exit 1
}

# Procurar nó "Filtrar e Extrair"
$node = $workflow.nodes | Where-Object { $_.name -eq $NodeName }
if (-not $node) {
    Write-Host "ERRO: nó '$NodeName' não encontrado no workflow!" -ForegroundColor Red
    exit 1
}

Write-Host "Nó encontrado. Lendo código corrigido..." -ForegroundColor Cyan

# Ler novo código
$newCode = Get-Content -Path "..\n8n_patch_filtrar_extrair.js" -Raw
$node.parameters.jsCode = @($newCode)

Write-Host "Enviando atualização para N8N..." -ForegroundColor Cyan

try {
    $result = Invoke-RestMethod -Uri "$BaseUrl/api/v1/workflows/$WorkflowId" `
        -Headers @{"X-N8N-API-KEY" = $Token} `
        -Method PUT `
        -Body ($workflow | ConvertTo-Json -Depth 100) `
        -ContentType "application/json"

    Write-Host "✓ Atualização concluída com sucesso!" -ForegroundColor Green
    Write-Host "Workflow '$($result.name)' (ID: $WorkflowId)" -ForegroundColor Green
    Write-Host "Nó '$NodeName' foi atualizado com o código correto." -ForegroundColor Green
} catch {
    Write-Host "ERRO ao atualizar: $_" -ForegroundColor Red
    exit 1
}
