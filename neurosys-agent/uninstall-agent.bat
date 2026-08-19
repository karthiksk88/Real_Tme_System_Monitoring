@echo off
setlocal enabledelayedexpansion
title Uninstall NeuroSys Telemetry Agent

net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"

echo Uninstalling NeuroSys Telemetry Agent service...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Stop-ScheduledTask -TaskName 'NeuroSysAgent' -ErrorAction SilentlyContinue; Unregister-ScheduledTask -TaskName 'NeuroSysAgent' -Confirm:\$false -ErrorAction SilentlyContinue" >nul 2>&1
wmic process where "commandline like '%%neurosys-agent%%'" call terminate >nul 2>&1

echo.
echo ========================================
echo  NeuroSys Agent Uninstalled
echo ========================================
echo.
echo  Service: NeuroSys Telemetry Agent (NeuroSysAgent)
echo  Status:  REMOVED
echo.
echo ========================================
echo.
pause
