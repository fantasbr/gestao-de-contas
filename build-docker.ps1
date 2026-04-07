# ============================================
# Build Docker - Gestao Contas
# ============================================

Write-Host ""
Write-Host "📦 Build Docker - Gestao Contas" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Variáveis (Tente ler do .env.local se existir, senão solicita)
$envFile = ".env.local"
$supabaseUrl = ""
$supabaseAnonKey = ""
$appUrl = "http://localhost:3000"

if (Test-Path $envFile) {
    Write-Host "Lendo variaveis do $envFile..." -ForegroundColor Green
    Get-Content $envFile | Where-Object { $_ -match "^NEXT_PUBLIC_SUPABASE_URL=(.*)$" } | ForEach-Object { $supabaseUrl = $matches[1] }
    Get-Content $envFile | Where-Object { $_ -match "^NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)$" } | ForEach-Object { $supabaseAnonKey = $matches[1] }
}

if ([string]::IsNullOrWhitespace($supabaseUrl)) {
    $supabaseUrl = Read-Host "Digite a URL do Supabase (ex: https://xxxx.supabase.co)"
}
if ([string]::IsNullOrWhitespace($supabaseAnonKey)) {
    $supabaseAnonKey = Read-Host "Digite a Anon Key do Supabase"
}

$imageTag = Read-Host "Digite a tag da imagem (padrao: latest)"
if ([string]::IsNullOrWhitespace($imageTag)) {
    $imageTag = "latest"
}

Write-Host ""
Write-Host "🔨 Buildando imagem angelomoreirafilho/gestao-contas:$imageTag ..." -ForegroundColor Yellow

docker build `
  --build-arg NEXT_PUBLIC_SUPABASE_URL=$supabaseUrl `
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$supabaseAnonKey `
  --build-arg NEXT_PUBLIC_APP_URL=$appUrl `
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
