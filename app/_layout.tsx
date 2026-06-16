import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PhoneFrame } from '../src/components/PhoneFrame';
import { useAuth } from '../src/store/authStore';
import { loadRuntimeConfig } from '../src/config';
import { IotekPreviewBridge } from '../src/previewBridge';
import { loadHosts } from '../src/api/hostStore';
import { connectAccessServerFromSession } from '../src/api/auth';

const queryClient = new QueryClient();

export default function RootLayout() {
  const hydrated = useAuth((s) => s.hydrated);
  const [runtimeReady, setRuntimeReady] = React.useState(false);
  const [hostsReady, setHostsReady] = React.useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadRuntimeConfig().finally(() => {
      if (!cancelled) setRuntimeReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (runtimeReady) {
      void useAuth.getState().hydrate();
      // Restore the persisted host_list BEFORE screens (and their queries)
      // mount, so host-routed calls (alerts/vault) hit the right host on a
      // refresh / deep link instead of falling back to the base URL.
      loadHosts().finally(() => setHostsReady(true));
    }
  }, [runtimeReady]);

  // Once auth + host_list are restored, connect LibCore to the access server
  // if we already have a session (relaunch path that skips the login screen).
  // Without this, TRANSFER-mode live fails with "Not login access server".
  useEffect(() => {
    if (hydrated && hostsReady && useAuth.getState().token) {
      connectAccessServerFromSession().catch((e) => {
        // Surface the real reason (e.g. token invalid) in the device log
        // instead of silently swallowing it.
        console.warn('[zmodo] access server connect failed:', e?.message ?? e);
      });
    }
  }, [hydrated, hostsReady]);

  if (!runtimeReady || !hydrated || !hostsReady) {
    // Render nothing while hydrating persisted auth + host state
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <IotekPreviewBridge />
      <PhoneFrame>
        <Stack screenOptions={{ headerShown: false }} />
      </PhoneFrame>
    </QueryClientProvider>
  );
}
