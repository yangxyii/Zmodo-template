import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PlaybackScreen from '../camera/[id]/playback';
import * as pb from '../../src/api/playback';
import { useAuth } from '../../src/store/authStore';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'ZM1' }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

beforeEach(() => { useAuth.setState({ token: 'tk', user: null, hydrated: true } as any); });

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

test('renders playback video placeholder + SD/Cloud tabs', async () => {
  jest.spyOn(pb, 'recordList').mockResolvedValue([{ start_time: 0, end_time: 3599, file_type: 4 }] as any);
  jest.spyOn(pb, 'storageList').mockResolvedValue([] as any);
  const { findByTestId, getByText } = wrap(<PlaybackScreen />);
  expect(await findByTestId('camera.liveView')).toBeTruthy(); // CameraVideoView placeholder (shared testID)
  expect(getByText(/SD|sd card|tf/i)).toBeTruthy();
  expect(getByText(/cloud/i)).toBeTruthy();
});

test('can switch to Cloud tab', async () => {
  jest.spyOn(pb, 'recordList').mockResolvedValue([] as any);
  jest.spyOn(pb, 'storageList').mockResolvedValue([{ record_type: 0, start_time: '2026-06-10 12:00:00', end_time: '2026-06-10 12:10:00' }] as any);
  const { getByTestId } = wrap(<PlaybackScreen />);
  fireEvent.press(getByTestId('playback.tab.cloud'));
  // no throw = pass; cloud query should run
});

test('shows No recordings when recordList returns empty array', async () => {
  jest.spyOn(pb, 'recordList').mockResolvedValue([] as any);
  jest.spyOn(pb, 'storageList').mockResolvedValue([] as any);
  const { findByText } = wrap(<PlaybackScreen />);
  expect(await findByText(/No recordings/i)).toBeTruthy();
});

test('prev date button changes the displayed date', async () => {
  jest.spyOn(pb, 'recordList').mockResolvedValue([] as any);
  jest.spyOn(pb, 'storageList').mockResolvedValue([] as any);
  const { getByTestId } = wrap(<PlaybackScreen />);
  const label = getByTestId('playback.date.label');
  const initialDate = label.props.children as string;
  fireEvent.press(getByTestId('playback.date.prev'));
  const newDate = label.props.children as string;
  expect(newDate).not.toBe(initialDate);
});
