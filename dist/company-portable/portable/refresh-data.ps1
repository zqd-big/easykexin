$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$source = Join-Path (Split-Path -Parent $root) "data\\questions.json"
$target = Join-Path $root "questions-data.js"

if (-not (Test-Path $source)) {
    throw "questions.json not found: $source"
}

$json = Get-Content -Raw -Encoding UTF8 $source
$content = "window.QUESTIONS = $json;`n"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($target, $content, $utf8NoBom)

Write-Host "Updated: $target"
