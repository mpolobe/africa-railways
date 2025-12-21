# Gitpod Development Environment

This repository is configured for one-click development in Gitpod.

## Quick Start

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/mpolobe/africa-railways)

## What Gets Set Up Automatically

When you open this project in Gitpod, the following happens automatically:

### 1. Environment Setup
- Go development environment
- Node.js 18 LTS
- Rust and Cargo
- Sui CLI (blockchain development)
- PostgreSQL database
- All project dependencies installed
- Go modules initialized

### 2. Services Started
- **Backend API** on port 8080
- **Frontend Dashboard** on port 3000
- **Test Environment** ready in split terminal

### 3. VS Code Extensions
- Go language support
- TypeScript/JavaScript support
- Prettier code formatter
- ESLint
- Live Server
- Docker support
- GitLens

## Available Ports

| Port | Service | Description |
|------|---------|-------------|
| 8080 | Backend API | Spine Engine & Health Check |
| 3000 | Frontend | Dashboard & Static Files |
| 9000 | Sui RPC | Sui blockchain RPC node |
| 9123 | Sui Faucet | Local testnet faucet |
| 5432 | PostgreSQL | Database server |
| 5500 | Live Server | Development Server |

## Quick Commands

Use the Makefile for common tasks:

```bash
# Show all available commands
make help

# Install dependencies
make install

# Build all services
make build

# Run tests
make test

# Run tests with coverage
make test-coverage

# Start backend server
make backend

# Start frontend server
make frontend

# Start both (development mode)
make dev

# Format code
make format

# Run linters
make lint

# Clean build artifacts
make clean

# Check service status
make status
```

## Manual Service Control

### Backend Server
```bash
cd backend/cmd/spine_engine
go run main.go
```

### Frontend Server
```bash
python3 -m http.server 3000
```

### Run Tests
```bash
# All tests
make test

# Backend tests
cd backend/cmd/spine_engine
go test -v

# Voice AI Classifier tests
cd server
go test -v voice_ai_classifier.go voice_ai_classifier_test.go

# Sui Move contract tests
make sui-test
```

### Sui Blockchain Development
```bash
# Install Sui CLI (if not already installed)
make sui-install

# Start local Sui network
make sui-start

# Build Move contracts
make sui-build

# Test Move contracts
make sui-test

# Publish contracts to local network
make sui-publish

# Open Sui client console
make sui-client
```

### Database Management
```bash
# Start PostgreSQL
make postgres-start

# Check PostgreSQL status
make postgres-status

# Stop PostgreSQL
make postgres-stop
```

## Accessing Services

Gitpod automatically exposes ports and provides URLs:

1. Click on the **Ports** tab in the terminal panel
2. Find the service you want to access
3. Click the **Open Browser** or **Open Preview** button

Or use the command palette:
- Press `Cmd/Ctrl + Shift + P`
- Type "Ports: Focus on Ports View"

## Development Workflow

### 1. Make Changes
Edit files in the VS Code editor. Changes are automatically saved.

### 2. Test Changes
```bash
make test
```

### 3. Run Locally
```bash
make dev
```

### 4. Commit Changes
```bash
git add .
git commit -m "Your commit message"
git push
```

## Prebuilds

This repository is configured with GitHub prebuilds, which means:

- Faster workspace startup times
- Dependencies pre-installed
- Build artifacts cached
- Automatic prebuild on push to main branch

## Troubleshooting

### Port Already in Use
If a port is already in use, kill the process:
```bash
# Find process using port 8080
lsof -ti:8080 | xargs kill -9

# Or for port 3000
lsof -ti:3000 | xargs kill -9
```

### Go Module Issues
```bash
cd backend
go mod tidy
go mod download
```

### Node Module Issues
```bash
cd mobile
rm -rf node_modules package-lock.json
npm install
```

### Restart Workspace
If things get really stuck:
1. Click on your avatar (top right)
2. Select "Stop Workspace"
3. Restart the workspace from Gitpod dashboard

## Environment Variables

Create a `.env` file in the project root if needed:

```bash
# Backend configuration
PORT=8080
LOG_LEVEL=debug

# Database (if needed)
DATABASE_URL=postgresql://user:pass@localhost:5432/africoin
```

## iPad/Tablet Access

Gitpod works great on iPad:

1. Open the Gitpod URL in Safari
2. Services are accessible via the exposed ports
3. Use the built-in terminal for commands
4. Full VS Code experience in the browser

## Workspace Timeout

- Free tier: 50 hours/month
- Workspace stops after 30 minutes of inactivity
- All changes are saved and persisted
- Restart anytime from Gitpod dashboard

## Custom Configuration

### Modify Startup Tasks
Edit `.gitpod.yml` to customize what runs on startup.

### Add VS Code Extensions
Add extension IDs to the `vscode.extensions` section in `.gitpod.yml`.

### Change Port Configuration
Modify the `ports` section in `.gitpod.yml`.

## Resources

- [Gitpod Documentation](https://www.gitpod.io/docs)
- [Go Documentation](https://go.dev/doc/)
- [Project README](./README.md)
- [Architecture Guide](./ARCHITECTURE.md)

## Support

For issues specific to the Gitpod setup, please open an issue on GitHub with the `gitpod` label.
