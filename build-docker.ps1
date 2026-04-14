# ============================================
# Build Docker - Gestao Contas
# ============================================

Write-Host ""
Write-Host "📦 Build Docker - Gestao Contas" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Variáveis
$imageTag = Read-Host "Digite a tag da imagem (padrao: latest)"
if ([string]::IsNullOrWhitespace($imageTag)) {
    $imageTag = "latest"
}

Write-Host ""
Write-Host "🔨 Buildando imagem genérica angelomoreirafilho/gestao-contas:$imageTag ..." -ForegroundColor Yellow
Write-Host "(A injeção das variáveis NEXT_PUBLIC_ ocorrerá via entrypoint.sh no runtime pelo docker-compose)"

docker build `
  -t angelomoreirafilho/gestao-contas:$imageTag `
  .

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Build concluido com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Para fazer push no Docker Hub:" -ForegroundColor Cyan
    Write-Host "   docker push angelomoreirafilho/gestao-contas:$imageTag" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Build falhou!" -ForegroundColor Red
}
