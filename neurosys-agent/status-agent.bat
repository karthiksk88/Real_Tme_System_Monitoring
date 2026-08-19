@echo off
setlocal enabledelayedexpansion
title NeuroSys Telemetry Agent Status

cd /d "%~dp0"

echo ===================================================
echo   NeuroSys Telemetry Agent - Service Status
echo ===================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$Task = Get-ScheduledTask -TaskName 'NeuroSysAgent' -ErrorAction SilentlyContinue; if (-not $Task) { Write-Host 'Service Status: NOT INSTALLED' -ForegroundColor Red; Write-Host 'Startup Type:   N/A' -ForegroundColor Red; exit 0; }; $State = $Task.State; if ($State -eq 'Running') { $StatusStr = 'RUNNING'; $Color = 'Green'; } elseif ($State -eq 'Ready') { $StatusStr = 'STOPPED'; $Color = 'Yellow'; } else { $StatusStr = $State.ToString().ToUpper(); $Color = 'Cyan'; }; Write-Host ('Service Name:  NeuroSys Telemetry Agent (NeuroSysAgent)'); Write-Host ('Status:        ' + $StatusStr) -ForegroundColor $Color; Write-Host ('Startup Type:  AUTOMATIC (On Windows Boot)'); Write-Host ('Task Hidden:   TRUE (Silent Background Process)');"

echo.
echo ===================================================
echo.
pause
