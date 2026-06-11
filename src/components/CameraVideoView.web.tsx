import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, font, spacing } from '../theme/tokens';
import type { StreamMode } from '../native/LibCoreBridge';

export interface CameraVideoViewProps {
  physicalId: string;
  mode: StreamMode;
  channel?: number;
  style?: object;
}

/**
 * Web implementation of CameraVideoView.
 *
 * The proprietary Zmodo LibCore native stack cannot run in a browser, so we
 * render a bilingual placeholder that tells the user to open the mobile app.
 * The testID "camera.liveView" is the stable No-Code element id used by tests
 * and automation.
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
