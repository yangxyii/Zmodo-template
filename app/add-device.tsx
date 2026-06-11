// TODO(phase-2): real device binding via add-device API / native QR scan
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { TextField } from '../src/components/TextField';
import { Button } from '../src/components/Button';
import { colors, spacing, font, radius } from '../src/theme/tokens';

export default function AddDeviceScreen() {
  const router = useRouter();
  const [deviceId, setDeviceId] = useState('');
  const [validationError, setValidationError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const handleAdd = () => {
    if (!deviceId.trim()) {
      setValidationError('Device ID is required.');
      return;
    }
    setValidationError('');
    // Phase 1: front-end only — no real bind API call
    setInfoMessage('Manual binding will be available in the mobile app.');
  };

  return (
    <Screen title="Add Device" onBack={() => router.back()}>
      <View style={styles.container}>
        {/* QR Scan Placeholder — real camera scan requires native mobile app */}
        <View style={styles.scanBox}>
          <Text style={styles.scanIcon}>⬜</Text>
          <Text style={styles.scanSubLabel}>
            扫码添加需在手机 App 中进行 / Scan QR code to add a device in the mobile app
          </Text>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or enter manually</Text>
          <View style={styles.dividerLine} />
        </View>

        <TextField
          label="Device ID"
          value={deviceId}
          onChangeText={(text) => {
            setDeviceId(text);
            if (validationError) setValidationError('');
            if (infoMessage) setInfoMessage('');
          }}
          placeholder="Device ID / 设备ID"
          autoCapitalize="none"
          testID="adddevice.manualId"
          accessibilityLabel="Device ID"
        />
        {!!validationError && (
          <Text style={styles.errorText}>{validationError}</Text>
        )}
        {!!infoMessage && (
          <Text style={styles.infoText}>{infoMessage}</Text>
        )}
        <Button
          title="Add"
          onPress={handleAdd}
          testID="adddevice.submit"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  scanBox: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginBottom: spacing.lg,
    backgroundColor: colors.bgMuted,
    minHeight: 180,
  },
  scanIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  scanSubLabel: {
    fontSize: font.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: spacing.sm,
    fontSize: font.sm,
    color: colors.textMuted,
  },
  errorText: {
    color: colors.danger,
    fontSize: font.sm,
    marginBottom: spacing.md,
  },
  infoText: {
    color: colors.textMuted,
    fontSize: font.sm,
    marginBottom: spacing.md,
  },
});
