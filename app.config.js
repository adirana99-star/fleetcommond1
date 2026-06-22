const IS_PRODUCTION = process.env.EXPO_PUBLIC_ENVIRONMENT === 'production';

module.exports = {
  expo: {
    name: IS_PRODUCTION ? 'FleetCommand' : 'FleetCommand Dev',
    slug: 'fleet-command-enterprise',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: 'fleetcommand',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#0f172a'
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.yourcompany.fleetcommand',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      package: 'com.yourcompany.fleetcommand',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0f172a'
      },
      edgeToEdgeEnabled: true,
      permissions: []
    },
    web: {
      bundler: 'metro',
      favicon: './assets/favicon.png'
    },
    extra: {
      environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || ''
      ,
      eas: {
        projectId: '4fd860a2-c783-4973-baec-f44e5315d98f'
      }
    }
  }
};
