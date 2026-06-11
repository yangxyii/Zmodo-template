import Constants from 'expo-constants';
import { Platform } from 'react-native';

const extra = (Constants.expoConfig?.extra ?? {}) as { iotekBaseUrl?: string; apiProxy?: string };

export const IOTEK_BASE_URL = extra.iotekBaseUrl ?? 'https://11-app-mop.iotek.ai';

// Web goes through a proxy to defeat CORS; native connects directly
export const API_PROXY = Platform.OS === 'web' ? (extra.apiProxy ?? '') : '';
