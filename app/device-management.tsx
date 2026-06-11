import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../src/components/Screen';
import { CardGroup } from '../src/components/CardGroup';
import { Ionicons } from '@expo/vector-icons';
import { deviceList, deviceModify, deleteDevice } from '../src/api/devices';
import { useAuth } from '../src/store/authStore';
import type { Device } from '../src/api/types';
import { colors, spacing, font, radius } from '../src/theme/tokens';

const DEFAULT_THUMB = require('../assets/zmodo/device_camera_default.png');

function confirmDelete(deviceName: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-restricted-globals
    if (window.confirm(`Delete "${deviceName}"? This cannot be undone.`)) {
      onConfirm();
    }
  } else {
    Alert.alert(
      'Delete Device',
      `Delete "${deviceName}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onConfirm },
      ],
    );
  }
}

interface DeviceRowProps {
  device: Device;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string, name: string) => void;
}

function DeviceRow({ device, onRename, onDelete }: DeviceRowProps) {
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(device.device_name);

  const thumb =
    device.photo_url && device.photo_url.startsWith('http')
      ? { uri: device.photo_url }
      : DEFAULT_THUMB;

  const handleSave = () => {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== device.device_name) {
      onRename(device.physical_id, trimmed);
    }
    setEditing(false);
  };

  return (
    <View testID="devmgmt.row" style={styles.deviceRow}>
      {/* Thumbnail */}
      <Image source={thumb} style={styles.thumb} resizeMode="cover" />

      {/* Info */}
      <View style={styles.deviceInfo}>
        {editing ? (
          <View style={styles.inlineEdit}>
            <TextInput
              style={styles.nameInput}
              value={nameInput}
              onChangeText={setNameInput}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
              accessibilityLabel="Device name input"
              testID="devmgmt.name.input"
            />
            <Pressable
              onPress={handleSave}
              style={styles.saveBtn}
              accessibilityRole="button"
              accessibilityLabel="Save name"
            >
              <Text style={styles.saveBtnText}>Save</Text>
            </Pressable>
            <Pressable
              onPress={() => setEditing(false)}
              style={styles.cancelBtn}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.deviceName} numberOfLines={1}>
              {device.device_name}
            </Text>
            <Text style={styles.deviceId} numberOfLines={1}>
              {device.physical_id}
            </Text>
          </>
        )}
      </View>

      {/* Actions — only shown when not editing */}
      {!editing && (
        <View style={styles.actions}>
          <Pressable
            onPress={() => {
              setNameInput(device.device_name);
              setEditing(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Rename device"
            style={styles.actionBtn}
          >
            <Ionicons name="pencil-outline" size={20} color={colors.primary} />
          </Pressable>
          <Pressable
            testID="devmgmt.delete"
            onPress={() =>
              confirmDelete(device.device_name, () =>
                onDelete(device.physical_id, device.device_name),
              )
            }
            accessibilityRole="button"
            accessibilityLabel="Delete device"
            style={styles.actionBtn}
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function DeviceManagementScreen() {
  const router = useRouter();
  const token = useAuth((s) => s.token);
  const queryClient = useQueryClient();

  const { data: devices, isLoading, isError, refetch } = useQuery({
    queryKey: ['devices', token],
    queryFn: () => deviceList(token!),
    enabled: !!token,
  });

  const onBack = () =>
    router.canGoBack() ? router.back() : router.replace('/home' as any);

  const handleRename = async (physical_id: string, device_name: string) => {
    if (!token) return;
    const prev = queryClient.getQueryData<Device[]>(['devices', token]);
    queryClient.setQueryData<Device[]>(['devices', token], (old = []) =>
      old.map((d) => (d.physical_id === physical_id ? { ...d, device_name } : d)),
    );
    try {
      await deviceModify(token, physical_id, { device_name });
    } catch {
      if (prev !== undefined) queryClient.setQueryData(['devices', token], prev);
    }
  };

  const handleDelete = async (physical_id: string) => {
    if (!token) return;
    const prev = queryClient.getQueryData<Device[]>(['devices', token]);
    queryClient.setQueryData<Device[]>(['devices', token], (old = []) =>
      old.filter((d) => d.physical_id !== physical_id),
    );
    try {
      await deleteDevice(token, physical_id);
      void queryClient.invalidateQueries({ queryKey: ['devices', token] });
    } catch {
      if (prev !== undefined) queryClient.setQueryData(['devices', token], prev);
    }
  };

  return (
    <Screen title="Device Management" onBack={onBack} scroll>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load devices.</Text>
          <Pressable
            onPress={() => void refetch()}
            style={styles.retryBtn}
            accessibilityRole="button"
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : !devices || devices.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No devices</Text>
        </View>
      ) : (
        <View style={styles.listWrap}>
          <CardGroup>
            {devices.map((device) => (
              <DeviceRow
                key={device.physical_id}
                device={device}
                onRename={handleRename}
                onDelete={handleDelete}
              />
            ))}
          </CardGroup>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  listWrap: {
    marginTop: spacing.lg,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 64,
    backgroundColor: colors.bg,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    marginRight: spacing.md,
    backgroundColor: colors.bgMuted,
  },
  deviceInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  deviceId: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionBtn: {
    padding: spacing.xs,
  },
  inlineEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  nameInput: {
    flex: 1,
    fontSize: font.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    minHeight: 36,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  saveBtnText: {
    color: colors.textOnPrimary,
    fontSize: font.xs,
    fontWeight: '600',
  },
  cancelBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  cancelBtnText: {
    color: colors.textMuted,
    fontSize: font.xs,
  },
  errorText: {
    fontSize: font.md,
    color: colors.danger,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
  },
  retryBtnText: {
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
