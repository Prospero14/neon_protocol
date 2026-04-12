$ErrorActionPreference = 'SilentlyContinue'
function Get-FolderSizeMB([string]$Path) {
  if (-not (Test-Path $Path)) { return $null }
  $b = (Get-ChildItem $Path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
  [math]::Round($b / 1MB, 1)
}

$rows = @(
  @{ Name = 'USERPROFILE\.cursor'; Path = (Join-Path $env:USERPROFILE '.cursor') },
  @{ Name = 'APPDATA\Cursor'; Path = (Join-Path $env:APPDATA 'Cursor') },
  @{ Name = 'LOCALAPPDATA\Cursor'; Path = (Join-Path $env:LOCALAPPDATA 'Cursor') },
  @{ Name = 'LOCALAPPDATA\npm-cache'; Path = (Join-Path $env:LOCALAPPDATA 'npm-cache') },
  @{ Name = 'USERPROFILE\.npm'; Path = (Join-Path $env:USERPROFILE '.npm') }
)

foreach ($r in $rows) {
  $mb = Get-FolderSizeMB $r.Path
  if ($null -ne $mb) {
    '{0,-32} {1,10} MB' -f $r.Name, $mb
    '    {0}' -f $r.Path
  }
}

$lc = Join-Path $env:LOCALAPPDATA 'Cursor'
if (Test-Path $lc) {
  $mb = Get-FolderSizeMB $lc
  '{0,-32} {1,10} MB' -f 'LOCALAPPDATA\Cursor', $mb
  '    {0}' -f $lc
}
