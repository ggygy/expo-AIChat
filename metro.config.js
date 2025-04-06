const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const config = getDefaultConfig(__dirname);

config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_classnames: true,
    keep_fnames: true,
    mangle: {
      keep_classnames: true,
      keep_fnames: true,
    },
  },
};

config.resolver = {
  ...config.resolver,
  sourceExts: [...config.resolver.sourceExts, 'svg'],
  resolverMainFields: ['react-native', 'browser', 'main'],
  // url: path.resolve(__dirname, 'polyfills/url.js'),
  // crypto: require.resolve('crypto-browserify'),
  // jsonwebtoken: require.resolve('./stub-jsonwebtoken.js'),
};

module.exports = config;