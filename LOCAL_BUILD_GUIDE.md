# 🏗️ Local EAS Build Guide

## Overview

Build your mobile apps locally without using EAS cloud credits. This is completely free but requires Docker.

---

## Prerequisites

### 1. Docker Installation

**Check if Docker is installed:**
```bash
docker --version
```

**If not installed:**

**Linux/Gitpod:**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Restart shell or run:
newgrp docker

# Verify
docker --version
```

**macOS:**
- Download Docker Desktop: https://www.docker.com/products/docker-desktop

**Windows:**
- Download Docker Desktop: https://www.docker.com/products/docker-desktop
- Enable WSL2

### 2. System Requirements

- **Disk Space:** ~15GB free (for Docker images and build artifacts)
- **RAM:** 8GB minimum, 16GB recommended
- **Time:** 30-60 minutes per build

---

## Quick Start

### Step 1: Navigate to App Directory

```bash
cd SmartphoneApp
```

### Step 2: Ensure Dependencies are Installed

```bash
npm ci --legacy-peer-deps
```

### Step 3: Login to EAS (One-Time)

```bash
eas login
```

Enter your Expo credentials.

### Step 4: Build Locally

**Build Railways App:**
```bash
APP_VARIANT=railways eas build --platform android --profile railways --local
```

**Build Africoin App:**
```bash
APP_VARIANT=africoin eas build --platform android --profile africoin --local
```

---

## Detailed Build Process

### What Happens During Local Build:

1. **Docker Image Download** (~5-10 min first time)
   - Downloads Android build environment
   - ~5GB download
   - Cached for future builds

2. **Dependency Installation** (~5-10 min)
   - npm packages
   - Android SDK components
   - Gradle dependencies

3. **Compilation** (~15-30 min)
   - JavaScript bundling
   - Android compilation
   - APK generation

4. **Output** (~1 min)
   - APK file saved locally
   - Build artifacts stored

**Total Time:** 30-60 minutes (first build)  
**Subsequent Builds:** 15-30 minutes (cached)

---

## Build Commands Reference

### Railways App

```bash
cd SmartphoneApp

# Development build
APP_VARIANT=railways eas build \
  --platform android \
  --profile railways \
  --local

# With specific output directory
APP_VARIANT=railways eas build \
  --platform android \
  --profile railways \
  --local \
  --output ~/builds/railways.apk
```

### Africoin App

```bash
cd SmartphoneApp

# Development build
APP_VARIANT=africoin eas build \
  --platform android \
  --profile africoin \
  --local

# With specific output directory
APP_VARIANT=africoin eas build \
  --platform android \
  --profile africoin \
  --local \
  --output ~/builds/africoin.apk
```

### Both Apps (Sequential)

```bash
cd SmartphoneApp

# Build both apps
APP_VARIANT=railways eas build --platform android --profile railways --local
APP_VARIANT=africoin eas build --platform android --profile africoin --local
```

---

## Troubleshooting

### Issue: Docker Not Running

**Error:**
```
Cannot connect to the Docker daemon
```

**Solution:**
```bash
# Start Docker daemon
sudo systemctl start docker

# Or on macOS/Windows
# Start Docker Desktop application
```

### Issue: Permission Denied

**Error:**
```
permission denied while trying to connect to the Docker daemon socket
```

**Solution:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login, or run:
newgrp docker
```

### Issue: Out of Disk Space

**Error:**
```
no space left on device
```

**Solution:**
```bash
# Clean Docker images
docker system prune -a

# Remove old build artifacts
rm -rf ~/.eas-build-local
```

### Issue: Build Fails with Memory Error

**Error:**
```
JavaScript heap out of memory
```

**Solution:**
```bash
# Increase Node memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Then retry build
```

### Issue: Keystore Not Found

**Error:**
```
Keystore not found
```

**Solution:**
```bash
# Generate keystore
eas credentials

# Select: Android → Production → Keystore → Generate
```

---

## Build Output

### Where to Find Your APK

After successful build:

```
✔ Build finished
APK: /path/to/SmartphoneApp/build-xxxxx.apk
```

**Default Location:**
```
SmartphoneApp/build-[timestamp].apk
```

**Custom Location:**
```bash
# Specify output path
eas build --local --output ~/my-app.apk
```

---

## Installing the APK

### On Android Device

**Method 1: USB Transfer**
```bash
# Connect device via USB
adb install build-xxxxx.apk
```

**Method 2: File Transfer**
1. Copy APK to device (USB, cloud, email)
2. Open APK file on device
3. Enable "Install from Unknown Sources" if prompted
4. Tap "Install"

**Method 3: QR Code**
```bash
# Generate QR code for download
# (requires hosting the APK somewhere)
```

---

## Comparison: Local vs Cloud Builds

| Feature | Local Build | Cloud Build |
|---------|-------------|-------------|
| **Cost** | Free | 30 builds/month (free) or $29/month |
| **Speed** | 30-60 min | 15-25 min |
| **Requirements** | Docker, 15GB disk | Internet only |
| **Credits** | None used | Uses EAS credits |
| **Caching** | Local cache | Cloud cache |
| **Parallelization** | One at a time | Multiple simultaneous |

---

## Optimization Tips

### 1. Use Docker Cache

Docker caches layers, so subsequent builds are faster:

```bash
# First build: 45 minutes
# Second build: 20 minutes (cached)
```

### 2. Build During Off-Hours

Local builds are CPU-intensive:

```bash
# Run overnight or during lunch
nohup eas build --local &
```

### 3. Clean Up After Builds

```bash
# Remove old build artifacts
rm -f SmartphoneApp/build-*.apk

# Clean Docker cache (if needed)
docker system prune
```

### 4. Monitor Build Progress

```bash
# Watch Docker containers
docker ps

# View logs
docker logs -f [container-id]
```

---

## CI/CD Integration

### GitHub Actions (Self-Hosted Runner)

```yaml
name: Local Build

on:
  workflow_dispatch:

jobs:
  build:
    runs-on: self-hosted  # Requires self-hosted runner with Docker
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      
      - name: Install dependencies
        working-directory: SmartphoneApp
        run: npm ci --legacy-peer-deps
      
      - name: Build locally
        working-directory: SmartphoneApp
        run: |
          APP_VARIANT=railways eas build \
            --platform android \
            --profile railways \
            --local \
            --non-interactive
      
      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: railways-apk
          path: SmartphoneApp/build-*.apk
```

**Note:** Requires self-hosted runner with Docker installed.

---

## Best Practices

### 1. Version Control

Don't commit APK files:

```bash
# .gitignore
*.apk
build-*.apk
```

### 2. Naming Convention

Use descriptive names:

```bash
eas build --local --output railways-v1.0.0-$(date +%Y%m%d).apk
```

### 3. Testing

Test APK before distribution:

```bash
# Install on test device
adb install -r build-xxxxx.apk

# Check logs
adb logcat | grep -i "africa"
```

### 4. Distribution

For internal testing:

- **Firebase App Distribution**
- **TestFlight** (iOS)
- **Direct APK sharing**

---

## FAQ

**Q: Do local builds use EAS credits?**  
A: No, local builds are completely free and don't use any EAS credits.

**Q: Can I build iOS apps locally?**  
A: Yes, but requires macOS with Xcode installed.

**Q: How much disk space do I need?**  
A: ~15GB for Docker images and build artifacts.

**Q: Can I build both apps simultaneously?**  
A: No, local builds run sequentially. Cloud builds can run in parallel.

**Q: Will local builds work in CI/CD?**  
A: Yes, but requires self-hosted runner with Docker.

**Q: Do I need to generate keystore?**  
A: Yes, run `eas credentials` once to generate signing keys.

---

## Quick Reference

```bash
# Prerequisites
docker --version
eas login

# Build Railways
cd SmartphoneApp
APP_VARIANT=railways eas build --platform android --profile railways --local

# Build Africoin
APP_VARIANT=africoin eas build --platform android --profile africoin --local

# Install on device
adb install build-xxxxx.apk

# Clean up
docker system prune
rm -f build-*.apk
```

---

## Support

**Issues:**
- Docker: https://docs.docker.com/
- EAS: https://docs.expo.dev/build-reference/local-builds/
- Android: https://developer.android.com/

**Community:**
- Expo Discord: https://chat.expo.dev/
- Stack Overflow: [expo] tag

---

**Status:** Ready for local builds  
**Cost:** $0 (free)  
**Time:** 30-60 minutes per build  
**Requirements:** Docker + 15GB disk space
