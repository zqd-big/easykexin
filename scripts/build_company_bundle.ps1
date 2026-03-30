param(
    [string]$OutputRoot = "",
    [string]$PythonSource = "",
    [string]$MinGWSource = ""
)

$ErrorActionPreference = 'Stop'

function Resolve-DefaultPythonSource {
    $candidates = @()
    try {
        $py312 = (& py -3.12 -c "import sys; print(sys.executable)" 2>$null).Trim()
        if ($py312) { $candidates += (Split-Path -Parent $py312) }
    } catch {}
    try {
        $py3 = (& py -3 -c "import sys; print(sys.executable)" 2>$null).Trim()
        if ($py3) { $candidates += (Split-Path -Parent $py3) }
    } catch {}
    $candidates += @(
        "$env:LOCALAPPDATA\Programs\Python\Python312",
        "$env:LOCALAPPDATA\Programs\Python\Python311",
        "$env:LOCALAPPDATA\Programs\Python\Python310"
    )
    foreach ($candidate in $candidates | Select-Object -Unique) {
        if ($candidate -and (Test-Path (Join-Path $candidate 'python.exe'))) {
            return (Resolve-Path $candidate).Path
        }
    }
    throw 'Portable Python source not found. Set -PythonSource explicitly.'
}

function Resolve-DefaultMinGWSource {
    $candidates = @(
        'D:\BaiduNetdiskDownload\mingw64',
        'C:\msys64\mingw64',
        'D:\msys64\mingw64',
        'C:\mingw64',
        'D:\mingw64'
    )
    foreach ($candidate in $candidates) {
        if (Test-Path (Join-Path $candidate 'bin\gcc.exe')) {
            return (Resolve-Path $candidate).Path
        }
    }
    throw 'Portable MinGW source not found. Set -MinGWSource explicitly.'
}

function Invoke-RoboCopy {
    param(
        [Parameter(Mandatory = $true)][string]$Source,
        [Parameter(Mandatory = $true)][string]$Target,
        [string[]]$Options = @('/E')
    )

    New-Item -ItemType Directory -Force -Path $Target | Out-Null
    & robocopy $Source $Target @Options
    $code = $LASTEXITCODE
    if ($code -gt 7) {
        throw "robocopy failed: $Source -> $Target (exit=$code)"
    }
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$portableSource = Join-Path $repoRoot 'portable'

if (-not $OutputRoot) {
    $OutputRoot = Join-Path $repoRoot 'dist\company-portable'
}
if (-not $PythonSource) {
    $PythonSource = Resolve-DefaultPythonSource
}
if (-not $MinGWSource) {
    $MinGWSource = Resolve-DefaultMinGWSource
}

$OutputRoot = [System.IO.Path]::GetFullPath($OutputRoot)
$bundlePortable = Join-Path $OutputRoot 'portable'
$pythonTarget = Join-Path $bundlePortable 'toolchain\python'
$mingwTarget = Join-Path $bundlePortable 'toolchain\mingw64'

Write-Host "Repo root: $repoRoot"
Write-Host "Output:    $OutputRoot"
Write-Host "Python:    $PythonSource"
Write-Host "MinGW:     $MinGWSource"

if (Test-Path $OutputRoot) {
    Remove-Item -Recurse -Force $OutputRoot
}
New-Item -ItemType Directory -Force -Path $OutputRoot | Out-Null
New-Item -ItemType Directory -Force -Path $bundlePortable | Out-Null

Invoke-RoboCopy -Source $portableSource -Target $bundlePortable -Options @('/E', '/XD', 'toolchain', '__pycache__', '/XF', '*.pyc')
Copy-Item (Join-Path $repoRoot 'run.bat') -Destination (Join-Path $OutputRoot 'run.bat') -Force
Copy-Item (Join-Path $repoRoot 'START-HERE.txt') -Destination (Join-Path $OutputRoot 'START-HERE.txt') -Force

Invoke-RoboCopy -Source $PythonSource -Target $pythonTarget -Options @('/E', '/XD', '__pycache__', 'Doc', '/XF', '*.pyc')
Invoke-RoboCopy -Source $MinGWSource -Target $mingwTarget -Options @('/E', '/XD', 'tmp', '__pycache__', '/XF', '*.pyc')

$info = @"
Micro Drills company bundle
Built at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Python source: $PythonSource
MinGW source: $MinGWSource
Launch: run.bat
"@
Set-Content -Path (Join-Path $OutputRoot 'BUNDLE-INFO.txt') -Value $info -Encoding UTF8

Write-Host "Bundle ready: $OutputRoot"
