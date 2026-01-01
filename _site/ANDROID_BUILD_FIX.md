# Android Build Duplicate Classes Fix

## Problem
The error `checkDebugDuplicateClasses FAILED` occurs when multiple versions of the same class are included in the build, typically from:
- Conflicting dependency versions
- Transitive dependencies pulling in duplicates
- React Native and React DOM version mismatches

## Solution Applied

### 1. Package.json Updates
Added `resolutions` field to force specific versions:
```json
"resolutions": {
  "react": "18.2.0",
  "react-dom": "18.2.0",
  "react-native": "0.73.11"
}
```

Added `@google/genai` for Sovereign Hub features.

### 2. Gradle Configuration
Created `android-gradle-fix.gradle` with:
- Packaging options to exclude duplicate META-INF files
- Pick first strategy for native libraries
- Dependency exclusions for known conflicts
- Force resolution of specific library versions

### 3. How to Apply in EAS Build

#### Option A: Using app.json plugin
Add to `app.config.js`:
```javascript
android: {
  package: config.package,
  versionCode: 1,
  permissions: ["CAMERA", "ACCESS_FINE_LOCATION"],
  gradleProperties: {
    "android.useAndroidX": "true",
    "android.enableJetifier": "true"
  }
}
```

#### Option B: Using eas-build-pre-install hook
Create `.eas/build/pre-install.sh`:
```bash
#!/bin/bash
# Copy gradle fix to android directory
if [ -f "android-gradle-fix.gradle" ]; then
  echo "Applying Android Gradle fixes..."
  # This will be applied during build
fi
```

#### Option C: Using expo-build-properties plugin
Install and configure:
```bash
npx expo install expo-build-properties
```

Add to plugins in app.config.js:
```javascript
[
  "expo-build-properties",
  {
    android: {
      packagingOptions: {
        pickFirst: [
          "lib/x86/libc++_shared.so",
          "lib/x86_64/libc++_shared.so",
          "lib/armeabi-v7a/libc++_shared.so",
          "lib/arm64-v8a/libc++_shared.so"
        ]
      }
    }
  }
]
```

### 4. CodeMagic Configuration
Add to `codemagic.yaml` in the Android build script:
```yaml
scripts:
  - name: Apply Gradle fixes
    script: |
      # Ensure gradle wrapper has proper permissions
      chmod +x android/gradlew
      
      # Add gradle properties
      echo "android.useAndroidX=true" >> android/gradle.properties
      echo "android.enableJetifier=true" >> android/gradle.properties
      
  - name: Build Android
    script: |
      cd android
      ./gradlew clean
      ./gradlew assembleRelease --no-daemon
```

## Verification
After applying fixes, verify with:
```bash
cd SmartphoneApp
npx expo prebuild --platform android --clean
cd android
./gradlew app:dependencies --configuration debugRuntimeClasspath
```

Look for duplicate entries in the dependency tree.

## Common Duplicate Classes
- `com.google.common` (from Guava)
- `org.apache.commons`
- `com.facebook.react` (React Native)
- Native libraries (libc++_shared.so)

## Prevention
1. Use exact versions in package.json (no ^ or ~)
2. Regularly run `npm dedupe`
3. Check for peer dependency warnings
4. Use `npm ls <package>` to find duplicate versions
