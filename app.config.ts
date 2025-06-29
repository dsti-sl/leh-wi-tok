import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'leh-wi-tok',
  slug: 'leh-wi-tok',
  scheme: 'leh-wi-tok',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/images/splash.png',
    resizeMode: 'cover',
    backgroundColor: '#0F4C5C',
  },
  ios: {
    supportsTablet: true,
    infoPlist: {
      NSPhotoLibraryUsageDescription: 'Le Wi Tok access ',
    },
    bundleIdentifier: 'com.dsti.lehwitok',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#0F4C5C',
    },
    permissions: ['CAMERA', 'READ_EXTERNAL_STORAGE'],
    package: 'com.dsti.lehwitok',
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-image-picker',
    [
      'expo-video',
      {
        supportsBackgroundPlayback: true,
        supportsPictureInPicture: true,
      },
    ],
    'expo-font',
    'expo-font',
    [
      'expo-sqlite',
      {
        enableFTS: true,
        useSQLCipher: false,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    API_URL: process.env.EXPO_PUBLIC_BASE_URL,
    router: {
      origin: false,
    },
    eas: {
      projectId: 'aacef87d-4cb4-4d7c-83c7-299db6fc6c1a',
    },
  },
});
