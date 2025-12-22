// app.config.js
const IS_RAILWAYS = process.env.APP_VARIANT === 'railways';

export default {
  expo: {
    // Switch Identity
    name: IS_RAILWAYS ? "Africa Railways Hub" : "Africoin Wallet",
    slug: IS_RAILWAYS ? "africa-railways" : "africoin-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: IS_RAILWAYS ? "./assets/icon.png" : "./assets/africoin-icon.png",
    userInterfaceStyle: "light",
    
    splash: {
      image: IS_RAILWAYS ? "./assets/splash.png" : "./assets/africoin-splash.png",
      resizeMode: "contain",
      backgroundColor: IS_RAILWAYS ? "#0066CC" : "#FFB800"
    },
    
    assetBundlePatterns: [
      "**/*"
    ],
    
    // Switch Project IDs
    extra: {
      eas: {
        projectId: IS_RAILWAYS 
          ? "82efeb87-20c5-45b4-b945-65d4b9074c32" 
          : "5fa2f2b4-5c9f-43bf-b1eb-20d90ae19185"
      },
      APP_VARIANT: process.env.APP_VARIANT || 'railways',
      // Backend configuration (from EAS secrets)
      backendUrl: process.env.BACKEND_URL || 'https://africa-railways.vercel.app',
      apiKey: process.env.API_KEY
    },
    
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
      adaptiveIcon: {
        foregroundImage: IS_RAILWAYS ? "./assets/adaptive-icon.png" : "./assets/africoin-adaptive-icon.png",
        backgroundColor: IS_RAILWAYS ? "#0066CC" : "#FFB800"
      },
      package: IS_RAILWAYS ? "com.mpolobe.railways" : "com.mpolobe.africoin"
    },
    
    web: {
      favicon: IS_RAILWAYS ? "./assets/favicon.png" : "./assets/africoin-favicon.png"
    }
  }
};
