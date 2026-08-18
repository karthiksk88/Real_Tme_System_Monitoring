# NeuroSys Agent Silent Windows Background Service Installer
# Installs NeuroSys Telemetry Agent as a silent Windows Scheduled Task that automatically starts on system boot.

param (
    [string]$BackendUrl = "https://zestful-energy-production-5cb8.up.railway.app",
    [string]$LabName = "Lab-Alpha"
)

$ErrorActionPreference = "Stop"

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  NeuroSys Telemetry Agent - Background Installer    " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# 1. Determine Working Directory & Executable JAR Path
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$JarPath = Join-Path $ScriptDir "neurosys-agent-1.0.0-SNAPSHOT-exec.jar"

if (-not (Test-Path $JarPath)) {
    Write-Error "Could not find neurosys-agent-1.0.0-SNAPSHOT-exec.jar in $ScriptDir"
    exit 1
}

# 2. Locate Java Executable
$JavaCmd = Get-Command java -ErrorAction SilentlyContinue
if (-not $JavaCmd) {
    Write-Host "Java runtime environment not found in PATH." -ForegroundColor Red
    Write-Host "Please install Java 17+ or Java 21 JDK." -ForegroundColor Yellow
    exit 1
}
$JavaExe = $JavaCmd.Source

Write-Host "Java Found: $JavaExe" -ForegroundColor Green
Write-Host "Agent Jar:  $JarPath" -ForegroundColor Green
Write-Host "Backend URL: $BackendUrl" -ForegroundColor Green

# 3. Create or Update agent.properties
$PropFile = Join-Path $ScriptDir "agent.properties"
$PropContent = @"
neurosys.backend.url=$BackendUrl
neurosys.agent.lab.name=$LabName
neurosys.agent.collection.interval.seconds=5
"@
Set-Content -Path $PropFile -Value $PropContent -Force
Write-Host "Configured agent.properties successfully." -ForegroundColor Green

# 4. Register Windows Background Task (Runs on System Boot - Hidden Window)
$TaskName = "NeuroSysTelemetryAgent"
$Action = New-ScheduledTaskAction -Execute $JavaExe -Argument "-jar `"$JarPath`"" -WorkingDirectory $ScriptDir
$Trigger = New-ScheduledTaskTrigger -AtStartup
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable -Hidden
$Principal = New-ScheduledTaskPrincipal -UserId "NT AUTHORITY\SYSTEM" -LogonType ServiceAccount -RunLevel Highest

# Unregister existing task if present
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

# Register new scheduled task
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal | Out-Null

Write-Host "`n✅ SUCCESS: NeuroSys Telemetry Agent successfully installed as a Silent Windows Service!" -ForegroundColor Green
Write-Host "• Automatic Boot: The agent will now run silently whenever this computer turns on." -ForegroundColor Yellow
Write-Host "• Zero Window Popups: No command prompt windows will be shown to users." -ForegroundColor Yellow
Write-Host "• Live Telemetry: System performance metrics are being transmitted to NeuroSys platform." -ForegroundColor Yellow

# 5. Start Task Immediately
Start-ScheduledTask -TaskName $TaskName
Write-Host "Agent background process started." -ForegroundColor Green
