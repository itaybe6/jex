module.exports = {
  expo: {
    name: 'Brilliant',
    slug: 'brilliant',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    "notification": {
      "icon": "./assets/icon.png",
    },
    ios: {
      bundleIdentifier: 'com.itaybenyair.brilliantv2', 
      supportsTablet: true,
      infoPlist: {
        UIBackgroundModes: ['remote-notification']
      }
    },
    extra: {
      eas: {
        projectId: '186c0305-2545-4725-8b37-10f794488e44' // 👈 זה החדש

      }
    },
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    assetBundlePatterns: [
      '**/*'
    ],
    
    android: {
      package: 'com.anonymous.jexmobilenew',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      }
    },
    scheme: 'jex-mobile-new',
    web: {
      favicon: './assets/favicon.png'
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    }
  }
};