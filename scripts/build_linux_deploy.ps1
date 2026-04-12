param(
    [string]$OutputRoot = ""
)

$ErrorActionPreference = 'Stop'

function Invoke-RoboCopy {
    param(
        [Parameter(Mandatory = $true)][string]$Source,
        [Parameter(Mandatory = $true)][string]$Target,
        [string[]]$Options = @('/E')
    )
    New-Item -ItemType Directory -Force -Path $Target | Out-Null
    & robocopy $Source $Target @Options | Out-Host
    $code = $LASTEXITCODE
    if ($code -gt 7) {
        throw "robocopy failed: $Source -> $Target (exit=$code)"
    }
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
if (-not $OutputRoot) {
    $OutputRoot = Join-Path $repoRoot 'dist\linux-deploy'
}
$OutputRoot = [System.IO.Path]::GetFullPath($OutputRoot)

if (Test-Path $OutputRoot) {
    Remove-Item -Recurse -Force $OutputRoot
}
New-Item -ItemType Directory -Force -Path $OutputRoot | Out-Null

Invoke-RoboCopy -Source (Join-Path $repoRoot 'portable') -Target (Join-Path $OutputRoot 'portable') -Options @('/E', '/XD', 'toolchain', '__pycache__', '/XF', '*.pyc')
Invoke-RoboCopy -Source (Join-Path $repoRoot 'deploy\linux') -Target (Join-Path $OutputRoot 'deploy\linux') -Options @('/E')
Copy-Item (Join-Path $repoRoot 'run-linux.sh') -Destination (Join-Path $OutputRoot 'run-linux.sh') -Force

$readme = @"
Linux deploy package

Bare metal:
  bash run-linux.sh --lan

Docker:
  cd deploy/linux
  docker compose up -d --build

Open:
  http://<linux-server-ip>:19081/index.html?editor2

Security:
  This service compiles and runs C code. Use only on trusted intranet.
"@
Set-Content -Path (Join-Path $OutputRoot 'START-LINUX.txt') -Value $readme -Encoding UTF8

Write-Host "Linux deploy package ready: $OutputRoot"
