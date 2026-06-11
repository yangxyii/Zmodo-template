import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

type RuntimeConfig = {
  services?: {
    identity?: { base_url?: string; baseUrl?: string };
    live_webrtc?: { base_url?: string; baseUrl?: string };
  };
  app?: {
    display_name?: string;
    displayName?: string;
    theme_accent_hex?: string;
    themeAccentHex?: string;
  };
};

function readRuntimeConfig(): RuntimeConfig {
  const configPath = path.join(process.cwd(), 'public', 'runtime-config.json');
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8')) as RuntimeConfig;
  } catch {
    return {};
  }
}

const runtimeConfig = readRuntimeConfig();
const runtimeApp = runtimeConfig.app ?? {};
const runtimeServices = runtimeConfig.services ?? {};
const identityBaseUrl =
  process.env.IOTEK_BASE_URL ??
  runtimeServices.identity?.base_url ??
  runtimeServices.identity?.baseUrl ??
  'https://11-app-mop.iotek.ai';
const liveWebrtcBaseUrl =
  process.env.IOTEK_LIVE_WEBRTC_BASE_URL ??
  runtimeServices.live_webrtc?.base_url ??
  runtimeServices.live_webrtc?.baseUrl ??
  'https://11-webetc.iotek.ai';
const displayName =
  process.env.IOTEK_APP_DISPLAY_NAME ??
  runtimeApp.display_name ??
  runtimeApp.displayName ??
  'Zmodo';
const themeAccentHex =
  process.env.IOTEK_THEME_ACCENT_HEX ??
  runtimeApp.theme_accent_hex ??
  runtimeApp.themeAccentHex ??
  '#00AEEF';

export default {
  expo: {
    name: displayName,
    slug: 'zmodo',
    version: '1.0.0',
    orientation: 'portrait' as const,
    icon: './assets/icon.png',
    userInterfaceStyle: 'light' as const,
    scheme: 'zmodo',
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
      // Single-page static output: assets become normal hashed files under
      // /assets/... (no Metro dev-server "?unstable_path=" URLs), and client
      // routing works inside the No-Code iframe. Serve the exported dist/
      // statically — do NOT run `expo start` in production.
      output: 'single',
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
      iotekBaseUrl: identityBaseUrl,
      liveWebrtcBaseUrl,
      appDisplayName: displayName,
      themeAccentHex,
      apiProxy: process.env.EXPO_PUBLIC_API_PROXY ?? '',
    },
  },
};
