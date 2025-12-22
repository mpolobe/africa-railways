// Mock global objects
global.window = {};
global.window = global;

// Mock Expo modules
jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: jest.fn(() => [
    { granted: true },
    jest.fn()
  ])
}));

jest.mock('expo-localization', () => ({
  locale: 'en-US',
  getLocales: jest.fn(() => [{ languageCode: 'en', regionCode: 'US' }])
}));

jest.mock('expo-speech', () => ({
  speak: jest.fn()
}));

// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Sui client
jest.mock('@mysten/sui.js/client', () => ({
  SuiClient: jest.fn().mockImplementation(() => ({
    getObject: jest.fn().mockResolvedValue({
      data: {
        content: {
          fields: {
            recipient: 'test-user',
            class: 'first'
          }
        }
      }
    })
  })),
  getFullnodeUrl: jest.fn(() => 'http://localhost:9000')
}));

jest.mock('@mysten/sui.js/transactions', () => ({
  TransactionBlock: jest.fn()
}));

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiRemove: jest.fn(() => Promise.resolve())
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi'
  })),
  addEventListener: jest.fn(() => jest.fn())
}));
