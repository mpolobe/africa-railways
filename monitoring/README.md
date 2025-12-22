# 🔄 Monitoring & Stability Tools

Tools to keep your Africa Railways environment stable and prevent crashes.

---

## Scripts

### 1. supervisor.sh
**Purpose**: Automatically restart crashed services

**Usage:**
```bash
./monitoring/supervisor.sh
```

**Features:**
- Monitors backend and frontend every 5 seconds
- Automatically restarts crashed services
- Prevents restart loops (max 5 restarts in 60 seconds)
- Logs all restart attempts

**Run in background:**
```bash
nohup ./monitoring/supervisor.sh > logs/supervisor.log 2>&1 &
```

### 2. health-check.sh
**Purpose**: Verify all services are healthy

**Usage:**
```bash
./monitoring/health-check.sh
```

**Checks:**
- Backend API (port 8080)
- Frontend server (port 8082)
- Disk space usage
- Memory usage
- Log file sizes
- Process status

**Exit codes:**
- 0: All healthy
- 1: System unhealthy

### 3. cleanup-logs.sh
**Purpose**: Rotate and compress old logs

**Usage:**
```bash
./monitoring/cleanup-logs.sh
```

**Actions:**
- Rotates logs larger than 10MB
- Compresses old logs with gzip
- Deletes logs older than 7 days
- Shows current log directory size

**Schedule with cron:**
```bash
# Run daily at 2 AM
0 2 * * * cd /workspaces/africa-railways && ./monitoring/cleanup-logs.sh
```

---

## Makefile Commands

### Quick Commands
```bash
# Check system health
make health-check

# Start supervisor
make supervisor

# Clean up logs
make cleanup-logs

# Full monitoring dashboard
make monitor
```

---

## Setup

### 1. Make scripts executable
```bash
chmod +x monitoring/*.sh
```

### 2. Create logs directory
```bash
mkdir -p logs
```

### 3. Start supervisor (optional)
```bash
nohup ./monitoring/supervisor.sh > logs/supervisor.log 2>&1 &
```

---

## Troubleshooting

### Services keep crashing
1. Check logs: `tail -f logs/backend.log`
2. Check health: `make health-check`
3. Review errors in supervisor log: `tail -f logs/supervisor.log`

### Supervisor not restarting services
1. Check if supervisor is running: `ps aux | grep supervisor`
2. Check supervisor log: `cat logs/supervisor.log`
3. Manually restart: `./monitoring/supervisor.sh`

### Disk space issues
1. Run cleanup: `make cleanup-logs`
2. Check disk usage: `df -h`
3. Find large files: `du -sh logs/*`

---

## Best Practices

1. **Run supervisor in production**
   - Ensures services auto-restart on crash
   - Prevents extended downtime

2. **Schedule log cleanup**
   - Prevents disk space issues
   - Keeps logs manageable

3. **Monitor regularly**
   - Run `make health-check` daily
   - Review logs for errors
   - Check resource usage

4. **Set up alerts**
   - Email on service crash
   - Slack notifications
   - SMS for critical issues

---

## Integration with Systemd

Create `/etc/systemd/system/africa-railways-supervisor.service`:

```ini
[Unit]
Description=Africa Railways Service Supervisor
After=network.target

[Service]
Type=simple
User=vscode
WorkingDirectory=/workspaces/africa-railways
ExecStart=/workspaces/africa-railways/monitoring/supervisor.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable africa-railways-supervisor
sudo systemctl start africa-railways-supervisor
```

---

## Monitoring Metrics

### Key Metrics to Track
- Service uptime
- Restart frequency
- Response times
- Error rates
- Resource usage (CPU, memory, disk)
- Log growth rate

### Tools
- `htop` - Process monitoring
- `iotop` - Disk I/O monitoring
- `netstat` - Network connections
- `journalctl` - System logs

---

**Keep your system stable!** 🚀
