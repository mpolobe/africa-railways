#!/bin/bash

################################################################################
# 🔄 SERVICE SUPERVISOR
# 
# Monitors and automatically restarts crashed services
# Prevents downtime and improves stability
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BACKEND_PORT=8080
FRONTEND_PORT=8082
CHECK_INTERVAL=5
LOG_DIR="logs"
MAX_RESTARTS=5
RESTART_WINDOW=60

# Counters
backend_restarts=0
frontend_restarts=0
last_backend_restart=0
last_frontend_restart=0

echo -e "${GREEN}🔄 Service Supervisor Started${NC}"
echo -e "${BLUE}Monitoring services every ${CHECK_INTERVAL} seconds${NC}"
echo ""

# Function to check if service is running
check_service() {
    local port=$1
    curl -sf http://localhost:${port}/health > /dev/null 2>&1
    return $?
}

# Function to restart backend
restart_backend() {
    local now=$(date +%s)
    
    # Reset counter if outside restart window
    if [ $((now - last_backend_restart)) -gt $RESTART_WINDOW ]; then
        backend_restarts=0
    fi
    
    backend_restarts=$((backend_restarts + 1))
    last_backend_restart=$now
    
    if [ $backend_restarts -gt $MAX_RESTARTS ]; then
        echo -e "${RED}❌ Backend crashed too many times ($backend_restarts in ${RESTART_WINDOW}s)${NC}"
        echo -e "${YELLOW}Manual intervention required${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}⚠️  Backend not responding, restarting... (attempt $backend_restarts)${NC}"
    
    # Kill existing process
    if [ -f "$LOG_DIR/backend.pid" ]; then
        kill $(cat $LOG_DIR/backend.pid) 2>/dev/null || true
    fi
    pkill -f sovereign-engine 2>/dev/null || true
    
    # Wait a moment
    sleep 2
    
    # Start backend
    nohup ./bin/sovereign-engine > $LOG_DIR/backend.log 2>&1 &
    echo $! > $LOG_DIR/backend.pid
    
    echo -e "${GREEN}✓ Backend restarted (PID: $!)${NC}"
}

# Function to restart frontend
restart_frontend() {
    local now=$(date +%s)
    
    # Reset counter if outside restart window
    if [ $((now - last_frontend_restart)) -gt $RESTART_WINDOW ]; then
        frontend_restarts=0
    fi
    
    frontend_restarts=$((frontend_restarts + 1))
    last_frontend_restart=$now
    
    if [ $frontend_restarts -gt $MAX_RESTARTS ]; then
        echo -e "${RED}❌ Frontend crashed too many times ($frontend_restarts in ${RESTART_WINDOW}s)${NC}"
        echo -e "${YELLOW}Manual intervention required${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}⚠️  Frontend not responding, restarting... (attempt $frontend_restarts)${NC}"
    
    # Kill existing process
    if [ -f "$LOG_DIR/frontend.pid" ]; then
        kill $(cat $LOG_DIR/frontend.pid) 2>/dev/null || true
    fi
    fuser -k $FRONTEND_PORT/tcp 2>/dev/null || true
    
    # Wait a moment
    sleep 2
    
    # Start frontend
    if command -v python3 &> /dev/null; then
        nohup python3 -m http.server $FRONTEND_PORT > $LOG_DIR/frontend.log 2>&1 &
        echo $! > $LOG_DIR/frontend.pid
        echo -e "${GREEN}✓ Frontend restarted (PID: $!)${NC}"
    fi
}

# Main monitoring loop
while true; do
    # Check backend
    if ! check_service $BACKEND_PORT; then
        restart_backend || break
    else
        # Reset counter on successful check
        if [ $backend_restarts -gt 0 ]; then
            echo -e "${GREEN}✓ Backend recovered${NC}"
            backend_restarts=0
        fi
    fi
    
    # Check frontend
    if ! curl -sf http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
        restart_frontend || break
    else
        # Reset counter on successful check
        if [ $frontend_restarts -gt 0 ]; then
            echo -e "${GREEN}✓ Frontend recovered${NC}"
            frontend_restarts=0
        fi
    fi
    
    # Wait before next check
    sleep $CHECK_INTERVAL
done

echo -e "${RED}Supervisor stopped${NC}"
