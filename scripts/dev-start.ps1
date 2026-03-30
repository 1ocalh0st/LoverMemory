param(
  [switch]$SkipMigrate
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Require-Command {
  param([string]$Name)

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Missing required command: $Name"
  }
}

function Start-DevWindow {
  param(
    [string]$Title,
    [string]$Command
  )

  $escapedRoot = $root.Replace("'", "''")
  $escapedCommand = $Command.Replace("'", "''")
  $psCommand = "Set-Location '$escapedRoot'; `$Host.UI.RawUI.WindowTitle = '$Title'; $escapedCommand"

  Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", $psCommand
  ) | Out-Null
}

Require-Command "docker"
Require-Command "npm"

if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "Created .env from .env.example"
}

$envContent = Get-Content ".env" -Raw
if ($envContent -notmatch "DATABASE_URL=mysql://lovermemory:lovermemory@localhost:3307/lovermemory") {
  Write-Warning ".env DATABASE_URL is not using localhost:3307. Current docker-compose maps MySQL to port 3307."
}

if ($envContent -notmatch "SHADOW_DATABASE_URL=") {
  Add-Content ".env" "`r`nSHADOW_DATABASE_URL=mysql://root:root@localhost:3307/lovermemory_shadow"
  Write-Host "Added SHADOW_DATABASE_URL to .env for Prisma migrate"
}

Write-Host "Starting Docker dependencies..."
docker compose up -d mysql redis minio minio-init
if ($LASTEXITCODE -ne 0) {
  throw "docker compose up failed"
}

Write-Host "Ensuring MySQL databases exist..."
docker compose exec -T mysql mysql -uroot -proot -e "CREATE DATABASE IF NOT EXISTS lovermemory; CREATE DATABASE IF NOT EXISTS lovermemory_shadow;"
if ($LASTEXITCODE -ne 0) {
  throw "failed to create MySQL databases"
}

Write-Host "Generating Prisma client..."
npm run prisma:generate
if ($LASTEXITCODE -ne 0) {
  throw "npm run prisma:generate failed"
}

if (-not $SkipMigrate) {
  Write-Host "Running Prisma migrations..."
  npm run prisma:migrate
  if ($LASTEXITCODE -ne 0) {
    throw "npm run prisma:migrate failed"
  }
}

Write-Host "Opening dev service terminals..."
Start-DevWindow -Title "LoverMemory API" -Command "npm run dev:api"
Start-DevWindow -Title "LoverMemory Prism Studio" -Command "Set-Location apps/api; npx prisma studio"
Start-DevWindow -Title "LoverMemory Web" -Command "npm run dev:web"
Start-DevWindow -Title "LoverMemory Worker" -Command "npm run dev:worker"

Write-Host ""
Write-Host "Local dev environment started."
Write-Host "API:    http://localhost:3000"
Write-Host "Web:    check the Vite terminal for the exact URL"
Write-Host "MinIO:  http://localhost:9001"
Write-Host ""
Write-Host "Use -SkipMigrate if you want to skip Prisma migrate on later runs."
