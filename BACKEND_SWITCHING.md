# 🔌 Automatic Backend Switching Guide

## Overview

Your apps automatically connect to the correct backend based on which app is running:

- **Railways App** → `https://africa-railways.vercel.app`
- **Africoin App** → `https://africoin-wallet.vercel.app`

## How It Works

### Detection Method

The app detects which variant is running by checking the `slug` in the configuration:

```javascript
import Constants from 'expo-constants';

const IS_RAILWAYS = Constants.expoConfig?.slug === 'africa-railways';
```

### Automatic URL Switching

```javascript
const API_URL = IS_RAILWAYS
  ? 'https://africa-railways.vercel.app'
  : 'https://africoin-wallet.vercel.app';
```

## Implementation

### 1. Updated reporting_tool.js

Location: `mobile/src/logic/reporting_tool.js`

**Key Features:**
- ✅ Automatic backend detection
- ✅ Slug-based switching
- ✅ WebSocket support
- ✅ Health checks
- ✅ Error handling

**Usage:**
```javascript
import { sendReport, getReports, checkHealth } from './logic/reporting_tool';

// Automatically uses correct backend
const result = await sendReport(reportData);
const reports = await getReports();
const health = await checkHealth();
```

### 2. Configuration

**Railways App (slug: 'africa-railways'):**
```javascript
{
  appName: 'Railways',
  apiUrl: 'https://africa-railways.vercel.app',
  wsUrl: 'wss://africa-railways.vercel.app'
}
```

**Africoin App (slug: 'africoin-app'):**
```javascript
{
  appName: 'Africoin',
  apiUrl: 'https://africoin-wallet.vercel.app',
  wsUrl: 'wss://africoin-wallet.vercel.app'
}
```

## API Functions

### sendReport(report)

Send a report to the backend.

```javascript
import { sendReport } from './logic/reporting_tool';

const report = {
  type: 'track_inspection',
  location: 'Lusaka Central',
  status: 'active',
  data: { /* ... */ }
};

try {
  const result = await sendReport(report);
  console.log('Report sent:', result);
} catch (error) {
  console.error('Failed:', error);
}
```

**Endpoint:** `POST /api/report`

**Headers:**
- `Content-Type: application/json`
- `X-App-Name: Railways` or `Africoin`

### getReports()

Fetch reports from the backend.

```javascript
import { getReports } from './logic/reporting_tool';

try {
  const reports = await getReports();
  console.log(`Fetched ${reports.length} reports`);
} catch (error) {
  console.error('Failed:', error);
}
```

**Endpoint:** `GET /api/reports`

**Returns:** Array of report objects

### checkHealth()

Check backend health status.

```javascript
import { checkHealth } from './logic/reporting_tool';

try {
  const health = await checkHealth();
  console.log('Backend status:', health.status);
} catch (error) {
  console.error('Health check failed:', error);
}
```

**Endpoint:** `GET /api/health`

**Returns:**
```javascript
{
  status: 'ok',
  event_count: 10,
  timestamp: '2024-12-21T...'
}
```

### connectWebSocket(onMessage)

Connect to WebSocket for real-time updates.

```javascript
import { connectWebSocket } from './logic/reporting_tool';

const ws = connectWebSocket((message) => {
  console.log('Received:', message);
});

// Clean up when done
ws.close();
```

**Endpoint:** `WS /ws`

**Authentication:**
```javascript
{
  type: 'auth',
  appName: 'Railways',
  slug: 'africa-railways'
}
```

### getCurrentBackend()

Get current backend configuration.

```javascript
import { getCurrentBackend } from './logic/reporting_tool';

const backend = getCurrentBackend();
console.log('Connected to:', backend.apiUrl);
```

**Returns:**
```javascript
{
  appName: 'Railways',
  isRailways: true,
  slug: 'africa-railways',
  apiUrl: 'https://africa-railways.vercel.app',
  wsUrl: 'wss://africa-railways.vercel.app'
}
```

## Usage Examples

### Example 1: Simple Report Submission

```javascript
import React, { useState } from 'react';
import { View, Button, Text } from 'react-native';
import { sendReport, IS_RAILWAYS } from './logic/reporting_tool';

export default function ReportScreen() {
  const [status, setStatus] = useState('');

  const handleSubmit = async () => {
    try {
      const report = {
        type: IS_RAILWAYS ? 'track_inspection' : 'transaction',
        location: 'Test Location',
        status: 'active'
      };

      const result = await sendReport(report);
      setStatus('✅ Report sent successfully');
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
    }
  };

  return (
    <View>
      <Button title="Send Report" onPress={handleSubmit} />
      <Text>{status}</Text>
    </View>
  );
}
```

### Example 2: Display Reports

```javascript
import React, { useEffect, useState } from 'react';
import { View, FlatList, Text } from 'react-native';
import { getReports } from './logic/reporting_tool';

export default function ReportsScreen() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await getReports();
      setReports(data);
    } catch (error) {
      console.error('Failed to load reports:', error);
    }
  };

  return (
    <FlatList
      data={reports}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View>
          <Text>{item.node_location}</Text>
          <Text>Status: {item.status}</Text>
        </View>
      )}
    />
  );
}
```

### Example 3: Real-time Updates

```javascript
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { connectWebSocket } from './logic/reporting_tool';

export default function LiveUpdatesScreen() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const ws = connectWebSocket((message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => ws.close();
  }, []);

  return (
    <View>
      {messages.map((msg, index) => (
        <Text key={index}>{JSON.stringify(msg)}</Text>
      ))}
    </View>
  );
}
```

### Example 4: Health Check

```javascript
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { checkHealth, APP_NAME } from './logic/reporting_tool';

export default function StatusScreen() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const data = await checkHealth();
        setHealth(data);
      } catch (error) {
        setHealth({ status: 'error', message: error.message });
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, []);

  return (
    <View>
      <Text>{APP_NAME} Backend Status</Text>
      <Text>Status: {health?.status || 'Checking...'}</Text>
    </View>
  );
}
```

## Backend Requirements

### Railways Backend

**Base URL:** `https://africa-railways.vercel.app`

**Required Endpoints:**
- `POST /api/report` - Accept reports
- `GET /api/reports` - Return reports list
- `GET /api/health` - Health check
- `WS /ws` - WebSocket connection

### Africoin Backend

**Base URL:** `https://africoin-wallet.vercel.app`

**Required Endpoints:**
- `POST /api/report` - Accept transactions
- `GET /api/reports` - Return transaction history
- `GET /api/health` - Health check
- `WS /ws` - WebSocket connection

## Testing

### Test Backend Switching

```javascript
import { getCurrentBackend, IS_RAILWAYS, APP_NAME } from './logic/reporting_tool';

console.log('App Name:', APP_NAME);
console.log('Is Railways:', IS_RAILWAYS);
console.log('Backend:', getCurrentBackend());
```

**Expected Output (Railways):**
```
App Name: Railways
Is Railways: true
Backend: {
  appName: 'Railways',
  apiUrl: 'https://africa-railways.vercel.app',
  ...
}
```

**Expected Output (Africoin):**
```
App Name: Africoin
Is Railways: false
Backend: {
  appName: 'Africoin',
  apiUrl: 'https://africoin-wallet.vercel.app',
  ...
}
```

### Test API Calls

```javascript
import { checkHealth } from './logic/reporting_tool';

// Test connection
checkHealth()
  .then(data => console.log('✅ Connected:', data))
  .catch(error => console.error('❌ Failed:', error));
```

## Exported Constants

```javascript
import {
  IS_RAILWAYS,  // boolean: true if Railways app
  APP_NAME,     // string: 'Railways' or 'Africoin'
  API_URL,      // string: Base API URL
  WS_URL        // string: WebSocket URL
} from './logic/reporting_tool';
```

## Console Logs

The module logs connection information:

```
🔌 Railways app connecting to: https://africa-railways.vercel.app
📡 Railways sending report to: https://africa-railways.vercel.app/api/report
✅ Report sent successfully
💚 Railways backend health: ok
```

## Error Handling

All functions include try-catch blocks and throw errors:

```javascript
try {
  await sendReport(data);
} catch (error) {
  // error.message contains the error description
  console.error('Failed:', error.message);
}
```

## Next Steps

1. ✅ Backend switching implemented
2. ✅ API functions ready
3. ✅ Example components created
4. ⚠️ Deploy backends to Vercel
5. ⚠️ Test with both apps
6. ⚠️ Implement error recovery

## Files Modified

- ✅ `mobile/src/logic/reporting_tool.js` - Updated with automatic switching
- ✅ `mobile/src/examples/BackendConnectionExample.js` - Example component

## Documentation

- ✅ `BACKEND_SWITCHING.md` - This file
- ✅ `APP_CONFIG_README.md` - App configuration
- ✅ `BUILD_VARIANTS.md` - Build instructions

---

**Your apps now automatically connect to the correct backend!** 🔌✨
