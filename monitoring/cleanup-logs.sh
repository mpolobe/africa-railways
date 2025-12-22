#!/bin/bash

################################################################################
# 🧹 LOG CLEANUP SCRIPT
# 
# Rotates and compresses old logs to prevent disk space issues
# Run daily via cron or manually
################################################################################

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

LOG_DIR="logs"
MAX_LOG_SIZE=10485760  # 10MB in bytes
KEEP_DAYS=7

echo -e "${BLUE}🧹 Log Cleanup Started${NC}"
echo ""

# Create logs directory if it doesn't exist
mkdir -p $LOG_DIR

# Function to rotate log file
rotate_log() {
    local logfile=$1
    local timestamp=$(date +%Y%m%d_%H%M%S)
    
    if [ -f "$logfile" ]; then
        local size=$(stat -f%z "$logfile" 2>/dev/null || stat -c%s "$logfile" 2>/dev/null)
        
        if [ $size -gt $MAX_LOG_SIZE ]; then
            echo -e "${YELLOW}Rotating $logfile ($(numfmt --to=iec $size))${NC}"
            mv "$logfile" "${logfile}.${timestamp}"
            gzip "${logfile}.${timestamp}" 2>/dev/null || true
            touch "$logfile"
            echo -e "${GREEN}✓ Rotated and compressed${NC}"
        fi
    fi
}

# Rotate large log files
for logfile in $LOG_DIR/*.log; do
    if [ -f "$logfile" ]; then
        rotate_log "$logfile"
    fi
done

# Delete old compressed logs
echo ""
echo -e "${BLUE}Cleaning up old logs (older than $KEEP_DAYS days)${NC}"
find $LOG_DIR -name "*.gz" -mtime +$KEEP_DAYS -delete 2>/dev/null
find $LOG_DIR -name "*.log.*" -mtime +$KEEP_DAYS -delete 2>/dev/null

# Show current log sizes
echo ""
echo -e "${BLUE}Current log directory size:${NC}"
du -sh $LOG_DIR

echo ""
echo -e "${GREEN}✓ Log cleanup complete${NC}"
