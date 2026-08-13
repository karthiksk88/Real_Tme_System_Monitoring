@echo off
title NeuroSys Cloud Monitoring Agent Daemon
echo =========================================================
echo   Connecting NeuroSys Agent to Railway Cloud Server...
echo =========================================================

set "JAR_FILE=%~dp0neurosys-agent-1.0.0-SNAPSHOT-exec.jar"
set "TARGET_JAR=%~dp0target\neurosys-agent-1.0.0-SNAPSHOT-exec.jar"

if exist "%JAR_FILE%" (
    java -jar "%JAR_FILE%"
) else if exist "%TARGET_JAR%" (
    java -jar "%TARGET_JAR%"
) else (
    echo.
    echo [ERROR] Could not find 'neurosys-agent-1.0.0-SNAPSHOT-exec.jar'!
    echo.
    echo Please make sure 'neurosys-agent-1.0.0-SNAPSHOT-exec.jar' is copied
    echo in the exact same folder as 'Run-NeuroSys-Agent.bat'.
    echo.
)

pause
