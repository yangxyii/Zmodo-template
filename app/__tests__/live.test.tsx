import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LiveScreen from '../camera/[id]/live';
import * as devicesApi from '../../src/api/devices';
import { useAuth } from '../../src/store/authStore';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'ZM1' }),
  useRouter: () => ({ push: mockPush, back: mockBack, canGoBack: () => true }),
}));

beforeEach(() => {
  mockPush.mockClear();
  mockBack.mockClear();
  useAuth.setState({ token: 'tk', user: null, hydrated: true } as any);
});

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

const DEVICE = { physical_id: 'ZM1', device_name: 'Cam A', device_online: '1', device_type: '0' };

test('renders video placeholder (camera.liveView)', async () => {
  jest.spyOn(devicesApi, 'deviceList').mockResolvedValue([DEVICE] as any);
  const { findByTestId } = wrap(<LiveScreen />);
  expect(await findByTestId('camera.liveView')).toBeTruthy();
});

test('all 5 control bar testIDs render', async () => {
  jest.spyOn(devicesApi, 'deviceList').mockResolvedValue([DEVICE] as any);
  const { findByTestId } = wrap(<LiveScreen />);
  expect(await findByTestId('live.record')).toBeTruthy();
  expect(await findByTestId('live.snapshot')).toBeTruthy();
  expect(await findByTestId('live.talk')).toBeTruthy();
  expect(await findByTestId('live.sound')).toBeTruthy();
  expect(await findByTestId('live.playback')).toBeTruthy();
});

test('quality badge, fullscreen, settings testIDs render', async () => {
  jest.spyOn(devicesApi, 'deviceList').mockResolvedValue([DEVICE] as any);
  const { findByTestId } = wrap(<LiveScreen />);
  expect(await findByTestId('live.quality')).toBeTruthy();
  expect(await findByTestId('live.fullscreen')).toBeTruthy();
  expect(await findByTestId('live.settings')).toBeTruthy();
});

test('pressing live.playback calls router.push with playback path', async () => {
  jest.spyOn(devicesApi, 'deviceList').mockResolvedValue([DEVICE] as any);
  const { findByTestId } = wrap(<LiveScreen />);
  fireEvent.press(await findByTestId('live.playback'));
  expect(mockPush).toHaveBeenCalledWith('/camera/ZM1/playback');
});

test('pressing live.quality cycles label LD → SD', async () => {
  jest.spyOn(devicesApi, 'deviceList').mockResolvedValue([DEVICE] as any);
  const { findByTestId, getByTestId } = wrap(<LiveScreen />);
  const badge = await findByTestId('live.quality');
  // Initial quality label = "LD"
  expect(badge.props.accessibilityLabel).toContain('LD');
  fireEvent.press(badge);
  // After one press should be "SD"
  expect(getByTestId('live.quality').props.accessibilityLabel).toContain('SD');
});

test('shows device name in header', async () => {
  jest.spyOn(devicesApi, 'deviceList').mockResolvedValue([DEVICE] as any);
  const { findByText } = wrap(<LiveScreen />);
  expect(await findByText('Cam A')).toBeTruthy();
});

test('falls back to id when device not found', async () => {
  jest.spyOn(devicesApi, 'deviceList').mockResolvedValue([]);
  const { findByText } = wrap(<LiveScreen />);
  expect(await findByText('ZM1')).toBeTruthy();
});
