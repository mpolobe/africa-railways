# ⚡ Stability Quick Start Guide

Get your stable, crash-resistant environment running in 2 minutes.

---

## 🚀 Quick Setup

### 1. Check System Health
```bash
make health-check
```

### 2. Start Services with Auto-Restart
```bash
# Start supervisor in background
nohup ./monitoring/supervisor.sh > logs/supervisor.log 2>&1 &

# Or use the deployment script
./deploy-sovereign.sh
```

### 3. Verify Everything Works
```bash
make monitor
```

---

## 🔄 What Changed?

### Before (Unstable)
- ❌ Services crash and stay down
- ❌ Logs fill up disk space
- ❌ Build conflicts from test files
- ❌ No monitoring or alerts
- ❌ Manual restarts required

### After (Stable)
- ✅ Services auto-restart on crash
- ✅ Logs automatically rotate
- ✅ Clean build process
- ✅ Health monitoring built-in
- ✅ Zero manual intervention

---

## 📊 New Commands

```bash
# Check if everything is healthy
make health-check

# Start auto-restart supervisor
make supervisor

# Clean up old logs
make cleanup-logs

# Full monitoring dashboard
make monitor

# Deploy with stability features
./deploy-sovereign.sh
```

---

## 🛡️ Crash Prevention

### Automatic Service Recovery
The supervisor monitors your services every 5 seconds:
- Backend crashes → Auto-restart in 2 seconds
- Frontend crashes → Auto-restart in 2 seconds
- Too many crashes → Alert and stop (prevents loops)

### Log Management
Logs are automatically managed:
- Rotate when > 10MB
- Compress old logs
- Delete logs > 7 days old
- Prevents disk space issues

### Resource Monitoring
Health checks track:
- Service availability
- Disk space usage
- Memory usage
- Process status

---

## 📁 File Organization

### Backend Structure (Cleaned)
```
backend/
├── main.go              # Production server
├── reports.go           # Reports API
├── examples/            # Example code (not built)
│   ├── handlers.go
│   ├── onboarding.go
│   ├── messaging_service.go
│   └── provider_analytics.go
└── tests/               # Test files (not built)
    └── test_twilio.go
```

### Monitoring Tools
```
monitoring/
├── supervisor.sh        # Auto-restart crashed services
├── health-check.sh      # Verify system health
├── cleanup-logs.sh      # Rotate and clean logs
└── README.md            # Full documentation
```

---

## 🔍 Troubleshooting

### Service Won't Start
```bash
# Check what's wrong
make health-check

# View logs
tail -f logs/backend.log

# Manual restart
./deploy-sovereign.sh
```

### Disk Space Full
```bash
# Clean up logs
make cleanup-logs

# Check disk usage
df -h

# Find large files
du -sh logs/*
```

### Supervisor Not Working
```bash
# Check if running
ps aux | grep supervisor

# View supervisor logs
tail -f logs/supervisor.log

# Restart supervisor
pkill -f supervisor
nohup ./monitoring/supervisor.sh > logs/supervisor.log 2>&1 &
```

---

## 📈 Monitoring Dashboard

Run this to see everything at once:
```bash
make monitor
```

Output shows:
- ✓ Backend health
- ✓ Frontend health
- ✓ Disk space
- ✓ Memory usage
- ✓ Log sizes
- ✓ Process status
- Recent log entries

---

## 🎯 Best Practices

### Daily
- Run `make health-check` once
- Check `make monitor` for issues

### Weekly
- Run `make cleanup-logs`
- Review supervisor logs
- Check resource usage

### Monthly
- Update dependencies
- Review and optimize
- Backup important data

---

## 🚨 Emergency Recovery

If everything is broken:

```bash
# 1. Kill all processes
pkill -9 git
pkill -9 node
pkill -9 go
pkill -f sovereign-engine
pkill -f supervisor

# 2. Clean locks
rm -f .git/index.lock

# 3. Clean logs
rm -f logs/*.log
rm -f logs/*.pid

# 4. Rebuild and restart
cd backend && go build -o ../bin/sovereign-engine main.go reports.go
./deploy-sovereign.sh

# 5. Start supervisor
nohup ./monitoring/supervisor.sh > logs/supervisor.log 2>&1 &
```

---

## ✅ Success Indicators

Your environment is stable when:
- ✅ `make health-check` shows all green
- ✅ Services stay running for hours/days
- ✅ Logs don't fill up disk
- ✅ No manual restarts needed
- ✅ Supervisor handles crashes automatically

---

## 📚 More Information

- **Full optimization plan**: `STABILITY_OPTIMIZATION.md`
- **Monitoring guide**: `monitoring/README.md`
- **Deployment guide**: `DEPLOYMENT.md`
- **Build guide**: `ANDROID_BUILD_INSTRUCTIONS.md`

---

**Your environment is now production-ready!** 🎉
