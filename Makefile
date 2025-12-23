.PHONY: help dev backend engine status stop clean logs deploy sync build-railways-android build-railways-ios build-all-apps build-backend-optimized eas-build eas-android eas-ios eas-configure eas-status

# Colors
GREEN = \033[0;32m
BLUE = \033[0;34m
RED = \033[0;31m
YELLOW = \033[0;33m
NC = \033[0m

help:
	@echo "$(GREEN)🌍 Africa Railways - 2025 Hybrid Suite$(NC)"
	@echo ""
	@echo "$(BLUE)Development:$(NC)"
	@echo "  make dev                    - Start everything with Hot-Reload (iPad Ready)"
	@echo "  make status                 - Check all ports (3000, 8080, 8081, 9000, 8082)"
	@echo "  make logs                   - Interactive iPad log viewer"
	@echo "  make simulate               - Run ticket purchase simulation"
	@echo "  make stop                   - Stop all services"
	@echo "  make clean                  - Clean build artifacts"
	@echo ""
	@echo "$(BLUE)Build:$(NC)"
	@echo "  make build-backend-optimized - Build optimized Go binary (30-40% smaller)"
	@echo "  make eas-build               - Interactive EAS build menu"
	@echo "  make eas-android             - Build Android with EAS (local)"
	@echo "  make eas-ios                 - Build iOS with EAS (local, macOS only)"
	@echo "  make eas-configure           - Configure EAS build settings"
	@echo "  make eas-status              - Check EAS build status"
	@echo ""
	@echo "$(BLUE)Deployment:$(NC)"
	@echo "  make auto-deploy            - Automated git sync + CI/CD trigger"
	@echo "  make deploy-status          - Check deployment status"
	@echo "  make sync                   - Manual git sync"
	@echo "  make deploy                 - Push Africoin to Sui Localnet"
	@echo ""
	@echo "$(BLUE)Configuration:$(NC)"
	@echo "  make check-secrets          - Verify environment variables"
	@echo "  make preflight              - Run pre-deployment checklist"

# 🚀 HYBRID DEV COMMAND
dev:
	@echo "$(GREEN)🚀 Starting Hybrid Development Stack...$(NC)"
	@mkdir -p /tmp/africa-railways/logs
	@# Serve entire frontend directory (includes all HTML apps)
	@echo "$(BLUE)📱 Starting Frontend Server (port 3000)...$(NC)"
	@python3 -m http.server 3000 --directory . > /tmp/africa-railways/logs/frontend.log 2>&1 &
	@# Start iPad Control Center on dedicated port
	@echo "$(BLUE)📱 Starting iPad Control Center (port 8082)...$(NC)"
	@python3 -m http.server 8082 --directory . > /tmp/africa-railways/logs/ipad.log 2>&1 &
	@# Launch Go services with AIR (Hot Reload)
	@$(MAKE) -j 2 run-backend run-engine
	@echo "$(GREEN)✅ All services started!$(NC)"
	@echo "$(BLUE)Frontend URLs:$(NC)"
	@echo "  • Main App:     http://localhost:3000"
	@echo "  • iPad Center:  http://localhost:8082/ipad-control-center.html"
	@echo "  • Live Feed:    http://localhost:3000/live-feed.html"
	@echo "  • Dashboard:    http://localhost:3000/dashboard.html"
	@echo "  • Mobile:       http://localhost:3000/mobile.html"

# Hot-Reloading Logic
run-backend:
	@echo "$(BLUE)🔧 Starting backend with Air (hot-reload)...$(NC)"
	@cd backend && air -c .air.toml > /tmp/africa-railways/logs/backend.log 2>&1

run-engine:
	@echo "$(BLUE)⚙️  Starting spine engine with Air (hot-reload)...$(NC)"
	@cd backend/cmd/spine_engine && air -c .air.toml > /tmp/africa-railways/logs/spine.log 2>&1

status:
	@echo "$(BLUE)📊 Service Status$(NC)"
	@for port in 3000 8080 8081 9000 9123 8082; do \
		if curl -s --connect-timeout 2 http://localhost:$$port >/dev/null 2>&1; then \
			printf "$(GREEN)✅ Port %-5s: Service running$(NC)\n" $$port; \
		else \
			printf "$(RED)❌ Port %-5s: Service down$(NC)\n" $$port; \
		fi; \
	done
	@echo ""
	@echo "$(BLUE)🔧 System Info$(NC)"
	@if command -v go >/dev/null 2>&1; then \
		echo "Go: $$(go version)"; \
	else \
		echo "Go: Not installed"; \
	fi
	@echo "Git: $$(git --version 2>/dev/null || echo 'Not available')"

logs:
	@echo "$(BLUE)📋 Choose log to view:$(NC)"
	@echo "  (1) Sui Blockchain"
	@echo "  (2) Backend API"
	@echo "  (3) Spine Engine"
	@echo "  (4) Frontend"
	@echo "  (5) iPad Control Center"
	@echo "  (6) Startup Script"
	@echo "  (7) All Logs"
	@read -p "Choice: " choice; \
	case $$choice in \
		1) tail -f /tmp/africa-railways/logs/sui.log ;; \
		2) tail -f /tmp/africa-railways/logs/backend.log ;; \
		3) tail -f /tmp/africa-railways/logs/spine.log ;; \
		4) tail -f /tmp/africa-railways/logs/frontend.log ;; \
		5) tail -f /tmp/africa-railways/logs/ipad.log ;; \
		6) tail -f /tmp/africa-railways/logs/startup.log ;; \
		7) tail -f /tmp/africa-railways/logs/*.log ;; \
		*) echo "$(RED)Invalid choice$(NC)" ;; \
	esac

stop:
	@echo "$(RED)🛑 Stopping all services...$(NC)"
	@pkill -f "air" || true
	@pkill -f "python3 -m http.server" || true
	@pkill -f "sui start" || true
	@echo "$(GREEN)✅ All services stopped$(NC)"

deploy:
	@echo "$(GREEN)⛓️ Deploying Africoin to Sui...$(NC)"
	@cd sui/africoin && sui move build && sui client publish --gas-budget 100000000

sync:
	@echo "$(BLUE)🚀 Starting Sync Process...$(NC)"
	@git add .
	@git commit -m "Manual sync: $$(date '+%Y-%m-%d %H:%M:%S')" || echo "$(YELLOW)No changes to commit$(NC)"
	@git push origin main
	@echo "$(GREEN)✅ Sync complete! Codespaces can now pull and Vercel is building.$(NC)"

# Automated deployment with CI/CD trigger
auto-deploy:
	@echo "$(BLUE)📤 Syncing and Triggering Automated Deployment...$(NC)"
	@git add .
	@git commit -m "Automated Deploy: $$(date '+%Y-%m-%d %H:%M:%S')" || echo "$(YELLOW)No changes to commit$(NC)"
	@git push origin main
	@echo "$(GREEN)🚀 GitHub Actions is now building your latest changes!$(NC)"
	@echo "$(BLUE)📊 Monitor builds:$(NC)"
	@echo "  • GitHub Actions: https://github.com/mpolobe/africa-railways/actions"
	@echo "  • EAS Builds: https://expo.dev/accounts/mpolobe/projects/africa-railways/builds"
	@echo ""
	@echo "$(YELLOW)💡 Tip: Use 'make deploy-status' to check deployment status$(NC)"

# Check deployment status
deploy-status:
	@echo "$(BLUE)📊 Checking Deployment Status...$(NC)"
	@echo ""
	@echo "$(GREEN)Latest Commits:$(NC)"
	@git log --oneline -5
	@echo ""
	@echo "$(GREEN)Branch Status:$(NC)"
	@git status -sb
	@echo ""
	@echo "$(BLUE)🔗 Quick Links:$(NC)"
	@echo "  • GitHub Actions: https://github.com/mpolobe/africa-railways/actions"
	@echo "  • EAS Builds: https://expo.dev/accounts/mpolobe/projects/africa-railways/builds"
	@echo "  • Repository: https://github.com/mpolobe/africa-railways"

clean:
	@echo "$(BLUE)🧹 Cleaning build artifacts...$(NC)"
	@rm -rf backend/bin
	@rm -rf backend/tmp
	@rm -rf backend/cmd/spine_engine/tmp
	@rm -rf /tmp/africa-railways/logs/*.log
	@echo "$(GREEN)✅ Clean complete$(NC)"

build-backend-optimized:
	@echo "$(BLUE)🔨 Building optimized backend binary...$(NC)"
	@mkdir -p bin
	@cd backend && go build \
		-ldflags="-s -w -X main.version=$$(git rev-parse --short HEAD) -X main.buildTime=$$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
		-trimpath \
		-o ../bin/sovereign-engine \
		main.go reports.go
	@echo ""
	@echo "$(GREEN)✅ Build complete!$(NC)"
	@echo "Binary size:"
	@ls -lh bin/sovereign-engine
	@echo ""
	@echo "Optimization flags used:"
	@echo "  -ldflags=\"-s -w\"  : Strip debug info (30-40% smaller)"
	@echo "  -trimpath          : Remove file system paths"
	@echo "  -X main.version    : Embed git commit"
	@echo "  -X main.buildTime  : Embed build timestamp"

# Check secrets and environment configuration
check-secrets:
	@echo "$(BLUE)🔍 Checking Environment Configuration...$(NC)"
	@echo "======================================"
	@echo ""
	@echo "$(BLUE)📱 SMS Provider Configuration:$(NC)"
	@if [ -n "$$TWILIO_ACCOUNT_SID" ]; then \
		echo "$(GREEN)✅ TWILIO_ACCOUNT_SID: $${TWILIO_ACCOUNT_SID:0:8}...$${TWILIO_ACCOUNT_SID: -4}$(NC)"; \
	else \
		echo "$(RED)❌ TWILIO_ACCOUNT_SID not set$(NC)"; \
	fi
	@if [ -n "$$TWILIO_AUTH_TOKEN" ]; then \
		echo "$(GREEN)✅ TWILIO_AUTH_TOKEN: $${TWILIO_AUTH_TOKEN:0:4}...$${TWILIO_AUTH_TOKEN: -4}$(NC)"; \
	else \
		echo "$(RED)❌ TWILIO_AUTH_TOKEN not set$(NC)"; \
	fi
	@if [ -n "$$TWILIO_MESSAGING_SERVICE_SID" ]; then \
		echo "$(GREEN)✅ TWILIO_MESSAGING_SERVICE_SID: $${TWILIO_MESSAGING_SERVICE_SID:0:8}...$${TWILIO_MESSAGING_SERVICE_SID: -4}$(NC)"; \
	else \
		echo "$(YELLOW)⚠️  TWILIO_MESSAGING_SERVICE_SID not set (optional)$(NC)"; \
	fi
	@if [ -n "$$TWILIO_NUMBER" ]; then \
		echo "$(GREEN)✅ TWILIO_NUMBER: $$TWILIO_NUMBER$(NC)"; \
	else \
		echo "$(YELLOW)⚠️  TWILIO_NUMBER not set (optional if using Messaging Service)$(NC)"; \
	fi
	@echo ""
	@if [ -n "$$AT_API_KEY" ]; then \
		echo "$(GREEN)✅ AT_API_KEY: $${AT_API_KEY:0:4}...$${AT_API_KEY: -4}$(NC)"; \
	else \
		echo "$(YELLOW)⚠️  AT_API_KEY not set (Africa's Talking not configured)$(NC)"; \
	fi
	@if [ -n "$$AT_USERNAME" ]; then \
		echo "$(GREEN)✅ AT_USERNAME: $$AT_USERNAME$(NC)"; \
	else \
		echo "$(YELLOW)⚠️  AT_USERNAME not set$(NC)"; \
	fi
	@echo ""
	@echo "$(BLUE)🔧 Backend Configuration:$(NC)"
	@if [ -n "$$BACKEND_PORT" ]; then \
		echo "$(GREEN)✅ BACKEND_PORT: $$BACKEND_PORT$(NC)"; \
	else \
		echo "$(YELLOW)⚠️  BACKEND_PORT not set (will use default: 8080)$(NC)"; \
	fi
	@echo ""
	@echo "$(BLUE)📊 Summary:$(NC)"
	@echo "======================================"
	@if [ -n "$$TWILIO_ACCOUNT_SID" ] && [ -n "$$TWILIO_AUTH_TOKEN" ]; then \
		echo "$(GREEN)✅ Twilio: Ready$(NC)"; \
	else \
		echo "$(RED)❌ Twilio: Not configured$(NC)"; \
	fi
	@if [ -n "$$AT_API_KEY" ] && [ -n "$$AT_USERNAME" ]; then \
		echo "$(GREEN)✅ Africa's Talking: Ready$(NC)"; \
	else \
		echo "$(YELLOW)⚠️  Africa's Talking: Not configured$(NC)"; \
	fi
	@echo ""

# Pre-flight check before deployment
preflight:
	@echo "$(GREEN)🚀 Pre-Flight Checklist$(NC)"
	@echo "======================================"
	@echo ""
	@echo "$(BLUE)Step 1: Environment Configuration$(NC)"
	@$(MAKE) check-secrets
	@echo ""
	@echo "$(BLUE)Step 2: File Verification$(NC)"
	@if [ -f backend/.env ]; then \
		echo "$(GREEN)✅ backend/.env exists$(NC)"; \
	else \
		echo "$(RED)❌ backend/.env missing$(NC)"; \
	fi
	@if [ -f setup-twilio.sh ]; then \
		echo "$(GREEN)✅ setup-twilio.sh exists$(NC)"; \
	else \
		echo "$(RED)❌ setup-twilio.sh missing$(NC)"; \
	fi
	@if [ -f backend/onboarding.go ]; then \
		echo "$(GREEN)✅ backend/onboarding.go exists$(NC)"; \
	else \
		echo "$(RED)❌ backend/onboarding.go missing$(NC)"; \
	fi
	@echo ""
	@echo "$(BLUE)Step 3: Port Availability$(NC)"
	@for port in 8080 8082; do \
		if lsof -Pi :$$port -sTCP:LISTEN -t >/dev/null 2>&1; then \
			echo "$(YELLOW)⚠️  Port $$port is in use$(NC)"; \
		else \
			echo "$(GREEN)✅ Port $$port is available$(NC)"; \
		fi; \
	done
	@echo ""
	@echo "$(BLUE)Step 4: Go Dependencies$(NC)"
	@if command -v go >/dev/null 2>&1; then \
		echo "$(GREEN)✅ Go installed: $$(go version)$(NC)"; \
	else \
		echo "$(RED)❌ Go not installed$(NC)"; \
	fi
	@echo ""
	@echo "$(GREEN)✅ Pre-flight check complete!$(NC)"
	@echo ""
	@echo "$(BLUE)📋 Next Steps:$(NC)"
	@echo "1. Run: make dev"
	@echo "2. Open: http://localhost:8082/ipad-control-center.html"
	@echo "3. Test onboarding with your phone number"
	@echo ""

.DEFAULT_GOAL := help

# Run the ticket simulation
simulate:
	@echo "🎟️  Minting Africoin Ticket..."
	@if command -v go >/dev/null 2>&1; then \
		go run backend/cmd/spine_engine/simulate_ticket.go; \
	else \
		echo "⚠️  Go not found, using shell version..."; \
		./backend/cmd/spine_engine/simulate_ticket.sh; \
	fi
	@echo "✅ Simulation event sent to engine."

# 📱 MOBILE APP BUILDS
build-railways-android:
	@echo "$(BLUE)🚂 Building Africa Railways Android...$(NC)"
	@./build-scripts/build-railways-android.sh

build-railways-ios:
	@echo "$(BLUE)🚂 Building Africa Railways iOS...$(NC)"
	@./build-scripts/build-railways-ios.sh

build-all-apps:
	@echo "$(GREEN)📱 Building All Mobile Apps...$(NC)"
	@$(MAKE) build-railways-android
	@$(MAKE) build-railways-ios
	@echo "$(GREEN)✅ All builds submitted!$(NC)"

# 🔄 MONITORING & STABILITY
health-check:
	@./monitoring/health-check.sh

supervisor:
	@echo "$(GREEN)🔄 Starting Service Supervisor...$(NC)"
	@./monitoring/supervisor.sh

cleanup-logs:
	@./monitoring/cleanup-logs.sh

monitor:
	@echo "$(BLUE)📊 System Monitor$(NC)"
	@echo ""
	@./monitoring/health-check.sh
	@echo ""
	@echo "$(BLUE)Recent Logs:$(NC)"
	@tail -20 logs/backend.log 2>/dev/null || echo "No backend logs"

audit:
	@echo "$(CYAN)🔍 Running System Audit...$(NC)"
	@./monitoring/system-audit.sh

# 📱 EAS BUILD COMMANDS
eas-build:
	@echo "$(GREEN)📱 EAS Build Helper$(NC)"
	@./scripts/eas-build.sh

eas-configure:
	@echo "$(BLUE)⚙️  Configuring EAS Build...$(NC)"
	@eas build:configure

eas-android:
	@echo "$(BLUE)🤖 Building Android with EAS (Local)...$(NC)"
	@mkdir -p builds
	@eas build --platform android --local --profile preview --output ./builds/android-preview.apk
	@echo "$(GREEN)✅ Android build complete: ./builds/android-preview.apk$(NC)"

eas-ios:
	@echo "$(BLUE)🍎 Building iOS with EAS (Local)...$(NC)"
	@if [ "$$(uname)" != "Darwin" ]; then \
		echo "$(RED)❌ iOS builds require macOS$(NC)"; \
		exit 1; \
	fi
	@mkdir -p builds
	@eas build --platform ios --local --profile preview --output ./builds/ios-preview.ipa
	@echo "$(GREEN)✅ iOS build complete: ./builds/ios-preview.ipa$(NC)"

eas-status:
	@echo "$(BLUE)📊 EAS Build Status$(NC)"
	@eas build:list --limit 10

eas-login:
	@echo "$(BLUE)🔐 Logging into Expo...$(NC)"
	@eas login

eas-whoami:
	@echo "$(BLUE)👤 Current Expo User:$(NC)"
	@eas whoami || echo "$(RED)Not logged in$(NC)"
