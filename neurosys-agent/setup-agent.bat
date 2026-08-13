@echo off
title NeuroSys Monitoring Agent - Setup & Launch
echo =========================================================
echo   NeuroSys Predictive Monitoring - Agent Quick Setup
echo =========================================================
echo.

set "JAR_NAME=neurosys-agent-1.0.0-SNAPSHOT-exec.jar"
set "JAR_PATH=%~dp0%JAR_NAME%"
set "TARGET_JAR=%~dp0target\%JAR_NAME%"

if exist "%JAR_PATH%" (
    set "RUN_JAR=%JAR_PATH%"
) else if exist "%TARGET_JAR%" (
    set "RUN_JAR=%TARGET_JAR%"
) else (
    echo [!] Executable JAR not found in current folder. Building via Maven...
    cd /d "%~dp0"
    mvn clean package -DskipTests
    set "RUN_JAR=%TARGET_JAR%"
)

echo [*] Starting NeuroSys Monitoring Agent...
echo [*] Server Target: configured in agent.properties
echo.
java -jar "%RUN_JAR%"

pause
