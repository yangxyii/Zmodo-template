import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import type { Device } from '../api/types';
import { isOnline } from '../api/types';
import { colors, spacing, font } from '../theme/tokens';

interface DeviceCardProps {
  device: Device;
  /** Called when the card body or Live button is pressed (navigates to live view) */
  onPress: (physicalId: string) => void;
  /** Called when the Play Back button is pressed */
  onPlayback?: (physicalId: string) => void;
  /**
   * 'card' (default) — standalone card with bg/shadow (original behaviour).
   * 'row'  — flat row for use inside a shared white container card; no outer bg.
   */
  variant?: 'card' | 'row';
  /** When variant='row', show a hairline separator at the bottom of the row */
  showSeparator?: boolean;
}

export function DeviceCard({
  device,
  onPress,
  onPlayback,
  variant = 'card',
  showSeparator = false,
}: DeviceCardProps) {
  const online = isOnline(device);

  // NOTE: the row's main tap area, Live, and Play Back are SIBLINGS — never
  // nest a Pressable inside another Pressable, or react-native-web emits a
  // "<button> cannot contain a nested <button>" DOM error on web.
  return (
    <View
      style={[
        styles.base,
        variant === 'card' ? styles.cardVariant : styles.rowVariant,
        showSeparator && styles.rowSeparator,
      ]}
    >
      {/* Main tap area: thumbnail + info → opens live view */}
      <Pressable
        testID="home.cameraCard"
        accessibilityRole="button"
        accessibilityLabel={device.device_name}
        accessibilityHint="Open live view"
        style={({ pressed }) => [styles.body, pressed && styles.cardPressed]}
        onPress={() => onPress(device.physical_id)}
      >
        <Image
          source={require('../../assets/zmodo/device_default.png')}
          style={styles.thumbnail}
          resizeMode="contain"
        />
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
            <Text style={[styles.statusText, { color: colors.textDarkGray }]}>
              {online ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
      </Pressable>

      {/* Action buttons: Live + Play Back (siblings of the body) */}
      <View style={styles.actions}>
        <Pressable
          testID="home.liveButton"
          accessibilityRole="button"
          accessibilityLabel="Live"
          style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
          onPress={() => {
            onPress(device.physical_id);
          }}
        >
          <Image
            source={require('../../assets/zmodo/icon_live.png')}
            style={styles.actionIcon}
            resizeMode="contain"
          />
          <Text style={styles.actionLabel}>Live</Text>
        </Pressable>

        <Pressable
          testID="home.playbackButton"
          accessibilityRole="button"
          accessibilityLabel="Play Back"
          style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
          onPress={() => {
            onPlayback?.(device.physical_id);
          }}
        >
          <Image
            source={require('../../assets/zmodo/icon_playback.png')}
            style={styles.actionIcon}
            resizeMode="contain"
          />
          <Text style={styles.actionLabel}>Play Back</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  // Left tap area (thumbnail + info), fills remaining width
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Standalone card variant (original behaviour)
  cardVariant: {
    backgroundColor: colors.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C8C8C8',
  },
  // Row variant — used inside shared white card (no outer bg/shadow)
  rowVariant: {
    backgroundColor: 'transparent',
  },
  rowSeparator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C8C8C8',
  },
  cardPressed: {
    opacity: 0.75,
  },
  thumbnail: {
    width: 54,
    height: 54,
    borderRadius: 6,
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
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
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textDarkGray,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginLeft: spacing.sm,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
  },
  actionBtnPressed: {
    opacity: 0.6,
  },
  actionIcon: {
    width: 32,
    height: 32,
  },
  actionLabel: {
    fontSize: 10,
    color: colors.textDarkGray,
    marginTop: 2,
    textAlign: 'center',
  },
});
