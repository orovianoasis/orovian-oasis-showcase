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

Write-Host "Built successfully into dist/." -ForegroundColor Green
Pause
