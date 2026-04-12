$ErrorActionPreference = 'SilentlyContinue'
$root = Join-Path $env:APPDATA 'Cursor'
Get-ChildItem $root -Directory | ForEach-Object {
  $b = (Get-ChildItem $_.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
  [PSCustomObject]@{ Name = $_.Name; MB = [math]::Round($b / 1MB, 1) }
} | Sort-Object MB -Descending | Format-Table -AutoSize
