# generate_manifest.ps1
param(
  [string]$Root = "$(Join-Path $PSScriptRoot 'images')"
)
$ErrorActionPreference = "Stop"
if (-not (Test-Path $Root)) {
  Write-Error "Images folder not found: $Root"
}

$exts = @('.jpg','.jpeg','.png','.webp','.gif')
$maps = [ordered]@{}

Get-ChildItem -Path $Root -Directory | Sort-Object Name | ForEach-Object {
  $mapName = $_.Name
  $files = Get-ChildItem -Path $_.FullName -File | Where-Object {
    $exts -contains $_.Extension.ToLower()
  } | Sort-Object Name | Select-Object -ExpandProperty Name
  if ($files.Count -gt 0) {
    $maps[$mapName] = $files
  }
}

$data = [ordered]@{ maps = $maps }
$dest = Join-Path $Root 'manifest.json'
$data | ConvertTo-Json -Depth 10 | Out-File -FilePath $dest -Encoding UTF8
Write-Host "Wrote $dest"
