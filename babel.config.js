module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // The 'expo-router/babel' plugin is deprecated and removed.
    // 'babel-preset-expo' handles this automatically since SDK 50.
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@': './',
          },
        },
      ],
      'react-native-reanimated/plugin', // ✅ הוסף שורה זו
    ],
  };
};
