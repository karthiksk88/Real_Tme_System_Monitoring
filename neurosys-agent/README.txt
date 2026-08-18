========================================================================
  NeuroSys Predictive Monitoring - Enterprise Agent Installation Guide
========================================================================

The NeuroSys Telemetry Agent runs on target computers to monitor CPU, 
RAM, Disk usage, and Software Readiness.

RECOMMENDED OPTION (Automatic Boot & Silent Background Tracking):
-----------------------------------------------------------------
To enable silent 24/7 background telemetry that starts automatically 
whenever the computer turns on (without needing to click batch files or 
leaving open terminal windows):

1. Extract this ZIP archive to a folder (e.g. C:\NeuroSysAgent).
2. Right-click "Install-NeuroSys-Service.ps1" -> Select "Run with PowerShell".
3. The agent is now installed as a silent Windows Scheduled Background Service!
   - Starts automatically on Windows boot.
   - Zero terminal popups or open windows.
   - Continuous background telemetry streaming.

UNINSTALLATION:
--------------
To stop and remove the background service:
- Right-click "Uninstall-NeuroSys-Service.ps1" -> Select "Run with PowerShell".

MANUAL LAUNCH OPTION:
---------------------
- Double-click "start-agent.bat" to launch manually.
- Double-click "stop-agent.bat" to stop the agent.

REQUIREMENTS:
------------
- Windows 10/11 or Windows Server (with Java 17+ or JDK 21).
