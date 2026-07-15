$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$usePy = [bool](Get-Command py -ErrorAction SilentlyContinue)
function Run-Python([string[]]$Arguments) {
    if ($usePy) { & py -3 @Arguments }
    else { & python @Arguments }
    if ($LASTEXITCODE -ne 0) { throw "Python command failed: $($Arguments -join ' ')" }
}

Run-Python @("scripts/validate_source.py")
Run-Python @("scripts/build_site.py", "--clean", "--strict")
Run-Python @("scripts/validate_output.py", "dist")

$url = "http://127.0.0.1:8765"
Write-Host "Preview server: $url" -ForegroundColor Cyan
Write-Host "Keep this window open. Press Ctrl+C to stop the server." -ForegroundColor Yellow
Start-Process $url
if ($usePy) { & py -3 -m http.server 8765 --directory dist }
else { & python -m http.server 8765 --directory dist }
