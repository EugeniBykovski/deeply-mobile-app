module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      // MUST be last — compiles worklet functions for the native UI thread.
      // Without this, Reanimated animations run on the JS thread in production
      // builds, causing severe lag on Dive and Training screens.
      'react-native-reanimated/plugin',
    ],
  };
};
