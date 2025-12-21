.PHONY: help build test run clean dev backend frontend

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)Africa Railways - Development Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

install: ## Install all dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	cd backend && go mod download
	cd server && go mod download
	cd mobile && npm install
	@echo "$(GREEN)✅ Dependencies installed$(NC)"

build: ## Build all services
	@echo "$(BLUE)Building backend services...$(NC)"
	cd backend && go build -o bin/backend ./main.go
	cd backend/cmd/spine_engine && go build -o ../../bin/spine_engine ./main.go
	@echo "$(GREEN)✅ Build complete$(NC)"

test: ## Run all tests
	@echo "$(BLUE)Running tests...$(NC)"
	cd backend/cmd/spine_engine && go test -v
	cd server && go test -v voice_ai_classifier.go voice_ai_classifier_test.go
	@echo "$(GREEN)✅ All tests passed$(NC)"

test-coverage: ## Run tests with coverage
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	cd backend/cmd/spine_engine && go test -v -coverprofile=coverage.out
	cd backend/cmd/spine_engine && go tool cover -html=coverage.out -o coverage.html
	@echo "$(GREEN)✅ Coverage report generated: backend/cmd/spine_engine/coverage.html$(NC)"

backend: ## Run backend server
	@echo "$(BLUE)Starting backend server on :8080...$(NC)"
	cd backend/cmd/spine_engine && go run main.go

frontend: ## Run frontend server
	@echo "$(BLUE)Starting frontend server on :3000...$(NC)"
	python3 -m http.server 3000

dev: ## Run both backend and frontend in development mode
	@echo "$(BLUE)Starting development environment...$(NC)"
	@make -j2 backend frontend

clean: ## Clean build artifacts
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	rm -rf backend/bin
	rm -rf backend/cmd/spine_engine/coverage.*
	rm -rf server/go.sum
	rm -rf backend/go.sum
	@echo "$(GREEN)✅ Clean complete$(NC)"

lint: ## Run linters
	@echo "$(BLUE)Running linters...$(NC)"
	cd backend && go vet ./...
	cd server && go vet ./...
	@echo "$(GREEN)✅ Linting complete$(NC)"

format: ## Format code
	@echo "$(BLUE)Formatting code...$(NC)"
	cd backend && go fmt ./...
	cd server && go fmt ./...
	@echo "$(GREEN)✅ Formatting complete$(NC)"

docker-build: ## Build Docker image
	@echo "$(BLUE)Building Docker image...$(NC)"
	docker build -t africa-railways:latest .
	@echo "$(GREEN)✅ Docker image built$(NC)"

docker-run: ## Run Docker container
	@echo "$(BLUE)Running Docker container...$(NC)"
	docker run -p 8080:8080 africa-railways:latest

status: ## Show service status
	@echo "$(BLUE)Service Status:$(NC)"
	@echo "Backend API: http://localhost:8080"
	@echo "Frontend: http://localhost:3000"
	@echo ""
	@echo "$(YELLOW)Check if services are running:$(NC)"
	@curl -s http://localhost:8080/api/health || echo "Backend: Not running"
	@curl -s http://localhost:3000 > /dev/null && echo "Frontend: Running" || echo "Frontend: Not running"

logs: ## Show logs (requires services to be running)
	@echo "$(BLUE)Showing logs...$(NC)"
	@tail -f /tmp/*.log 2>/dev/null || echo "No logs found"

sui-install: ## Install Sui CLI
	@echo "$(BLUE)Installing Sui CLI...$(NC)"
	@if command -v sui &> /dev/null; then \
		echo "$(YELLOW)Sui CLI already installed: $$(sui --version)$(NC)"; \
	else \
		cargo install --locked --git https://github.com/MystenLabs/sui.git --branch mainnet sui; \
		echo "$(GREEN)✅ Sui CLI installed$(NC)"; \
	fi

sui-start: ## Start local Sui network with faucet
	@echo "$(BLUE)Starting Sui local network...$(NC)"
	@echo "This will start:"
	@echo "  - Sui RPC on port 9000"
	@echo "  - Sui Faucet on port 9123"
	@sui start --with-faucet --force-regenesis

sui-client: ## Open Sui client console
	@echo "$(BLUE)Opening Sui client...$(NC)"
	@sui client

sui-build: ## Build Sui Move contracts
	@echo "$(BLUE)Building Sui Move contracts...$(NC)"
	@if [ -d "contracts" ]; then \
		cd contracts && sui move build; \
		echo "$(GREEN)✅ Contracts built$(NC)"; \
	else \
		echo "$(YELLOW)No contracts directory found$(NC)"; \
	fi

sui-test: ## Test Sui Move contracts
	@echo "$(BLUE)Testing Sui Move contracts...$(NC)"
	@if [ -d "contracts" ]; then \
		cd contracts && sui move test; \
		echo "$(GREEN)✅ Contract tests complete$(NC)"; \
	else \
		echo "$(YELLOW)No contracts directory found$(NC)"; \
	fi

sui-publish: ## Publish Sui Move contracts (requires local network)
	@echo "$(BLUE)Publishing Sui Move contracts...$(NC)"
	@if [ -d "contracts" ]; then \
		cd contracts && sui client publish --gas-budget 100000000; \
		echo "$(GREEN)✅ Contracts published$(NC)"; \
	else \
		echo "$(YELLOW)No contracts directory found$(NC)"; \
	fi

postgres-start: ## Start PostgreSQL service
	@echo "$(BLUE)Starting PostgreSQL...$(NC)"
	@sudo service postgresql start
	@echo "$(GREEN)✅ PostgreSQL started$(NC)"

postgres-stop: ## Stop PostgreSQL service
	@echo "$(BLUE)Stopping PostgreSQL...$(NC)"
	@sudo service postgresql stop
	@echo "$(GREEN)✅ PostgreSQL stopped$(NC)"

postgres-status: ## Check PostgreSQL status
	@echo "$(BLUE)PostgreSQL Status:$(NC)"
	@sudo service postgresql status

.DEFAULT_GOAL := help
