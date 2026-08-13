@echo off
title Stop NeuroSys Agent
echo Stopping any running NeuroSys Agent processes...
taskkill /FI "WINDOWTITLE eq NeuroSys Cloud Monitoring Agent Daemon*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq NeuroSys Agent Daemon Launcher*" /F >nul 2>&1
echo Done.
pause
