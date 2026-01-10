# Sentinel Mobile App - Deployment Guide

## Overview
The Sentinel Portal mobile app allows railway sentinels to submit alerts, reports, and status updates directly to the admin dashboard.

## Features

### ✅ Alert Submission
- **Alert Types:** Safety, Maintenance, Passenger, Emergency
- **Priority Levels:** Low, Medium, High, Critical
- **Location Tracking:** Automatic GPS coordinates
- **Real-time Notifications:** Alerts instantly appear on admin dashboard

### ✅ Status Updates
- Online/Offline/Away status
- Shift start/end reporting
- Location tracking

### ✅ Backend Integration
- Connects to `/api/sentinel/alert` endpoint
- Connects to `/api/sentinel/status` endpoint
- Connects to `/api/sentinel/location` endpoint
- Real-time synchronization with dashboard

## Build Configuration

### App Details
- **Name:** Sentinel Portal
- **Package:** com.mpolobe.sentinel
- **Bundle ID:** com.mpolobe.sentinel
- **Slug:** sentinel-portal

### Build Profiles (eas.json)
```json
{
  "sentinel": {
    "extends": "production",
    "android": {
      "buildType": "apk"
    },
    "env": {
      "APP_VARIANT": "sentinel",
      "BACKEND_URL": "$BACKEND_URL",
      "API_KEY": "$SENTINEL_API_KEY"
    }
  }
}
```

## Local Testing

### Prerequisites
1. Node.js 18+ installed
2. Expo CLI installed: `npm install -g expo-cli`
3. Expo Go app on your mobile device
4. Backend server running

### Start Development Server
```bash
./build-sentinel.sh local
```

Or manually:
```bash
cd SmartphoneApp
APP_VARIANT=sentinel npx expo start
```

### Test Alert Submission
1. Open app in Expo Go
2. Navigate to Alert Submission screen
3. Fill in alert details
4. Submit alert
5. Check admin dashboard for notification

## Building for Production

### Android Build

#### Via Build Script
```bash
export EXPO_TOKEN=your_expo_token_here
./build-sentinel.sh android
```

#### Via EAS CLI
```bash
cd SmartphoneApp
export EXPO_TOKEN=your_expo_token_here
APP_VARIANT=sentinel eas build --platform android --profile sentinel --non-interactive
```

### iOS Build

#### Via Build Script
```bash
export EXPO_TOKEN=your_expo_token_here
./build-sentinel.sh ios
```

#### Via EAS CLI
```bash
cd SmartphoneApp
export EXPO_TOKEN=your_expo_token_here
APP_VARIANT=sentinel eas build --platform ios --profile sentinel --non-interactive
```

### Build Both Platforms
```bash
export EXPO_TOKEN=your_expo_token_here
./build-sentinel.sh both
```

## CodeMagic Deployment

### Automatic Builds
CodeMagic is configured to automatically build the Sentinel app when:
1. Code is pushed to `main` or `develop` branches
2. A tag matching `sentinel-*` is created

### Trigger Build with Tag
```bash
git tag -a sentinel-v1.0.0 -m "Sentinel Portal v1.0.0"
git push origin sentinel-v1.0.0
```

### CodeMagic Workflows
- **Android:** `react-native-sentinel-android`
- **iOS:** `react-native-sentinel-ios`

### Required Environment Variables in CodeMagic
Add these to the `railways_credentials` group:
- `EXPO_TOKEN` - Your Expo authentication token
- `BACKEND_URL` - Backend API URL (e.g., https://api.africarailways.com)
- `SENTINEL_API_KEY` - API key for sentinel authentication

### Get EXPO_TOKEN
```bash
npx expo login
npx expo whoami
# Token is stored in ~/.expo/state.json
```

## API Integration

### Submit Alert
```javascript
const response = await fetch(`${BACKEND_URL}/api/sentinel/alert`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    sentinel_id: 'sentinel-001',
    sentinel_name: 'John Mwamba',
    type: 'safety',
    priority: 'high',
    title: 'Track Obstruction',
    description: 'Large debris on track',
    location: 'Kapiri Mposhi Station',
    route: 'Lusaka-Livingstone',
    latitude: -13.9714,
    longitude: 28.6821
  })
});
```

### Update Status
```javascript
const response = await fetch(`${BACKEND_URL}/api/sentinel/status`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    sentinel_id: 'sentinel-001',
    sentinel_name: 'John Mwamba',
    status: 'online',
    location: 'Kapiri Mposhi Station',
    route: 'Lusaka-Livingstone',
    on_duty: true
  })
});
```

### Update Location
```javascript
const response = await fetch(`${BACKEND_URL}/api/sentinel/location`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    sentinel_id: 'sentinel-001',
    sentinel_name: 'John Mwamba',
    latitude: -13.9714,
    longitude: 28.6821,
    location: 'Kapiri Mposhi Station',
    route: 'Lusaka-Livingstone',
    status: 'online'
  })
});
```

## Testing End-to-End Flow

### 1. Start Backend
```bash
cd backend
./bin/backend
```

### 2. Start Mobile App
```bash
./build-sentinel.sh local
```

### 3. Submit Test Alert
1. Open app in Expo Go
2. Fill in alert form
3. Submit alert

### 4. Verify on Dashboard
1. Open `sentinel-dashboard.html`
2. Check notification badge (should show new notification)
3. Click Notifications in sidebar
4. Verify alert appears in notifications list
5. Check activity feed for alert

### 5. Run Test Script
```bash
./test-sentinel-alert.sh
```

## Troubleshooting

### Build Fails with "EXPO_TOKEN not set"
**Solution:** Set EXPO_TOKEN environment variable
```bash
export EXPO_TOKEN=your_token_here
```

### App Can't Connect to Backend
**Solution:** Check BACKEND_URL in app.config.js
```javascript
env: {
  API_URL: "https://your-backend-url.com"
}
```

### Location Permission Denied
**Solution:** Enable location permissions in device settings
- Android: Settings > Apps > Sentinel Portal > Permissions > Location
- iOS: Settings > Sentinel Portal > Location

### Build Stuck on CodeMagic
**Solution:** Check CodeMagic logs
1. Go to CodeMagic dashboard
2. Find the Sentinel build
3. Check build logs for errors
4. Verify environment variables are set

## Deployment Checklist

### Before Building
- [ ] Backend API is deployed and accessible
- [ ] EXPO_TOKEN is set in CodeMagic
- [ ] BACKEND_URL is configured correctly
- [ ] All dependencies are up to date
- [ ] App icons and splash screens are present

### After Building
- [ ] Test APK/IPA on physical device
- [ ] Verify alert submission works
- [ ] Check location tracking
- [ ] Test status updates
- [ ] Verify notifications appear on dashboard

## App Store Submission

### Android (Google Play)
1. Build production APK: `./build-sentinel.sh android`
2. Download APK from EAS
3. Upload to Google Play Console
4. Fill in app details and screenshots
5. Submit for review

### iOS (App Store)
1. Build production IPA: `./build-sentinel.sh ios`
2. Download IPA from EAS
3. Upload to App Store Connect
4. Fill in app details and screenshots
5. Submit for review

## Version History

### v1.0.0 (Current)
- Initial release
- Alert submission with GPS tracking
- Status updates (online/offline/away)
- Location tracking
- Backend integration
- Real-time notifications to dashboard

## Support

### Common Issues
1. **Build fails:** Check EXPO_TOKEN and dependencies
2. **API errors:** Verify BACKEND_URL is correct
3. **Location not working:** Enable location permissions
4. **Notifications not appearing:** Check backend logs

### Contact
For issues or questions:
- Email: ben.mpolokoso@gmail.com
- Check backend logs: `./bin/backend`
- Check CodeMagic build logs

## Next Steps

### Planned Features
1. Photo/video upload for alerts
2. Offline mode with sync
3. Push notifications to sentinels
4. Route tracking and checkpoints
5. Incident history and reports
6. Team chat functionality

## Summary

✅ Sentinel app configured and ready to build
✅ Backend integration complete
✅ CodeMagic workflows configured
✅ Build scripts created
✅ Tag pushed to trigger build
✅ End-to-end testing guide provided

**Build Status:** Check CodeMagic dashboard for build progress
**Tag:** sentinel-v1.0.0
**Workflows:** react-native-sentinel-android, react-native-sentinel-ios
