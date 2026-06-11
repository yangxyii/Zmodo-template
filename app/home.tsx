import React from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../src/components/Screen';
import { DeviceCard } from '../src/components/DeviceCard';
import { deviceList } from '../src/api/devices';
import { useAuth } from '../src/store/authStore';
import type { Device } from '../src/api/types';
import { colors, spacing, font, radius } from '../src/theme/tokens';

export default function HomeScreen() {
  const router = useRouter();

  const token = useAuth((s) => s.token);
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['devices', token],
    queryFn: () => deviceList(token!),
    enabled: !!token,
  });

  const handleCardPress = (physicalId: string) => {
    router.push(('/camera/' + physicalId + '/live') as any);
  };

  const handleAddDevice = () => {
    router.push('/add-device' as any);
  };

  const handleAccount = () => {
    router.push('/account' as any);
  };

  const rightAction = (
    <View style={styles.headerActions}>
      <Pressable
        onPress={handleAccount}
        accessibilityRole="button"
        accessibilityLabel="Account"
        style={styles.headerIconButton}
        testID="home.account"
      >
        <Text style={styles.headerIconText}>👤</Text>
      </Pressable>
      <Pressable
        onPress={handleAddDevice}
        accessibilityRole="button"
        accessibilityLabel="Add device"
        style={styles.addButton}
      >
        <Text style={styles.addButtonText}>+</Text>
      </Pressable>
    </View>
  );

  let content: React.ReactElement;

  if (isLoading) {
    content = (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  } else if (isError) {
    content = (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          {error instanceof Error ? error.message : 'Failed to load devices.'}
        </Text>
        <Pressable
          onPress={() => void refetch()}
          style={styles.retryButton}
          accessibilityRole="button"
        >
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  } else if (!data || data.length === 0) {
    content = (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No devices found.</Text>
        <Text style={styles.emptySubText}>Tap + to add your first device.</Text>
      </View>
    );
  } else {
    content = (
      <FlatList<Device>
        data={data}
        keyExtractor={(item) => item.physical_id}
        renderItem={({ item }) => (
          <DeviceCard device={item} onPress={handleCardPress} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={() => void refetch()}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    );
  }

  return (
    <Screen title="My Cameras" right={rightAction}>
      {content}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerIconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  headerIconText: {
    fontSize: font.md,
    lineHeight: font.md + 4,
  },
  addButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  addButtonText: {
    fontSize: font.xl,
    color: colors.primary,
    fontWeight: '400',
    lineHeight: font.xl + 4,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  errorText: {
    fontSize: font.md,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
  },
  retryText: {
    color: colors.textOnPrimary,
    fontSize: font.md,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: font.lg,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  emptySubText: {
    fontSize: font.md,
    color: colors.textMuted,
    textAlign: 'center',
  },
  list: {
    paddingVertical: spacing.sm,
  },
});
