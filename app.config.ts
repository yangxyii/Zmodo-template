import 'dotenv/config';

export default {
  expo: {
    name: 'Zmodo',
    slug: 'zmodo',
    version: '1.0.0',
    orientation: 'portrait' as const,
    icon: './assets/icon.png',
    userInterfaceStyle: 'light' as const,
    scheme: 'zmodo',
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    plugins: ['expo-router'],
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    extra: {
      iotekBaseUrl: process.env.IOTEK_BASE_URL ?? 'https://11-app-mop.iotek.ai',
      apiProxy: process.env.EXPO_PUBLIC_API_PROXY ?? '',
    },
  },
};
