@echo off
title NeuroSys-Agent Interactive Setup Wizard
color 0A
echo ===================================================
echo   NeuroSys Windows Monitoring Agent Setup Wizard
echo ===================================================
echo.
echo Detecting system hardware specifications via OSHI...
echo.

set /p SERVER_URL="Enter Central NeuroSys Server URL [Default: http://localhost:8080]: "
if "%SERVER_URL%"=="" set SERVER_URL=http://localhost:8080

set /p LAB_NAME="Enter Computer Lab / Department Name [Default: Computer Lab A]: "
if "%LAB_NAME%"=="" set LAB_NAME=Computer Lab A

echo.
echo Configuration summary:
echo Server URL : %SERVER_URL%
echo Lab Name   : %LAB_NAME%
echo.
echo Starting NeuroSys Monitoring Agent Daemon...
echo ===================================================

powershell -Command "$env:NEUROSYS_SERVER_URL='%SERVER_URL%'; $env:NEUROSYS_LAB_NAME='%LAB_NAME%'; & 'C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot\bin\java.exe' -jar target\neurosys-agent-1.0.0-SNAPSHOT-exec.jar"

pause
