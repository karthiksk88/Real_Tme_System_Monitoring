========================================================================
  NeuroSys Predictive Monitoring - Enterprise Agent Installation Guide
========================================================================

The NeuroSys Monitoring Agent runs on target endpoints (laptops/desktops) 
and streams hardware telemetry, system metrics, and installed software 
inventory to the central NeuroSys server.

INSTALLATION INSTRUCTIONS:
-------------------------
1. Extract all files in this ZIP archive to a folder on the target computer.
2. Double-click "setup-agent.bat" (or "start-agent.bat").
3. The agent automatically detects system hardware parameters (CPU, RAM, 
   Disk, OS, Installed Applications) and registers with the server.
4. The computer will immediately appear on the administrator's Computers catalog.

FILES INCLUDED:
--------------
- neurosys-agent-1.0.0-SNAPSHOT-exec.jar : Self-contained Java executable agent
- setup-agent.bat                      : Interactive 1-click installer/launcher
- start-agent.bat                      : Background launcher script
- stop-agent.bat                       : Stop agent daemon
- README.txt                           : Installation instructions

REQUIREMENTS:
------------
- Windows 10/11 (or Linux/macOS with JRE 17+)
- Java Runtime Environment (JRE 17 or JDK 17+)
