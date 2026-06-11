import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeBack } from '../../../src/hooks/useSafeBack';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { Screen } from '../../../src/components/Screen';
import { Cell } from '../../../src/components/Cell';
import { deviceModify, deviceList } from '../../../src/api/devices';
import { useAuth } from '../../../src/store/authStore';
import type { Device } from '../../../src/api/types';
import { colors, spacing, font, radius } from '../../../src/theme/tokens';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOTION_LABELS: Record<string, string> = {
  '0': 'Low',
  '1': 'Medium',
  '2': 'High',
};

function nextMotion(current: string | undefined): string {
  if (current === '0') return '1';
  if (current === '1') return '2';
  return '0';
}

// ---------------------------------------------------------------------------
// Custom hook — defined at module scope so it is never re-created on render
// ---------------------------------------------------------------------------

function useDeviceMutation(
  token: string | null | undefined,
  id: string | undefined,
  queryClient: ReturnType<typeof useQueryClient>,
  setErrorMsg: (msg: string | null) => void,
) {
  return useMutation({
    mutationFn: (fields: Record<string, unknown>) =>
      deviceModify(token!, id!, fields),

    onMutate: async (fields: Record<string, unknown>) => {
      // Clear any previous error banner at the start of each save attempt.
      setErrorMsg(null);

      // Cancel any in-flight refetches so they don't overwrite the optimistic update.
      await queryClient.cancelQueries({ queryKey: ['devices', token] });

      // Snapshot the previous cache value for rollback.
      const previous = queryClient.getQueryData<Device[]>(['devices', token]);

      // Apply the optimistic update.
      queryClient.setQueryData<Device[]>(['devices', token], (old = []) =>
        old.map((d) =>
          d.physical_id === id ? { ...d, ...(fields as Partial<Device>) } : d,
        ),
      );

      return { previous };
    },

    onError: (_err, _fields, context) => {
      // Roll back on failure.
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['devices', token], context.previous);
      }
      setErrorMsg('Failed to save setting. Please try again.');
    },
    // NOTE: onSettled intentionally omitted — clearing errorMsg there would
    // swallow the error banner immediately after onError sets it (Fix 1).
  });
}

// ---------------------------------------------------------------------------
// Settings screen
// ---------------------------------------------------------------------------

export default function SettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const goBack = useSafeBack('/home');
  const token = useAuth((s) => s.token);
  const queryClient = useQueryClient();

  // ── Inline name-edit state ──
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  // ── Error banner ──
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Subscribe to the devices cache reactively so optimistic patches re-render (Fix 2) ──
  const { data: devices } = useQuery({
    queryKey: ['devices', token],
    queryFn: () => deviceList(token!),
    enabled: !!token,
    staleTime: Infinity, // read from already-populated cache; no extra network call
  });
  const device = devices?.find((d) => d.physical_id === id);

  // ── Mutation (Fix 3: proper top-level custom hook, not inner function) ──
  const mutation = useDeviceMutation(token, id, queryClient, setErrorMsg);

  // ---------------------------------------------------------------------------
  // Render — device not found guard
  // ---------------------------------------------------------------------------

  if (!device) {
    return (
      <Screen title="Settings" onBack={goBack}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Device not found</Text>
        </View>
      </Screen>
    );
  }

  // ---------------------------------------------------------------------------
  // Helpers using resolved device
  // ---------------------------------------------------------------------------

  const boolVal = (v: string | undefined) => v === '1';

  const handleToggle = (field: keyof Device, newBool: boolean) => {
    mutation.mutate({ [field]: newBool ? '1' : '0' });
  };

  const handleMotionCycle = () => {
    mutation.mutate({ motion_sensitivity: nextMotion(device.motion_sensitivity) });
  };

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    mutation.mutate({ device_name: trimmed });
    setEditingName(false);
  };

  // ── Volume helpers ──
  const currentVol = parseInt(device.device_volume ?? '0', 10);

  const handleVolumeDelta = (delta: number) => {
    const next = Math.max(0, Math.min(100, currentVol + delta));
    mutation.mutate({ device_volume: String(next) });
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Screen
      title={device.device_name || 'Settings'}
      onBack={goBack}
      scroll
    >
      {/* ── Error banner ── */}
      {errorMsg ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      {/* ─────────────────── Device name ─────────────────── */}
      {editingName ? (
        <View style={styles.inlineEdit} testID="settings.name">
          <TextInput
            style={styles.inlineInput}
            value={nameInput}
            onChangeText={setNameInput}
            autoFocus
            placeholder="Device name"
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
            onSubmitEditing={handleSaveName}
            testID="settings.name.input"
          />
          <Pressable
            style={styles.saveBtn}
            onPress={handleSaveName}
            accessibilityRole="button"
            accessibilityLabel="Save device name"
            disabled={mutation.isPending}
          >
            <Text style={styles.saveBtnText}>Save</Text>
          </Pressable>
          <Pressable
            style={styles.cancelBtn}
            onPress={() => setEditingName(false)}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>
        </View>
      ) : (
        <Cell
          testID="settings.name"
          title="Device Name"
          value={device.device_name}
          onPress={() => {
            setNameInput(device.device_name);
            setEditingName(true);
          }}
        />
      )}

      {/* ─────────────────── Night Vision ─────────────────── */}
      <Cell
        title="Night Vision"
        right={
          <Switch
            testID="settings.nightvision"
            value={boolVal(device.nightvision)}
            onValueChange={(v) => handleToggle('nightvision', v)}
            thumbColor={colors.bg}
            trackColor={{ false: colors.border, true: colors.primary }}
            accessibilityLabel="Night Vision"
            disabled={mutation.isPending}
          />
        }
      />

      {/* Note: The original Zmodo app uses tri-state (auto/on/off) for night
          vision. Phase 1 simplifies this to a boolean on/off mapped to '1'/'0'.
          This will need to be revisited when the native camera SDK is integrated. */}

      {/* ─────────────────── Motion Detection Sensitivity ─────────────────── */}
      <Cell
        testID="settings.motion"
        title="Motion Sensitivity"
        value={MOTION_LABELS[device.motion_sensitivity ?? '1'] ?? 'Medium'}
        onPress={mutation.isPending ? undefined : handleMotionCycle}
      />

      {/* ─────────────────── Sound Detection ─────────────────── */}
      <Cell
        title="Sound Detection"
        right={
          <Switch
            testID="settings.sound"
            value={boolVal(device.sound_detection)}
            onValueChange={(v) => handleToggle('sound_detection', v)}
            thumbColor={colors.bg}
            trackColor={{ false: colors.border, true: colors.primary }}
            accessibilityLabel="Sound Detection"
            disabled={mutation.isPending}
          />
        }
      />

      {/* ─────────────────── Image Flip ─────────────────── */}
      <Cell
        title="Image Flip"
        right={
          <Switch
            testID="settings.flip"
            value={boolVal(device.imageflip)}
            onValueChange={(v) => handleToggle('imageflip', v)}
            thumbColor={colors.bg}
            trackColor={{ false: colors.border, true: colors.primary }}
            accessibilityLabel="Image Flip"
            disabled={mutation.isPending}
          />
        }
      />

      {/* ─────────────────── Volume ─────────────────── */}
      <Cell
        testID="settings.volume"
        title="Volume"
        value={`${device.device_volume ?? '50'}%`}
        right={
          <View style={styles.volumeControls}>
            <Pressable
              onPress={() => handleVolumeDelta(-10)}
              accessibilityRole="button"
              accessibilityLabel="Decrease volume"
              style={styles.volBtn}
              disabled={mutation.isPending}
            >
              <Text style={styles.volBtnText}>−</Text>
            </Pressable>
            <Pressable
              onPress={() => handleVolumeDelta(10)}
              accessibilityRole="button"
              accessibilityLabel="Increase volume"
              style={styles.volBtn}
              disabled={mutation.isPending}
            >
              <Text style={styles.volBtnText}>+</Text>
            </Pressable>
          </View>
        }
      />

      {/* ─────────────────── Share Device ─────────────────── */}
      <View style={styles.sectionSpacer} />
      <Cell
        testID="settings.share"
        title="Share Device"
        onPress={() => router.push((`/camera/${id}/share`) as any)}
      />
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  notFoundText: {
    fontSize: font.lg,
    color: colors.textMuted,
  },
  errorBanner: {
    backgroundColor: colors.dangerBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.danger,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  errorText: {
    fontSize: font.sm,
    color: colors.danger,
    textAlign: 'center',
  },
  inlineEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 52,
  },
  inlineInput: {
    flex: 1,
    fontSize: font.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginRight: spacing.sm,
    minHeight: 36,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    marginRight: spacing.xs,
  },
  saveBtnText: {
    color: colors.textOnPrimary,
    fontSize: font.sm,
    fontWeight: '600',
  },
  cancelBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  cancelBtnText: {
    color: colors.textMuted,
    fontSize: font.sm,
  },
  volumeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  volBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgMuted,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  volBtnText: {
    fontSize: font.lg,
    color: colors.text,
    fontWeight: '500',
    lineHeight: font.lg + 4,
  },
  sectionSpacer: {
    height: spacing.lg,
    backgroundColor: colors.bgMuted,
  },
});
