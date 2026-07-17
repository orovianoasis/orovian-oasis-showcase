$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$usePy = [bool](Get-Command py -ErrorAction SilentlyContinue)
function Run-Python([string[]]$Arguments) {
    if ($usePy) { & py -3 @Arguments }
    else { & python @Arguments }
    if ($LASTEXITCODE -ne 0) { throw "Python command failed: $($Arguments -join ' ')" }
}

$daeFiles = Get-ChildItem -Path "content/projects" -Recurse -File -Include *.dae,*.DAE -ErrorAction SilentlyContinue
if ($daeFiles) {
    $blender = Get-Command blender -ErrorAction SilentlyContinue
    if (-not $blender) {
        throw "A DAE project is present. Local conversion requires Blender on PATH. GitHub Actions installs Blender automatically, so you may upload and commit instead of building locally."
    }
    Run-Python @("scripts/build_walkthroughs.py", "--strict", "--blender", $blender.Source)
}
else {
    Run-Python @("scripts/build_walkthroughs.py", "--strict")
}

Run-Python @("scripts/validate_source.py")
Run-Python @("scripts/build_site.py", "--clean", "--strict")
Run-Python @("scripts/validate_output.py", "dist")

Write-Host "Built successfully into dist/." -ForegroundColor Green
Pause
