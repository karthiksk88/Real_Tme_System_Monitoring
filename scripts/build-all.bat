@echo off
echo ===================================================
echo   Building NeuroSys Full-Stack Production Artifacts
echo ===================================================

set "JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo [1/4] Building Spring Boot Backend...
cd neurosys-backend
call mvn clean package -DskipTests
cd ..

echo [2/4] Building Java OSHI Monitoring Agent...
cd neurosys-agent
call mvn clean package -DskipTests
cd ..

echo [3/4] Building React Web Dashboard...
cd neurosys-frontend
call npm install
call npm run build
cd ..

echo [4/4] Verifying Python AI Service Dependencies...
cd neurosys-ai
python -m py_compile app/main.py
cd ..

echo ===================================================
echo   NeuroSys Build Completed Successfully!
echo ===================================================
