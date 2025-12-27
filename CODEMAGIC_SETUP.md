# Codemagic CI/CD Setup Guide

This repository is configured for automated builds using Codemagic.io for Android, iOS, and Web platforms.

## Repository Structure

```
africa-railways/
├── SmartphoneApp/           # React Native mobile app (Expo)
│   ├── components/          # Native mobile components
│   ├── components-web/      # Web-specific React components (from AfricaRailways)
│   ├── App.js              # Main React Native app
│   ├── App-web.tsx         # Web app entry point
│   ├── types.ts            # TypeScript type definitions
│   └── package.json        # Dependencies
├── codemagic.yaml          # CI/CD configuration
└── eas.json                # Expo Application Services config
```

## Merged Content

The following content from `mpolobe/AfricaRailways` has been integrated:

- **Web Components**: React/TypeScript components in `SmartphoneApp/components-web/`
  - LoginScreen.tsx
  - DashboardScreen.tsx
  - TripDetailsScreen.tsx
  - ReportScreen.tsx
  - AIAssistantScreen.tsx
- **Type Definitions**: `types.ts` for TypeScript support
- **Web App**: `App-web.tsx` for web-specific builds

## Available Workflows

### 1. Android Builds

#### Railways App (Android)
- **Workflow**: `react-native-railways-android`
- **Trigger**: Push to `main` or `develop`, or tag `railways-*`
- **Output**: APK and AAB files
- **Package**: `com.mpolobe.railways`

#### Africoin App (Android)
- **Workflow**: `react-native-africoin-android`
- **Trigger**: Push to `main` or `develop`, or tag `africoin-*`
- **Output**: APK and AAB files
- **Package**: `com.mpolobe.africoin`

### 2. iOS Builds

#### Railways App (iOS)
- **Workflow**: `react-native-railways-ios`
- **Trigger**: Push to `main` or `develop`, or tag `railways-*`
- **Output**: IPA file
- **Bundle ID**: `com.mpolobe.railways`

#### Africoin App (iOS)
- **Workflow**: `react-native-africoin-ios`
- **Trigger**: Push to `main` or `develop`, or tag `africoin-*`
- **Output**: IPA file
- **Bundle ID**: `com.mpolobe.africoin`

### 3. Native Android Build
- **Workflow**: `native-android`
- **Trigger**: Push to `native-android` branch
- **Uses**: Gradle directly (no Expo)

### 4. Web App Build
- **Workflow**: `web-app`
- **Trigger**: Push to `main` or `web` branch
- **Output**: Static web files in `dist/`
- **Technology**: React + Vite

### 5. Combined Builds

#### All Platforms
- **Workflow**: `all-platforms`
- **Trigger**: Tag `release-*`
- **Output**: Android APK/AAB + iOS IPA

#### Preview Build
- **Workflow**: `preview-build`
- **Trigger**: Push to `develop` or `feature/*` branches
- **Output**: Preview builds for testing
- **Includes**: Test coverage reports

## Environment Variables Required

### Codemagic Environment Groups

Create these groups in Codemagic dashboard:

#### 1. `railways_credentials`
```
EXPO_TOKEN=<your-expo-token>
BACKEND_URL=https://africa-railways.vercel.app
RAILWAYS_API_KEY=<your-api-key>
```

#### 2. `africoin_credentials`
```
EXPO_TOKEN=<your-expo-token>
BACKEND_URL=https://africa-railways.vercel.app
AFRICOIN_API_KEY=<your-api-key>
```

#### 3. `ios_credentials`
```
APP_STORE_CONNECT_PRIVATE_KEY=<base64-encoded-p8-key>
APP_STORE_CONNECT_KEY_IDENTIFIER=<key-id>
APP_STORE_CONNECT_ISSUER_ID=<issuer-id>
```

#### 4. `android_credentials`
```
GCLOUD_SERVICE_ACCOUNT_CREDENTIALS=<json-credentials>
```

#### 5. `web_credentials`
```
GEMINI_API_KEY=<your-gemini-api-key>
```

### Android Signing

Upload keystores in Codemagic:
- `railways_keystore` - for Railways app
- `africoin_keystore` - for Africoin app

## Setup Instructions

### 1. Connect Repository to Codemagic

1. Go to [codemagic.io](https://codemagic.io)
2. Sign in with GitHub
3. Add repository: `mpolobe/africa-railways`
4. Codemagic will detect `codemagic.yaml` automatically

### 2. Configure Environment Variables

1. Go to **Teams** → **Environment variables**
2. Create the environment groups listed above
3. Add all required variables

### 3. Upload Signing Credentials

#### Android:
1. Go to **Code signing identities** → **Android**
2. Upload keystore files
3. Enter keystore password, key alias, and key password

#### iOS:
1. Go to **Code signing identities** → **iOS**
2. Upload provisioning profiles and certificates
3. Or use automatic code signing with App Store Connect API

### 4. Configure EAS (Expo Application Services)

```bash
# Login to Expo
npx eas-cli login

# Get your Expo token
npx eas-cli whoami

# Add token to Codemagic environment variables
```

### 5. Trigger Builds

#### Manual Trigger:
- Go to Codemagic dashboard
- Select workflow
- Click "Start new build"

#### Automatic Triggers:

**Android/iOS Production:**
```bash
git push origin main
```

**Preview Build:**
```bash
git checkout -b feature/my-feature
git push origin feature/my-feature
```

**Release All Platforms:**
```bash
git tag release-1.0.0
git push origin release-1.0.0
```

**App-Specific Release:**
```bash
# Railways
git tag railways-1.0.0
git push origin railways-1.0.0

# Africoin
git tag africoin-1.0.0
git push origin africoin-1.0.0
```

## Build Profiles (from eas.json)

### Production
- Auto-increment version
- Full optimization
- Release signing

### Preview
- Internal distribution
- Faster builds
- Testing purposes

### Development
- Development client
- Hot reload enabled
- Debug mode

## App Variants

The project supports two app variants controlled by `APP_VARIANT` environment variable:

### Railways (`APP_VARIANT=railways`)
- Name: "Africa Railways Hub"
- Package: `com.mpolobe.railways`
- Expo Project ID: `82efeb87-20c5-45b4-b945-65d4b9074c32`

### Africoin (`APP_VARIANT=africoin`)
- Name: "Africoin Wallet"
- Package: `com.mpolobe.africoin`
- Expo Project ID: `5fa2f2b4-5c9f-43bf-b1eb-20d90ae19185`

## Local Testing

### Test Android Build Locally:
```bash
cd SmartphoneApp
APP_VARIANT=railways eas build --platform android --profile preview --local
```

### Test iOS Build Locally:
```bash
cd SmartphoneApp
APP_VARIANT=railways eas build --platform ios --profile preview --local
```

### Test Web Build:
```bash
cd SmartphoneApp
npm install
npm run build
```

## Troubleshooting

### Build Fails with "Project not found"
- Verify `EXPO_PROJECT_ID` matches your Expo dashboard
- Check `EXPO_TOKEN` is valid

### Android Signing Issues
- Verify keystore is uploaded correctly
- Check keystore password and alias

### iOS Provisioning Issues
- Ensure bundle identifier matches provisioning profile
- Verify App Store Connect API credentials

### Web Build Fails
- Check `GEMINI_API_KEY` is set
- Verify all dependencies are installed

## Monitoring Builds

1. **Codemagic Dashboard**: View real-time build logs
2. **Email Notifications**: Configured for success/failure
3. **Artifacts**: Download APK/IPA/AAB files from dashboard

## Publishing

### Android (Google Play)
- Builds automatically submitted to internal track
- Review in Google Play Console
- Promote to beta/production when ready

### iOS (TestFlight)
- Builds automatically submitted to TestFlight
- Add internal testers
- Submit to App Store when ready

### Web
- Deploy `dist/` folder to:
  - Vercel
  - Netlify
  - Firebase Hosting
  - GitHub Pages

## Support

For issues:
1. Check Codemagic build logs
2. Review EAS build logs: `eas build:list`
3. Verify environment variables
4. Check repository issues

## Next Steps

1. ✅ Repository merged with AfricaRailways content
2. ✅ Codemagic configuration created
3. ⏳ Set up Codemagic account and connect repository
4. ⏳ Configure environment variables
5. ⏳ Upload signing credentials
6. ⏳ Trigger first build
7. ⏳ Test and deploy
