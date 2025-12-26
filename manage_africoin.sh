#!/bin/bash

# ============================================================================
# AFRICOIN INFRASTRUCTURE MANAGEMENT SCRIPT
# ============================================================================
# This script monitors and manages all Africoin infrastructure components
# including validators, OCC Dashboard, Sui nodes, and Railway services.
#
# Usage: ./manage_africoin.sh [command]
# Commands:
#   status    - Check health of all services (default)
#   start     - Start all services
#   stop      - Stop all services
#   restart   - Restart all services
#   logs      - View logs from all services
#   deploy    - Deploy updates to all services
# ============================================================================

set -e

# --- CONFIGURATION ---
VALIDATOR_IP="34.10.5.8"
DEV_SERVER_IP="34.63.91.33"
NEW_STATIC_IP="34.60.45.96"
OCC_DASHBOARD_IP="34.10.37.126"
DOMAIN="africoin.duckdns.org"
RAILWAY_DOMAIN="www.africarailways.com"

# Ports
VALIDATOR_PORT="8545"
SUI_RPC_PORT="9000"
OCC_DASHBOARD_PORT="8080"
USSD_GATEWAY_PORT="8081"
RELAYER_PORT="8082"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Symbols
CHECK="✅"
CROSS="❌"
WARNING="⚠️"
INFO="ℹ️"
ROCKET="🚀"
WRENCH="🔧"

# --- HELPER FUNCTIONS ---

print_header() {
    echo ""
    echo -e "${CYAN}=========================================="
    echo -e "   $1"
    echo -e "==========================================${NC}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${BLUE}--- $1 ---${NC}"
}

print_success() {
    echo -e "${GREEN}${CHECK} $1${NC}"
}

print_error() {
    echo -e "${RED}${CROSS} $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}${WARNING} $1${NC}"
}

print_info() {
    echo -e "${CYAN}${INFO} $1${NC}"
}

check_command() {
    if command -v $1 &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# --- HEALTH CHECK FUNCTIONS ---

check_network() {
    local ip=$1
    local name=$2
    echo -n "  [NETWORK] $name ($ip): "
    if ping -c 1 -W 2 $ip > /dev/null 2>&1; then
        print_success "ONLINE"
        return 0
    else
        print_error "OFFLINE"
        return 1
    fi
}

check_http_service() {
    local url=$1
    local name=$2
    echo -n "  [HTTP] $name: "
    local status=$(curl -o /dev/null -s -w "%{http_code}" --max-time 5 $url 2>/dev/null)
    if [ "$status" == "200" ]; then
        print_success "RUNNING (HTTP $status)"
        return 0
    elif [ "$status" == "000" ]; then
        print_error "UNREACHABLE"
        return 1
    else
        print_warning "RESPONDING (HTTP $status)"
        return 1
    fi
}

check_polygon_validator() {
    echo -n "  [BLOCKCHAIN] Polygon Validator: "
    local response=$(curl -s -X POST http://$VALIDATOR_IP:$VALIDATOR_PORT \
        -H 'Content-Type: application/json' \
        -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        --max-time 5 2>/dev/null)
    
    if echo "$response" | grep -q "result"; then
        local block=$(echo "$response" | grep -o '"result":"[^"]*"' | cut -d'"' -f4)
        print_success "SYNCED (Block: $block)"
        return 0
    else
        print_error "NOT RESPONDING"
        return 1
    fi
}

check_sui_node() {
    echo -n "  [BLOCKCHAIN] Sui Node: "
    local response=$(curl -s -X POST http://$VALIDATOR_IP:$SUI_RPC_PORT \
        -H 'Content-Type: application/json' \
        -d '{"jsonrpc":"2.0","method":"rpc.discover","id":1}' \
        --max-time 5 2>/dev/null)
    
    if echo "$response" | grep -q "info"; then
        print_success "SYNCING"
        return 0
    else
        print_error "NOT RESPONDING"
        return 1
    fi
}

check_occ_dashboard() {
    echo -n "  [SERVICE] OCC Dashboard (via Railway): "
    local response=$(curl -s https://$RAILWAY_DOMAIN/occ/api/health --max-time 5 2>/dev/null)
    
    if echo "$response" | grep -q "status"; then
        local status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        print_success "RUNNING (Status: $status)"
        return 0
    else
        print_error "NOT RESPONDING"
        return 1
    fi
}

check_occ_dashboard_direct() {
    echo -n "  [SERVICE] OCC Dashboard (Direct GCP): "
    local response=$(curl -s http://$OCC_DASHBOARD_IP:$OCC_DASHBOARD_PORT/api/health --max-time 5 2>/dev/null)
    
    if echo "$response" | grep -q "status"; then
        local status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        print_success "RUNNING (Status: $status)"
        return 0
    else
        print_error "NOT RESPONDING"
        return 1
    fi
}

check_relayer() {
    echo -n "  [SERVICE] Relayer Bridge: "
    local response=$(curl -s http://$OCC_DASHBOARD_IP:$RELAYER_PORT/health --max-time 5 2>/dev/null)
    
    if echo "$response" | grep -q "status"; then
        print_success "RUNNING"
        return 0
    else
        print_error "NOT RESPONDING"
        return 1
    fi
}

check_ussd_gateway() {
    echo -n "  [SERVICE] USSD Gateway: "
    local response=$(curl -s http://$OCC_DASHBOARD_IP:$USSD_GATEWAY_PORT/health --max-time 5 2>/dev/null)
    
    if echo "$response" | grep -q "status"; then
        print_success "RUNNING"
        return 0
    else
        print_error "NOT RESPONDING"
        return 1
    fi
}

check_railway_website() {
    echo -n "  [WEB] Railway Website: "
    local status=$(curl -o /dev/null -s -w "%{http_code}" --max-time 5 https://$RAILWAY_DOMAIN 2>/dev/null)
    if [ "$status" == "200" ]; then
        print_success "ONLINE (HTTP $status)"
        return 0
    else
        print_error "ERROR (HTTP $status)"
        return 1
    fi
}

check_railway_occ_proxy() {
    echo -n "  [WEB] Railway OCC Proxy: "
    local status=$(curl -o /dev/null -s -w "%{http_code}" --max-time 5 https://$RAILWAY_DOMAIN/occ 2>/dev/null)
    if [ "$status" == "200" ]; then
        print_success "ONLINE (HTTP $status)"
        return 0
    else
        print_error "ERROR (HTTP $status)"
        return 1
    fi
}

# --- MAIN COMMANDS ---

cmd_status() {
    print_header "AFRICOIN INFRASTRUCTURE STATUS"
    
    print_section "Network Connectivity"
    check_network $VALIDATOR_IP "Polygon Validator"
    check_network $DEV_SERVER_IP "Dev Server"
    check_network $NEW_STATIC_IP "Static IP"
    check_network $OCC_DASHBOARD_IP "OCC Dashboard Server"
    
    print_section "Blockchain Services"
    check_polygon_validator
    check_sui_node
    
    print_section "Backend Services (GCP)"
    check_occ_dashboard_direct
    check_relayer
    check_ussd_gateway
    
    print_section "Web Services (Railway)"
    check_railway_website
    check_railway_occ_proxy
    check_occ_dashboard
    check_http_service "http://$DOMAIN:3000" "DuckDNS Dashboard"
    
    print_section "Summary"
    echo ""
    print_info "Infrastructure Status Check Complete"
    echo ""
}

cmd_start() {
    print_header "STARTING AFRICOIN SERVICES"
    
    print_info "This will start all services on GCP VMs"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
    
    print_section "Starting Services"
    
    # Start OCC Dashboard
    echo "Starting OCC Dashboard..."
    gcloud compute ssh africoin-node-1 --zone=us-central1-a --command="cd /opt/dashboard && nohup ./occ-dashboard > logs/occ.log 2>&1 &" 2>/dev/null && print_success "OCC Dashboard started" || print_error "Failed to start OCC Dashboard"
    
    # Start Relayer
    echo "Starting Relayer Bridge..."
    gcloud compute ssh africoin-node-1 --zone=us-central1-a --command="cd /opt && nohup ./relayer > logs/relayer.log 2>&1 &" 2>/dev/null && print_success "Relayer started" || print_error "Failed to start Relayer"
    
    # Start USSD Gateway
    echo "Starting USSD Gateway..."
    gcloud compute ssh africoin-node-1 --zone=us-central1-a --command="cd /opt/ussd-gateway && nohup ./ussd-gateway > logs/ussd.log 2>&1 &" 2>/dev/null && print_success "USSD Gateway started" || print_error "Failed to start USSD Gateway"
    
    print_success "All services started"
}

cmd_stop() {
    print_header "STOPPING AFRICOIN SERVICES"
    
    print_warning "This will stop all services on GCP VMs"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
    
    print_section "Stopping Services"
    
    # Stop services
    echo "Stopping all services..."
    gcloud compute ssh africoin-node-1 --zone=us-central1-a --command="pkill -f occ-dashboard; pkill -f relayer; pkill -f ussd-gateway" 2>/dev/null && print_success "All services stopped" || print_error "Failed to stop services"
}

cmd_restart() {
    print_header "RESTARTING AFRICOIN SERVICES"
    cmd_stop
    sleep 3
    cmd_start
}

cmd_logs() {
    print_header "AFRICOIN SERVICE LOGS"
    
    echo "Select service to view logs:"
    echo "1) OCC Dashboard"
    echo "2) Relayer Bridge"
    echo "3) USSD Gateway"
    echo "4) Monitor Engine"
    echo "5) All Services"
    read -p "Choice (1-5): " choice
    
    case $choice in
        1)
            gcloud compute ssh africoin-node-1 --zone=us-central1-a --command="tail -f /opt/dashboard/logs/occ.log"
            ;;
        2)
            gcloud compute ssh africoin-node-1 --zone=us-central1-a --command="tail -f /opt/logs/relayer.log"
            ;;
        3)
            gcloud compute ssh africoin-node-1 --zone=us-central1-a --command="tail -f /opt/ussd-gateway/logs/ussd.log"
            ;;
        4)
            gcloud compute ssh africoin-node-1 --zone=us-central1-a --command="tail -f /opt/logs/monitor.log"
            ;;
        5)
            gcloud compute ssh africoin-node-1 --zone=us-central1-a --command="tail -f /opt/dashboard/logs/occ.log /opt/logs/relayer.log /opt/ussd-gateway/logs/ussd.log /opt/logs/monitor.log"
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
}

cmd_deploy() {
    print_header "DEPLOYING AFRICOIN UPDATES"
    
    print_info "This will deploy the latest code to all services"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
    
    print_section "Deploying Updates"
    
    # Deploy to Railway
    if check_command railway; then
        echo "Deploying to Railway..."
        railway up && print_success "Railway deployment complete" || print_error "Railway deployment failed"
    else
        print_warning "Railway CLI not found, skipping Railway deployment"
    fi
    
    # Deploy to GCP
    echo "Deploying to GCP..."
    gcloud compute ssh africoin-node-1 --zone=us-central1-a --command="cd /opt/africa-railways && git pull && make build" 2>/dev/null && print_success "GCP deployment complete" || print_error "GCP deployment failed"
    
    print_success "Deployment complete"
}

cmd_help() {
    print_header "AFRICOIN INFRASTRUCTURE MANAGEMENT"
    
    echo "Usage: ./manage_africoin.sh [command]"
    echo ""
    echo "Commands:"
    echo "  status    - Check health of all services (default)"
    echo "  start     - Start all services"
    echo "  stop      - Stop all services"
    echo "  restart   - Restart all services"
    echo "  logs      - View logs from services"
    echo "  deploy    - Deploy updates to all services"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./manage_africoin.sh status"
    echo "  ./manage_africoin.sh restart"
    echo "  ./manage_africoin.sh logs"
    echo ""
}

# --- MAIN ---

# Parse command
COMMAND=${1:-status}

# Check if gcloud is required for this command
if [[ "$COMMAND" == "start" || "$COMMAND" == "stop" || "$COMMAND" == "restart" || "$COMMAND" == "logs" || "$COMMAND" == "deploy" ]]; then
    if ! check_command gcloud; then
        print_error "gcloud CLI not found. Please install Google Cloud SDK."
        print_info "Install: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
fi

case $COMMAND in
    status)
        cmd_status
        ;;
    start)
        cmd_start
        ;;
    stop)
        cmd_stop
        ;;
    restart)
        cmd_restart
        ;;
    logs)
        cmd_logs
        ;;
    deploy)
        cmd_deploy
        ;;
    help|--help|-h)
        cmd_help
        ;;
    *)
        print_error "Unknown command: $COMMAND"
        cmd_help
        exit 1
        ;;
esac

exit 0
