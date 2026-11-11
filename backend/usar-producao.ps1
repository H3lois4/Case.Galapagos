# Aponta ESTE terminal para o banco de PRODUÇÃO (Supabase), lendo .env.producao.
#
# Uso (o ponto e o espaço no começo são obrigatórios, para valer neste terminal):
#   . .\usar-producao.ps1           -> passa a usar a produção
#   . .\usar-producao.ps1 -Sair     -> volta para o banco local (SQLite)
#
# Fechar o terminal também volta para o local. Sem isso, o Django usa o SQLite.

param([switch]$Sair)

if ($Sair) {
    Remove-Item Env:\DATABASE_URL -ErrorAction SilentlyContinue
    Write-Host "OK: este terminal voltou para o banco LOCAL (SQLite)." -ForegroundColor Green
    return
}

$arquivo = Join-Path $PSScriptRoot ".env.producao"
if (-not (Test-Path $arquivo)) {
    Write-Host "Arquivo .env.producao nao encontrado em backend/." -ForegroundColor Red
    return
}

$linha = Get-Content $arquivo -Encoding UTF8 |
    Where-Object { $_ -match '^\s*DATABASE_URL\s*=' } |
    Select-Object -First 1
$valor = ($linha -replace '^\s*DATABASE_URL\s*=', '').Trim().Trim('"').Trim("'")

if (-not $valor) {
    Write-Host "DATABASE_URL vazia em .env.producao." -ForegroundColor Red
    return
}

$env:DATABASE_URL = $valor
$host_ = ([regex]::Match($valor, '@([^:/]+)')).Groups[1].Value
Write-Host "ATENCAO: este terminal agora usa o banco de PRODUCAO ($host_)." -ForegroundColor Yellow
Write-Host "Para voltar ao local: . .\usar-producao.ps1 -Sair" -ForegroundColor Yellow
