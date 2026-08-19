@echo off
setlocal
cd /d "%~dp0"

net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo Uninstalling NeuroSys Telemetry Agent service...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Stop-ScheduledTask -TaskName 'NeuroSysAgent' -ErrorAction SilentlyContinue; Unregister-ScheduledTask -TaskName 'NeuroSysAgent' -Confirm:\$false -ErrorAction SilentlyContinue" >nul 2>&1
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Process -Name java -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*neurosys-agent*' } | Stop-Process -Force -ErrorAction SilentlyContinue" >nul 2>&1

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
