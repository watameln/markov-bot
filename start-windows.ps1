param(
    [switch]$Install,
    [switch]$Build
)

$root = Split-Path -Path $MyInvocation.MyCommand.Path -Parent
Set-Location $root

if (-not (Test-Path .env)) {
    Write-Host ".env not found. Copy .env.example to .env and set BOT_TOKEN before starting." -ForegroundColor Red
    exit 1
}

if ($Install -or -not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..."
    npm install
}

if ($Build -or -not (Test-Path "dist")) {
    Write-Host "Building project..."
    npm run build
}

Write-Host "Starting bot..."
npm start
