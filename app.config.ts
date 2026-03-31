import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'leh-wi-tok',
  slug: 'leh-wi-tok',
  scheme: 'leh-wi-tok',
  version: '1.0.1',
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
    supportsTablet: false,
    infoPlist: {
      NSPhotoLibraryUsageDescription:
        'Leh Wi Tok needs access to your photo library so you can select and upload a profile picture. The photo you choose will be displayed on your account profile.',
    },
    bundleIdentifier: 'com.dsti.lehwitok',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#0F4C5C',
    },
    permissions: ['CAMERA', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE'],
    package: 'com.dsti.lehwitok',
    allowBackup: false,
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
      'expo-build-properties',
      {
        android: {
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          enableProguardInReleaseBuilds: true,
          ndkVersion: '27.1.12297006',
        },
      },
    ],
    [
      'expo-video',
      {
        supportsBackgroundPlayback: false,
        supportsPictureInPicture: true,
      },
    ],
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
