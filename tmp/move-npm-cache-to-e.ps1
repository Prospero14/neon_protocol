$ErrorActionPreference = 'Stop'
$old = Join-Path $env:LOCALAPPDATA 'npm-cache'
$new = 'E:\.antigravity\cursor-system-data\npm-cache'
New-Item -ItemType Directory -Path $new -Force | Out-Null
if (-not (Test-Path $old)) {
  Write-Host "No old npm-cache on C:."
  exit 0
}
Write-Host "Moving npm-cache: $old -> $new"
& robocopy $old $new /E /MOVE /NFL /NDL /NJH /NJS /NC /NS
# robocopy: 0-7 OK
if ($LASTEXITCODE -ge 8) { throw "robocopy failed: $LASTEXITCODE" }
if (Test-Path $old) { Remove-Item $old -Recurse -Force -ErrorAction SilentlyContinue }
Write-Host "Done. npm cache = $(& npm config get cache)"
