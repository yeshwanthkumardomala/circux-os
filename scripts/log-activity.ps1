param(
  [string]$Action = "manual-check",
  [string]$Status = "done",
  [string]$Notes = ""
)

$root = Split-Path -Parent $PSScriptRoot
$log = Join-Path $root "logs\activity.csv"
$timestamp = (Get-Date).ToString("o")
$safeNotes = $Notes.Replace('"', '""')
Add-Content -LiteralPath $log -Value "$timestamp,$Action,$Status,`"$safeNotes`""
Write-Output "Logged: $timestamp $Action ($Status)"
