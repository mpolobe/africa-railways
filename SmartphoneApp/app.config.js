// app.config.js - Dynamic configuration for all 4 apps
const APP_VARIANT = process.env.APP_VARIANT || 'railways';

// App configurations
const APP_CONFIGS = {
  railways: {
    name: "Africa Railways Hub",
    slug: "africa-railways-app",
    package: "com.mpolobe.railways",
    bundleIdentifier: "com.mpolobe.railways",
    projectId: "82efeb87-20c5-45b4-b945-65d4b9074c32",
    cameraPermission: "Allow Africa Railways to scan your ticket.",
    backgroundColor: "#0066CC",
    description: "Book tickets and manage your railway journey"
  },
  africoin: {
    name: "Africoin Wallet",
    slug: "africa-railways-monorepo",
    package: "com.mpolobe.africoin",
    bundleIdentifier: "com.mpolobe.africoin",
    projectId: "5fa2f2b4-5c9f-43bf-b1eb-20d90ae19185",
    cameraPermission: "Allow Africoin to scan QR codes.",
    backgroundColor: "#FFB800",
    description: "Pan-African digital currency wallet"
  },
  sentinel: {
    name: "Sentinel Portal",
    slug: "sentinel-portal",
    package: "com.mpolobe.sentinel",
    bundleIdentifier: "com.mpolobe.sentinel",
    projectId: "82efeb87-20c5-45b4-b945-65d4b9074c32", // Use Railways project for now
    cameraPermission: "Allow Sentinel to scan track checkpoint QR codes.",
    backgroundColor: "#FFB800",
    description: "Track worker safety monitoring and reporting"
  },
  staff: {
    name: "Staff Verification",
    slug: "staff-verification",
    package: "com.mpolobe.staff",
    bundleIdentifier: "com.mpolobe.staff",
    projectId: "82efeb87-20c5-45b4-b945-65d4b9074c32", // Use Railways project for now
    cameraPermission: "Allow Staff Verification to scan passenger tickets.",
    backgroundColor: "#0066CC",
    description: "Railway staff ticket verification tool"
  }
};

// Get current app config
const config = APP_CONFIGS[APP_VARIANT] || APP_CONFIGS.railways;

module.exports = {
  expo: {
    name: config.name,
    slug: config.slug,
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "dark",
    
    // App Icon
    icon: `./assets/icon-${APP_VARIANT}.png`,
    
    // Splash Screen
    splash: {
      image: `./assets/splash-${APP_VARIANT}.png`,
      resizeMode: "contain",
      backgroundColor: config.backgroundColor
    },
    
    // Plugins
    plugins: [
      [
        "expo-camera",
        {
          cameraPermission: config.cameraPermission
        }
      ],
      [
        "expo-build-properties",
        {
          android: {
            compileSdkVersion: 34,
            targetSdkVersion: 34,
            minSdkVersion: 23,
            useAndroidX: true,
            enableJetifier: true,
            packagingOptions: {
              pickFirst: [
                "lib/x86/libc++_shared.so",
                "lib/x86_64/libc++_shared.so",
                "lib/armeabi-v7a/libc++_shared.so",
                "lib/arm64-v8a/libc++_shared.so"
              ],
              exclude: [
                "META-INF/DEPENDENCIES",
                "META-INF/LICENSE",
                "META-INF/LICENSE.txt",
                "META-INF/NOTICE",
                "META-INF/NOTICE.txt"
              ]
            }
          }
        }
      ]
    ],
    
    // Asset patterns
    assetBundlePatterns: ["**/*"],
    
    // iOS Configuration
    ios: {
      supportsTablet: true,
      bundleIdentifier: config.bundleIdentifier,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    
    // Android Configuration
    android: {
      package: config.package,
      versionCode: 1,
      permissions: [
        "CAMERA", 
        "ACCESS_FINE_LOCATION",
        "ACCESS_NETWORK_STATE",
        "ACCESS_WIFI_STATE"
      ],
      usesCleartextTraffic: true,
      hardwareAccelerated: true,
      adaptiveIcon: {
        foregroundImage: `./assets/adaptive-icon-${APP_VARIANT}.png`,
        backgroundColor: config.backgroundColor
      }
    },
    
    // Extra configuration
    extra: {
      eas: {
        projectId: config.projectId
      },
      APP_VARIANT: APP_VARIANT,
      appDescription: config.description,
      backendUrl: process.env.BACKEND_URL || "https://africa-railways.vercel.app",
      apiKey: process.env.API_KEY,
      alchemyKey: process.env.ALCHEMY_SDK_KEY
    }
  }
};
