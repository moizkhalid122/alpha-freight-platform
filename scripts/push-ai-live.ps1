# Push latest AI updates to GitHub -> Vercel auto-deploy
$ErrorActionPreference = "Stop"
$git = "C:\Program Files\Git\cmd"
if (Test-Path $git) { $env:Path = "$git;$env:Path" }

$root = Split-Path $PSScriptRoot -Parent
$deploy = Join-Path $root "_deploy-v2"
$src = Join-Path $root "alpha-freight-modern"

Write-Host "`n=== Alpha Freight: Push AI Live ===" -ForegroundColor Cyan

if (-not (Test-Path $deploy)) {
  Write-Host "Downloading GitHub repo (first time, ~5 min)..." -ForegroundColor Yellow
  New-Item -ItemType Directory -Path $deploy -Force | Out-Null
  curl.exe -L "https://github.com/moizkhalid122/alpha-freight-platform/archive/refs/heads/main.zip" -o "$deploy\main.zip"
  Expand-Archive -Path "$deploy\main.zip" -DestinationPath $deploy -Force
  Move-Item "$deploy\alpha-freight-platform-main\*" $deploy -Force
  Remove-Item "$deploy\main.zip", "$deploy\alpha-freight-platform-main" -Recurse -Force -ErrorAction SilentlyContinue
  Set-Location $deploy
  git init
  git checkout -b main
  git remote add origin https://github.com/moizkhalid122/alpha-freight-platform.git
} else {
  Set-Location $deploy
}

Write-Host "Syncing latest AI code..." -ForegroundColor Yellow
robocopy $src "$deploy\alpha-freight-modern" /MIR /XD node_modules .next .git /XF .env.local .env /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
Copy-Item "$root\vercel.json" "$deploy\vercel.json" -Force -ErrorAction SilentlyContinue

git add alpha-freight-modern vercel.json scripts 2>$null
git add -A alpha-freight-modern 2>$null

$status = git status --porcelain
if (-not $status) {
  Write-Host "No changes to push." -ForegroundColor Yellow
  exit 0
}

git commit -m "Add free UK freight AI, SEO topic pages, llms.txt, and growth features"

Write-Host "`nPushing to GitHub (login window may open)..." -ForegroundColor Yellow
git pull origin main --rebase 2>$null
git push -u origin main

if ($LASTEXITCODE -eq 0) {
  Write-Host "`nDone! Vercel will auto-deploy in 2-3 min." -ForegroundColor Green
  Write-Host "Check: https://www.alphafreightuk.com/ai" -ForegroundColor Green
} else {
  Write-Host "`nPush failed. GitHub login required." -ForegroundColor Red
  Write-Host "1. Browser mein GitHub login karo" -ForegroundColor White
  Write-Host "2. Is script ko dubara run karo" -ForegroundColor White
  exit 1
}
