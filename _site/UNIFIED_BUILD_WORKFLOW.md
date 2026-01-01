# Unified Build Workflow - Build All 4 Apps in One Job

## Problem

Current setup: **8 separate builds** (4 apps × 2 platforms)
- Each build runs independently
- Uses 8× build minutes
- Takes ~3 hours total (parallel)
- Costs 8 build credits

## Solution: Unified Workflow

Build all 4 apps sequentially in **ONE Codemagic job**.

---

## Option 1: Sequential Build Script (Recommended)

### Add to codemagic.yaml

```yaml
workflows:
  # Build ALL 4 apps in one job
  build-all-apps-android:
    name: Build All Apps - Android
    max_build_duration: 120
    instance_type: mac_mini_m2
    environment:
      groups:
        - railways_credentials
        - africoin_credentials
        - sentinel_credentials
        - staff_credentials
      node: 18.19.0
    cache:
      cache_paths:
        - $HOME/.npm
        - $HOME/.expo
        - SmartphoneApp/node_modules
    triggering:
      events:
        - push
      branch_patterns:
        - pattern: 'build-all'
          include: true
      tag_patterns:
        - pattern: 'release-*'
          include: true
    scripts:
      - name: Install dependencies
        script: |
          cd SmartphoneApp
          npm install --legacy-peer-deps
      
      - name: Install EAS CLI
        script: |
          npm install -g eas-cli
      
      - name: Build Railways Android
        script: |
          cd SmartphoneApp
          echo "🚂 Building Railways App..."
          APP_VARIANT=railways eas build --platform android --profile railways --non-interactive --no-wait
          sleep 5
      
      - name: Build Africoin Android
        script: |
          cd SmartphoneApp
          echo "💰 Building Africoin App..."
          APP_VARIANT=africoin eas build --platform android --profile africoin --non-interactive --no-wait
          sleep 5
      
      - name: Build Sentinel Android
        script: |
          cd SmartphoneApp
          echo "🛡️ Building Sentinel App..."
          APP_VARIANT=sentinel eas build --platform android --profile sentinel --non-interactive --no-wait
          sleep 5
      
      - name: Build Staff Android
        script: |
          cd SmartphoneApp
          echo "📱 Building Staff Verification App..."
          APP_VARIANT=staff eas build --platform android --profile staff --non-interactive --no-wait
      
      - name: Wait for builds to complete
        script: |
          cd SmartphoneApp
          echo "⏳ Waiting for all EAS builds to complete..."
          eas build:list --limit 4 --json
          
          # Monitor builds until all complete
          while true; do
            PENDING=$(eas build:list --limit 4 --json | jq '[.[] | select(.status == "in-progress" or .status == "in-queue")] | length')
            if [ "$PENDING" -eq 0 ]; then
              echo "✅ All builds completed!"
              break
            fi
            echo "⏳ $PENDING builds still in progress..."
            sleep 30
          done
      
      - name: Download all artifacts
        script: |
          cd SmartphoneApp
          echo "📦 Downloading build artifacts..."
          
          # Get latest build IDs
          RAILWAYS_BUILD=$(eas build:list --limit 1 --json | jq -r '.[0].id')
          AFRICOIN_BUILD=$(eas build:list --limit 2 --json | jq -r '.[1].id')
          SENTINEL_BUILD=$(eas build:list --limit 3 --json | jq -r '.[2].id')
          STAFF_BUILD=$(eas build:list --limit 4 --json | jq -r '.[3].id')
          
          # Download APKs
          mkdir -p ../build
          eas build:download --id $RAILWAYS_BUILD --output ../build/railways.apk
          eas build:download --id $AFRICOIN_BUILD --output ../build/africoin.apk
          eas build:download --id $SENTINEL_BUILD --output ../build/sentinel.apk
          eas build:download --id $STAFF_BUILD --output ../build/staff.apk
          
          echo "✅ All APKs downloaded to build/ directory"
    
    artifacts:
      - build/*.apk
    
    publishing:
      email:
        recipients:
          - mpolobe@example.com
        notify:
          success: true
          failure: true

  # Build ALL 4 apps for iOS in one job
  build-all-apps-ios:
    name: Build All Apps - iOS
    max_build_duration: 120
    instance_type: mac_mini_m2
    environment:
      groups:
        - railways_credentials
        - africoin_credentials
        - sentinel_credentials
        - staff_credentials
        - ios_credentials
      node: 18.19.0
      xcode: 15.0
      cocoapods: default
    cache:
      cache_paths:
        - $HOME/.npm
        - $HOME/.expo
        - SmartphoneApp/node_modules
    triggering:
      events:
        - push
      branch_patterns:
        - pattern: 'build-all'
          include: true
      tag_patterns:
        - pattern: 'release-*'
          include: true
    scripts:
      - name: Install dependencies
        script: |
          cd SmartphoneApp
          npm install --legacy-peer-deps
      
      - name: Install EAS CLI
        script: |
          npm install -g eas-cli
      
      - name: Build all iOS apps
        script: |
          cd SmartphoneApp
          
          echo "🚂 Building Railways iOS..."
          APP_VARIANT=railways eas build --platform ios --profile railways --non-interactive --no-wait
          sleep 5
          
          echo "💰 Building Africoin iOS..."
          APP_VARIANT=africoin eas build --platform ios --profile africoin --non-interactive --no-wait
          sleep 5
          
          echo "🛡️ Building Sentinel iOS..."
          APP_VARIANT=sentinel eas build --platform ios --profile sentinel --non-interactive --no-wait
          sleep 5
          
          echo "📱 Building Staff iOS..."
          APP_VARIANT=staff eas build --platform ios --profile staff --non-interactive --no-wait
      
      - name: Wait and download artifacts
        script: |
          cd SmartphoneApp
          echo "⏳ Waiting for iOS builds..."
          
          # Wait for builds
          while true; do
            PENDING=$(eas build:list --limit 4 --json | jq '[.[] | select(.status == "in-progress" or .status == "in-queue")] | length')
            if [ "$PENDING" -eq 0 ]; then
              break
            fi
            sleep 30
          done
          
          # Download IPAs
          mkdir -p ../build
          eas build:list --limit 4 --json | jq -r '.[].id' | while read BUILD_ID; do
            eas build:download --id $BUILD_ID --output ../build/
          done
    
    artifacts:
      - build/*.ipa
    
    publishing:
      email:
        recipients:
          - mpolobe@example.com
        notify:
          success: true
          failure: true
```

---

## Option 2: Local Build Script (Faster)

### Create build-all-local.sh

```bash
#!/bin/bash
set -e

echo "🚀 Building all 4 apps locally..."

cd SmartphoneApp

# Build Railways
echo "🚂 Building Railways..."
APP_VARIANT=railways eas build --platform android --profile railways --local
mv build-*.apk ../build/railways.apk

# Build Africoin
echo "💰 Building Africoin..."
APP_VARIANT=africoin eas build --platform android --profile africoin --local
mv build-*.apk ../build/africoin.apk

# Build Sentinel
echo "🛡️ Building Sentinel..."
APP_VARIANT=sentinel eas build --platform android --profile sentinel --local
mv build-*.apk ../build/sentinel.apk

# Build Staff
echo "📱 Building Staff..."
APP_VARIANT=staff eas build --platform android --profile staff --local
mv build-*.apk ../build/staff.apk

echo "✅ All 4 apps built successfully!"
ls -lh ../build/*.apk
```

**Usage:**
```bash
chmod +x build-all-local.sh
./build-all-local.sh
```

---

## Option 3: Parallel Build with Matrix (Most Efficient)

### Add to codemagic.yaml

```yaml
workflows:
  build-all-apps-matrix:
    name: Build All Apps (Matrix)
    max_build_duration: 60
    instance_type: mac_mini_m2
    environment:
      groups:
        - railways_credentials
        - africoin_credentials
        - sentinel_credentials
        - staff_credentials
      node: 18.19.0
      # Matrix strategy
      matrix:
        - APP_VARIANT: railways
          PACKAGE_NAME: com.mpolobe.railways
        - APP_VARIANT: africoin
          PACKAGE_NAME: com.mpolobe.africoin
        - APP_VARIANT: sentinel
          PACKAGE_NAME: com.mpolobe.sentinel
        - APP_VARIANT: staff
          PACKAGE_NAME: com.mpolobe.staff
    cache:
      cache_paths:
        - $HOME/.npm
        - $HOME/.expo
        - SmartphoneApp/node_modules
    triggering:
      events:
        - push
      branch_patterns:
        - pattern: 'build-all'
          include: true
    scripts:
      - name: Install dependencies
        script: |
          cd SmartphoneApp
          npm install --legacy-peer-deps
      
      - name: Install EAS CLI
        script: |
          npm install -g eas-cli
      
      - name: Build app
        script: |
          cd SmartphoneApp
          echo "🚀 Building $APP_VARIANT app..."
          eas build --platform android --profile $APP_VARIANT --non-interactive --no-wait
    
    artifacts:
      - SmartphoneApp/build/**/*.apk
```

**Note**: Matrix builds still create 4 separate jobs, but managed by one workflow definition.

---

## Comparison

| Approach | Build Jobs | Duration | Credits | Complexity |
|----------|-----------|----------|---------|------------|
| **Current (8 workflows)** | 8 | ~3 hours (parallel) | 8 | Low |
| **Sequential (Option 1)** | 1 | ~2 hours (sequential) | 1 | Medium |
| **Local (Option 2)** | 0 (local) | ~2 hours | 0 | Low |
| **Matrix (Option 3)** | 4 | ~1 hour (parallel) | 4 | Medium |

---

## Recommendation

### For Development: Keep Current Setup
- Build apps individually as needed
- Faster feedback
- Lower cost per test

### For Production: Use Sequential Build
- One workflow for all apps
- Single build credit
- All artifacts in one place
- Easier to manage releases

### For CI/CD: Use Matrix Build
- Parallel execution
- Faster than sequential
- Still organized under one workflow

---

## Implementation

### Add Sequential Build Workflow

```bash
# Add the unified workflow to codemagic.yaml
cat >> codemagic.yaml << 'EOF'

  # Build ALL 4 apps in one job (Android)
  build-all-apps-android:
    name: Build All Apps - Android
    max_build_duration: 120
    instance_type: mac_mini_m2
    environment:
      groups:
        - railways_credentials
        - africoin_credentials
        - sentinel_credentials
        - staff_credentials
      node: 18.19.0
    scripts:
      - name: Install dependencies
        script: |
          cd SmartphoneApp
          npm install --legacy-peer-deps
          npm install -g eas-cli
      
      - name: Build all Android apps
        script: |
          cd SmartphoneApp
          
          # Build Railways
          APP_VARIANT=railways eas build --platform android --profile railways --non-interactive --no-wait
          
          # Build Africoin
          APP_VARIANT=africoin eas build --platform android --profile africoin --non-interactive --no-wait
          
          # Build Sentinel
          APP_VARIANT=sentinel eas build --platform android --profile sentinel --non-interactive --no-wait
          
          # Build Staff
          APP_VARIANT=staff eas build --platform android --profile staff --non-interactive --no-wait
    
    artifacts:
      - SmartphoneApp/build/**/*.apk
EOF
```

### Trigger Unified Build

```bash
# Create build-all branch
git checkout -b build-all
git push origin build-all

# Or use release tag
git tag release-v1.0.0
git push origin release-v1.0.0
```

---

## Summary

**Current Setup:**
- ❌ 8 separate builds
- ❌ 8× build credits
- ✅ Parallel execution (fast)
- ✅ Independent failures

**Unified Build:**
- ✅ 1 build job
- ✅ 1 build credit
- ❌ Sequential (slower)
- ❌ One failure stops all

**Best Approach:**
- **Development**: Use individual workflows (current setup)
- **Production**: Add unified workflow for releases
- **Both**: Keep both options available

---

Would you like me to add the unified build workflow to your codemagic.yaml?
