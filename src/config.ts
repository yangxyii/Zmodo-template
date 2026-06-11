import Constants from 'expo-constants';
import { Platform } from 'react-native';

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

const extra = (Constants.expoConfig?.extra ?? {}) as {
  iotekBaseUrl?: string;
  liveWebrtcBaseUrl?: string;
  appDisplayName?: string;
  themeAccentHex?: string;
  apiProxy?: string;
};

const DEFAULT_IDENTITY_BASE_URL = extra.iotekBaseUrl ?? 'https://11-app-mop.iotek.ai';
const DEFAULT_LIVE_WEBRTC_BASE_URL = extra.liveWebrtcBaseUrl ?? 'https://11-webetc.iotek.ai';
const DEFAULT_APP_DISPLAY_NAME = extra.appDisplayName ?? 'Zmodo';
const DEFAULT_THEME_ACCENT_HEX = extra.themeAccentHex ?? '#00AEEF';

const defaultRuntimeConfig: RuntimeConfig = {
  services: {
    identity: { base_url: DEFAULT_IDENTITY_BASE_URL },
    live_webrtc: { base_url: DEFAULT_LIVE_WEBRTC_BASE_URL },
  },
  app: {
    display_name: DEFAULT_APP_DISPLAY_NAME,
    theme_accent_hex: DEFAULT_THEME_ACCENT_HEX,
  },
};

let runtimeConfig: RuntimeConfig = defaultRuntimeConfig;
let runtimeConfigPromise: Promise<RuntimeConfig> | null = null;

function readBaseUrl(service: RuntimeConfig['services'] extends infer Services ? Services : never, key: 'identity' | 'live_webrtc') {
  const services = service as RuntimeConfig['services'];
  return services?.[key]?.base_url ?? services?.[key]?.baseUrl;
}

export function getRuntimeConfig() {
  return runtimeConfig;
}

export function getIdentityBaseUrl() {
  return readBaseUrl(runtimeConfig.services, 'identity') ?? DEFAULT_IDENTITY_BASE_URL;
}

export function getLiveWebrtcBaseUrl() {
  return readBaseUrl(runtimeConfig.services, 'live_webrtc') ?? DEFAULT_LIVE_WEBRTC_BASE_URL;
}

export function getAppDisplayName() {
  return runtimeConfig.app?.display_name ?? runtimeConfig.app?.displayName ?? DEFAULT_APP_DISPLAY_NAME;
}

export function getThemeAccentHex() {
  return runtimeConfig.app?.theme_accent_hex ?? runtimeConfig.app?.themeAccentHex ?? DEFAULT_THEME_ACCENT_HEX;
}

export async function loadRuntimeConfig() {
  if (runtimeConfigPromise) return runtimeConfigPromise;
  runtimeConfigPromise = (async () => {
    if (Platform.OS !== 'web') return runtimeConfig;
    try {
      const response = await fetch('/runtime-config.json', { cache: 'no-store' });
      if (!response.ok) return runtimeConfig;
      const next = (await response.json()) as RuntimeConfig;
      runtimeConfig = {
        services: {
          ...runtimeConfig.services,
          ...(next.services ?? {}),
        },
        app: {
          ...runtimeConfig.app,
          ...(next.app ?? {}),
        },
      };
    } catch {
      // Keep Expo extra / default config when No-Code runtime file is absent.
    }
    return runtimeConfig;
  })();
  return runtimeConfigPromise;
}

export const IOTEK_BASE_URL = getIdentityBaseUrl();

// Web goes through a proxy to defeat CORS; native connects directly
export const API_PROXY = Platform.OS === 'web' ? (extra.apiProxy ?? '') : '';
