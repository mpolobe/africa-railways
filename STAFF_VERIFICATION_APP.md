# 📱 Staff Verification App - Technical Specification

## Overview

The Staff Verification App is a mobile application for railway staff to verify NFT tickets. Since passengers use USSD, staff need a simple app to scan and validate tickets on-chain.

---

## 🎯 Key Features

### 1. Camera Scanner
- **QR Code Scanning:** Instant camera-based scanning
- **Fast Recognition:** < 1 second scan time
- **Low Light Support:** Works in dim train environments
- **Multiple Format Support:** QR codes, barcodes, NFC

### 2. Alchemy NFT Lookup
- **Real-time Verification:** Queries Polygon blockchain instantly
- **NFT Status Check:** Valid, used, expired, or invalid
- **Passenger Details:** Name, route, seat, class
- **Transaction History:** View ticket usage history

### 3. Offline Mode
- **Local Cache:** Stores recent verifications
- **Tunnel Operation:** Works in areas without signal
- **Auto-Sync:** Syncs with Command Center when back online
- **Conflict Resolution:** Handles duplicate scans

---

## 🎨 Scan Result UI

### Success Screen

```
┌─────────────────────────────────────┐
│  ✅ VALID TICKET                    │
├─────────────────────────────────────┤
│                                     │
│  Ticket #TKT1024                    │
│  Route: JHB → CPT                   │
│  Class: Standard                    │
│  Seat: 14A                          │
│                                     │
│  Passenger: John Doe                │
│  Phone: +27123456789                │
│                                     │
│  Departure: Dec 24, 2025 10:00 AM   │
│  Status: ✅ Valid                   │
│                                     │
│  NFT Address:                       │
│  0x742d...f0bEb1                    │
│                                     │
│  Verified on Polygon                │
│  Block: 12345678                    │
│                                     │
│  [MARK AS USED]  [VIEW DETAILS]     │
│                                     │
└─────────────────────────────────────┘
```

### Already Used Screen

```
┌─────────────────────────────────────┐
│  ⚠️  TICKET ALREADY USED            │
├─────────────────────────────────────┤
│                                     │
│  Ticket #TKT1024                    │
│  Route: JHB → CPT                   │
│                                     │
│  ❌ This ticket was already scanned │
│                                     │
│  Used by: Staff ID #456             │
│  Location: Platform 3               │
│  Time: Dec 24, 2025 09:45 AM        │
│                                     │
│  [VIEW HISTORY]  [REPORT ISSUE]     │
│                                     │
└─────────────────────────────────────┘
```

### Invalid Ticket Screen

```
┌─────────────────────────────────────┐
│  ❌ INVALID TICKET                  │
├─────────────────────────────────────┤
│                                     │
│  This ticket is not valid           │
│                                     │
│  Reason: NFT not found on chain     │
│                                     │
│  Scanned Data:                      │
│  TKT9999                            │
│                                     │
│  [SCAN AGAIN]  [REPORT FRAUD]       │
│                                     │
└─────────────────────────────────────┘
```

### Offline Mode Screen

```
┌─────────────────────────────────────┐
│  📡 OFFLINE MODE                    │
├─────────────────────────────────────┤
│                                     │
│  Ticket #TKT1024                    │
│  Route: JHB → CPT                   │
│                                     │
│  ⚠️  No network connection          │
│                                     │
│  Cached verification:               │
│  ✅ Valid (last checked 5 min ago)  │
│                                     │
│  Will sync when online              │
│  Pending syncs: 3                   │
│                                     │
│  [MARK AS USED]  [CACHE INFO]       │
│                                     │
└─────────────────────────────────────┘
```

---

## 🔧 Technical Architecture

### Frontend (React Native / Flutter)

```
Staff App
├── Camera Module
│   ├── QR Scanner
│   ├── Barcode Reader
│   └── NFC Reader
│
├── Verification Module
│   ├── Alchemy API Client
│   ├── Blockchain Query
│   └── NFT Validator
│
├── Offline Module
│   ├── Local Database (SQLite)
│   ├── Cache Manager
│   └── Sync Engine
│
└── UI Components
    ├── Scan Screen
    ├── Result Screen
    ├── History Screen
    └── Settings Screen
```

### Backend Integration

```
Staff App → Alchemy API → Polygon Blockchain
         ↓
    Command Center
         ↓
    Sync Database
```

---

## 📡 API Integration

### 1. Alchemy NFT API

**Get NFT Details:**
```javascript
const alchemyURL = "https://polygon-amoy.g.alchemy.com/v2/YOUR_API_KEY";

async function getNFTDetails(contractAddress, tokenId) {
    const response = await fetch(alchemyURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "alchemy_getNFTMetadata",
            params: [{
                contractAddress: contractAddress,
                tokenId: tokenId
            }]
        })
    });
    
    const data = await response.json();
    return data.result;
}
```

**Check NFT Ownership:**
```javascript
async function verifyNFTOwnership(contractAddress, tokenId, ownerAddress) {
    const response = await fetch(alchemyURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "alchemy_getOwnersForToken",
            params: [{
                contractAddress: contractAddress,
                tokenId: tokenId
            }]
        })
    });
    
    const data = await response.json();
    return data.result.owners.includes(ownerAddress);
}
```

### 2. Command Center API

**Mark Ticket as Used:**
```javascript
async function markTicketUsed(ticketId, staffId, location) {
    const response = await fetch('https://africarailways.com/api/tickets/use', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${staffToken}`
        },
        body: JSON.stringify({
            ticket_id: ticketId,
            staff_id: staffId,
            location: location,
            timestamp: new Date().toISOString()
        })
    });
    
    return await response.json();
}
```

**Sync Offline Verifications:**
```javascript
async function syncOfflineVerifications(verifications) {
    const response = await fetch('https://africarailways.com/api/tickets/sync', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${staffToken}`
        },
        body: JSON.stringify({
            verifications: verifications
        })
    });
    
    return await response.json();
}
```

---

## 💾 Offline Mode Implementation

### Local Database Schema

```sql
-- Cached Tickets
CREATE TABLE cached_tickets (
    ticket_id TEXT PRIMARY KEY,
    nft_address TEXT,
    passenger_name TEXT,
    route TEXT,
    seat TEXT,
    class TEXT,
    departure_time INTEGER,
    status TEXT,
    metadata_json TEXT,
    cached_at INTEGER,
    expires_at INTEGER
);

-- Pending Verifications
CREATE TABLE pending_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT,
    staff_id TEXT,
    location TEXT,
    action TEXT,
    timestamp INTEGER,
    synced INTEGER DEFAULT 0
);

-- Verification History
CREATE TABLE verification_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT,
    staff_id TEXT,
    location TEXT,
    action TEXT,
    timestamp INTEGER,
    online INTEGER
);
```

### Cache Strategy

```javascript
class TicketCache {
    constructor() {
        this.db = openDatabase();
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
    }
    
    async cacheTicket(ticket) {
        const expiresAt = Date.now() + this.cacheExpiry;
        
        await this.db.execute(
            'INSERT OR REPLACE INTO cached_tickets VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                ticket.id,
                ticket.nftAddress,
                ticket.passengerName,
                ticket.route,
                ticket.seat,
                ticket.class,
                ticket.departureTime,
                ticket.status,
                JSON.stringify(ticket.metadata),
                Date.now(),
                expiresAt
            ]
        );
    }
    
    async getCachedTicket(ticketId) {
        const result = await this.db.query(
            'SELECT * FROM cached_tickets WHERE ticket_id = ? AND expires_at > ?',
            [ticketId, Date.now()]
        );
        
        return result.length > 0 ? result[0] : null;
    }
    
    async clearExpiredCache() {
        await this.db.execute(
            'DELETE FROM cached_tickets WHERE expires_at < ?',
            [Date.now()]
        );
    }
}
```

### Sync Engine

```javascript
class SyncEngine {
    constructor() {
        this.db = openDatabase();
        this.syncInterval = 5 * 60 * 1000; // 5 minutes
    }
    
    async syncPendingVerifications() {
        const pending = await this.db.query(
            'SELECT * FROM pending_verifications WHERE synced = 0'
        );
        
        if (pending.length === 0) return;
        
        try {
            const result = await syncOfflineVerifications(pending);
            
            if (result.success) {
                await this.db.execute(
                    'UPDATE pending_verifications SET synced = 1 WHERE synced = 0'
                );
                
                console.log(`Synced ${pending.length} verifications`);
            }
        } catch (error) {
            console.error('Sync failed:', error);
        }
    }
    
    startAutoSync() {
        setInterval(() => {
            if (navigator.onLine) {
                this.syncPendingVerifications();
            }
        }, this.syncInterval);
    }
}
```

---

## 🎨 UI Components (React Native)

### Scan Screen

```jsx
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Camera } from 'react-native-camera';

function ScanScreen() {
    const [scanning, setScanning] = useState(true);
    
    const handleBarCodeRead = async (event) => {
        if (!scanning) return;
        
        setScanning(false);
        const ticketId = event.data;
        
        // Verify ticket
        const result = await verifyTicket(ticketId);
        
        // Navigate to result screen
        navigation.navigate('Result', { ticket: result });
    };
    
    return (
        <View style={styles.container}>
            <Camera
                style={styles.camera}
                onBarCodeRead={handleBarCodeRead}
            />
            <View style={styles.overlay}>
                <Text style={styles.instruction}>
                    Scan QR Code on Ticket
                </Text>
            </View>
        </View>
    );
}
```

### Result Screen

```jsx
function ResultScreen({ route }) {
    const { ticket } = route.params;
    
    const getStatusColor = (status) => {
        switch (status) {
            case 'valid': return '#4CAF50';
            case 'used': return '#FF9800';
            case 'invalid': return '#F44336';
            default: return '#9E9E9E';
        }
    };
    
    const getStatusIcon = (status) => {
        switch (status) {
            case 'valid': return '✅';
            case 'used': return '⚠️';
            case 'invalid': return '❌';
            default: return '❓';
        }
    };
    
    return (
        <View style={styles.container}>
            <View style={[styles.header, { backgroundColor: getStatusColor(ticket.status) }]}>
                <Text style={styles.headerText}>
                    {getStatusIcon(ticket.status)} {ticket.status.toUpperCase()} TICKET
                </Text>
            </View>
            
            <View style={styles.details}>
                <DetailRow label="Ticket #" value={ticket.id} />
                <DetailRow label="Route" value={ticket.route} />
                <DetailRow label="Class" value={ticket.class} />
                <DetailRow label="Seat" value={ticket.seat} />
                <DetailRow label="Passenger" value={ticket.passengerName} />
                <DetailRow label="Phone" value={ticket.phone} />
                <DetailRow label="Departure" value={formatDate(ticket.departureTime)} />
                <DetailRow label="NFT Address" value={shortenAddress(ticket.nftAddress)} />
            </View>
            
            {ticket.status === 'valid' && (
                <Button
                    title="MARK AS USED"
                    onPress={() => markAsUsed(ticket.id)}
                    style={styles.primaryButton}
                />
            )}
            
            {ticket.status === 'used' && (
                <View style={styles.usedInfo}>
                    <Text>Used by: Staff ID #{ticket.usedBy}</Text>
                    <Text>Location: {ticket.usedLocation}</Text>
                    <Text>Time: {formatDate(ticket.usedAt)}</Text>
                </View>
            )}
        </View>
    );
}
```

---

## 🔐 Security Features

### 1. Staff Authentication

```javascript
async function authenticateStaff(staffId, pin) {
    const response = await fetch('https://africarailways.com/api/staff/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            staff_id: staffId,
            pin: pin
        })
    });
    
    const data = await response.json();
    
    if (data.success) {
        await SecureStore.setItemAsync('staff_token', data.token);
        await SecureStore.setItemAsync('staff_id', staffId);
        return true;
    }
    
    return false;
}
```

### 2. Encrypted Local Storage

```javascript
import * as SecureStore from 'expo-secure-store';

async function saveSecurely(key, value) {
    await SecureStore.setItemAsync(key, value);
}

async function getSecurely(key) {
    return await SecureStore.getItemAsync(key);
}
```

### 3. Audit Logging

```javascript
async function logVerification(ticket, action, result) {
    const log = {
        ticket_id: ticket.id,
        staff_id: await getSecurely('staff_id'),
        action: action,
        result: result,
        timestamp: new Date().toISOString(),
        location: await getCurrentLocation(),
        device_id: await getDeviceId()
    };
    
    await saveToLocalLog(log);
    await sendToCommandCenter(log);
}
```

---

## 📊 Analytics & Reporting

### Staff Dashboard

```
┌─────────────────────────────────────┐
│  Staff Dashboard                    │
├─────────────────────────────────────┤
│                                     │
│  Today's Activity                   │
│  ─────────────────                  │
│  Tickets Scanned: 156               │
│  Valid: 142 (91%)                   │
│  Used: 12 (8%)                      │
│  Invalid: 2 (1%)                    │
│                                     │
│  Offline Scans: 8                   │
│  Pending Sync: 0                    │
│                                     │
│  Last Sync: 2 minutes ago           │
│                                     │
│  [VIEW HISTORY]  [SYNC NOW]         │
│                                     │
└─────────────────────────────────────┘
```

---

## 🚀 Deployment

### Build Configuration

**Android (build.gradle):**
```gradle
android {
    defaultConfig {
        applicationId "com.africarailways.staff"
        minSdkVersion 21
        targetSdkVersion 33
        versionCode 1
        versionName "1.0.0"
    }
    
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt')
        }
    }
}
```

**iOS (Info.plist):**
```xml
<key>NSCameraUsageDescription</key>
<string>Camera access is required to scan ticket QR codes</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>Location is used to track verification locations</string>
```

### Distribution

1. **Internal Testing:** TestFlight (iOS) / Internal Testing (Android)
2. **Beta Release:** Limited staff rollout
3. **Production:** Full deployment to all staff devices

---

## 📱 Device Requirements

### Minimum Requirements

- **OS:** Android 8.0+ / iOS 12.0+
- **Camera:** 5MP+ with autofocus
- **Storage:** 100MB free space
- **RAM:** 2GB+
- **Network:** 3G/4G/5G or WiFi (offline mode available)

### Recommended Devices

- **Android:** Samsung Galaxy A series, Google Pixel
- **iOS:** iPhone 8 or newer

---

## 🎓 Staff Training

### Quick Start Guide

1. **Login:** Enter Staff ID and PIN
2. **Scan:** Point camera at QR code
3. **Verify:** Check ticket status
4. **Action:** Mark as used if valid
5. **Sync:** App syncs automatically when online

### Common Scenarios

**Scenario 1: Valid Ticket**
- Scan QR code
- See ✅ VALID TICKET
- Tap "MARK AS USED"
- Allow passenger to board

**Scenario 2: Already Used**
- Scan QR code
- See ⚠️ TICKET ALREADY USED
- Check usage details
- Report to supervisor if suspicious

**Scenario 3: Invalid Ticket**
- Scan QR code
- See ❌ INVALID TICKET
- Do not allow boarding
- Report fraud if suspected

**Scenario 4: Offline Mode**
- Scan QR code
- See 📡 OFFLINE MODE
- Check cached status
- Mark as used (will sync later)

---

## 🔄 Future Enhancements

### Phase 2 Features

- [ ] NFC tap verification
- [ ] Facial recognition for passenger verification
- [ ] Multi-language support
- [ ] Voice commands for hands-free operation
- [ ] Integration with conductor devices
- [ ] Real-time passenger count
- [ ] Route deviation alerts

### Phase 3 Features

- [ ] AR overlay for seat guidance
- [ ] Predictive analytics for fraud detection
- [ ] Integration with train systems
- [ ] Automated reporting
- [ ] Biometric authentication for staff

---

## 📊 Success Metrics

### KPIs to Track

- **Scan Speed:** < 1 second average
- **Accuracy:** > 99% correct verifications
- **Offline Success:** > 95% offline verifications successful
- **Sync Rate:** > 99% successful syncs
- **Staff Adoption:** > 90% daily active users
- **Fraud Detection:** Track invalid ticket attempts

---

## 🎉 Summary

The Staff Verification App provides:

✅ **Fast Scanning:** < 1 second QR code recognition
✅ **Real-time Verification:** Instant blockchain lookup via Alchemy
✅ **Offline Support:** Works in tunnels and remote areas
✅ **Simple UI:** Clear status indicators (✅ ⚠️ ❌)
✅ **Auto-Sync:** Seamless sync with Command Center
✅ **Secure:** Staff authentication and audit logging

**This completes the passenger-to-staff verification loop!**

---

**Next Steps:**
1. Build React Native app
2. Integrate Alchemy NFT API
3. Implement offline mode
4. Deploy to test devices
5. Train staff
6. Roll out to production
