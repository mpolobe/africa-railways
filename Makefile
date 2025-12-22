.PHONY: help dev backend engine status stop clean logs deploy sync

# Colors
GREEN = \033[0;32m
BLUE = \033[0;34m
RED = \033[0;31m
YELLOW = \033[0;33m
NC = \033[0m

help:
	@echo "$(GREEN)🌍 Africa Railways - 2025 Hybrid Suite$(NC)"
	@echo "  make dev    - Start everything with Hot-Reload (iPad Ready)"
	@echo "  make status - Check all ports (3000, 8080, 8081, 9000, 8082)"
	@echo "  make logs   - Interactive iPad log viewer"
	@echo "  make deploy - Push Africoin to Sui Localnet"
	@echo "  make sync   - Git add, commit, and push (iPad friendly)"

# 🚀 HYBRID DEV COMMAND
dev:
	@echo "$(GREEN)🚀 Starting Hybrid Development Stack...$(NC)"
	@# Start the iPad Control Center (8082) & Frontend (3000)
	@python3 -m http.server 8082 --directory . > /tmp/africa-railways/logs/ipad.log 2>&1 &
	@python3 -m http.server 3000 --directory . > /tmp/africa-railways/logs/frontend.log 2>&1 &
	@# Launch Go services with AIR (Hot Reload)
	@$(MAKE) -j 2 run-backend run-engine

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

clean:
	@echo "$(BLUE)🧹 Cleaning build artifacts...$(NC)"
	@rm -rf backend/bin
	@rm -rf backend/tmp
	@rm -rf backend/cmd/spine_engine/tmp
	@rm -rf /tmp/africa-railways/logs/*.log
	@echo "$(GREEN)✅ Clean complete$(NC)"

.DEFAULT_GOAL := help
