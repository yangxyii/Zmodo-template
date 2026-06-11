import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { DeviceCard } from '../../src/components/DeviceCard';
import { deviceList } from '../../src/api/devices';
import { useAuth } from '../../src/store/authStore';
import type { Device } from '../../src/api/types';
import { colors, spacing, font } from '../../src/theme/tokens';

// Single promo banner (the product-shelf image), matching the native app.
const BANNER_IMAGE = require('../../assets/zmodo/home_banner_2.png');

const BANNER_HEIGHT = 150;

// ─── Pill Button ─────────────────────────────────────────────────────────────

interface PillButtonProps {
  label: string;
  testID?: string;
}

function PillButton({ label, testID }: PillButtonProps) {
  // TODO(phase-2): wire up Settings navigation
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.pill}
      onPress={() => {/* TODO(phase-2): open settings */}}
    >
      <Text style={styles.pillText}>{label}</Text>
    </Pressable>
  );
}

// ─── Promo Banner (single, dismissible) ───────────────────────────────────────

function PromoBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <View testID="home.banner" style={styles.bannerContainer}>
      <Image source={BANNER_IMAGE} style={styles.bannerImage} resizeMode="cover" />
      {/* Close button */}
      <Pressable
        testID="home.banner.close"
        accessibilityRole="button"
        accessibilityLabel="Dismiss banner"
        style={styles.bannerClose}
        onPress={() => setVisible(false)}
      >
        <Image
          source={require('../../assets/zmodo/home_banner_close.png')}
          style={styles.bannerCloseIcon}
          resizeMode="contain"
        />
      </Pressable>
    </View>
  );
}

// ─── Notification Section ─────────────────────────────────────────────────────

function NotificationSection() {
  const [notificationsOn, setNotificationsOn] = useState(true);

  return (
    <View style={styles.section}>
      {/* Section header row */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Notification</Text>
        <PillButton label="Settings" testID="home.notif.settings" />
      </View>
      {/* Toggles */}
      <View style={styles.notifToggles}>
        {/* ON toggle */}
        <Pressable
          testID="home.notif.on"
          accessibilityRole="button"
          accessibilityLabel="Notifications On"
          style={styles.toggleItem}
          onPress={() => setNotificationsOn(true)}
        >
          <View
            style={[
              styles.toggleCircle,
              notificationsOn ? styles.toggleCircleActive : styles.toggleCircleInactive,
            ]}
          >
            <Ionicons
              name="notifications"
              size={26}
              color={notificationsOn ? '#FFFFFF' : colors.dimGray}
            />
          </View>
          <Text style={styles.toggleLabel}>ON</Text>
        </Pressable>

        {/* OFF toggle */}
        <Pressable
          testID="home.notif.off"
          accessibilityRole="button"
          accessibilityLabel="Notifications Off"
          style={styles.toggleItem}
          onPress={() => setNotificationsOn(false)}
        >
          <View
            style={[
              styles.toggleCircle,
              !notificationsOn ? styles.toggleCircleActive : styles.toggleCircleInactive,
            ]}
          >
            <Ionicons
              name="notifications-off"
              size={26}
              color={!notificationsOn ? '#FFFFFF' : colors.dimGray}
            />
          </View>
          <Text style={styles.toggleLabel}>OFF</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── My Devices Section ────────────────────────────────────────────────────────

interface DevicesSectionProps {
  devices: Device[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onRefetch: () => void;
  onLive: (id: string) => void;
  onPlayback: (id: string) => void;
}

function DevicesSection({
  devices,
  isLoading,
  isError,
  error,
  onRefetch,
  onLive,
  onPlayback,
}: DevicesSectionProps) {
  let cardContent: React.ReactElement;

  if (isLoading) {
    cardContent = (
      <View style={styles.deviceCardInner}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  } else if (isError) {
    cardContent = (
      <View style={styles.deviceCardInner}>
        <Text style={styles.errorText}>
          {error instanceof Error ? error.message : 'Failed to load devices.'}
        </Text>
        <Pressable
          onPress={onRefetch}
          style={styles.retryButton}
          accessibilityRole="button"
        >
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  } else if (!devices || devices.length === 0) {
    cardContent = (
      <View style={styles.deviceCardInner}>
        <Text style={styles.emptyText}>No Devices</Text>
      </View>
    );
  } else {
    cardContent = (
      <>
        {devices.map((device, index) => (
          <DeviceCard
            key={device.physical_id}
            device={device}
            variant="row"
            onPress={onLive}
            onPlayback={onPlayback}
            showSeparator={index < devices.length - 1}
          />
        ))}
      </>
    );
  }

  return (
    <View style={styles.section}>
      {/* Section header row */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>My Devices</Text>
        <PillButton label="Settings" testID="home.devices.settings" />
      </View>
      {/* White card container */}
      <View style={styles.devicesCard}>{cardContent}</View>
    </View>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const token = useAuth((s) => s.token);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['devices', token],
    queryFn: () => deviceList(token!),
    enabled: !!token,
  });

  const handleLive = (physicalId: string) => {
    router.push(('/camera/' + physicalId + '/live') as any);
  };

  const handlePlayback = (physicalId: string) => {
    router.push(('/camera/' + physicalId + '/playback') as any);
  };

  const handleAddDevice = () => {
    router.push('/add-device' as any);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Welcome</Text>
        <Pressable
          onPress={handleAddDevice}
          accessibilityRole="button"
          accessibilityLabel="Add device"
          style={styles.addButton}
        >
          <Image
            source={require('../../assets/zmodo/icon_add_new.png')}
            style={styles.addIcon}
            resizeMode="contain"
          />
        </Pressable>
      </View>

      {/* Scrollable body */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={() => void refetch()}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Promo banner */}
        <PromoBanner />

        {/* Notification */}
        <NotificationSection />

        {/* My Devices */}
        <DevicesSection
          devices={data}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRefetch={() => void refetch()}
          onLive={handleLive}
          onPlayback={handlePlayback}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#EFEFF4',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFEFF4',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  addButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
  },
  addIcon: {
    width: 24,
    height: 24,
    tintColor: '#1A1A1A',
  },

  // Scroll
  scroll: {
    flex: 1,
    backgroundColor: '#EFEFF4',
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },

  // Banner
  bannerContainer: {
    marginBottom: 0,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: BANNER_HEIGHT,
  },
  bannerClose: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerCloseIcon: {
    width: 22,
    height: 22,
  },

  // Section
  section: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  // Pill button
  pill: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.pillBorder,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 12,
    color: colors.textDarkGray,
  },

  // Notification toggles
  notifToggles: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
  },
  toggleItem: {
    alignItems: 'center',
    gap: 6,
  },
  toggleCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleCircleActive: {
    backgroundColor: colors.primary,
  },
  toggleCircleInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleLabel: {
    fontSize: 13,
    color: colors.textDarkGray,
  },

  // Devices card
  devicesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  deviceCardInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: spacing.md,
    gap: 12,
  },

  // Error / empty / loading states (inside device card)
  errorText: {
    fontSize: font.md,
    color: colors.danger,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: colors.textOnPrimary,
    fontSize: font.md,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textDarkGray,
    textAlign: 'center',
  },
});
