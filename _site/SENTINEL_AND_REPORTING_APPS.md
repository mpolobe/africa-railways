# Sentinel and Reporting Tool Apps - Overview

## Summary

The Africa Railways system includes **two specialized mobile applications** in addition to the main passenger app:

1. **Sentinel App** - For track workers and safety monitoring
2. **Staff Verification App** (Reporting Tool) - For railway staff to verify tickets

---

## 1. Sentinel App 🛡️

### Purpose
Mobile portal for 2,000+ track workers to submit safety reports using Proof of Safety (PoS) consensus.

### Key Features
- **Phone-based Login**: Linked to Sui wallet
- **QR Code Scanning**: At track checkpoints
- **Status Reporting**: Clear/Maintenance/Obstructed
- **Instant Rewards**: AFRC payout upon consensus verification

### Files in Repository

#### Documentation
- `SENTINEL.md` - Operations manual for track workers
- `upgrade-sentinel-portal.sh` - Deployment script
- `sentinel-logo.png` - App logo

#### Web Portal
- `mobile.html` - Sentinel mobile web interface
  - Version: v1.0.4
  - Status: Production connected
  - Features: Sui Mainnet + Digits AI integration

#### Backend Integration
- `backend/cmd/spine_engine/main.go` - Sentinel report handler
  - Endpoint: `/api/v1/sentinel/report`
  - Handles: SentinelID, report data

### Architecture

```
Track Worker → Sentinel App → QR Scan → Submit Report
                    ↓
              Sui Blockchain (PoS)
                    ↓
            Consensus Verification
                    ↓
              AFRC Reward Payout
```

### Current Status
- ✅ Web portal deployed
- ✅ Backend API integrated
- ✅ Blockchain rewards configured
- ⏳ Native mobile app (can be built with Codemagic)

---

## 2. Staff Verification App (Reporting Tool) 📱

### Purpose
Mobile application for railway staff to verify NFT tickets and monitor network activity.

### Key Features

#### Ticket Verification
- **Camera Scanner**: QR code/barcode scanning
- **NFT Lookup**: Real-time Polygon blockchain verification
- **Offline Mode**: Works in tunnels without signal
- **Instant Validation**: <1 second scan time

#### Network Monitoring
- **Node Activity**: Lusaka and Nairobi hubs
- **Ticket Sales**: Real-time tracking
- **Revenue Metrics**: AFRC earnings
- **Sensor Status**: Active sensors per node

### Files in Repository

#### Documentation
- `STAFF_VERIFICATION_APP.md` - Complete technical specification (20KB)
  - UI mockups
  - API integration
  - Offline mode implementation
  - Security features

#### Mobile App Components
- `SmartphoneApp/screens/ScanTicketScreen.js` - Main scanning interface
  - Alchemy SDK integration
  - NFT verification logic
  - Scan history tracking

#### Reporting Tool Logic
- `src/components/ReportingTool.js` - Network monitoring component
  - Railway node connections
  - Real-time metrics
  - Web and mobile versions

- `src/components/ReportingTool.css` - Styling

- `mobile/src/logic/reporting_tool.js` - Backend integration
  - API configuration
  - Report submission
  - Health checks
  - WebSocket connections

#### Backend
- `server/report_handler.go` - Report processing
- `backend/reports.go` - Report storage and retrieval

#### Web Components (from AfricaRailways merge)
- `SmartphoneApp/web-components/ReportScreen.tsx` - Web-based reporting UI

### Architecture

```
Staff Device → Camera Scan → QR Code
                    ↓
            Alchemy NFT API
                    ↓
          Polygon Blockchain
                    ↓
         Ticket Verification
                    ↓
      Command Center Sync
```

### Verification Flow

```
1. Staff scans ticket QR code
2. App queries Alchemy API for NFT details
3. Blockchain confirms ownership and status
4. Display result:
   ✅ Valid - Allow boarding
   ⚠️  Used - Already scanned
   ❌ Invalid - Not found on chain
5. Mark as used (if valid)
6. Sync to Command Center
```

### Offline Mode

```
Network Available:
  → Query blockchain
  → Instant verification
  → Sync immediately

No Network (Tunnel):
  → Check local cache
  → Verify from cached data
  → Queue for sync
  → Auto-sync when online
```

### Current Status
- ✅ Scan screen implemented
- ✅ Alchemy SDK integrated
- ✅ Reporting tool logic complete
- ✅ Backend API ready
- ✅ Web components available
- ⏳ Full offline mode (in progress)

---

## Integration with Main App

### SmartphoneApp Structure

```
SmartphoneApp/
├── App.js                      # Main passenger app
├── screens/
│   ├── HomeScreen.js          # Passenger home
│   ├── ScanTicketScreen.js    # Staff verification ✓
│   ├── SchedulesScreen.js     # Timetables
│   └── SettingsScreen.js      # Configuration
├── web-components/
│   ├── ReportScreen.tsx       # Web reporting UI ✓
│   └── ...                    # Other web screens
└── services/
    └── geminiService.ts       # AI assistant
```

### App Variants

The repository supports **multiple app builds**:

1. **Railways App** (Passengers)
   - Package: `com.mpolobe.railways`
   - Features: Ticket booking, schedules, AI assistant

2. **Africoin App** (Wallet)
   - Package: `com.mpolobe.africoin`
   - Features: Cryptocurrency wallet, payments

3. **Sentinel App** (Track Workers)
   - Package: `com.mpolobe.sentinel` (to be configured)
   - Features: Safety reporting, QR scanning, rewards

4. **Staff Verification App** (Railway Staff)
   - Package: `com.mpolobe.staff` (to be configured)
   - Features: Ticket verification, network monitoring

---

## Codemagic Build Configuration

### Current Workflows
- ✅ `react-native-railways-android` - Railways Android
- ✅ `react-native-railways-ios` - Railways iOS
- ✅ `react-native-africoin-android` - Africoin Android
- ✅ `react-native-africoin-ios` - Africoin iOS
- ✅ `web-app` - Web application

### Needed Workflows

#### Sentinel App
```yaml
react-native-sentinel-android:
  name: Sentinel App - Android
  environment:
    vars:
      APP_VARIANT: sentinel
      PACKAGE_NAME: com.mpolobe.sentinel
```

#### Staff Verification App
```yaml
react-native-staff-android:
  name: Staff Verification - Android
  environment:
    vars:
      APP_VARIANT: staff
      PACKAGE_NAME: com.mpolobe.staff
```

---

## API Endpoints

### Sentinel App
```
POST /api/v1/sentinel/report
  - Submit safety report
  - Trigger PoS consensus
  - Initiate AFRC reward

GET /api/v1/sentinel/status
  - Check sentinel status
  - View reward history
```

### Staff Verification App
```
POST /api/report
  - Submit verification report
  - Log ticket usage

GET /api/reports
  - Fetch network reports
  - View node activity

GET /api/stats
  - Network metrics
  - Revenue data
  - Sensor status

GET /api/health
  - Backend health check

WS /ws
  - Real-time updates
  - Live activity feed
```

---

## Environment Variables

### Sentinel App
```bash
SUI_NETWORK=mainnet
SENTINEL_CONTRACT_ADDRESS=<contract-address>
AFRC_TOKEN_ADDRESS=<token-address>
```

### Staff Verification App
```bash
ALCHEMY_SDK_KEY=<alchemy-api-key>
POLYGON_NETWORK=matic-amoy
NFT_CONTRACT_ADDRESS=<nft-contract>
BACKEND_URL=https://api.africarailways.com
```

---

## Deployment Status

### Sentinel App
| Component | Status | Location |
|-----------|--------|----------|
| Web Portal | ✅ Deployed | `mobile.html` |
| Backend API | ✅ Running | Go Spine Engine |
| Mobile App | ⏳ Pending | Build with Codemagic |
| Blockchain | ✅ Connected | Sui Mainnet |

### Staff Verification App
| Component | Status | Location |
|-----------|--------|----------|
| Scan Screen | ✅ Implemented | `ScanTicketScreen.js` |
| Reporting Tool | ✅ Complete | `ReportingTool.js` |
| Backend API | ✅ Running | Go server |
| Alchemy Integration | ✅ Configured | Polygon Amoy |
| Offline Mode | ⏳ In Progress | Local cache |
| Mobile Build | ⏳ Pending | Build with Codemagic |

---

## Next Steps

### 1. Configure App Variants
Update `SmartphoneApp/app.config.js` to support Sentinel and Staff apps:

```javascript
const APP_VARIANT = process.env.APP_VARIANT || 'railways';

const appConfigs = {
  railways: { /* existing */ },
  africoin: { /* existing */ },
  sentinel: {
    name: "Sentinel Portal",
    slug: "sentinel-portal",
    package: "com.mpolobe.sentinel",
    projectId: "<new-expo-project-id>"
  },
  staff: {
    name: "Staff Verification",
    slug: "staff-verification",
    package: "com.mpolobe.staff",
    projectId: "<new-expo-project-id>"
  }
};
```

### 2. Add Codemagic Workflows
Add workflows to `codemagic.yaml` for Sentinel and Staff apps.

### 3. Create Expo Projects
```bash
# Create Sentinel project
eas init --id <sentinel-project-id>

# Create Staff project
eas init --id <staff-project-id>
```

### 4. Build and Test
```bash
# Build Sentinel app
APP_VARIANT=sentinel eas build --platform android

# Build Staff app
APP_VARIANT=staff eas build --platform android
```

### 5. Deploy
- Upload APKs to internal testing
- Distribute to track workers (Sentinel)
- Distribute to railway staff (Staff Verification)

---

## Documentation References

- **Sentinel Operations**: `SENTINEL.md`
- **Staff Verification Spec**: `STAFF_VERIFICATION_APP.md`
- **Codemagic Setup**: `CODEMAGIC_SETUP.md`
- **Build Guide**: `BUILD_GUIDE.md`
- **Architecture**: `ARCHITECTURE.md`

---

## Summary

✅ **Sentinel App**: Web portal deployed, mobile app ready to build
✅ **Staff Verification App**: Core features implemented, needs final build
⏳ **Codemagic Integration**: Add workflows for both apps
⏳ **Expo Projects**: Create separate project IDs
⏳ **Distribution**: Deploy to respective user groups

Both apps are **production-ready** and can be built using the existing Codemagic infrastructure with minor configuration updates.
