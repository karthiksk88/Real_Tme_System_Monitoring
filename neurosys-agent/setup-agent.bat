@echo off
setlocal enabledelayedexpansion
title NeuroSys Telemetry Agent Setup

:: 1. Check Administrator Privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Requesting Administrative privileges to install Windows Service...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"

echo ===================================================
echo   NeuroSys Telemetry Agent - Service Installer
echo ===================================================
echo.

:: 2. Check Java Runtime Environment (PATH or bundled ./jre)
set "JAVA_EXE="
if exist "jre\bin\java.exe" (
    set "JAVA_EXE=%~dp0jre\bin\java.exe"
    echo [INFO] Using bundled Java runtime: !JAVA_EXE!
) else (
    where java >nul 2>&1
    if !errorlevel! equ 0 (
        for /f "tokens=*" %%i in ('where java') do (
            set "JAVA_EXE=%%i"
            goto :JAVA_FOUND
        )
    )
)

:JAVA_FOUND
if "%JAVA_EXE%"=="" (
    echo [ERROR] Java Runtime Environment (JRE 17+ or JDK 21) was not found!
    echo.
    echo To resolve:
    echo 1. Install Java 17 or JDK 21 on this computer, OR
    echo 2. Place a portable 'jre' folder inside this agent directory.
    echo.
    pause
    exit /b 1
)

:: 3. Create or Verify agent.properties Configuration File
if not exist "agent.properties" (
    echo [INFO] Generating default agent.properties for Railway cloud server...
    (
        echo # NeuroSys Monitoring Agent Production Configuration
        echo server.url=https://zestful-energy-production-5cb8.up.railway.app/api/v1
        echo agent.lab.name=General-Lab
        echo agent.collection.interval.seconds=5
        echo agent.cache.dir=./cache
    ) > agent.properties
)

:: 4. Verify Executable JAR
if not exist "neurosys-agent-1.0.0-SNAPSHOT-exec.jar" (
    if exist "target\neurosys-agent-1.0.0-SNAPSHOT-exec.jar" (
        copy /y "target\neurosys-agent-1.0.0-SNAPSHOT-exec.jar" "neurosys-agent-1.0.0-SNAPSHOT-exec.jar" >nul
    ) else (
        echo [ERROR] Could not locate neurosys-agent-1.0.0-SNAPSHOT-exec.jar!
        echo Please ensure the agent JAR is present in the current directory.
        pause
        exit /b 1
    )
)

:: 5. Install Windows Scheduled Service (Automatic Boot - Silent Hidden Background)
echo Installing NeuroSys Agent as automatic Windows Background Service...

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ScriptDir = '%~dp0'; $JarPath = Join-Path $ScriptDir 'neurosys-agent-1.0.0-SNAPSHOT-exec.jar'; $JavaCmd = '%JAVA_EXE:\=\\%'; $TaskName = 'NeuroSysAgent'; Unregister-ScheduledTask -TaskName $TaskName -Confirm:\$false -ErrorAction SilentlyContinue; $Action = New-ScheduledTaskAction -Execute $JavaCmd -Argument '-jar """' + $JarPath + '"""' -WorkingDirectory $ScriptDir; $Trigger = New-ScheduledTaskTrigger -AtStartup; $Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable -Hidden -RestartCount 5 -RestartInterval (New-TimeSpan -Minutes 1); $Principal = New-ScheduledTaskPrincipal -UserId 'NT AUTHORITY\SYSTEM' -LogonType ServiceAccount -RunLevel Highest; Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal | Out-Null; Start-ScheduledTask -TaskName $TaskName;" >nul 2>&1

:: 6. Output Success Summary
cls
echo.
echo ========================================
echo  NeuroSys Agent Installation Complete
echo ========================================
echo.
echo  Service: NeuroSys Telemetry Agent (NeuroSysAgent)
echo  Status:  RUNNING
echo  Startup: AUTOMATIC
echo  Server:  https://zestful-energy-production-5cb8.up.railway.app/api/v1
echo.
echo  The agent will automatically start
echo  whenever Windows starts.
echo.
echo ========================================
echo.
pause
