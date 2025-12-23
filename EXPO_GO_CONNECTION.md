# 📱 Connect Expo Go to Development Server

## Quick Answer

**Enter this URL in Expo Go:**

```
exp://19000--019b4884-c34a-7df3-a253-856248a3e14e.eu-central-1-01.gitpod.dev
```

## Step-by-Step Instructions

### For Android

1. **Open Expo Go** app
2. Tap **"Enter URL manually"** at the bottom
3. Type or paste:
   ```
   exp://19000--019b4884-c34a-7df3-a253-856248a3e14e.eu-central-1-01.gitpod.dev
   ```
4. Tap **"Connect"** or press Enter
5. Wait for the app to load (may take 30-60 seconds first time)

### For iOS

1. **Open Expo Go** app
2. Tap **"Enter URL manually"** in the Projects tab
3. Type or paste:
   ```
   exp://19000--019b4884-c34a-7df3-a253-856248a3e14e.eu-central-1-01.gitpod.dev
   ```
4. Tap **"Connect"**
5. Wait for the app to load

## Alternative: Use Tunnel Mode

If the above doesn't work, use tunnel mode:

### Step 1: Start with Tunnel

```bash
cd /workspaces/africa-railways/SmartphoneApp
npx expo start --tunnel
```

### Step 2: Get the URL

Look for output like:
```
› Metro waiting on exp://abc-123.tunnel.dev:80
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

### Step 3: Enter in Expo Go

Use the `exp://` URL shown in the terminal.

## Troubleshooting

### "Unable to connect to development server"

**Try these URLs in order:**

1. **Gitpod URL (recommended):**
   ```
   exp://19000--019b4884-c34a-7df3-a253-856248a3e14e.eu-central-1-01.gitpod.dev
   ```

2. **With port explicitly:**
   ```
   exp://19000--019b4884-c34a-7df3-a253-856248a3e14e.eu-central-1-01.gitpod.dev:443
   ```

3. **Tunnel mode:**
   ```bash
   # Start tunnel
   npx expo start --tunnel
   
   # Use the exp:// URL shown
   ```

### "Network response timed out"

**Solution:**
1. Make sure dev server is running
2. Check your phone has internet connection
3. Try tunnel mode: `npx expo start --tunnel`

### "Couldn't load exp://"

**Solution:**
1. Restart Expo Go app
2. Clear Expo Go cache (Settings → Clear cache)
3. Try tunnel mode

### "Project is not running"

**Solution:**
```bash
# Restart dev server
cd /workspaces/africa-railways/SmartphoneApp
npx expo start --clear
```

## Current Dev Server Status

Check if server is running:

```bash
# Check Expo dev server
curl https://19000--019b4884-c34a-7df3-a253-856248a3e14e.eu-central-1-01.gitpod.dev

# Should return Expo dev server response
```

## QR Code (Alternative)

If you prefer scanning a QR code:

1. **Start dev server with QR:**
   ```bash
   cd /workspaces/africa-railways/SmartphoneApp
   npx expo start
   ```

2. **Look for QR code in terminal**

3. **Scan with:**
   - **Android**: Expo Go app (built-in scanner)
   - **iOS**: Camera app (opens in Expo Go)

## URL Format Explained

```
exp://[subdomain]--[workspace-id].[region].gitpod.dev
```

**Your workspace:**
- Subdomain: `19000` (Expo dev server port)
- Workspace ID: `019b4884-c34a-7df3-a253-856248a3e14e`
- Region: `eu-central-1-01`
- Domain: `gitpod.dev`

## Testing Connection

### From Terminal

```bash
# Test if Expo server is accessible
curl -I https://19000--019b4884-c34a-7df3-a253-856248a3e14e.eu-central-1-01.gitpod.dev

# Should return: HTTP/2 200
```

### From Browser

Open in browser:
```
https://19000--019b4884-c34a-7df3-a253-856248a3e14e.eu-central-1-01.gitpod.dev
```

Should show Expo dev server page.

## Best Practices

### For Gitpod Development

1. **Use tunnel mode for reliability:**
   ```bash
   npx expo start --tunnel
   ```

2. **Keep terminal open:**
   - Don't close the terminal running Expo
   - Server must stay running

3. **Same network not required:**
   - Gitpod URLs work from anywhere
   - No need to be on same WiFi

### For Local Development

If you switch to local development later:

1. **Find your local IP:**
   ```bash
   # Linux/Mac
   ifconfig | grep "inet "
   
   # Windows
   ipconfig
   ```

2. **Use local IP:**
   ```
   exp://192.168.1.100:19000
   ```

3. **Same WiFi required:**
   - Phone and computer must be on same network

## Quick Reference

### URLs to Try

```
# Primary (Gitpod)
exp://19000--019b4884-c34a-7df3-a253-856248a3e14e.eu-central-1-01.gitpod.dev

# With explicit port
exp://19000--019b4884-c34a-7df3-a253-856248a3e14e.eu-central-1-01.gitpod.dev:443

# Tunnel (after running: npx expo start --tunnel)
exp://[tunnel-url-from-terminal]
```

### Commands

```bash
# Start dev server
cd /workspaces/africa-railways/SmartphoneApp
npx expo start

# Start with tunnel
npx expo start --tunnel

# Start with QR code
npx expo start

# Clear cache and restart
npx expo start --clear
```

## Need Help?

1. **Check dev server is running:**
   ```bash
   ps aux | grep expo
   ```

2. **View dev server logs:**
   ```bash
   # In the terminal where you ran npx expo start
   ```

3. **Restart everything:**
   ```bash
   # Kill expo processes
   pkill -f expo
   
   # Start fresh
   cd /workspaces/africa-railways/SmartphoneApp
   npx expo start --clear
   ```

## Success Indicators

You'll know it's working when:
- ✅ Expo Go shows "Opening project..."
- ✅ Progress bar appears
- ✅ App loads on your phone
- ✅ You see the Africa Railways app interface

## Next Steps

Once connected:
1. Make changes to code in Gitpod
2. Save the file
3. App automatically reloads on your phone
4. See changes instantly!

---

**Your URL:** `exp://19000--019b4884-c34a-7df3-a253-856248a3e14e.eu-central-1-01.gitpod.dev`

**Copy and paste this into Expo Go!** 📱
