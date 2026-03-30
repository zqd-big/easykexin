@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

set "MODE=%~1"
if not defined MODE set "MODE=auto"
set "APP_URL=http://127.0.0.1:19081/index.html?editor2"
set "FILE_URL=%cd%\index.html"

if /I "%MODE%"=="lite" goto :start_file_mode

call :find_python
call :find_tool gcc GCC_EXE
call :find_tool gdb GDB_EXE

if not defined PYTHON_EXE (
  echo [Micro Drills] Python not found. Falling back to offline mode.
  echo [Micro Drills] Practice works. Judge and debug are unavailable.
  goto :start_file_mode
)

echo [Micro Drills] Python: %PYTHON_EXE%
if defined GCC_EXE (
  echo [Micro Drills] gcc: %GCC_EXE%
) else (
  echo [Micro Drills] gcc not found. Judge/debug will be limited.
)
if defined GDB_EXE (
  echo [Micro Drills] gdb: %GDB_EXE%
) else (
  echo [Micro Drills] gdb not found. Step debugging will be unavailable.
)

call :kill_server_port 19081

set "MICRO_DRILLS_NO_BROWSER=1"
if defined GCC_EXE set "MICRO_DRILLS_GCC=%GCC_EXE%"
if defined GDB_EXE set "MICRO_DRILLS_GDB=%GDB_EXE%"

start "Micro Drills Server" /min "%PYTHON_EXE%" "%cd%\debug_server.py"
call :wait_server
if errorlevel 1 (
  echo [Micro Drills] Local server failed. Falling back to offline mode.
  goto :start_file_mode
)

if /I "%MICRO_DRILLS_NO_LAUNCH%"=="1" goto :skip_open_server
start "" "%APP_URL%"
:skip_open_server

echo [Micro Drills] Started: %APP_URL%
if defined GCC_EXE if defined GDB_EXE (
  echo [Micro Drills] Mode: full ^(practice + judge + step debug^)
) else (
  echo [Micro Drills] Mode: web only ^(practice works, judge/debug limited^)
)
endlocal
exit /b 0

:start_file_mode
if /I "%MICRO_DRILLS_NO_LAUNCH%"=="1" goto :skip_open_file
start "" "%FILE_URL%"
:skip_open_file

echo [Micro Drills] Started: %FILE_URL%
echo [Micro Drills] Mode: offline file mode ^(practice only^)
endlocal
exit /b 0

:find_python
set "PYTHON_EXE="
if defined MICRO_DRILLS_PYTHON if exist "%MICRO_DRILLS_PYTHON%" set "PYTHON_EXE=%MICRO_DRILLS_PYTHON%"
if defined PYTHON_EXE exit /b 0
for %%F in (
  "%cd%\toolchain\python\python.exe"
  "%cd%\..\toolchain\python\python.exe"
  "%cd%\python\python.exe"
) do (
  if not defined PYTHON_EXE if exist %%~fF set "PYTHON_EXE=%%~fF"
)
if defined PYTHON_EXE exit /b 0
for /f "delims=" %%P in ('where python 2^>nul') do (
  if not defined PYTHON_EXE set "PYTHON_EXE=%%~fP"
)
if defined PYTHON_EXE exit /b 0
for /f "usebackq delims=" %%P in (`py -3 -c "import sys; print(sys.executable)" 2^>nul`) do (
  if not defined PYTHON_EXE set "PYTHON_EXE=%%~fP"
)
exit /b 0

:find_tool
set "%~2="
set "TOOL_NAME=%~1"
set "TOOL_ENV=MICRO_DRILLS_%TOOL_NAME%"
set "TOOL_ENV_VALUE="
call set "TOOL_ENV_VALUE=%%%TOOL_ENV%%%"
if defined TOOL_ENV_VALUE if exist "%TOOL_ENV_VALUE%" set "%~2=%TOOL_ENV_VALUE%"
if defined %~2 exit /b 0
for %%F in (
  "%cd%\toolchain\mingw64\bin\%~1.exe"
  "%cd%\..\toolchain\mingw64\bin\%~1.exe"
  "%cd%\toolchain\bin\%~1.exe"
  "%cd%\..\toolchain\bin\%~1.exe"
  "C:\mingw64\bin\%~1.exe"
  "D:\mingw64\bin\%~1.exe"
  "C:\msys64\mingw64\bin\%~1.exe"
  "D:\msys64\mingw64\bin\%~1.exe"
  "C:\msys64\ucrt64\bin\%~1.exe"
  "D:\msys64\ucrt64\bin\%~1.exe"
  "D:\BaiduNetdiskDownload\mingw64\bin\%~1.exe"
) do (
  if not defined %~2 if exist %%~fF set "%~2=%%~fF"
)
if defined %~2 exit /b 0
for /f "delims=" %%P in ('where %~1 2^>nul') do (
  if not defined %~2 set "%~2=%%~fP"
)
exit /b 0

:kill_server_port
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%~1 .* LISTENING"') do (
  taskkill /PID %%P /F >nul 2>nul
)
ping -n 2 127.0.0.1 >nul
exit /b 0

:wait_server
for /L %%I in (1,1,12) do (
  powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:19081/api/debug/capabilities' -TimeoutSec 1; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>nul
  if not errorlevel 1 exit /b 0
  ping -n 2 127.0.0.1 >nul
)
exit /b 1
