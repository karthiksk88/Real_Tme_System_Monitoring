# NeuroSys Agent Windows Background Service Uninstaller

$ErrorActionPreference = "Stop"
$TaskName = "NeuroSysTelemetryAgent"

Write-Host "Stopping and removing NeuroSys Telemetry Agent Task..." -ForegroundColor Yellow

Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

Write-Host "✅ NeuroSys Telemetry Agent background service removed successfully." -ForegroundColor Green
