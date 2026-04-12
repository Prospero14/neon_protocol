# Перенос данных Cursor и npm-cache с C: на E: (junction + кэш npm)
# ЗАПУСК: закройте Cursor IDE полностью (и терминалы с npm), затем PowerShell:
#   Set-ExecutionPolicy -Scope Process Bypass -Force
#   & "e:\.antigravity\neon_protocol\tmp\migrate-cursor-data-to-e.ps1"

param(
  [switch]$DryRun,
  [string]$DestRoot = "E:\.antigravity\cursor-system-data"
)

$ErrorActionPreference = 'Stop'

function Test-CursorRunning {
  return $null -ne (Get-Process -Name 'Cursor' -ErrorAction SilentlyContinue)
}

if (Test-CursorRunning) {
  Write-Host "Закройте Cursor (процесс Cursor.exe) и повторите." -ForegroundColor Red
  exit 1
}

$roamingSrc = Join-Path $env:APPDATA 'Cursor'
$roamingDest = Join-Path $DestRoot 'AppData-Roaming-Cursor'
$npmOld = Join-Path $env:LOCALAPPDATA 'npm-cache'
$npmDest = Join-Path $DestRoot 'npm-cache'

if (-not (Test-Path 'E:\')) {
  Write-Host "Диск E: недоступен." -ForegroundColor Red
  exit 1
}

Write-Host "DestRoot: $DestRoot"
Write-Host "Roaming:  $roamingSrc -> $roamingDest"
Write-Host "npm:      $npmOld -> $npmDest (через npm config + перенос)"
Write-Host ""

if ($DryRun) {
  Write-Host "[DryRun] Без изменений."
  exit 0
}

New-Item -ItemType Directory -Path $DestRoot -Force | Out-Null

# --- 1. AppData\Roaming\Cursor ---
if (Test-Path $roamingSrc) {
  $isJunction = (Get-Item $roamingSrc -Force).Attributes -band [IO.FileAttributes]::ReparsePoint
  if ($isJunction) {
    Write-Host "Roaming\Cursor уже reparse point — пропуск переноса." -ForegroundColor Yellow
  } else {
    New-Item -ItemType Directory -Path (Split-Path $roamingDest -Parent) -Force | Out-Null
    if (Test-Path $roamingDest) {
      throw "Папка назначения уже существует: $roamingDest"
    }
    Write-Host "Перенос Roaming\Cursor (robocopy /MOVE)..."
    & robocopy $roamingSrc $roamingDest /E /MOVE /NFL /NDL /NJH /NJS /NC /NS | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "robocopy failed: $LASTEXITCODE" }
    if (Test-Path $roamingSrc) { Remove-Item $roamingSrc -Recurse -Force }
    Write-Host "Создание junction: $roamingSrc -> $roamingDest"
    cmd /c "mklink /J `"$roamingSrc`" `"$roamingDest`""
    if ($LASTEXITCODE -ne 0) { throw "mklink failed" }
  }
} else {
  Write-Host "Нет папки: $roamingSrc" -ForegroundColor Yellow
}

# --- 2. npm cache ---
if (Test-Path $npmOld) {
  New-Item -ItemType Directory -Path $npmDest -Force | Out-Null
  Write-Host "Перенос npm-cache..."
  & robocopy $npmOld $npmDest /E /MOVE /NFL /NDL /NJH /NJS /NC /NS | Out-Null
  if ($LASTEXITCODE -ge 8) { throw "robocopy npm-cache failed: $LASTEXITCODE" }
  Remove-Item $npmOld -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "npm config set cache..."
& npm config set cache $npmDest
if ($LASTEXITCODE -ne 0) {
  Write-Host "npm не найден в PATH — пропишите вручную: npm config set cache `"$npmDest`"" -ForegroundColor Yellow
} else {
  Write-Host "Кэш npm: $(npm config get cache)"
}

Write-Host "Готово. Освободите место на C: вручную: Очистка диска / %TEMP% при необходимости." -ForegroundColor Green
