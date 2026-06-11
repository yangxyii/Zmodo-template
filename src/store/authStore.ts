import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LoginData } from '../api/types';

const KEYS = {
  token: 'zmodo.token',
  user: 'zmodo.user',
} as const;

interface AuthState {
  token: string | null;
  user: LoginData | null;
  hydrated: boolean;
  setSession: (token: string, user: LoginData) => void;
  clear: () => void;
  hydrate: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  token: null,
  user: null,
  hydrated: false,

  setSession: (token, user) => {
    set({ token, user });
    void AsyncStorage.setItem(KEYS.token, token);
    void AsyncStorage.setItem(KEYS.user, JSON.stringify(user));
  },

  clear: () => {
    set({ token: null, user: null });
    void AsyncStorage.removeItem(KEYS.token);
    void AsyncStorage.removeItem(KEYS.user);
  },

  hydrate: async () => {
    if (useAuth.getState().hydrated) return;
    try {
      const [token, userJson] = await Promise.all([
        AsyncStorage.getItem(KEYS.token),
        AsyncStorage.getItem(KEYS.user),
      ]);
      let user: LoginData | null = null;
      try {
        user = userJson ? (JSON.parse(userJson) as LoginData) : null;
      } catch {
        user = null;
      }
      set((s) => (s.hydrated ? s : { ...s, token: token ?? null, user, hydrated: true }));
    } catch {
      set((s) => (s.hydrated ? s : { ...s, token: null, user: null, hydrated: true }));
    }
  },
}));
