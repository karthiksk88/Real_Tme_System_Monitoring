# NeuroSys Production Deployment Manual

This guide provides step-by-step instructions for deploying **NeuroSys – AI Powered Predictive System Monitoring Platform** to production environments (Ubuntu Linux Server or Windows Server 2022).

---

## 1. System Requirements

- **Processor**: Minimum 4 CPU Cores
- **RAM**: Minimum 8 GB RAM (16 GB Recommended for large computer fleets)
- **Disk**: 50 GB SSD
- **Operating System**: Ubuntu 22.04 LTS / Debian 12 / Windows Server 2022
- **Required Software**: Docker 24+, Docker Compose v2+, Git

---

## 2. Production Environment Setup

### Step 1: Clone Repository & Prepare Directory
```bash
git clone https://github.com/organization/neurosys.git
cd neurosys
```

### Step 2: Configure Production Environment Variables
Create `.env` file from the production template:
```bash
cp .env.example .env
nano .env
```
Ensure you update:
- `MYSQL_ROOT_PASSWORD` (Strong password)
- `MYSQL_PASSWORD` (Strong application password)
- `JWT_SECRET` (Minimum 256-bit cryptographically secure secret)
- `SPRING_MAIL_HOST` & `SPRING_MAIL_PASSWORD` (SMTP provider credentials)

---

## 3. SSL/TLS Certificate Setup (Nginx)

Place your SSL certificates inside `./nginx/ssl/`:
- `./nginx/ssl/fullchain.pem`
- `./nginx/ssl/privkey.pem`

Update `./nginx/conf.d/default.conf` to enable HTTPS port 443 with TLS 1.3:
```nginx
server {
    listen 443 ssl http2;
    server_name monitoring.yourdomain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ...
}
```

---

## 4. Launch Production Stack

Run the production Docker Compose command:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Verify service status:
```bash
docker compose ps
docker compose logs -f neurosys-backend
```

---

## 5. Deploying Java Monitoring Agent (`NeuroSys-Agent`)

### Option A: Running Executable JAR Service
1. Copy `neurosys-agent-1.0.0-exec.jar` and `agent.properties` to target Windows client.
2. Edit `agent.properties`:
   ```properties
   server.url=http://monitoring.yourdomain.com/api
   agent.lab.name=Lab-A
   agent.collection.interval.seconds=5
   ```
3. Run as background service:
   ```cmd
   java -jar neurosys-agent-1.0.0-exec.jar
   ```

### Option B: Installing as Windows Service (NSSM)
```cmd
nssm install NeuroSysAgent "C:\Program Files\Java\jdk-21\bin\java.exe" "-jar C:\NeuroSys\neurosys-agent-1.0.0-exec.jar"
nssm start NeuroSysAgent
```
