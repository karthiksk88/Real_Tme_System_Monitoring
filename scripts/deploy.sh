#!/bin/bash
set -e

echo "==================================================="
echo "  Deploying NeuroSys Monitoring Platform Containers"
echo "==================================================="

if [ ! -f .env ]; then
  echo "No .env file found. Copying from .env.example..."
  cp .env.example .env
fi

echo "Stopping existing containers..."
docker compose down

echo "Building & launching containers in detached mode..."
docker compose up --build -d

echo "Checking running container status..."
docker compose ps

echo "==================================================="
echo "  NeuroSys Platform Deployed Successfully!"
echo "  Dashboard URL: http://localhost"
echo "  API Docs:      http://localhost:8080/swagger-ui.html"
echo "==================================================="
