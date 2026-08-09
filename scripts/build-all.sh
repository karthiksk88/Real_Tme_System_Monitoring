#!/bin/bash
set -e

echo "==================================================="
echo "  Building NeuroSys Full-Stack Production Artifacts"
echo "==================================================="

echo "[1/4] Building Spring Boot Backend..."
cd neurosys-backend
mvn clean package -DskipTests
cd ..

echo "[2/4] Building Java OSHI Monitoring Agent..."
cd neurosys-agent
mvn clean package -DskipTests
cd ..

echo "[3/4] Building React Web Dashboard..."
cd neurosys-frontend
npm install
npm run build
cd ..

echo "[4/4] Verifying Python AI Service Dependencies..."
cd neurosys-ai
python3 -m py_compile app/main.py
cd ..

echo "==================================================="
echo "  NeuroSys Build Completed Successfully!"
echo "==================================================="
