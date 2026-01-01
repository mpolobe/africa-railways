const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  'react-native-maps': '@teovilla/react-native-web-maps',
};

module.exports = config;
