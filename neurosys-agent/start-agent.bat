@echo off
title NeuroSys Agent Daemon Launcher
echo Starting NeuroSys Monitoring Agent Daemon...

set "JAR_NAME=neurosys-agent-1.0.0-SNAPSHOT-exec.jar"
if exist "%~dp0%JAR_NAME%" (
    start /min java -jar "%~dp0%JAR_NAME%"
) else if exist "%~dp0target\%JAR_NAME%" (
    start /min java -jar "%~dp0target\%JAR_NAME%"
) else (
    echo [ERROR] %JAR_NAME% not found.
    pause
    exit /b 1
)

echo NeuroSys Agent started in background.
