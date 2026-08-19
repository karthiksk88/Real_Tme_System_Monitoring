@echo off
setlocal enabledelayedexpansion
title Stop NeuroSys Telemetry Agent

net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"

echo Stopping NeuroSys Telemetry Agent service...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Stop-ScheduledTask -TaskName 'NeuroSysAgent' -ErrorAction SilentlyContinue" >nul 2>&1
wmic process where "commandline like '%%neurosys-agent%%'" call terminate >nul 2>&1

echo.
echo [SUCCESS] NeuroSys Agent service stopped.
echo Status: STOPPED
echo.
timeout /t 3 >nul
