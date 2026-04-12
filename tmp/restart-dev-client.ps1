$ErrorActionPreference = 'SilentlyContinue'
$conns = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($conns) {
  $conns | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}
Set-Location 'e:\.antigravity\neon_protocol'
npm run dev:client -- --host
