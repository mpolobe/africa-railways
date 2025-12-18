# The Digital Spine Architecture

## 1. Go Ingestion Engine
Processes real-time telemetry from locomotives using a high-throughput Go backend.
- **Input:** GPS, Fuel levels, Track vibration, Load weight.
- **Buffer:** Redis-backed queue for 0.1ms latency.
- **Output:** Verified data packets signed for Sui.

## 2. Sui Move Ledger
Every freight manifest is a Unique Digital Object on the Sui blockchain.
- **Packages:** `rail_manifest`, `ticket_asset`, `sentinel_reward`.
- **Security:** Move's resource safety prevents double-spending of train tickets.

## 3. Sovereign PoS
Regional hubs (Lusaka, Lagos, Nairobi) act as validators to ensure continental data sovereignty.
