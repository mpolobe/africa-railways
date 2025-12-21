# Africa Railways Development Environment Architecture

## Complete Stack Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GITPOD CLOUD WORKSPACE                           │
│                   (One-Click Development)                           │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DOCKER CONTAINER                               │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  Base: gitpod/workspace-full                                  │ │
│  │  • Ubuntu Linux                                               │ │
│  │  • Git, Docker, VS Code Server                                │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  DEVELOPMENT TOOLS                                            │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │ │
│  │  │   Go 1.21+  │  │ Node.js 18  │  │ Rust/Cargo  │          │ │
│  │  │   Backend   │  │  Frontend   │  │ Blockchain  │          │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │ │
│  │                                                                │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │ │
│  │  │  Sui CLI    │  │ PostgreSQL  │  │   Python3   │          │ │
│  │  │  Blockchain │  │  Database   │  │   Scripts   │          │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        RUNNING SERVICES                             │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Backend API (Go)                          Port 8080          │ │
│  │  • Spine Engine                                               │ │
│  │  • Health Check: /api/health                                  │ │
│  │  • Sentinel Reports: /api/v1/sentinel/report                  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Frontend (Static)                         Port 3000          │ │
│  │  • Dashboard UI                                               │ │
│  │  • Sentinel Portal                                            │ │
│  │  • Mobile Interface                                           │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Sui Blockchain (Optional)                                    │ │
│  │  • RPC Node                                Port 9000          │ │
│  │  • Faucet                                  Port 9123          │ │
│  │  • Local testnet with genesis                                │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  PostgreSQL Database                       Port 5432          │ │
│  │  • Database: africoin                                         │ │
│  │  • User: africoin                                             │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SMART CONTRACTS                                │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  AFRC Token (Sui Move)                                        │ │
│  │  • contracts/spine_token/sources/afrc.move                    │ │
│  │  • 6 decimals precision                                       │ │
│  │  • Shared treasury for minting                                │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Railway Ticketing (Sui Move)                                 │ │
│  │  • contracts/sources/ticket.move                              │ │
│  │  • Multi-country routing                                      │ │
│  │  • Automatic revenue splitting                                │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Service Communication Flow

```
┌──────────────┐
│   Browser    │
│  (Any Device)│
└──────┬───────┘
       │
       │ HTTPS
       ▼
┌──────────────────────────────────────────────────────────┐
│              Gitpod Public URLs                          │
│  • https://8080-[workspace].gitpod.io  (Backend)        │
│  • https://3000-[workspace].gitpod.io  (Frontend)       │
│  • https://9000-[workspace].gitpod.io  (Sui RPC)        │
└──────────────────────────────────────────────────────────┘
       │
       │ Port Forwarding
       ▼
┌──────────────────────────────────────────────────────────┐
│           Workspace Internal Network                     │
│                                                          │
│  Frontend (3000) ──────┐                                │
│                        │                                 │
│                        ▼                                 │
│                  Backend API (8080)                      │
│                        │                                 │
│                        ├──────► PostgreSQL (5432)        │
│                        │                                 │
│                        └──────► Sui RPC (9000)           │
│                                      │                   │
│                                      └──► Faucet (9123)  │
└──────────────────────────────────────────────────────────┘
```

## Development Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│  1. CLICK "OPEN IN GITPOD" BADGE                                │
│     • Workspace starts automatically                            │
│     • Docker container builds (or uses prebuild)                │
│     • All dependencies installed                                │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. AUTOMATIC INITIALIZATION                                    │
│     ✓ Go modules downloaded                                     │
│     ✓ Node.js packages installed                                │
│     ✓ Sui CLI installed (cached)                                │
│     ✓ PostgreSQL started                                        │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. SERVICES AUTO-START                                         │
│     ✓ Backend API running on port 8080                          │
│     ✓ Frontend server on port 3000                              │
│     ✓ Test environment ready                                    │
│     ✓ Sui blockchain ready (optional start)                     │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. DEVELOP & TEST                                              │
│     • Edit code in VS Code                                      │
│     • Run: make test                                            │
│     • Build: make build                                         │
│     • Deploy contracts: make sui-publish                        │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. COMMIT & PUSH                                               │
│     • git add .                                                 │
│     • git commit -m "message"                                   │
│     • git push                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## File Structure

```
africa-railways/
├── .gitpod.yml              # Gitpod configuration
├── .gitpod.Dockerfile       # Custom Docker image
├── Makefile                 # 24 development commands
│
├── backend/                 # Go backend services
│   ├── main.go             # Main backend server
│   ├── cmd/
│   │   └── spine_engine/   # Spine engine service
│   │       ├── main.go
│   │       └── main_test.go
│   └── pkg/
│       └── models/         # Data models
│
├── server/                  # Lambda functions
│   ├── lambda_main.go      # AWS Lambda handler
│   ├── voice_ai_classifier.go
│   └── voice_ai_classifier_test.go
│
├── contracts/               # Sui Move smart contracts
│   ├── sources/
│   │   └── ticket.move     # Railway ticketing
│   └── spine_token/
│       └── sources/
│           └── afrc.move   # AFRC token
│
├── mobile/                  # React Native mobile app
│   ├── App.js
│   └── package.json
│
├── docs/                    # Documentation
│   ├── GITPOD_SETUP.md     # Gitpod guide
│   ├── SUI_DEVELOPMENT.md  # Blockchain guide
│   ├── SETUP_SUMMARY.md    # Setup overview
│   └── ENVIRONMENT_DIAGRAM.md  # This file
│
└── frontend/                # Static web files
    ├── index.html          # Main landing page
    ├── dashboard.html      # Sentinel dashboard
    └── mobile.html         # Mobile interface
```

## Technology Stack Details

### Backend (Go)
- **Version:** 1.21+
- **Framework:** Standard library (net/http)
- **Testing:** Go testing package
- **Tools:** gopls, delve, staticcheck, golangci-lint

### Frontend (Web)
- **HTML5** with modern CSS
- **Vanilla JavaScript** (no framework)
- **Python HTTP Server** for development
- **Responsive Design** for mobile/tablet

### Blockchain (Sui)
- **Language:** Move
- **Network:** Local testnet / Mainnet
- **CLI:** Sui CLI (latest)
- **Contracts:** AFRC token, Railway ticketing

### Database (PostgreSQL)
- **Version:** Latest stable
- **Database:** africoin
- **User:** africoin
- **Port:** 5432

### Mobile (React Native)
- **Framework:** React Native
- **Platform:** iOS & Android
- **Package Manager:** npm

## Quick Reference

### Start Everything
```bash
make dev              # Backend + Frontend
make sui-start        # Sui blockchain (separate terminal)
make postgres-start   # PostgreSQL
```

### Run Tests
```bash
make test             # All tests
make test-coverage    # With coverage
make sui-test         # Smart contract tests
```

### Build & Deploy
```bash
make build            # Build all services
make sui-build        # Build contracts
make sui-publish      # Deploy to blockchain
```

### Check Status
```bash
make status           # Service status
make postgres-status  # Database status
sui client envs       # Blockchain environments
```

## Access Points

### From Browser
- **Frontend:** Click port 3000 in Gitpod Ports panel
- **Backend API:** Click port 8080 in Gitpod Ports panel
- **Sui RPC:** Click port 9000 in Gitpod Ports panel

### From Command Line
```bash
# Preview in browser
gp preview http://localhost:3000

# Get public URL
gp url 8080
```

### From External Tools
Use the public URLs provided by Gitpod:
```
https://8080-[workspace-id].gitpod.io
https://3000-[workspace-id].gitpod.io
https://9000-[workspace-id].gitpod.io
```

## Resource Usage

### Gitpod Free Tier
- **50 hours/month** of workspace time
- **30 minutes** idle timeout
- **4 cores, 8GB RAM** per workspace
- **Unlimited** public repositories

### Workspace Lifecycle
1. **Starting:** 30-60 seconds (with prebuilds)
2. **Running:** Active development
3. **Idle:** After 30 minutes of inactivity
4. **Stopped:** Can restart anytime
5. **Deleted:** After 14 days of inactivity

## Best Practices

### 1. Use Prebuilds
- Enabled for main branch and PRs
- Speeds up workspace startup
- Caches dependencies and builds

### 2. Commit Frequently
- Changes persist in workspace
- Push to GitHub for backup
- Use feature branches

### 3. Stop When Done
- Saves workspace hours
- Workspace state preserved
- Restart anytime

### 4. Use Make Commands
- Consistent across team
- Documented and tested
- Easy to remember

---

For detailed guides, see:
- [GITPOD_SETUP.md](GITPOD_SETUP.md) - Complete Gitpod guide
- [SUI_DEVELOPMENT.md](SUI_DEVELOPMENT.md) - Blockchain development
- [SETUP_SUMMARY.md](SETUP_SUMMARY.md) - Setup overview
