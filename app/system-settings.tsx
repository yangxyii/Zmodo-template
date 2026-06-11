/**
 * System Settings sub-page — reached from the Me page's "System Settings" row.
 * Phase 1: all rows are placeholders.
 */
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../src/components/Screen';
import { SettingsRow } from '../src/components/SettingsRow';
import { CardGroup } from '../src/components/CardGroup';
import { colors } from '../src/theme/tokens';

const ICON_COLOR = '#8A8F98';
const ICON_SIZE = 22;

// Phase-1 placeholder
const noop = () => {
  // TODO(phase-2): implement real functionality
};

export default function SystemSettingsScreen() {
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home' as never);
    }
  };

  return (
    <Screen title="System Settings" onBack={handleBack}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card 1: Reset Password */}
        <CardGroup style={styles.card}>
          <SettingsRow
            icon={<Ionicons name="lock-closed" size={ICON_SIZE} color={ICON_COLOR} />}
            label="Reset Password"
            onPress={noop}
            testID="sysset.row.resetPassword"
          />
        </CardGroup>

        {/* Card 2: 2-Factor Authentication */}
        <CardGroup style={styles.card}>
          <SettingsRow
            icon={<Ionicons name="shield-checkmark" size={ICON_SIZE} color={ICON_COLOR} />}
            label="2-Factor Authentication"
            onPress={noop}
            testID="sysset.row.2fa"
          />
        </CardGroup>

        {/* Card 3: AI Notifications, Storage Management */}
        <CardGroup style={styles.card}>
          <SettingsRow
            icon={<Ionicons name="notifications" size={ICON_SIZE} color={ICON_COLOR} />}
            label="AI Notifications"
            onPress={noop}
            testID="sysset.row.aiNotifications"
          />
          <SettingsRow
            icon={<Ionicons name="server" size={ICON_SIZE} color={ICON_COLOR} />}
            label="Storage Management"
            onPress={noop}
            testID="sysset.row.storageManagement"
          />
        </CardGroup>

        {/* Card 4: Check for Updates, About */}
        <CardGroup style={styles.card}>
          <SettingsRow
            icon={<Ionicons name="cloud-download" size={ICON_SIZE} color={ICON_COLOR} />}
            label="Check for Updates"
            onPress={noop}
            testID="sysset.row.checkUpdates"
          />
          <SettingsRow
            icon={<Ionicons name="information-circle" size={ICON_SIZE} color={ICON_COLOR} />}
            label="About"
            onPress={noop}
            testID="sysset.row.about"
          />
        </CardGroup>

        <View style={styles.bottomPad} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  card: {
    marginTop: 16,
  },
  bottomPad: {
    height: 16,
  },
});
