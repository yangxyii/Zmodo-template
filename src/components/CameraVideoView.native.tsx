import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, font, spacing } from '../theme/tokens';
import type { StreamMode } from '../native/LibCoreBridge';

// TODO(phase-2): mount native LibCore video view via libCoreBridge.
// Replace this placeholder with a <NativeViewManagerAdapter> (or equivalent)
// that calls libCoreBridge.start({ physicalId, channel, mode }) on mount and
// libCoreBridge.stop() on unmount, then renders the hardware-decoded surface.

export interface CameraVideoViewProps {
  physicalId: string;
  mode: StreamMode;
  channel?: number;
  style?: object;
}

/**
 * Native implementation of CameraVideoView — Phase 1 placeholder.
 *
 * Until the iOS LibCore bridge is wired (phase-2), native clients see the same
 * bilingual placeholder as the web build.  The testID "camera.liveView" is the
 * stable No-Code element id shared across platforms.
 */
export function CameraVideoView({ style }: CameraVideoViewProps) {
  return (
    <View style={[styles.container, style]} testID="camera.liveView">
      {/* Camera icon — pure text glyph, no image asset required */}
      <Text style={styles.icon} accessibilityLabel="camera icon">
        📷
      </Text>
      <Text style={styles.textCN}>请在手机 App 中查看实时画面</Text>
      <Text style={styles.textEN}>View live video in the mobile app</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    aspectRatio: 16 / 9,
    backgroundColor: colors.videoBg,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  icon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  textCN: {
    fontSize: font.md,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  textEN: {
    fontSize: font.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
