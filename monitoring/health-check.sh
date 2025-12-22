#!/bin/bash

################################################################################
# 🏥 HEALTH CHECK SCRIPT
# 
# Verifies all services are running and healthy
# Returns exit code 0 if healthy, 1 if unhealthy
################################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

HEALTHY=true

echo "🏥 Health Check Report"
echo "======================"
echo ""

# Check backend
echo -n "Backend (port 8080): "
if curl -sf http://localhost:8080/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Healthy${NC}"
else
    echo -e "${RED}✗ Unhealthy${NC}"
    HEALTHY=false
fi

# Check frontend
echo -n "Frontend (port 8082): "
if curl -sf http://localhost:8082 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Healthy${NC}"
else
    echo -e "${RED}✗ Unhealthy${NC}"
    HEALTHY=false
fi

# Check disk space
echo -n "Disk space: "
DISK_USAGE=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 80 ]; then
    echo -e "${GREEN}✓ ${DISK_USAGE}% used${NC}"
else
    echo -e "${YELLOW}⚠ ${DISK_USAGE}% used (high)${NC}"
fi

# Check memory
echo -n "Memory: "
MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
if [ $MEM_USAGE -lt 80 ]; then
    echo -e "${GREEN}✓ ${MEM_USAGE}% used${NC}"
else
    echo -e "${YELLOW}⚠ ${MEM_USAGE}% used (high)${NC}"
fi

# Check log file sizes
echo -n "Log files: "
if [ -d "logs" ]; then
    LOG_SIZE=$(du -sh logs 2>/dev/null | awk '{print $1}')
    echo -e "${GREEN}✓ ${LOG_SIZE}${NC}"
else
    echo -e "${YELLOW}⚠ logs/ directory not found${NC}"
fi

# Check processes
echo -n "Backend process: "
if pgrep -f sovereign-engine > /dev/null; then
    PID=$(pgrep -f sovereign-engine)
    echo -e "${GREEN}✓ Running (PID: $PID)${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
    HEALTHY=false
fi

echo ""
echo "======================"

if [ "$HEALTHY" = true ]; then
    echo -e "${GREEN}✓ All systems operational${NC}"
    exit 0
else
    echo -e "${RED}✗ System unhealthy${NC}"
    exit 1
fi
