const { getDefaultConfig } = require('expo/metro-config');

// Get default config
const config = getDefaultConfig(__dirname);

// Add resolver alias for web maps
config.resolver = config.resolver || {};
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native-maps': '@teovilla/react-native-web-maps',
};

// Ensure transformer is properly configured
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('expo/metro-config/babel-transformer'),
};

module.exports = config;
