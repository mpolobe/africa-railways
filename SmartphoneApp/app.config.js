// app.config.js - Dynamic configuration for Railways and Africoin apps
const IS_RAILWAYS = process.env.APP_VARIANT === 'railways';
const IS_AFRICOIN = process.env.APP_VARIANT === 'africoin';

// Determine which app we're building
const APP_VARIANT = IS_RAILWAYS ? 'railways' : IS_AFRICOIN ? 'africoin' : 'railways';

module.exports = {
  expo: {
    // Dynamic app identity based on variant
    // Note: Slugs must match the projectId in extra.eas
    name: IS_RAILWAYS ? "Africa Railways Hub" : "Africoin Wallet",
    slug: IS_RAILWAYS ? "africa-railways" : "africoin-app",
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
      permissions: ["CAMERA"]
    },
    
    // Web Configuration
    // web: {
    //   favicon: IS_RAILWAYS ? "./assets/favicon.png" : "./assets/africoin-favicon.png"
    // },
    
    // Extra configuration
    extra: {
      // Note: projectId is now set via slug in eas.json
      // No need to set it here as it causes conflicts
      APP_VARIANT: APP_VARIANT,
      backendUrl: process.env.BACKEND_URL || "https://africa-railways.vercel.app",
      apiKey: process.env.API_KEY
    }
  }
};
