/**
 * zmodoSession.native.ts — iOS-only wrapper for ZmodoVideo native module's
 * "connect" function.
 *
 * Loaded only on native (React Native resolution prefers .native.ts over .ts).
 * Web/Jest see the no-op stub in zmodoSession.ts instead.
 */
import { requireNativeModule } from 'expo-modules-core';
import type { ConnectServerParams } from '../api/auth';

// The Expo native module registered as "ZmodoVideo" (ZmodoVideoModule.swift).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ZmodoVideoNative = requireNativeModule<{ connect: (params: Record<string, unknown>) => Promise<void> }>('ZmodoVideo');

/**
 * Connect LibCore to the Zmodo access server (TRANSFER relay).
 * Must be called once after login, before any live stream is started.
 * Idempotent — safe to call on every login (LibCore initialize is guarded).
 */
export async function connectServer(params: ConnectServerParams): Promise<void> {
  // Cast ConnectServerParams to a plain object for the native bridge.
  await ZmodoVideoNative.connect(params as unknown as Record<string, unknown>);
}
