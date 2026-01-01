# 🔧 Environment Stability & Optimization Plan

Comprehensive analysis and fixes to prevent crashes and improve efficiency.

---

## Issues Identified

### 1. **Backend Build Conflicts** ⚠️
- Multiple `main()` functions in backend/
- Duplicate type declarations
- Test files mixed with production code
- Unused example files causing build errors

### 2. **Memory & Process Issues** 💾
- Log files growing unbounded
- No log rotation
- PID files not cleaned up
- Processes not properly terminated

### 3. **Dependency Conflicts** 📦
- Africa's Talking package requires Go 1.24+ (we have 1.21)
- Conflicting package versions
- Unused dependencies

### 4. **Git Issues** 🔀
- Index locks causing hangs
- Large binary files in repo
- No proper .gitignore for build artifacts

### 5. **Resource Management** 🎯
- No process monitoring
- No automatic restart on crash
- No health checks for services

---

## Optimization Actions

### Phase 1: Clean Up Backend Structure

**Move test/example files:**
```bash
mkdir -p backend/examples backend/tests
mv backend/test_twilio.go backend/tests/
mv backend/otp_example.go backend/examples/
mv backend/main_complete.go backend/examples/
mv backend/main_simple.go.example backend/examples/
```

**Update .gitignore:**
```
# Build artifacts
bin/
*.exe
*.dll
*.so
*.dylib

# Logs
logs/*.log
logs/*.pid

# Test files
backend/tests/
backend/examples/

# Dependencies
vendor/
```

### Phase 2: Optimize Backend Build

**Create clean main.go:**
- Only production code
- No duplicate declarations
- Proper error handling

**Consolidate handlers:**
- Merge handlers.go functionality
- Remove duplicates
- Single source of truth

### Phase 3: Add Process Management

**Create supervisor script:**
```bash
#!/bin/bash
# supervisor.sh - Monitors and restarts services

while true; do
    if ! pgrep -f sovereign-engine > /dev/null; then
        echo "Backend crashed, restarting..."
        ./bin/sovereign-engine &
    fi
    sleep 5
done
```

### Phase 4: Implement Log Rotation

**Add logrotate config:**
```
/workspaces/africa-railways/logs/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
    maxsize 10M
}
```

### Phase 5: Optimize Dependencies

**Clean go.mod:**
```bash
cd backend
go mod tidy
go mod verify
```

**Remove unused packages:**
- Comment out Africa's Talking (requires Go 1.24+)
- Keep only essential dependencies

### Phase 6: Add Health Monitoring

**Create health check script:**
```bash
#!/bin/bash
# health-check.sh

# Check backend
if ! curl -sf http://localhost:8080/health > /dev/null; then
    echo "Backend unhealthy"
    exit 1
fi

# Check frontend
if ! curl -sf http://localhost:8082 > /dev/null; then
    echo "Frontend unhealthy"
    exit 1
fi

echo "All services healthy"
```

---

## Implementation Steps

### Step 1: Reorganize Backend
```bash
# Create directories
mkdir -p backend/{examples,tests,production}

# Move files
mv backend/test_*.go backend/tests/
mv backend/*_example.go backend/examples/
mv backend/main_complete.go backend/examples/

# Keep only production files in backend/
# main.go, reports.go
```

### Step 2: Update Build Process
```bash
# Update deploy-sovereign.sh
# Build only: main.go reports.go

# Update GitHub workflow
# Same build command
```

### Step 3: Add Monitoring
```bash
# Create monitoring directory
mkdir -p monitoring

# Add supervisor script
# Add health check script
# Add log rotation config
```

### Step 4: Optimize Git
```bash
# Clean up
git gc --aggressive --prune=now

# Remove large files from history if needed
git filter-branch --tree-filter 'rm -rf bin/' HEAD

# Update .gitignore
```

### Step 5: Add Graceful Shutdown
```go
// In main.go
func main() {
    // ... setup ...
    
    // Handle shutdown signals
    sigChan := make(chan os.Signal, 1)
    signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
    
    go func() {
        <-sigChan
        log.Println("Shutting down gracefully...")
        // Cleanup
        os.Exit(0)
    }()
    
    // ... start server ...
}
```

---

## Performance Optimizations

### 1. **Reduce Memory Usage**
- Limit event history to 100 items
- Implement circular buffer
- Clear old logs automatically

### 2. **Optimize WebSocket**
- Add connection pooling
- Implement backpressure
- Limit concurrent connections

### 3. **Database Connection Pooling**
- Set max connections
- Implement connection reuse
- Add timeout handling

### 4. **Caching**
- Cache static responses
- Implement Redis for sessions
- Add CDN for assets

---

## Monitoring & Alerts

### Add Prometheus Metrics
```go
import "github.com/prometheus/client_golang/prometheus"

var (
    requestCount = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total HTTP requests",
        },
        []string{"method", "endpoint"},
    )
)
```

### Add Logging
```go
import "go.uber.org/zap"

logger, _ := zap.NewProduction()
defer logger.Sync()
```

---

## Crash Prevention

### 1. **Panic Recovery**
```go
func recoveryMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if err := recover(); err != nil {
                log.Printf("Panic recovered: %v", err)
                http.Error(w, "Internal Server Error", 500)
            }
        }()
        next.ServeHTTP(w, r)
    })
}
```

### 2. **Timeout Handling**
```go
server := &http.Server{
    Addr:         ":8080",
    Handler:      mux,
    ReadTimeout:  15 * time.Second,
    WriteTimeout: 15 * time.Second,
    IdleTimeout:  60 * time.Second,
}
```

### 3. **Resource Limits**
```go
// Limit goroutines
semaphore := make(chan struct{}, 100)

// Limit memory
debug.SetMemoryLimit(500 * 1024 * 1024) // 500MB
```

---

## Testing Strategy

### 1. **Load Testing**
```bash
# Install hey
go install github.com/rakyll/hey@latest

# Test backend
hey -n 1000 -c 10 http://localhost:8080/health
```

### 2. **Stress Testing**
```bash
# Test WebSocket
wscat -c ws://localhost:8080/ws

# Monitor resources
htop
```

### 3. **Memory Profiling**
```bash
# Enable pprof
import _ "net/http/pprof"

# Profile
go tool pprof http://localhost:8080/debug/pprof/heap
```

---

## Deployment Checklist

- [ ] Clean up test files
- [ ] Update .gitignore
- [ ] Optimize build process
- [ ] Add process monitoring
- [ ] Implement log rotation
- [ ] Add health checks
- [ ] Set up graceful shutdown
- [ ] Add panic recovery
- [ ] Configure timeouts
- [ ] Test under load
- [ ] Document changes
- [ ] Update README

---

## Maintenance Schedule

### Daily
- Check logs for errors
- Monitor disk space
- Verify services running

### Weekly
- Rotate logs
- Update dependencies
- Review metrics

### Monthly
- Performance audit
- Security updates
- Backup verification

---

**Next Steps:** Implement Phase 1-3 immediately for stability.
