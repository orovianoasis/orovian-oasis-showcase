$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)
$slug = Read-Host "Project slug (lowercase, numbers, hyphens)"
Write-Host "1 = Concept Home`n2 = Transformation`n3 = Property"
$choice = Read-Host "Project type"
$type = switch ($choice) { "1" {"concept-home"} "2" {"transformation"} "3" {"property"} default {throw "Choose 1, 2, or 3."} }
$title = Read-Host "Public project title"
$python = Get-Command py -ErrorAction SilentlyContinue
if ($python) { py -3 scripts/new_project.py $slug $type --title $title }
else { python scripts/new_project.py $slug $type --title $title }
Write-Host "`nProject created. Open content/projects/$slug/project.toml" -ForegroundColor Green
Pause
