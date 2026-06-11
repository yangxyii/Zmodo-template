/**
 * QR Code scan placeholder screen.
 * Camera scanning requires the native mobile app — it is not available in Expo Go / web.
 */
// TODO(phase-2): real pairing via native module + device
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Button } from '../../src/components/Button';
import { colors, spacing, font, radius } from '../../src/theme/tokens';

export default function QRScreen() {
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home');
    }
  };

  return (
    <Screen title="Scan QR Code" onBack={handleBack} scroll>
      <View style={styles.container}>
        {/* Framed scan-area placeholder */}
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>

        <Text style={styles.instructions}>
          Point your camera at the QR code on your device.
        </Text>

        <View style={styles.noteBanner}>
          <Text style={styles.noteText}>
            Camera scanning is available in the mobile app.
          </Text>
        </View>

        <Button
          title="Enter Device ID manually"
          onPress={() => router.push('/add-device/manual')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    alignItems: 'stretch',
  },
  scanFrame: {
    alignSelf: 'center',
    width: 220,
    height: 220,
    backgroundColor: '#1A1A2E',
    borderRadius: radius.md,
    marginVertical: spacing.xl,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: colors.primary,
    borderWidth: 3,
  },
  cornerTL: {
    top: 12,
    left: 12,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 12,
    right: 12,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 12,
    left: 12,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 12,
    right: 12,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 4,
  },
  instructions: {
    fontSize: font.md,
    color: colors.textDarkGray,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  noteBanner: {
    backgroundColor: '#EBF7FD',
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  noteText: {
    fontSize: font.sm,
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
