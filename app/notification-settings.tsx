import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../src/components/Screen';
import { CardGroup } from '../src/components/CardGroup';
import { getAiNotification, setAiNotification } from '../src/api/notifications';
import type { AiNotification } from '../src/api/notifications';
import { useAuth } from '../src/store/authStore';
import { colors, spacing, font } from '../src/theme/tokens';

const ROWS: { label: string; key: keyof AiNotification; testID: string }[] = [
  { label: 'People', key: 'people_motion', testID: 'notif.people' },
  { label: 'Vehicles', key: 'vehicle_motion', testID: 'notif.vehicle' },
  { label: 'Animals', key: 'animal_motion', testID: 'notif.animal' },
  { label: 'Other Motion', key: 'other_motion', testID: 'notif.other' },
];

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const token = useAuth((s) => s.token);
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['aiNotification', token],
    queryFn: () => getAiNotification(token!),
    enabled: !!token,
  });

  const handleToggle = async (key: keyof AiNotification, value: boolean) => {
    if (!data || !token) return;
    setErrorMsg(null);
    const next: AiNotification = { ...data, [key]: value ? 1 : 0 };
    // Optimistic update
    queryClient.setQueryData(['aiNotification', token], next);
    try {
      await setAiNotification(token, next);
    } catch {
      // Roll back
      queryClient.setQueryData(['aiNotification', token], data);
      setErrorMsg('Failed to save. Please try again.');
    }
  };

  const onBack = () =>
    router.canGoBack() ? router.back() : router.replace('/home' as any);

  return (
    <Screen title="Notification Settings" onBack={onBack} scroll>
      {errorMsg ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load notification settings.</Text>
        </View>
      ) : (
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>AI Notifications</Text>
          <CardGroup>
            {ROWS.map((row) => (
              <View key={row.key} testID={row.testID} style={styles.row}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Switch
                  value={data ? data[row.key] === 1 : false}
                  onValueChange={(v) => void handleToggle(row.key, v)}
                  thumbColor={colors.bg}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  accessibilityLabel={row.label}
                />
              </View>
            ))}
          </CardGroup>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionWrap: {
    marginTop: spacing.lg,
  },
  sectionLabel: {
    fontSize: font.sm,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.md + 4,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bg,
  },
  rowLabel: {
    flex: 1,
    fontSize: font.md + 1,
    color: colors.text,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorBanner: {
    backgroundColor: colors.dangerBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.danger,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  errorText: {
    fontSize: font.sm,
    color: colors.danger,
    textAlign: 'center',
  },
});
