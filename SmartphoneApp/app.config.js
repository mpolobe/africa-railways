// app.config.js - Dynamic configuration for Railways and Africoin apps
const IS_RAILWAYS = process.env.APP_VARIANT === 'railways';
const IS_AFRICOIN = process.env.APP_VARIANT === 'africoin';

// Determine which app we're building
const APP_VARIANT = IS_RAILWAYS ? 'railways' : IS_AFRICOIN ? 'africoin' : 'railways';

module.exports = {
  expo: {
    // 1. Name of the app as it appears on the phone
    name: IS_RAILWAYS ? "Africa Railways Hub" : "Africoin Wallet",

    // 2. Slug MUST match what Expo has on their servers for that Project ID
    // Based on the error, the Africoin ID is currently linked to 'africa-railways-monorepo'
    slug: IS_RAILWAYS ? "africa-railways-app" : "africa-railways-monorepo",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "dark",
    
    // Icons and splash screens (using defaults for now)
    // icon: IS_RAILWAYS ? "./assets/icon.png" : "./assets/africoin-icon.png",
    
    // splash: {
    //   image: IS_RAILWAYS ? "./assets/splash.png" : "./assets/africoin-splash.png",
    //   resizeMode: "contain",
    //   backgroundColor: IS_RAILWAYS ? "#0066CC" : "#FFB800"
    // },
    
    // Plugins
    plugins: [
      [
        "expo-camera",
        {
          cameraPermission: IS_RAILWAYS
            ? "Allow Africa Railways to scan your ticket."
            : "Allow Africoin to scan QR codes."
        }
      ]
    ],
    
    // Asset patterns
    assetBundlePatterns: ["**/*"],
    
    // iOS Configuration
    ios: {
      supportsTablet: true,
      bundleIdentifier: IS_RAILWAYS ? "com.mpolobe.railways" : "com.mpolobe.africoin",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    
    // Android Configuration
    android: {
      // adaptiveIcon: {
      //   foregroundImage: IS_RAILWAYS
      //     ? "./assets/adaptive-icon.png"
      //     : "./assets/africoin-adaptive-icon.png",
      //   backgroundColor: IS_RAILWAYS ? "#0066CC" : "#FFB800"
      // },
      package: IS_RAILWAYS ? "com.mpolobe.railways" : "com.mpolobe.africoin",
      versionCode: 1,
      permissions: ["CAMERA"]
    },
    
    // Web Configuration
    // web: {
    //   favicon: IS_RAILWAYS ? "./assets/favicon.png" : "./assets/africoin-favicon.png"
    // },
    
    // Extra configuration
    extra: {
      eas: {
        // projectId is the UUID from Expo Dashboard
        projectId: IS_RAILWAYS 
          ? "82efeb87-20c5-45b4-b945-65d4b9074c32" // Railways ID
          : "5fa2f2b4-5c9f-43bf-b1eb-20d90ae19185" // Africoin ID
      },
      APP_VARIANT: APP_VARIANT,
      backendUrl: process.env.BACKEND_URL || "https://africa-railways.vercel.app",
      apiKey: process.env.API_KEY
    }
  }
};
