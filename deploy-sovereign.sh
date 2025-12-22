#!/bin/bash

################################################################################
# 🚂 SOVEREIGN HUB DEPLOYMENT SCRIPT
# 
# One-command deployment for the Africa Railways Digital Spine
# Handles environment validation, dependency checks, and service startup
#
# Usage: ./deploy-sovereign.sh
################################################################################

set -e  # Exit on error

# --- CONFIGURATION ---
PORT_BACKEND=8080
PORT_FRONTEND=8082
LOG_FILE="logs/sovereign_engine.log"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GOLD='\033[1;33m'
NC='\033[0m' # No Color

# Banner
echo -e "${GOLD}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚂  SOVEREIGN HUB DEPLOYMENT                           ║
║   Africa Railways Digital Spine                          ║
║   Powered by Sui Blockchain & Go                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

################################################################################
# STEP 1: Environment Validation
################################################################################

echo -e "${CYAN}[1/6] 🔍 Validating Environment...${NC}"

# Check if running from correct directory
if [ ! -f "deploy-sovereign.sh" ]; then
    echo -e "${RED}❌ Error: Must run from project root directory${NC}"
    exit 1
fi

# Detect environment
if [ -n "$GITPOD_WORKSPACE_ID" ]; then
    ENV_TYPE="Gitpod"
    echo -e "${GREEN}✓ Running in Gitpod environment${NC}"
elif [ -n "$CODESPACES" ]; then
    ENV_TYPE="Codespaces"
    echo -e "${GREEN}✓ Running in GitHub Codespaces${NC}"
else
    ENV_TYPE="Local"
    echo -e "${GREEN}✓ Running in local environment${NC}"
fi

################################################################################
# STEP 2: Dependency Checks
################################################################################

echo -e "${CYAN}[2/6] 📦 Checking Dependencies...${NC}"

MISSING_DEPS=0

# Check Go
if command -v go &> /dev/null; then
    GO_VERSION=$(go version | awk '{print $3}')
    echo -e "${GREEN}✓ Go installed: ${GO_VERSION}${NC}"
else
    echo -e "${RED}✗ Go not found${NC}"
    MISSING_DEPS=1
fi

# Check Node (optional, for frontend tooling)
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js installed: ${NODE_VERSION}${NC}"
else
    echo -e "${YELLOW}⚠ Node.js not found (optional)${NC}"
fi

# Check Git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version | awk '{print $3}')
    echo -e "${GREEN}✓ Git installed: ${GIT_VERSION}${NC}"
else
    echo -e "${YELLOW}⚠ Git not found${NC}"
fi

# Check for required Go packages
echo -e "${BLUE}Checking Go dependencies...${NC}"
cd backend
if [ -f "go.mod" ]; then
    echo -e "${GREEN}✓ go.mod found${NC}"
    
    # Check for WebSocket package
    if ! go list -m github.com/gorilla/websocket > /dev/null 2>&1; then
        echo -e "${YELLOW}Installing WebSocket package...${NC}"
        go get github.com/gorilla/websocket
    fi
    
    go mod download 2>&1 | grep -v "go: downloading" || true
    echo -e "${GREEN}✓ Go dependencies downloaded${NC}"
else
    echo -e "${YELLOW}⚠ go.mod not found, initializing...${NC}"
    go mod init github.com/mpolobe/africa-railways/backend
    go get github.com/gorilla/websocket
    echo -e "${GREEN}✓ Go module initialized${NC}"
fi
cd ..

if [ $MISSING_DEPS -eq 1 ]; then
    echo -e "${RED}❌ Missing critical dependencies. Please install Go.${NC}"
    exit 1
fi

################################################################################
# STEP 3: Environment Variables & Credential Check
################################################################################

echo -e "${CYAN}[3/6] 🔐 Validating Carrier Secrets...${NC}"

# Check for .env file
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✓ backend/.env found${NC}"
    source backend/.env
else
    echo -e "${YELLOW}⚠ backend/.env not found, checking environment variables${NC}"
fi

# Required SMS provider variables
REQUIRED_VARS=("TWILIO_ACCOUNT_SID" "TWILIO_AUTH_TOKEN" "TWILIO_MESSAGING_SERVICE_SID")
OPTIONAL_VARS=("AT_API_KEY" "AT_USERNAME")

MISSING_REQUIRED=0
MISSING_OPTIONAL=0

# Check required Twilio variables
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}✗ $var not set${NC}"
        MISSING_REQUIRED=1
    else
        echo -e "${GREEN}✓ $var configured${NC}"
    fi
done

# Check optional Africa's Talking variables
for var in "${OPTIONAL_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_OPTIONAL=1
    else
        echo -e "${GREEN}✓ $var configured (fallback provider)${NC}"
    fi
done

# Determine SMS provider status
if [ $MISSING_REQUIRED -eq 1 ] && [ $MISSING_OPTIONAL -eq 1 ]; then
    echo -e "${RED}❌ No SMS provider configured!${NC}"
    echo -e "${YELLOW}Run ./setup-twilio.sh to configure Twilio${NC}"
    echo -e "${YELLOW}Or set Africa's Talking credentials${NC}"
    echo -e "${YELLOW}Continuing without SMS features...${NC}"
elif [ $MISSING_REQUIRED -eq 1 ]; then
    echo -e "${YELLOW}⚠ Twilio not configured, using Africa's Talking${NC}"
elif [ $MISSING_OPTIONAL -eq 1 ]; then
    echo -e "${GREEN}✓ Using Twilio as primary SMS provider${NC}"
else
    echo -e "${GREEN}✓ Dual SMS providers configured (Twilio + Africa's Talking)${NC}"
fi

################################################################################
# STEP 4: Build Backend
################################################################################

echo -e "${CYAN}[4/6] 🔨 Building Backend Services...${NC}"

cd backend

# Check if handlers.go exists
if [ ! -f "handlers.go" ]; then
    echo -e "${RED}❌ handlers.go not found${NC}"
    exit 1
fi

# Build the Go backend
echo -e "${BLUE}Compiling Go backend...${NC}"
if go build -o ../bin/sovereign-engine main.go; then
    echo -e "${GREEN}✓ Backend compiled successfully${NC}"
else
    echo -e "${RED}❌ Backend compilation failed${NC}"
    exit 1
fi

cd ..

################################################################################
# STEP 5: Start Services
################################################################################

echo -e "${CYAN}[5/6] 🚀 Starting Services...${NC}"

# Create logs directory if it doesn't exist
mkdir -p logs

# Kill any existing processes on backend port
echo -e "${BLUE}🛰️  Starting Sentinel Engine on port $PORT_BACKEND...${NC}"
if command -v fuser &> /dev/null; then
    fuser -k $PORT_BACKEND/tcp > /dev/null 2>&1 || true
elif lsof -Pi :$PORT_BACKEND -sTCP:LISTEN -t >/dev/null 2>&1; then
    kill -9 $(lsof -t -i:$PORT_BACKEND) 2>/dev/null || true
fi
sleep 1

# Start the backend
nohup ./bin/sovereign-engine > $LOG_FILE 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > logs/backend.pid

# Wait for backend to start
echo -e "${BLUE}Waiting for backend to initialize...${NC}"
sleep 3

# Health check
if curl -s http://localhost:$PORT_BACKEND/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend Running (Logs: $LOG_FILE)${NC}"
else
    echo -e "${RED}❌ Backend failed to start${NC}"
    echo -e "${YELLOW}Check $LOG_FILE for details${NC}"
    exit 1
fi

# Start frontend server (iPad Dashboard)
if command -v python3 &> /dev/null; then
    echo -e "${BLUE}📱 Starting iPad Control Centre on port $PORT_FRONTEND...${NC}"
    
    # Kill any existing process on frontend port
    if command -v fuser &> /dev/null; then
        fuser -k $PORT_FRONTEND/tcp > /dev/null 2>&1 || true
    elif lsof -Pi :$PORT_FRONTEND -sTCP:LISTEN -t >/dev/null 2>&1; then
        kill -9 $(lsof -t -i:$PORT_FRONTEND) 2>/dev/null || true
    fi
    sleep 1
    
    nohup python3 -m http.server $PORT_FRONTEND > logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > logs/frontend.pid
    echo -e "${GREEN}✅ Frontend server running (PID: $FRONTEND_PID)${NC}"
elif command -v php &> /dev/null; then
    echo -e "${BLUE}📱 Starting frontend server on port $PORT_FRONTEND...${NC}"
    if command -v fuser &> /dev/null; then
        fuser -k $PORT_FRONTEND/tcp > /dev/null 2>&1 || true
    fi
    nohup php -S 0.0.0.0:$PORT_FRONTEND > logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > logs/frontend.pid
    echo -e "${GREEN}✅ Frontend server running (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${YELLOW}⚠ No HTTP server available (python3/php)${NC}"
    echo -e "${YELLOW}  Open HTML files directly in browser${NC}"
fi

################################################################################
# STEP 6: Status Report
################################################################################

echo -e "${CYAN}[6/6] 📊 Deployment Status${NC}"
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ SOVEREIGN HUB DEPLOYED SUCCESSFULLY                  ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GOLD}🔗 Access Points:${NC}"
echo ""

if [ "$ENV_TYPE" = "Gitpod" ]; then
    WORKSPACE_URL=$(gp url $PORT_FRONTEND)
    BACKEND_URL=$(gp url $PORT_BACKEND)
    DASHBOARD_URL="${WORKSPACE_URL}/dashboard.html"
    
    echo -e "  ${CYAN}📱 Dashboard:${NC}      ${DASHBOARD_URL}"
    echo -e "  ${CYAN}🏠 Home Page:${NC}      ${WORKSPACE_URL}/index.html"
    echo -e "  ${CYAN}📡 Live Feed:${NC}      ${WORKSPACE_URL}/live-feed.html"
    echo -e "  ${CYAN}🎮 iPad Control:${NC}   ${WORKSPACE_URL}/ipad-control-center.html"
    echo -e "  ${CYAN}🔧 Backend API:${NC}    ${BACKEND_URL}"
    echo ""
    
    # Generate QR Code for iPad
    if command -v qrencode &> /dev/null; then
        echo -e "${GOLD}📸 SCAN TO OPEN ON IPAD:${NC}"
        echo ""
        echo "$DASHBOARD_URL" | qrencode -t ansiutf8
        echo ""
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    fi
    
    echo -e "${YELLOW}💡 Tip: Scan the QR code with your iPad camera, then 'Add to Home Screen'${NC}"
elif [ "$ENV_TYPE" = "Codespaces" ]; then
    DASHBOARD_URL="https://${CODESPACE_NAME}-${PORT_FRONTEND}.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}/dashboard.html"
    
    echo -e "  ${CYAN}📱 Dashboard:${NC}      ${DASHBOARD_URL}"
    echo -e "  ${CYAN}🏠 Home Page:${NC}      https://${CODESPACE_NAME}-${PORT_FRONTEND}.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}/index.html"
    echo -e "  ${CYAN}🔧 Backend API:${NC}    https://${CODESPACE_NAME}-${PORT_BACKEND}.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
    echo ""
    
    # Generate QR Code for iPad
    if command -v qrencode &> /dev/null; then
        echo -e "${GOLD}📸 SCAN TO OPEN ON IPAD:${NC}"
        echo ""
        echo "$DASHBOARD_URL" | qrencode -t ansiutf8
        echo ""
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    fi
    
    echo -e "${YELLOW}💡 Tip: Scan the QR code with your iPad camera, then 'Add to Home Screen'${NC}"
else
    echo -e "  ${CYAN}📱 Dashboard:${NC}      http://localhost:${PORT_FRONTEND}/dashboard.html"
    echo -e "  ${CYAN}🏠 Home Page:${NC}      http://localhost:${PORT_FRONTEND}/index.html"
    echo -e "  ${CYAN}📡 Live Feed:${NC}      http://localhost:${PORT_FRONTEND}/live-feed.html"
    echo -e "  ${CYAN}🎮 iPad Control:${NC}   http://localhost:${PORT_FRONTEND}/ipad-control-center.html"
    echo -e "  ${CYAN}🔧 Backend API:${NC}    http://localhost:${PORT_BACKEND}"
    echo ""
    echo -e "${YELLOW}💡 Tip: Open the iPad Dashboard link and 'Add to Home Screen' for native experience${NC}"
fi

echo ""
echo -e "${GOLD}📊 Service Status:${NC}"
echo -e "  ${GREEN}✓${NC} Backend Engine:    Running (PID: $BACKEND_PID)"
if [ -n "$FRONTEND_PID" ]; then
    echo -e "  ${GREEN}✓${NC} Frontend Server:   Running (PID: $FRONTEND_PID)"
fi
echo ""
echo -e "${GOLD}📝 Logs:${NC}"
echo -e "  Backend:  ${BLUE}tail -f logs/backend.log${NC}"
if [ -n "$FRONTEND_PID" ]; then
    echo -e "  Frontend: ${BLUE}tail -f logs/frontend.log${NC}"
fi
echo ""
echo -e "${GOLD}🛑 Stop Services:${NC}"
echo -e "  ${BLUE}kill \$(cat logs/backend.pid)${NC}"
if [ -n "$FRONTEND_PID" ]; then
    echo -e "  ${BLUE}kill \$(cat logs/frontend.pid)${NC}"
fi
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🚂 The Digital Spine is now operational!${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
