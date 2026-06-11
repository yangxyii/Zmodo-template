import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PhoneFrame } from '../src/components/PhoneFrame';
import { useAuth } from '../src/store/authStore';

const queryClient = new QueryClient();

export default function RootLayout() {
  const hydrated = useAuth((s) => s.hydrated);

  useEffect(() => {
    void useAuth.getState().hydrate();
  }, []);

  if (!hydrated) {
    // Render nothing while hydrating persisted auth state
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PhoneFrame>
        <Stack screenOptions={{ headerShown: false }} />
      </PhoneFrame>
    </QueryClientProvider>
  );
}
