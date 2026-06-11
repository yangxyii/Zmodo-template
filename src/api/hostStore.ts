import AsyncStorage from '@react-native-async-storage/async-storage';
import { getIdentityBaseUrl } from '../config';
import type { HostList } from './types';

const STORAGE_KEY = 'zmodo.hostlist';

let hosts: HostList = {};

export const setHostList = (h?: HostList) => {
  if (h) {
    hosts = h;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(h)).catch(() => {});
  }
};

export const hostFor = (category: string): string =>
  hosts[category]?.[0] ?? getIdentityBaseUrl();

export const clearHosts = () => {
  hosts = {};
  AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
};

export async function loadHosts(): Promise<void> {
  // Only populate from storage when in-memory map is currently empty.
  if (Object.keys(hosts).length > 0) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as HostList;
      // Guard again — a concurrent login may have populated hosts while we awaited.
      if (Object.keys(hosts).length === 0) {
        hosts = parsed;
      }
    }
  } catch {
    // Best-effort; ignore storage or parse errors.
  }
}
