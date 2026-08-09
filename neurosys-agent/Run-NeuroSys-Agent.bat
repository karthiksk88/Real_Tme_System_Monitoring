@echo off
title NeuroSys Cloud Monitoring Agent Daemon
echo =========================================================
echo   Connecting NeuroSys Agent to Railway Cloud Server...
echo =========================================================
java -jar target\neurosys-agent-1.0.0-SNAPSHOT-exec.jar
pause
