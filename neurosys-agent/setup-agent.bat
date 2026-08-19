@echo off
setlocal
cd /d "%~dp0"

:: 1. Check Administrator Privileges & Elevate if Needed
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Requesting Administrative privileges to install NeuroSys Agent...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

:: 2. Execute PowerShell Installer Script
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-service.ps1"
if %errorlevel% neq 0 (
    echo.
    echo [FATAL ERROR] Agent setup failed with error code %errorlevel%.
    echo.
    pause
    exit /b %errorlevel%
)

pause
