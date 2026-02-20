# Deployment Guide

## Daycare Management System

**Version**: 2.0.0
**Last Updated**: February 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Method 1: TrueNAS Core VM (Current Production)](#2-method-1-truenas-core-vm-current-production)
3. [Method 2: Docker](#3-method-2-docker)
4. [Updating the Application](#4-updating-the-application)
5. [Backup Strategy](#5-backup-strategy)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Overview

The application is currently deployed on a **TrueNAS Core VM** running Ubuntu Server 24.04. This is the recommended method. Docker deployment is available as an alternative.

### Requirements

| Requirement | Minimum |
|-------------|---------|
| OS | Ubuntu Server 24.04+ (or any Linux with Node.js 20) |
| RAM | 1 GB (2 GB recommended) |
| Disk | 5 GB |
| Network | Static IP on local network |
| Node.js | v20.x |
| Git | For pulling updates |

---

## 2. Method 1: TrueNAS Core VM (Current Production)

### 2.1 Current Setup

| Item | Value |
|------|-------|
| TrueNAS Host | TrueNAS Core |
| VM OS | Ubuntu Server 24.04 LTS (minimized) |
| VM IP | 10.0.0.70 (static) |
| Gateway | 10.0.0.1 |
| Interface | igc1 (bridged) |
| DNS | 8.8.8.8, 8.8.4.4 |
| VM User | ikhan |
| App Path | /home/ikhan/daycare |
| App URL | http://10.0.0.70:3001 |

### 2.2 Creating the VM on TrueNAS Core

1. **TrueNAS Web UI** → Virtual Machines → Add
2. **VM Settings**:
   - Name: `daycare`
   - Type: Linux
   - Boot: UEFI
   - CPUs: 1 (or 2 for better performance)
   - RAM: 2048 MB
   - Autostart: **Yes**
3. **Disk**: Create a 10 GB zvol
4. **Network**: Select `igc1` (or your LAN interface)
5. **CDROM**: Attach Ubuntu Server 24.04 ISO
   - Set boot order: CDROM=1000, Disk=1001

### 2.3 Installing Ubuntu Server

1. Start VM and connect via VNC
2. Install Ubuntu Server (minimized)
3. Configure network with static IP:
   ```yaml
   # /etc/netplan/50-cloud-init.yaml
   network:
     version: 2
     ethernets:
       enp0s4:
         addresses: [10.0.0.70/24]
         gateway4: 10.0.0.1
         nameservers:
           addresses: [8.8.8.8, 8.8.4.4]
   ```
   Apply: `sudo netplan apply`
4. Enable SSH during installation (or install later: `sudo apt install openssh-server`)
5. After install, remove the CDROM device from VM settings

### 2.4 Installing the Application

SSH into the VM:
```bash
ssh ikhan@10.0.0.70
```

Install Node.js 20:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Install Git:
```bash
sudo apt install -y git
```

Clone the repository:
```bash
cd ~
git clone https://github.com/ikhan7548/DMS.git daycare
cd daycare
```

Install dependencies:
```bash
cd server && npm install && cd ..
cd client && npm install && cd ..
```

Build the frontend:
```bash
cd client && npx vite build && cd ..
```

Run database migrations and seed:
```bash
cd server
npx tsx src/db/migrate.ts
npx tsx src/db/seed.ts
cd ..
```

Test the app:
```bash
npx tsx server/src/index.ts
```

Access at http://10.0.0.70:3001. Login: `admin` / `1234`.

### 2.5 Setting Up the Systemd Service

Create the service file:
```bash
sudo nano /etc/systemd/system/daycare.service
```

Paste:
```ini
[Unit]
Description=Daycare Management System
After=network.target

[Service]
Type=simple
User=ikhan
WorkingDirectory=/home/ikhan/daycare
ExecStart=/usr/bin/npx tsx server/src/index.ts
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable daycare
sudo systemctl start daycare
```

Verify:
```bash
sudo systemctl status daycare
```

### 2.6 Auto-Start Chain

When the system boots:
1. **TrueNAS Core** boots and starts storage
2. **VM** auto-starts (configured in VM settings)
3. **systemd** starts `daycare.service`
4. **App** is accessible at http://10.0.0.70:3001

---

## 3. Method 2: Docker

### 3.1 Docker Compose

The project includes `Dockerfile` and `docker-compose.yml` for containerized deployment.

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### 3.2 Configuration

Edit `.env` based on `.env.example`:

```env
PORT=3001
SESSION_SECRET=your-random-secret-here
DATA_DIR=/app/data
CLIENT_URL=http://localhost:3001
NODE_ENV=production
```

### 3.3 Data Persistence

The `docker-compose.yml` maps `./data` to `/app/data` inside the container. This stores:
- SQLite database (`daycare.db`)
- Backup files

---

## 4. Updating the Application

### 4.1 Quick Update Command (VM)

```bash
cd ~/daycare && git pull && cd client && npx vite build && cd .. && sudo systemctl restart daycare
```

### 4.2 Step-by-Step Update

1. **SSH into VM**:
   ```bash
   ssh ikhan@10.0.0.70
   ```

2. **Pull latest code**:
   ```bash
   cd ~/daycare
   git pull
   ```

3. **Install any new dependencies** (if package.json changed):
   ```bash
   cd server && npm install && cd ..
   cd client && npm install && cd ..
   ```

4. **Rebuild frontend**:
   ```bash
   cd client && npx vite build && cd ..
   ```

5. **Run migrations** (if schema changed):
   ```bash
   npx tsx server/src/db/migrate.ts
   ```

6. **Restart service**:
   ```bash
   sudo systemctl restart daycare
   ```

7. **Verify**:
   ```bash
   sudo systemctl status daycare
   ```

### 4.3 Docker Update

```bash
docker-compose pull
docker-compose up -d --build
```

---

## 5. Backup Strategy

### 5.1 In-App Backups

The application has built-in backup features at **Settings > Backup**:
- **Data Backup**: Copies the SQLite database file
- **Full Backup**: Creates a zip archive of database + app data
- **Auto-Backup**: Configurable scheduled backups (hourly, every 6 hours, every 12 hours, daily)

### 5.2 Manual Database Backup (VM)

```bash
cp /home/ikhan/daycare/data/daycare.db /home/ikhan/daycare/backups/daycare-$(date +%Y%m%d).db
```

### 5.3 TrueNAS Snapshots

Configure TrueNAS to take periodic snapshots of the zvol used by the VM. This provides filesystem-level recovery.

---

## 6. Troubleshooting

### App Not Starting

Check service status and logs:
```bash
sudo systemctl status daycare
sudo journalctl -u daycare -f
```

Common causes:
- Node.js not found: Check `which node` and `which npx`
- Port already in use: `sudo lsof -i :3001`
- Database file missing: Run `npx tsx server/src/db/migrate.ts`

### Cannot Access from Other Devices

1. Check VM is running (TrueNAS UI → Virtual Machines)
2. Check service is running: `sudo systemctl status daycare`
3. Check IP is correct: `ip addr show`
4. Check firewall: `sudo ufw status` (should be inactive or allow port 3001)
5. Verify from VM itself: `curl http://localhost:3001/api/health`

### VM Network Not Working

1. Check netplan config: `cat /etc/netplan/50-cloud-init.yaml`
2. Apply changes: `sudo netplan apply`
3. Test connectivity: `ping 10.0.0.1` (gateway), `ping 8.8.8.8` (internet)
4. Check bridge interface in TrueNAS VM settings

### Database Issues

```bash
# Check if database exists
ls -la ~/daycare/data/daycare.db

# Re-run migrations (safe — uses CREATE TABLE IF NOT EXISTS)
cd ~/daycare && npx tsx server/src/db/migrate.ts

# Re-seed data (WARNING: adds duplicate data if run multiple times)
cd ~/daycare && npx tsx server/src/db/seed.ts
```

### Service Won't Start After Reboot

```bash
# Check if service is enabled
sudo systemctl is-enabled daycare

# If not, enable it
sudo systemctl enable daycare

# Start it
sudo systemctl start daycare
```

### Useful Commands

| Command | Purpose |
|---------|---------|
| `sudo systemctl status daycare` | Check app status |
| `sudo systemctl restart daycare` | Restart app |
| `sudo journalctl -u daycare -f` | View live logs |
| `sudo journalctl -u daycare --since "1 hour ago"` | Recent logs |
| `ip addr show` | Check VM IP address |
| `df -h` | Check disk space |
| `free -m` | Check memory usage |
| `curl http://localhost:3001/api/health` | Test API locally |
