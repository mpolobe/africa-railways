#!/bin/bash

################################################################################
# 🔍 AFRICA SOVEREIGN: Stability & Efficiency Profiler
# 
# Comprehensive system audit for stability, efficiency, and security
################################################################################

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

ISSUES_FOUND=0

echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔍  SYSTEM AUDIT & PROFILER                            ║
║   Stability • Efficiency • Security                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${YELLOW}🔍 Initializing Full System Audit...${NC}"
echo ""

# --- 1. BACKEND STABILITY: Go Profiling ---
echo -e "${GREEN}[1/6] Backend Efficiency Check (Go)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "./backend" ]; then
    # Check for pprof profiling
    echo -n "⚙️  Checking for pprof profiling... "
    if grep -r "_ \"net/http/pprof\"" ./backend > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Enabled${NC}"
    else
        echo -e "${YELLOW}⚠️  Not found${NC}"
        echo "   💡 Add: import _ \"net/http/pprof\" to enable memory profiling"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
    
    # Check for unbounded maps
    echo -n "🗺️  Checking for unbounded maps... "
    if grep -r "var.*map\[" ./backend/*.go 2>/dev/null | grep -v "make(map" > /dev/null; then
        echo -e "${RED}⚠️  Found${NC}"
        echo "   💡 Global maps should have max size or TTL to prevent memory bloat"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    else
        echo -e "${GREEN}✅ Safe${NC}"
    fi
    
    # Check for goroutine leaks
    echo -n "🔄 Checking for potential goroutine leaks... "
    if grep -r "go func()" ./backend/*.go 2>/dev/null | grep -v "defer" > /dev/null; then
        echo -e "${YELLOW}⚠️  Found goroutines without cleanup${NC}"
        echo "   💡 Ensure goroutines have proper cleanup with context or channels"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    else
        echo -e "${GREEN}✅ Safe${NC}"
    fi
    
    # Check for proper error handling
    echo -n "🛡️  Checking error handling... "
    if grep -r "err != nil" ./backend/*.go 2>/dev/null | wc -l | grep -q "^[0-9]"; then
        echo -e "${GREEN}✅ Present${NC}"
    else
        echo -e "${YELLOW}⚠️  Limited error handling${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
    
    # Check for timeouts
    echo -n "⏱️  Checking for HTTP timeouts... "
    if grep -r "ReadTimeout\|WriteTimeout\|IdleTimeout" ./backend/*.go > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Configured${NC}"
    else
        echo -e "${YELLOW}⚠️  Not configured${NC}"
        echo "   💡 Add timeouts to prevent hanging connections"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
    
    # Check for panic recovery
    echo -n "🚨 Checking for panic recovery... "
    if grep -r "recover()" ./backend/*.go > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Implemented${NC}"
    else
        echo -e "${YELLOW}⚠️  Not found${NC}"
        echo "   💡 Add panic recovery middleware to prevent crashes"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
else
    echo -e "${RED}❌ Backend directory not found${NC}"
fi

echo ""

# --- 2. MOBILE EFFICIENCY: Expo Bundle Analysis ---
echo -e "${GREEN}[2/6] Mobile Efficiency Check (Expo/React Native)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "./SmartphoneApp" ]; then
    echo "📦 Analyzing dependency bloat..."
    
    # Check for heavy libraries
    HEAVY_LIBS=("moment" "lodash" "react-native-webview" "axios")
    ALTERNATIVES=("dayjs" "lodash-es or native" "expo-web-browser" "fetch API")
    
    for i in "${!HEAVY_LIBS[@]}"; do
        lib="${HEAVY_LIBS[$i]}"
        alt="${ALTERNATIVES[$i]}"
        
        if [ -f "./SmartphoneApp/package.json" ] && grep -q "\"$lib\"" "./SmartphoneApp/package.json"; then
            echo -e "${YELLOW}⚠️  Found $lib${NC}"
            echo "   💡 Consider $alt to reduce bundle size"
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
        fi
    done
    
    # Check bundle size
    if [ -f "./SmartphoneApp/package.json" ]; then
        DEP_COUNT=$(grep -c "\".*\":" "./SmartphoneApp/package.json" || echo "0")
        echo "📊 Total dependencies: $DEP_COUNT"
        if [ $DEP_COUNT -gt 50 ]; then
            echo -e "${YELLOW}⚠️  High dependency count may slow builds${NC}"
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
        fi
    fi
    
    echo ""
    echo "💡 Run 'EXPO_UNSTABLE_ATLAS=true npx expo start' to visualize bundle tree"
else
    echo -e "${YELLOW}⚠️  SmartphoneApp directory not found${NC}"
fi

echo ""

# --- 3. INFRASTRUCTURE: Gitpod Workspace Health ---
echo -e "${GREEN}[3/6] Gitpod Environment Health${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Disk space
FREE_DISK=$(df -h . | awk 'NR==2 {print $4}')
DISK_PERCENT=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
echo "💾 Available Workspace Disk: $FREE_DISK"
if [ $DISK_PERCENT -gt 80 ]; then
    echo -e "${RED}⚠️  Disk usage critical (${DISK_PERCENT}%)${NC}"
    echo "   💡 Run: make cleanup-logs"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
elif [ $DISK_PERCENT -gt 60 ]; then
    echo -e "${YELLOW}⚠️  Disk usage high (${DISK_PERCENT}%)${NC}"
fi

# Memory usage
echo -n "🧠 Memory Usage: "
MEM_PERCENT=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
MEM_USED=$(free -h | grep Mem | awk '{print $3}')
MEM_TOTAL=$(free -h | grep Mem | awk '{print $2}')
echo "$MEM_USED / $MEM_TOTAL (${MEM_PERCENT}%)"
if [ $MEM_PERCENT -gt 80 ]; then
    echo -e "${RED}⚠️  Memory usage critical${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# CPU hogs
echo ""
echo "🔥 Top CPU Processes:"
ps aux --sort=-%cpu | head -n 4 | tail -n 3 | awk '{printf "   %s: %.1f%% CPU\n", $11, $3}'

# Check for zombie processes
ZOMBIES=$(ps aux | grep -c " Z ")
if [ $ZOMBIES -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $ZOMBIES zombie processes${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo ""

# --- 4. LOG FILE ANALYSIS ---
echo -e "${GREEN}[4/6] Log File Analysis${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "./logs" ]; then
    LOG_SIZE=$(du -sh logs 2>/dev/null | awk '{print $1}')
    echo "📝 Total log size: $LOG_SIZE"
    
    # Check for large log files
    echo "📊 Large log files:"
    find logs -name "*.log" -size +10M 2>/dev/null | while read file; do
        size=$(du -h "$file" | awk '{print $1}')
        echo -e "${YELLOW}   ⚠️  $file: $size${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    done
    
    # Check for errors in logs
    if [ -f "logs/backend.log" ]; then
        ERROR_COUNT=$(grep -ci "error\|fatal\|panic" logs/backend.log 2>/dev/null || echo "0")
        echo "🚨 Errors in backend.log: $ERROR_COUNT"
        if [ $ERROR_COUNT -gt 10 ]; then
            echo -e "${YELLOW}⚠️  High error count - review logs${NC}"
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Logs directory not found${NC}"
fi

echo ""

# --- 5. SECURITY SCAN ---
echo -e "${GREEN}[5/6] Security Leak Scan${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for hardcoded secrets
echo -n "🔐 Scanning for hardcoded secrets... "
if grep -rEi "sui.*key|digits.*key|api.*key.*=|password.*=|secret.*=" . \
    --exclude="*.sh" \
    --exclude="*.md" \
    --exclude-dir="node_modules" \
    --exclude-dir=".git" \
    --exclude-dir="monitoring" > /dev/null 2>&1; then
    echo -e "${RED}❌ FOUND${NC}"
    echo "   🚨 SECURITY ALERT: Hardcoded keys detected!"
    echo "   💡 Move secrets to .env file"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ Clean${NC}"
fi

# Check for .env in git
echo -n "🔒 Checking .env protection... "
if [ -f ".env" ] && ! grep -q "^\.env$" .gitignore 2>/dev/null; then
    echo -e "${RED}❌ .env not in .gitignore${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ Protected${NC}"
fi

# Check for exposed ports
echo -n "🌐 Checking for exposed ports... "
OPEN_PORTS=$(netstat -tuln 2>/dev/null | grep LISTEN | wc -l || echo "0")
echo "$OPEN_PORTS ports listening"

echo ""

# --- 6. GIT REPOSITORY HEALTH ---
echo -e "${GREEN}[6/6] Git Repository Health${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for large files
echo -n "📦 Checking for large files in repo... "
LARGE_FILES=$(find . -type f -size +5M \
    -not -path "./.git/*" \
    -not -path "./node_modules/*" \
    -not -path "./bin/*" 2>/dev/null | wc -l)
if [ $LARGE_FILES -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $LARGE_FILES large files${NC}"
    echo "   💡 Consider using Git LFS or .gitignore"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ Clean${NC}"
fi

# Check for uncommitted changes
echo -n "🔄 Checking for uncommitted changes... "
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
    CHANGES=$(git status --porcelain 2>/dev/null | wc -l)
    echo -e "${YELLOW}⚠️  $CHANGES uncommitted changes${NC}"
else
    echo -e "${GREEN}✅ Clean${NC}"
fi

# Check repo size
REPO_SIZE=$(du -sh .git 2>/dev/null | awk '{print $1}')
echo "📊 Repository size: $REPO_SIZE"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# --- SUMMARY ---
echo ""
if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ AUDIT COMPLETE - NO ISSUES FOUND                     ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
else
    echo -e "${YELLOW}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║  ⚠️  AUDIT COMPLETE - $ISSUES_FOUND ISSUES FOUND                    ║${NC}"
    echo -e "${YELLOW}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}💡 Review the warnings above to improve stability${NC}"
fi

echo ""
echo -e "${CYAN}📚 For detailed fixes, see: STABILITY_OPTIMIZATION.md${NC}"
echo ""

exit $ISSUES_FOUND
