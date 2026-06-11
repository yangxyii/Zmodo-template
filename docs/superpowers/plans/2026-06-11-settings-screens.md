# Settings Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the two home-screen "Settings" pill buttons to real Notification Settings and Device Management screens backed by the IOTEK API.

**Architecture:** Three independent deliverables — (1) `src/api/notifications.ts` with get/set functions, (2) `app/notification-settings.tsx` (AI notification toggles with optimistic updates), (3) `app/device-management.tsx` (device list with rename/delete), plus small wiring changes to `app/(tabs)/home.tsx` to pass `onPress` to `PillButton`. Tests live in `app/__tests__/`.

**Tech Stack:** Expo + React Native + expo-router + @tanstack/react-query + Ionicons + TypeScript

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/api/notifications.ts` | Create | `getAiNotification`, `setAiNotification`, `AiNotification` type |
| `app/notification-settings.tsx` | Create | Full screen: 4 AI-notification Switch rows, optimistic update, error banner |
| `app/device-management.tsx` | Create | Full screen: device list, rename (inline TextInput), delete (Alert/confirm) |
| `src/api/devices.ts` | Modify | Add `deleteDevice` export |
| `app/(tabs)/home.tsx` | Modify | Add `onPress` prop to `PillButton`, wire both pills |
| `app/__tests__/notification-settings.test.tsx` | Create | 4 rows render; toggling People calls setAiNotification correctly |
| `app/__tests__/device-management.test.tsx` | Create | rows render; delete after confirm calls deleteDevice |
| `app/__tests__/home.test.tsx` | Modify | No changes needed — testIDs unchanged; PillButton API stays backward-compat |

---

### Task 1: Add `src/api/notifications.ts`

**Files:**
- Create: `src/api/notifications.ts`

- [ ] **Step 1: Create the file**

```ts
import { postForm } from './http';

export interface AiNotification {
  people_motion: number;
  vehicle_motion: number;
  animal_motion: number;
  other_motion: number;
}

export async function getAiNotification(token: string): Promise<AiNotification> {
  const r = await postForm<any>('app_access', '/mode/user_config_get', { token });
  const ai = (r as any).ai_notification ?? {};
  return {
    people_motion: ai.people_motion ?? 0,
    vehicle_motion: ai.vehicle_motion ?? 0,
    animal_motion: ai.animal_motion ?? 0,
    other_motion: ai.other_motion ?? 0,
  };
}

export async function setAiNotification(token: string, ai: AiNotification): Promise<void> {
  await postForm('app_access', '/mode/user_config_set', {
    token,
    ai_notification: JSON.stringify(ai),
  });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/jianzhang/zmodo-temolate-react && npx tsc --noEmit 2>&1 | head -20`
Expected: no errors from `src/api/notifications.ts`

---

### Task 2: Add `deleteDevice` to `src/api/devices.ts`

**Files:**
- Modify: `src/api/devices.ts`

- [ ] **Step 1: Append `deleteDevice` export**

After the existing `isOnlineCheck` export, add:
```ts
export const deleteDevice = (token: string, physical_id: string) =>
  postForm('app_access', '/device/device_del', { token, physical_id });
```

- [ ] **Step 2: Verify tsc**

Run: `cd /Users/jianzhang/zmodo-temolate-react && npx tsc --noEmit 2>&1 | head -20`
Expected: exit 0

---

### Task 3: Create `app/notification-settings.tsx`

**Files:**
- Create: `app/notification-settings.tsx`

- [ ] **Step 1: Create the screen**

```tsx
import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../src/components/Screen';
import { CardGroup } from '../src/components/CardGroup';
import { getAiNotification, setAiNotification } from '../src/api/notifications';
import type { AiNotification } from '../src/api/notifications';
import { useAuth } from '../src/store/authStore';
import { colors, spacing, font } from '../src/theme/tokens';

const ROWS: { label: string; key: keyof AiNotification; testID: string }[] = [
  { label: 'People', key: 'people_motion', testID: 'notif.people' },
  { label: 'Vehicles', key: 'vehicle_motion', testID: 'notif.vehicle' },
  { label: 'Animals', key: 'animal_motion', testID: 'notif.animal' },
  { label: 'Other Motion', key: 'other_motion', testID: 'notif.other' },
];

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const token = useAuth((s) => s.token);
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['aiNotification', token],
    queryFn: () => getAiNotification(token!),
    enabled: !!token,
  });

  const handleToggle = async (key: keyof AiNotification, value: boolean) => {
    if (!data || !token) return;
    setErrorMsg(null);
    const next: AiNotification = { ...data, [key]: value ? 1 : 0 };
    // Optimistic update
    queryClient.setQueryData(['aiNotification', token], next);
    try {
      await setAiNotification(token, next);
    } catch {
      // Roll back
      queryClient.setQueryData(['aiNotification', token], data);
      setErrorMsg('Failed to save. Please try again.');
    }
  };

  const onBack = () =>
    router.canGoBack() ? router.back() : router.replace('/home' as any);

  return (
    <Screen title="Notification Settings" onBack={onBack} scroll>
      {errorMsg ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load notification settings.</Text>
        </View>
      ) : (
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>AI Notifications</Text>
          <CardGroup>
            {ROWS.map((row) => (
              <View key={row.key} testID={row.testID} style={styles.row}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Switch
                  value={data ? data[row.key] === 1 : false}
                  onValueChange={(v) => void handleToggle(row.key, v)}
                  thumbColor={colors.bg}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  accessibilityLabel={row.label}
                />
              </View>
            ))}
          </CardGroup>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionWrap: {
    marginTop: spacing.lg,
  },
  sectionLabel: {
    fontSize: font.sm,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.md + 4,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bg,
  },
  rowLabel: {
    flex: 1,
    fontSize: font.md + 1,
    color: colors.text,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
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
});
```

- [ ] **Step 2: Verify tsc**

Run: `cd /Users/jianzhang/zmodo-temolate-react && npx tsc --noEmit 2>&1 | head -20`
Expected: exit 0

---

### Task 4: Create `app/device-management.tsx`

**Files:**
- Create: `app/device-management.tsx`

- [ ] **Step 1: Create the screen**

```tsx
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
            <Pressable onPress={handleSave} style={styles.saveBtn} accessibilityRole="button" accessibilityLabel="Save name">
              <Text style={styles.saveBtnText}>Save</Text>
            </Pressable>
            <Pressable onPress={() => setEditing(false)} style={styles.cancelBtn} accessibilityRole="button" accessibilityLabel="Cancel">
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.deviceName} numberOfLines={1}>{device.device_name}</Text>
            <Text style={styles.deviceId} numberOfLines={1}>{device.physical_id}</Text>
          </>
        )}
      </View>

      {/* Actions */}
      {!editing && (
        <View style={styles.actions}>
          <Pressable
            onPress={() => { setNameInput(device.device_name); setEditing(true); }}
            accessibilityRole="button"
            accessibilityLabel="Rename device"
            style={styles.actionBtn}
          >
            <Ionicons name="pencil-outline" size={20} color={colors.primary} />
          </Pressable>
          <Pressable
            testID="devmgmt.delete"
            onPress={() => confirmDelete(device.device_name, () => onDelete(device.physical_id, device.device_name))}
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
    // Optimistic update
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
    // Optimistic remove
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
          <Pressable onPress={() => void refetch()} style={styles.retryBtn} accessibilityRole="button">
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
```

- [ ] **Step 2: Verify tsc**

Run: `cd /Users/jianzhang/zmodo-temolate-react && npx tsc --noEmit 2>&1 | head -30`
Expected: exit 0

---

### Task 5: Wire home PillButton to navigate

**Files:**
- Modify: `app/(tabs)/home.tsx`

- [ ] **Step 1: Update PillButton interface and implementation**

In `home.tsx`, change the `PillButtonProps` interface to add `onPress?`:
```ts
interface PillButtonProps {
  label: string;
  testID?: string;
  onPress?: () => void;
}
```

Change the `PillButton` component to use the prop:
```tsx
function PillButton({ label, testID, onPress }: PillButtonProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.pill}
      onPress={onPress}
    >
      <Text style={styles.pillText}>{label}</Text>
    </Pressable>
  );
}
```

- [ ] **Step 2: Pass router.push to each pill in NotificationSection**

`NotificationSection` currently has no router access. The simplest fix: pass `onPress` as a prop. Change its signature and the pill call:

```tsx
function NotificationSection({ onSettingsPress }: { onSettingsPress?: () => void }) {
  // ... existing state ...
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Notification</Text>
        <PillButton label="Settings" testID="home.notif.settings" onPress={onSettingsPress} />
      </View>
      {/* rest of section unchanged */}
```

- [ ] **Step 3: Pass router.push to pill in DevicesSection**

`DevicesSection` already receives props — add `onSettingsPress`:
```tsx
interface DevicesSectionProps {
  // ... existing props ...
  onSettingsPress?: () => void;
}
```

Add `onSettingsPress` to the destructuring and pass it:
```tsx
<PillButton label="Settings" testID="home.devices.settings" onPress={onSettingsPress} />
```

- [ ] **Step 4: Update HomeScreen to pass handlers**

In `HomeScreen`, call the sections with the router-based handlers:
```tsx
<NotificationSection onSettingsPress={() => router.push('/notification-settings' as any)} />
<DevicesSection
  ...
  onSettingsPress={() => router.push('/device-management' as any)}
/>
```

- [ ] **Step 5: Verify tsc**

Run: `cd /Users/jianzhang/zmodo-temolate-react && npx tsc --noEmit 2>&1 | head -20`
Expected: exit 0

---

### Task 6: Write notification-settings test

**Files:**
- Create: `app/__tests__/notification-settings.test.tsx`

- [ ] **Step 1: Create test file**

```tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NotificationSettingsScreen from '../notification-settings';
import * as notifApi from '../../src/api/notifications';
import { useAuth } from '../../src/store/authStore';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
}));

jest.mock('../../src/api/notifications', () => ({
  getAiNotification: jest.fn(),
  setAiNotification: jest.fn(),
}));

beforeEach(() => {
  useAuth.setState({ token: 'tk', user: null, hydrated: true } as any);
  (notifApi.getAiNotification as jest.Mock).mockResolvedValue({
    people_motion: 1,
    vehicle_motion: 1,
    animal_motion: 1,
    other_motion: 1,
  });
  (notifApi.setAiNotification as jest.Mock).mockResolvedValue(undefined);
});

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

test('renders all 4 notification rows', async () => {
  const { getByTestId } = wrap(<NotificationSettingsScreen />);
  await waitFor(() => expect(getByTestId('notif.people')).toBeTruthy());
  expect(getByTestId('notif.vehicle')).toBeTruthy();
  expect(getByTestId('notif.animal')).toBeTruthy();
  expect(getByTestId('notif.other')).toBeTruthy();
});

test('toggling People OFF calls setAiNotification with people_motion:0', async () => {
  const { getByTestId } = wrap(<NotificationSettingsScreen />);
  await waitFor(() => expect(getByTestId('notif.people')).toBeTruthy());
  // The Switch is inside the testID="notif.people" view; fire valueChange on it
  const switchEl = getByTestId('notif.people').findAllByType
    ? getByTestId('notif.people')
    : getByTestId('notif.people');
  // Use fireEvent on the Switch component directly
  const { UNSAFE_getAllByType } = wrap(<NotificationSettingsScreen />);
  await waitFor(() => expect(notifApi.getAiNotification).toHaveBeenCalled());
  fireEvent(UNSAFE_getAllByType(require('react-native').Switch)[0], 'valueChange', false);
  await waitFor(() =>
    expect(notifApi.setAiNotification).toHaveBeenCalledWith('tk', expect.objectContaining({ people_motion: 0 }))
  );
});
```

Wait — this approach is overcomplicated. Use a single render and UNSAFE_getAllByType(Switch):

```tsx
import React from 'react';
import { Switch } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NotificationSettingsScreen from '../notification-settings';
import * as notifApi from '../../src/api/notifications';
import { useAuth } from '../../src/store/authStore';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
    canGoBack: () => true,
  }),
}));

jest.mock('../../src/api/notifications', () => ({
  getAiNotification: jest.fn(),
  setAiNotification: jest.fn(),
}));

beforeEach(() => {
  useAuth.setState({ token: 'tk', user: null, hydrated: true } as any);
  (notifApi.getAiNotification as jest.Mock).mockResolvedValue({
    people_motion: 1,
    vehicle_motion: 1,
    animal_motion: 1,
    other_motion: 1,
  });
  (notifApi.setAiNotification as jest.Mock).mockResolvedValue(undefined);
});

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

test('renders all 4 notification rows', async () => {
  const { getByTestId } = wrap(<NotificationSettingsScreen />);
  await waitFor(() => expect(getByTestId('notif.people')).toBeTruthy());
  expect(getByTestId('notif.vehicle')).toBeTruthy();
  expect(getByTestId('notif.animal')).toBeTruthy();
  expect(getByTestId('notif.other')).toBeTruthy();
});

test('toggling People calls setAiNotification with people_motion flipped to 0', async () => {
  const { getByTestId, UNSAFE_getAllByType } = wrap(<NotificationSettingsScreen />);
  await waitFor(() => expect(getByTestId('notif.people')).toBeTruthy());
  // People switch is first in the list (index 0)
  const switches = UNSAFE_getAllByType(Switch);
  fireEvent(switches[0], 'valueChange', false);
  await waitFor(() =>
    expect(notifApi.setAiNotification).toHaveBeenCalledWith(
      'tk',
      expect.objectContaining({ people_motion: 0 }),
    ),
  );
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `cd /Users/jianzhang/zmodo-temolate-react && npm test -- --testPathPattern=notification-settings 2>&1 | tail -20`
Expected: PASS

---

### Task 7: Write device-management test

**Files:**
- Create: `app/__tests__/device-management.test.tsx`

- [ ] **Step 1: Create test file**

```tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DeviceManagementScreen from '../device-management';
import * as devicesApi from '../../src/api/devices';
import { useAuth } from '../../src/store/authStore';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: jest.fn(),
    canGoBack: () => true,
  }),
}));

jest.mock('../../src/api/devices', () => ({
  deviceList: jest.fn(),
  deviceModify: jest.fn(),
  deleteDevice: jest.fn(),
}));

// Mock window.confirm for web-branch path (jsdom provides it, returns false by default)
// Override to return true so delete proceeds
const originalConfirm = global.window?.confirm;
beforeAll(() => {
  if (typeof window !== 'undefined') {
    window.confirm = () => true;
  }
});
afterAll(() => {
  if (typeof window !== 'undefined' && originalConfirm !== undefined) {
    window.confirm = originalConfirm;
  }
});

const DEVICES = [
  { physical_id: 'AAA', device_name: 'Front Door', device_online: '1', device_type: '0' },
  { physical_id: 'BBB', device_name: 'Back Yard', device_online: '0', device_type: '0' },
];

beforeEach(() => {
  useAuth.setState({ token: 'tk', user: null, hydrated: true } as any);
  (devicesApi.deviceList as jest.Mock).mockResolvedValue(DEVICES);
  (devicesApi.deviceModify as jest.Mock).mockResolvedValue({ result: 'ok' });
  (devicesApi.deleteDevice as jest.Mock).mockResolvedValue({ result: 'ok' });
  mockPush.mockClear();
  mockBack.mockClear();
});

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

test('renders device rows with names', async () => {
  const { findByText } = wrap(<DeviceManagementScreen />);
  expect(await findByText('Front Door')).toBeTruthy();
  expect(await findByText('Back Yard')).toBeTruthy();
});

test('pressing delete calls deleteDevice (web confirm=true path)', async () => {
  const { findAllByTestId } = wrap(<DeviceManagementScreen />);
  const delBtns = await findAllByTestId('devmgmt.delete');
  fireEvent.press(delBtns[0]);
  await waitFor(() =>
    expect(devicesApi.deleteDevice).toHaveBeenCalledWith('tk', 'AAA'),
  );
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `cd /Users/jianzhang/zmodo-temolate-react && npm test -- --testPathPattern=device-management 2>&1 | tail -20`
Expected: PASS

---

### Task 8: Final verification and commit

- [ ] **Step 1: Run full test suite**

Run: `cd /Users/jianzhang/zmodo-temolate-react && npm test 2>&1 | tail -6`
Expected: All test suites pass.

- [ ] **Step 2: TypeScript check**

Run: `cd /Users/jianzhang/zmodo-temolate-react && npx tsc --noEmit`
Expected: exit 0 (no output)

- [ ] **Step 3: Expo web export**

Run: `cd /Users/jianzhang/zmodo-temolate-react && npx expo export -p web 2>&1 | tail -3`
Expected: no error, bundle produced.

- [ ] **Step 4: Commit**

```bash
git add src/api/notifications.ts src/api/devices.ts \
  app/notification-settings.tsx app/device-management.tsx \
  app/(tabs)/home.tsx \
  app/__tests__/notification-settings.test.tsx \
  app/__tests__/device-management.test.tsx
git commit -m "feat: add Notification Settings and Device Management screens

Wire home pill buttons to /notification-settings and /device-management.
Add src/api/notifications.ts (getAiNotification/setAiNotification).
Add deleteDevice to src/api/devices.ts.
Both screens use optimistic updates with rollback on error.
Delete confirm uses Alert.alert on native, window.confirm on web.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```
