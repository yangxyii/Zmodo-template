import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../src/components/Screen';
import { TextField } from '../../src/components/TextField';
import { Button } from '../../src/components/Button';
import { addDevice } from '../../src/api/devices';
import { useAuth } from '../../src/store/authStore';
import { colors, spacing, font, radius } from '../../src/theme/tokens';

export default function ManualAddScreen() {
  const router = useRouter();
  const token = useAuth((s) => s.token) ?? '';
  const queryClient = useQueryClient();

  const [deviceId, setDeviceId] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home');
    }
  };

  const handleAdd = async () => {
    const id = deviceId.trim();
    const name = deviceName.trim() || id;
    if (!id) return;

    setLoading(true);
    setErrorMsg('');

    try {
      await addDevice(token, id, name);
      await queryClient.invalidateQueries({ queryKey: ['devices', token] });
      router.replace('/home');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to add device. Please try again.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen title="Add by Device ID" onBack={handleBack} scroll>
      <View style={styles.container}>
        <TextField
          label="Device ID"
          value={deviceId}
          onChangeText={(text) => {
            setDeviceId(text);
            if (errorMsg) setErrorMsg('');
          }}
          placeholder="e.g. ZMD19H2IHA01172"
          autoCapitalize="characters"
          testID="adddevice.manual.id"
          accessibilityLabel="Device ID"
        />

        <TextField
          label="Device Name"
          value={deviceName}
          onChangeText={setDeviceName}
          placeholder="My Camera"
          autoCapitalize="sentences"
          testID="adddevice.manual.name"
          accessibilityLabel="Device Name"
        />

        {!!errorMsg && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        <Button
          title="Add"
          onPress={handleAdd}
          disabled={!deviceId.trim()}
          loading={loading}
          testID="adddevice.manual.submit"
        />

        <Text style={styles.caption}>
          If your device is not bound to any account, this will add it to yours.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  errorBanner: {
    backgroundColor: colors.dangerBg,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: font.sm,
    lineHeight: 18,
  },
  caption: {
    marginTop: spacing.md,
    fontSize: font.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
