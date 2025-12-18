# Africoin Tech Staff Onboarding

Welcome to the Digital Spine. Your goal is to maintain the bridge between the SADC/Saharan rail hardware and the Sui Ledger.

## 🛠️ Environment Setup
1. **Sui CLI:** Install the latest Sui binaries to interact with the `rail_manifest` package.
2. **Go 1.21+:** Required for the telemetry ingestion engine.
3. **Local Dev:** Run a local Sui explorer to monitor test transactions.

## 🏗️ Technical Standards
- **Root-First Execution:** All scripts must execute from the project root.
- **Move Safety:** Every freight ton must be represented by a unique object ID. No "ghost freight" allowed.
- **Heartbeat CSS:** Do not modify the `.sentinel-logo` animation class without approval, as it indicates system uptime for field workers.

## 🛰️ Integration Points
- **Telemetry API:** POST your JSON payloads to `/api/ingest`.
- **Sentinel Rewards:** The `payout_sentinel` function triggers upon 3/3 validator consensus.

## 🤖 First-Contact Logic (AI Welcome)
- **Trigger:** First WebSocket handshake post-zkLogin.
- **Content:** Pulled from APP_CONFIG.json.
- **Action:** Create a sub-account in Digits AI for the new worker.
