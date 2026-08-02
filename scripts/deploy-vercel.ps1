# Alpha Freight — Vercel production deploy
# Run: Right-click → Run with PowerShell (or from terminal)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

# Ensure Git is on PATH
$gitPath = "C:\Program Files\Git\cmd"
if (Test-Path $gitPath) {
  $env:Path = "$gitPath;$env:Path"
}

Write-Host "`n=== Alpha Freight — Vercel Deploy ===" -ForegroundColor Cyan
Write-Host "Project: alpha-freight-platform`n"

# Build first
Write-Host "Building Next.js app..." -ForegroundColor Yellow
Set-Location "alpha-freight-modern"
npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Host "Build failed. Fix errors and retry." -ForegroundColor Red
  exit 1
}

Set-Location ..

# Token: create at https://vercel.com/account/tokens (avoids browser login)
if (-not $env:VERCEL_TOKEN) {
  $saved = Join-Path $env:USERPROFILE ".vercel-alpha-freight-token"
  if (Test-Path $saved) {
    $env:VERCEL_TOKEN = (Get-Content $saved -Raw).Trim()
  }
}

if (-not $env:VERCEL_TOKEN) {
  Write-Host "Vercel login needs browser — or use a token:" -ForegroundColor Yellow
  Write-Host "  1. Open https://vercel.com/account/tokens" -ForegroundColor White
  Write-Host "  2. Create token, then run:" -ForegroundColor White
  Write-Host '     $env:VERCEL_TOKEN = "your-token"; npx vercel deploy --prod --yes' -ForegroundColor Gray
  Write-Host "`nTrying interactive login..." -ForegroundColor Yellow
  npx vercel login
}

# Deploy to Vercel production
Write-Host "`nDeploying to Vercel production..." -ForegroundColor Yellow
if ($env:VERCEL_TOKEN) {
  npx vercel deploy --prod --yes --token $env:VERCEL_TOKEN
} else {
  npx vercel deploy --prod --yes
}

if ($LASTEXITCODE -eq 0) {
  Write-Host "`nDeploy complete! Check: https://www.alphafreightuk.com/ai" -ForegroundColor Green
} else {
  Write-Host "`nDeploy failed. Run: npx vercel login" -ForegroundColor Red
  Write-Host "Then run this script again." -ForegroundColor Red
  exit 1
}
