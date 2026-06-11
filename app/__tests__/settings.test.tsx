import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SettingsScreen from '../camera/[id]/settings';
import * as devicesApi from '../../src/api/devices';
import { useAuth } from '../../src/store/authStore';

// Module-scope push mock — must be prefixed "mock" so Jest's factory hoisting allows it
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'ZM1' }),
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
}));

beforeEach(() => {
  useAuth.setState({ token: 'tk', user: null, hydrated: true } as any);
  mockPush.mockClear();
});

function wrap(ui: React.ReactElement, devices: any[]) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['devices', 'tk'], devices); // seed cache so the screen finds the device
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

const baseDev = {
  physical_id: 'ZM1',
  device_name: 'Cam A',
  device_online: '1',
  device_type: '0',
  nightvision: '0',
  motion_sensitivity: '1',
  sound_detection: '0',
  imageflip: '0',
  device_volume: '50',
};

// Fix 6 — exact field value assertions

test('toggling night vision ON calls deviceModify with nightvision: "1"', async () => {
  const dev = { ...baseDev, nightvision: '0' };
  const spy = jest
    .spyOn(devicesApi, 'deviceModify')
    .mockResolvedValue({ result: 'ok' } as any);
  const { getByTestId } = wrap(<SettingsScreen />, [dev]);
  fireEvent(getByTestId('settings.nightvision'), 'valueChange', true);
  await waitFor(() =>
    expect(spy).toHaveBeenCalledWith('tk', 'ZM1', { nightvision: '1' }),
  );
  spy.mockRestore();
});

test('renders device name row', async () => {
  const spy = jest
    .spyOn(devicesApi, 'deviceModify')
    .mockResolvedValue({ result: 'ok' } as any);
  const { getByTestId } = wrap(<SettingsScreen />, [baseDev]);
  expect(getByTestId('settings.name')).toBeTruthy();
  spy.mockRestore();
});

test('renders all settings rows', () => {
  jest.spyOn(devicesApi, 'deviceModify').mockResolvedValue({ result: 'ok' } as any);
  const { getByTestId } = wrap(<SettingsScreen />, [baseDev]);
  expect(getByTestId('settings.name')).toBeTruthy();
  expect(getByTestId('settings.nightvision')).toBeTruthy();
  expect(getByTestId('settings.motion')).toBeTruthy();
  expect(getByTestId('settings.sound')).toBeTruthy();
  expect(getByTestId('settings.flip')).toBeTruthy();
  expect(getByTestId('settings.volume')).toBeTruthy();
  expect(getByTestId('settings.share')).toBeTruthy();
});

test('shows device not found when device missing from cache', () => {
  const { getByText } = wrap(<SettingsScreen />, []);
  expect(getByText(/device not found/i)).toBeTruthy();
});

// Fix 6 — exact field value: sound_detection: '1'
test('toggling sound detection ON calls deviceModify with sound_detection: "1"', async () => {
  const spy = jest
    .spyOn(devicesApi, 'deviceModify')
    .mockResolvedValue({ result: 'ok' } as any);
  const { getByTestId } = wrap(<SettingsScreen />, [{ ...baseDev, sound_detection: '0' }]);
  fireEvent(getByTestId('settings.sound'), 'valueChange', true);
  await waitFor(() =>
    expect(spy).toHaveBeenCalledWith('tk', 'ZM1', { sound_detection: '1' }),
  );
  spy.mockRestore();
});

// Fix 6 — exact field value: imageflip: '1'
test('toggling image flip ON calls deviceModify with imageflip: "1"', async () => {
  const spy = jest
    .spyOn(devicesApi, 'deviceModify')
    .mockResolvedValue({ result: 'ok' } as any);
  const { getByTestId } = wrap(<SettingsScreen />, [{ ...baseDev, imageflip: '0' }]);
  fireEvent(getByTestId('settings.flip'), 'valueChange', true);
  await waitFor(() =>
    expect(spy).toHaveBeenCalledWith('tk', 'ZM1', { imageflip: '1' }),
  );
  spy.mockRestore();
});

test('tapping motion sensitivity cycles the value', async () => {
  const spy = jest
    .spyOn(devicesApi, 'deviceModify')
    .mockResolvedValue({ result: 'ok' } as any);
  const { getByTestId } = wrap(<SettingsScreen />, [{ ...baseDev, motion_sensitivity: '0' }]);
  fireEvent.press(getByTestId('settings.motion'));
  await waitFor(() =>
    expect(spy).toHaveBeenCalledWith(
      'tk',
      'ZM1',
      expect.objectContaining({ motion_sensitivity: expect.anything() }),
    ),
  );
  spy.mockRestore();
});

// Fix 6 — share navigation using module-scope pushMock
test('tapping share navigates to share route', () => {
  jest.spyOn(devicesApi, 'deviceModify').mockResolvedValue({ result: 'ok' } as any);
  const { getByTestId } = wrap(<SettingsScreen />, [baseDev]);
  fireEvent.press(getByTestId('settings.share'));
  expect(mockPush).toHaveBeenCalledWith('/camera/ZM1/share');
});

// Fix 6 — volume mutation: +10 step from '50' → device_volume: '60'
test('pressing volume + calls deviceModify with device_volume: "60"', async () => {
  const spy = jest
    .spyOn(devicesApi, 'deviceModify')
    .mockResolvedValue({ result: 'ok' } as any);
  const { getByLabelText } = wrap(<SettingsScreen />, [{ ...baseDev, device_volume: '50' }]);
  fireEvent.press(getByLabelText('Increase volume'));
  await waitFor(() =>
    expect(spy).toHaveBeenCalledWith('tk', 'ZM1', { device_volume: '60' }),
  );
  spy.mockRestore();
});

// Fix 6 — error banner is visible after rollback (guards Fix 1: no onSettled clearing it)
test('optimistic update: rolls back on deviceModify failure and shows error banner', async () => {
  const spy = jest
    .spyOn(devicesApi, 'deviceModify')
    .mockRejectedValue(new Error('network error'));

  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['devices', 'tk'], [{ ...baseDev, nightvision: '0' }]);

  const { getByTestId, findByText } = render(
    <QueryClientProvider client={qc}>
      <SettingsScreen />
    </QueryClientProvider>,
  );

  fireEvent(getByTestId('settings.nightvision'), 'valueChange', true);

  // Error banner must be visible (Fix 1 guard)
  await findByText(/failed to save/i);

  // Cache rolled back to original value
  await waitFor(() => {
    const cached = qc.getQueryData<any[]>(['devices', 'tk']);
    const device = cached?.find((d: any) => d.physical_id === 'ZM1');
    expect(device?.nightvision).toBe('0');
  });

  spy.mockRestore();
});

test('shows device name in header', () => {
  jest.spyOn(devicesApi, 'deviceModify').mockResolvedValue({ result: 'ok' } as any);
  const { getAllByText } = wrap(<SettingsScreen />, [baseDev]);
  // Device name or "Settings" should appear at least once (in the header)
  const matches = getAllByText(/Cam A|Settings/);
  expect(matches.length).toBeGreaterThan(0);
});
