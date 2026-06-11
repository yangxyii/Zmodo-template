import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { Button } from '../src/components/Button';
import { logout } from '../src/api/auth';
import { useAuth } from '../src/store/authStore';
import { colors, spacing, font, radius } from '../src/theme/tokens';

export default function AccountScreen() {
  const router = useRouter();
  const token = useAuth((s) => s.token);
  const user = useAuth((s) => s.user);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout(token!);
    } finally {
      useAuth.getState().clear();
      // Return to the first screen (welcome carousel), like the native app.
      router.replace('/welcome');
    }
  };

  const displayName = user?.nickname ?? user?.username ?? '';
  const displayEmail = user?.email ?? '';

  return (
    <Screen title="Account" onBack={router.canGoBack() ? () => router.back() : undefined}>
      <View style={styles.container}>
        {/* User info card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(displayName || displayEmail).charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          {!!displayName && (
            <Text style={styles.displayName}>{displayName}</Text>
          )}
          {!!displayEmail && (
            <Text style={styles.email}>{displayEmail}</Text>
          )}
        </View>

        <View style={styles.actions}>
          <Button
            title="Log Out"
            onPress={() => { handleLogout().catch(() => {}); }}
            variant="danger"
            loading={loggingOut}
            disabled={loggingOut}
            testID="settings.logoutButton"
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  userCard: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: font.xl,
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
  displayName: {
    fontSize: font.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  email: {
    fontSize: font.sm,
    color: colors.textMuted,
  },
  actions: {
    gap: spacing.md,
  },
});
