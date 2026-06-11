import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PlaybackScreen from '../camera/[id]/playback';
import * as eventsApi from '../../src/api/events';
import * as devicesApi from '../../src/api/devices';
import { useAuth } from '../../src/store/authStore';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'ZM1' }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), canGoBack: () => true }),
}));

beforeEach(() => {
  useAuth.setState({ token: 'tk', user: null, hydrated: true } as any);
});

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

const DEVICE = { physical_id: 'ZM1', device_name: 'Cam A', device_online: '1', device_type: '0' };

const FAKE_EVENTS = [
  {
    id: 'ev1',
    from_id: 'ZM1',
    device_name: 'Cam A',
    type: '0',
    alarm_time: '1749600000',
    create_time: '1749600000',
    image_url: '/path/to/thumb1.jpg',
    video_url: '',
    cloud_playback: '1',
    moving_object: '0',
    channel: 0,
    if_read: '0',
  },
  {
    id: 'ev2',
    from_id: 'ZM1',
    device_name: 'Cam A',
    type: '0',
    alarm_time: '1749603600',
    create_time: '1749603600',
    image_url: '/path/to/thumb2.jpg',
    video_url: '',
    cloud_playback: '1',
    moving_object: '0',
    channel: 0,
    if_read: '0',
  },
];

test('renders video placeholder (camera.liveView)', async () => {
  jest.spyOn(devicesApi, 'deviceList').mockResolvedValue([DEVICE] as any);
  jest.spyOn(eventsApi, 'searchEvents').mockResolvedValue([]);
  jest.spyOn(eventsApi, 'eventThumbnailUrl').mockReturnValue('http://example.com/thumb.jpg');
  jest.spyOn(eventsApi, 'eventTypeLabel').mockReturnValue('Motion');
  const { findByTestId } = wrap(<PlaybackScreen />);
  expect(await findByTestId('camera.liveView')).toBeTruthy();
});

test('timeline renders (playback.timeline testID)', async () => {
  jest.spyOn(devicesApi, 'deviceList').mockResolvedValue([DEVICE] as any);
  jest.spyOn(eventsApi, 'searchEvents').mockResolvedValue([]);
  jest.spyOn(eventsApi, 'eventThumbnailUrl').mockReturnValue('http://example.com/thumb.jpg');
  jest.spyOn(eventsApi, 'eventTypeLabel').mockReturnValue('Motion');
  const { findByTestId } = wrap(<PlaybackScreen />);
  expect(await findByTestId('playback.timeline')).toBeTruthy();
});

test('Alerts section header renders', async () => {
  jest.spyOn(devicesApi, 'deviceList').mockResolvedValue([DEVICE] as any);
  jest.spyOn(eventsApi, 'searchEvents').mockResolvedValue([]);
  jest.spyOn(eventsApi, 'eventThumbnailUrl').mockReturnValue('http://example.com/thumb.jpg');
  jest.spyOn(eventsApi, 'eventTypeLabel').mockReturnValue('Motion');
  const { findByText } = wrap(<PlaybackScreen />);
  expect(await findByText('Alerts')).toBeTruthy();
});

test('renders 2 alert rows with Motion label when 2 events returned', async () => {
  jest.spyOn(devicesApi, 'deviceList').mockResolvedValue([DEVICE] as any);
  jest.spyOn(eventsApi, 'searchEvents').mockResolvedValue(FAKE_EVENTS as any);
  jest.spyOn(eventsApi, 'eventThumbnailUrl').mockReturnValue('http://example.com/thumb.jpg');
  jest.spyOn(eventsApi, 'eventTypeLabel').mockReturnValue('Motion');
  const { findAllByTestId, findAllByText } = wrap(<PlaybackScreen />);
  const rows = await findAllByTestId('playback.alertRow');
  expect(rows).toHaveLength(2);
  const motionLabels = await findAllByText('Motion');
  expect(motionLabels.length).toBeGreaterThanOrEqual(2);
});

test('bottom bar testIDs render', async () => {
  jest.spyOn(devicesApi, 'deviceList').mockResolvedValue([DEVICE] as any);
  jest.spyOn(eventsApi, 'searchEvents').mockResolvedValue([]);
  jest.spyOn(eventsApi, 'eventThumbnailUrl').mockReturnValue('http://example.com/thumb.jpg');
  jest.spyOn(eventsApi, 'eventTypeLabel').mockReturnValue('Motion');
  const { findByTestId } = wrap(<PlaybackScreen />);
  expect(await findByTestId('playback.clip')).toBeTruthy();
  expect(await findByTestId('playback.snapshot')).toBeTruthy();
  expect(await findByTestId('playback.time')).toBeTruthy();
  expect(await findByTestId('playback.calendar')).toBeTruthy();
});

test('video overlay testIDs render', async () => {
  jest.spyOn(devicesApi, 'deviceList').mockResolvedValue([DEVICE] as any);
  jest.spyOn(eventsApi, 'searchEvents').mockResolvedValue([]);
  jest.spyOn(eventsApi, 'eventThumbnailUrl').mockReturnValue('http://example.com/thumb.jpg');
  jest.spyOn(eventsApi, 'eventTypeLabel').mockReturnValue('Motion');
  const { findByTestId } = wrap(<PlaybackScreen />);
  expect(await findByTestId('playback.playPause')).toBeTruthy();
  expect(await findByTestId('playback.mute')).toBeTruthy();
  expect(await findByTestId('playback.fullscreen')).toBeTruthy();
  expect(await findByTestId('playback.categories')).toBeTruthy();
});

test('shows device name in header', async () => {
  jest.spyOn(devicesApi, 'deviceList').mockResolvedValue([DEVICE] as any);
  jest.spyOn(eventsApi, 'searchEvents').mockResolvedValue([]);
  jest.spyOn(eventsApi, 'eventThumbnailUrl').mockReturnValue('http://example.com/thumb.jpg');
  jest.spyOn(eventsApi, 'eventTypeLabel').mockReturnValue('Motion');
  const { findByText } = wrap(<PlaybackScreen />);
  expect(await findByText('Cam A')).toBeTruthy();
  expect(await findByText('Cloud Playback')).toBeTruthy();
});
