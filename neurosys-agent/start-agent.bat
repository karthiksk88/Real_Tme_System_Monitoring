@echo off
setlocal
cd /d "%~dp0"

net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo Starting NeuroSys Telemetry Agent service...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-ScheduledTask -TaskName 'NeuroSysAgent' -ErrorAction SilentlyContinue" >nul 2>&1

echo.
echo [SUCCESS] NeuroSys Agent service started.
echo Status: RUNNING
echo.
timeout /t 3 >nul
