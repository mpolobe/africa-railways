# 🚀 Complete Setup Guide

## Prerequisites

- Node.js 18+ installed
- Expo CLI installed (`npm install -g expo-cli`)
- EAS CLI installed (`npm install -g eas-cli`)
- Expo account created
- Git installed

## Step-by-Step Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/mpolobe/africa-railways.git
cd africa-railways

# Install dependencies
npm install
```

### 2. Configure EAS Projects

You have two separate EAS projects:

**Railways App:**
- Project ID: `82efeb87-20c5-45b4-b945-65d4b9074c32`
- Bundle ID: `com.mpolobe.railways`

**Africoin App:**
- Project ID: `5fa2f2b4-5c9f-43bf-b1eb-20d90ae19185`
- Bundle ID: `com.mpolobe.africoin`

### 3. Set Up EAS Secrets

#### Option A: Automated Setup (Recommended)

```bash
# Make the script executable
chmod +x setup-eas-secrets.sh

# Run the setup script
./setup-eas-secrets.sh
```

The script will prompt you for:
1. Backend URL (e.g., `https://africa-railways.vercel.app`)
2. Railways API Key
3. Africoin API Key
4. Expo Token (optional, for CI/CD)

#### Option B: Manual Setup

```bash
# Set backend URL (same for both apps)
eas secret:create --scope project --name BACKEND_URL --value "https://africa-railways.vercel.app" --force

# Set Railways API key
eas secret:create --scope project --name RAILWAYS_API_KEY --value "your-railways-api-key-here" --force

# Set Africoin API key
eas secret:create --scope project --name AFRICOIN_API_KEY --value "your-africoin-api-key-here" --force

# Optional: Set Expo token for automated builds
eas secret:create --scope project --name EXPO_TOKEN --value "your-expo-token-here" --force
```

### 4. Verify Secrets

```bash
# List all secrets
eas secret:list

# You should see:
# - BACKEND_URL
# - RAILWAYS_API_KEY
# - AFRICOIN_API_KEY
# - EXPO_TOKEN (if set)
```

### 5. Configure Backend

Your backend needs these environment variables:

```bash
# In your Vercel project settings, add:
DATABASE_URL=postgresql://user:password@host:5432/database
RAILWAYS_API_KEY=same-as-mobile-app
AFRICOIN_API_KEY=same-as-mobile-app
PORT=8080
```

### 6. Test Local Development

```bash
# Start the Expo development server
npm start

# Or start with specific variant
APP_VARIANT=railways npm start
APP_VARIANT=africoin npm start
```

### 7. Build Apps

#### Build Railways App

```bash
# Development build
eas build --platform android --profile railways --local

# Production build
eas build --platform android --profile railways
```

#### Build Africoin App

```bash
# Development build
eas build --platform android --profile africoin --local

# Production build
eas build --platform android --profile africoin
```

### 8. Submit to Play Store (Optional)

```bash
# Submit Railways app
eas submit --platform android --profile railways

# Submit Africoin app
eas submit --platform android --profile africoin
```

## Configuration Files

### eas.json

```json
{
  "cli": {
    "version": ">= 10.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "railways": {
      "extends": "production",
      "env": {
        "APP_VARIANT": "railways",
        "BACKEND_URL": "$BACKEND_URL",
        "API_KEY": "$RAILWAYS_API_KEY"
      }
    },
    "africoin": {
      "extends": "production",
      "env": {
        "APP_VARIANT": "africoin",
        "BACKEND_URL": "$BACKEND_URL",
        "API_KEY": "$AFRICOIN_API_KEY"
      }
    }
  }
}
```

### app.config.js

```javascript
const IS_RAILWAYS = process.env.APP_VARIANT === 'railways';

export default {
  expo: {
    name: IS_RAILWAYS ? "Africa Railways Hub" : "Africoin Wallet",
    slug: IS_RAILWAYS ? "africa-railways" : "africoin-app",
    extra: {
      eas: {
        projectId: IS_RAILWAYS 
          ? "82efeb87-20c5-45b4-b945-65d4b9074c32" 
          : "5fa2f2b4-5c9f-43bf-b1eb-20d90ae19185"
      },
      APP_VARIANT: process.env.APP_VARIANT || 'railways',
      backendUrl: process.env.BACKEND_URL,
      apiKey: process.env.API_KEY
    }
  }
};
```

## Using the API Configuration

### In Your Code

```javascript
// Import the API configuration
import { apiRequest, API_CONFIG } from '../src/config/api';

// Make API requests
async function fetchReports() {
  try {
    const data = await apiRequest('/api/reports', {
      method: 'GET'
    });
    console.log('Reports:', data);
  } catch (error) {
    console.error('Failed to fetch reports:', error);
  }
}

// Check which app variant
if (API_CONFIG.isRailways) {
  console.log('Running Railways app');
} else {
  console.log('Running Africoin app');
}
```

## Environment Variables Reference

### Mobile App (EAS Secrets)

| Variable | Description | Example |
|----------|-------------|---------|
| `BACKEND_URL` | Backend API URL | `https://africa-railways.vercel.app` |
| `RAILWAYS_API_KEY` | Railways app authentication | `rw_1234567890abcdef` |
| `AFRICOIN_API_KEY` | Africoin app authentication | `ac_1234567890abcdef` |
| `EXPO_TOKEN` | Expo authentication token | `expo_token_here` |

### Backend (Vercel Environment Variables)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `RAILWAYS_API_KEY` | Must match mobile app | `rw_1234567890abcdef` |
| `AFRICOIN_API_KEY` | Must match mobile app | `ac_1234567890abcdef` |
| `PORT` | Server port | `8080` |

## Troubleshooting

### "API key not configured" Warning

**Problem:** App shows warning about missing API key

**Solution:**
```bash
# Verify secrets are set
eas secret:list

# If missing, set them
eas secret:create --scope project --name RAILWAYS_API_KEY --value "your-key" --force
eas secret:create --scope project --name AFRICOIN_API_KEY --value "your-key" --force
```

### "Cannot connect to backend" Error

**Problem:** App can't reach the backend

**Solutions:**
1. Check backend is deployed and running
2. Verify BACKEND_URL is correct
3. Check network connectivity
4. Verify backend URL in secrets:
   ```bash
   eas secret:list
   ```

### "Unauthorized" Error

**Problem:** Backend rejects API requests

**Solutions:**
1. Verify API keys match between mobile and backend
2. Check API key is being sent in headers
3. Verify backend environment variables:
   ```bash
   # In Vercel dashboard, check:
   # RAILWAYS_API_KEY matches mobile app
   # AFRICOIN_API_KEY matches mobile app
   ```

### Build Fails with "Missing Environment Variable"

**Problem:** EAS build fails due to missing env vars

**Solution:**
```bash
# Check eas.json references correct secret names
# Verify secrets exist
eas secret:list

# Rebuild
eas build --platform android --profile railways --clear-cache
```

### Wrong App Variant Running

**Problem:** App shows wrong branding/features

**Solution:**
```bash
# Check APP_VARIANT is set correctly
# For local development:
APP_VARIANT=railways npm start

# For builds, check eas.json profile
```

## Security Best Practices

### ✅ Do:
- Store all secrets in EAS Secrets
- Use different API keys for each app
- Rotate API keys every 90 days
- Use HTTPS for all API communication
- Validate API keys on backend

### ❌ Don't:
- Commit API keys to git
- Share API keys in chat/email
- Use the same API key for both apps
- Hardcode URLs in source code
- Expose API keys in client-side code

## API Key Rotation

When you need to rotate API keys:

```bash
# Use the emergency rotation script
chmod +x emergency-key-rotation.sh
./emergency-key-rotation.sh

# Or manually:
# 1. Generate new keys
# 2. Update EAS secrets
eas secret:create --scope project --name RAILWAYS_API_KEY --value "new-key" --force

# 3. Update backend environment variables in Vercel
# 4. Rebuild and redeploy apps
eas build --platform android --profile railways
```

## Monitoring

### Check App Logs

```bash
# View build logs
eas build:list

# View specific build
eas build:view [build-id]
```

### Check Backend Logs

```bash
# In Vercel dashboard:
# 1. Go to your project
# 2. Click "Logs" tab
# 3. Filter by time/severity
```

## Next Steps

1. ✅ Complete this setup guide
2. ✅ Test local development
3. ✅ Build development versions
4. ✅ Test on physical devices
5. ✅ Build production versions
6. ✅ Submit to Play Store
7. ✅ Monitor app performance
8. ✅ Set up CI/CD pipeline

## Support

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Vercel Documentation](https://vercel.com/docs)

## Quick Reference Commands

```bash
# Development
npm start                                    # Start dev server
APP_VARIANT=railways npm start              # Start as Railways
APP_VARIANT=africoin npm start              # Start as Africoin

# Secrets Management
eas secret:list                             # List all secrets
eas secret:create --name KEY --value VAL    # Create secret
eas secret:delete --name KEY                # Delete secret

# Building
eas build --platform android --profile railways    # Build Railways
eas build --platform android --profile africoin    # Build Africoin
eas build:list                                     # List builds

# Submission
eas submit --platform android --profile railways   # Submit Railways
eas submit --platform android --profile africoin   # Submit Africoin
```
