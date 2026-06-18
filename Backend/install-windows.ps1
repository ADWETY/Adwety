$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "Checking Node.js..." -ForegroundColor Cyan
$nodeRaw = (& node -v).Trim()
if (-not $nodeRaw) {
  throw "Node.js is not installed or not available in PATH."
}

$nodeVersion = [version]($nodeRaw.TrimStart('v').Split('-')[0])
if ($nodeVersion.Major -lt 20) {
  throw "Node.js 20 or newer is required. Current version: $nodeRaw"
}

Write-Host "Using $nodeRaw" -ForegroundColor Green
Write-Host "Configuring the official npm registry..." -ForegroundColor Cyan
npm config set registry "https://registry.npmjs.org/" --location=project

if (Test-Path "node_modules") {
  Write-Host "Removing old node_modules..." -ForegroundColor Cyan
  Remove-Item -Recurse -Force "node_modules"
}

Write-Host "Verifying npm cache..." -ForegroundColor Cyan
npm cache verify

Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
npm ci --registry="https://registry.npmjs.org/" --no-audit --no-fund

Write-Host "Checking backend source files..." -ForegroundColor Cyan
npm run check

Write-Host "Backend installation and checks completed successfully." -ForegroundColor Green
