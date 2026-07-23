@echo off
REM ============================================================
REM Force-rebuild PATH from registry (use PowerShell to get
REM REG_EXPAND_SZ values fully expanded). Keep at top.
REM ============================================================
for /f "tokens=* delims=" %%i in ('powershell -NoProfile -Command "Write-Output (([Environment]::GetEnvironmentVariable('Path','User')) + ';' + ([Environment]::GetEnvironmentVariable('Path','Machine')))"') do set "PATH=%%i"

setlocal EnableExtensions

title Claude Code + MiniMax

echo ======================================
echo   Claude Code + MiniMax
echo ======================================
echo.

REM Get the directory where this bat file lives
set "WORK_DIR=%~dp0"
if "%WORK_DIR:~-1%"=="\" set "WORK_DIR=%WORK_DIR:~0,-1%"

echo [INFO] Working directory: %WORK_DIR%
echo.

REM Check Windows Terminal
where wt >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Windows Terminal not found
    pause
    exit /b 1
) else (
    echo [OK] Windows Terminal installed
)

REM Check Claude
where claude >nul 2>&1
if errorlevel 1 (
    echo [ERROR] claude not in PATH
    echo        Install: npm install -g @anthropic-ai/claude-code
    pause
    exit /b 1
) else (
    echo [OK] claude found
)

REM MiniMax config is in %USERPROFILE%\.claude\settings.json
echo [OK] MiniMax settings loaded from global settings.json
echo.

echo [START] Launching Claude Code in new Windows Terminal...
echo.

REM Launch Claude Code directly (no happy wrapper)
REM MiniMax API is configured in global settings.json
start "Claude Code + MiniMax" wt.exe new-tab -d "%WORK_DIR%" claude

echo Done. Claude Code should be starting in a new window.
echo.
pause
endlocal
