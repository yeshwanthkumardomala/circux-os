param([int]$IntervalSeconds = 900)

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
Write-Output "Circux auto-push watcher started. First push will happen after $IntervalSeconds seconds."

while ($true) {
  Start-Sleep -Seconds $IntervalSeconds
  $changes = git -C $root status --porcelain
  if (-not $changes) {
    Write-Output "$(Get-Date -Format o): no changes"
    continue
  }
  git -C $root add .
  $stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss K"
  git -C $root -c user.name="Circux OS" -c user.email="local@circux.invalid" commit -m "Auto-save $stamp"
  git -C $root push origin main
  Write-Output "$(Get-Date -Format o): committed and pushed"
}
