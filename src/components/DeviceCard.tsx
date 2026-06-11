import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { Device } from '../api/types';
import { isOnline } from '../api/types';
import { colors, spacing, radius, font } from '../theme/tokens';

interface DeviceCardProps {
  device: Device;
  onPress: (physicalId: string) => void;
}

export function DeviceCard({ device, onPress }: DeviceCardProps) {
  const online = isOnline(device);

  return (
    <Pressable
      testID="home.cameraCard"
      accessibilityRole="button"
      accessibilityLabel={device.device_name}
      accessibilityHint="Open live view"
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress(device.physical_id)}
    >
      {/* Thumbnail placeholder — no remote images; streaming not available on web */}
      <View style={styles.thumbnail}>
        <Text style={styles.thumbnailIcon}>📷</Text>
      </View>

      {/* Main info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {device.device_name}
        </Text>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: online ? colors.online : colors.offline },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: online ? colors.online : colors.offline },
            ]}
          >
            {online ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      {/* Right chevron */}
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: {
    opacity: 0.75,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.bgMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  thumbnailIcon: {
    fontSize: 24,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: font.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: font.sm,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 24,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
});
