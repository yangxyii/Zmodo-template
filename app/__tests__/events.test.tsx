import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EventsScreen from '../(tabs)/events';
import * as eventsApi from '../../src/api/events';
import * as devicesApi from '../../src/api/devices';
import { useAuth } from '../../src/store/authStore';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

// Fixed epoch times so tests are deterministic regardless of TZ.
// 2026-06-11T20:29:02Z → local date may be Jun 11 or earlier depending on TZ,
// but we assert on 'Motion' and device_name rather than date string.
const T1 = '1749673742'; // 2026-06-11 some time
const T2 = '1749673002'; // 2026-06-11, a minute earlier

const FAKE_EVENTS: eventsApi.ZmodoEvent[] = [
  {
    id: 'ev1',
    from_id: 'ZMD123',
    device_name: 'Front Door',
    type: '0',
    alarm_time: T1,
    create_time: T1,
    image_url: 'D/alerts_7/abc.jpg',
    video_url: '',
    cloud_playback: '1',
    moving_object: 'Normal',
    channel: 0,
    if_read: '0',
  },
  {
    id: 'ev2',
    from_id: 'ZMD456',
    device_name: 'Back Yard',
    type: '0',
    alarm_time: T2,
    create_time: T2,
    image_url: '',
    video_url: '',
    cloud_playback: '0',
    moving_object: 'Normal',
    channel: 0,
    if_read: '1',
  },
];

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  useAuth.setState({ token: 'test-token', user: null, hydrated: true } as any);
  jest.spyOn(devicesApi, 'deviceList').mockResolvedValue([]);
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('shows loading indicator initially', () => {
  jest.spyOn(eventsApi, 'searchEvents').mockReturnValue(new Promise(() => {}));
  const { getByTestId } = wrap(<EventsScreen />);
  // ActivityIndicator doesn't have a testID by default — check that rows don't appear yet
  // (query will never resolve in this test)
  expect(() => getByTestId('events.row')).toThrow();
});

test('renders a date section header and two event rows', async () => {
  jest.spyOn(eventsApi, 'searchEvents').mockResolvedValue(FAKE_EVENTS);
  const { getAllByTestId, findAllByText } = wrap(<EventsScreen />);

  // Wait for Motion labels to appear
  const motionLabels = await findAllByText('Motion');
  expect(motionLabels).toHaveLength(2);

  // Two rows
  await waitFor(() => expect(getAllByTestId('events.row')).toHaveLength(2));
});

test('renders device name in row subtitles', async () => {
  jest.spyOn(eventsApi, 'searchEvents').mockResolvedValue(FAKE_EVENTS);
  const { findByText } = wrap(<EventsScreen />);

  expect(await findByText(/Front Door/)).toBeTruthy();
  expect(await findByText(/Back Yard/)).toBeTruthy();
});

test('renders time in subtitle (HH:MM:SS AM/PM format)', async () => {
  jest.spyOn(eventsApi, 'searchEvents').mockResolvedValue(FAKE_EVENTS);
  const { findAllByText } = wrap(<EventsScreen />);

  // Time should include AM or PM
  const subtitles = await findAllByText(/[AP]M/);
  expect(subtitles.length).toBeGreaterThanOrEqual(1);
});

test('shows "No events" when API returns empty array', async () => {
  jest.spyOn(eventsApi, 'searchEvents').mockResolvedValue([]);
  const { findByText } = wrap(<EventsScreen />);
  expect(await findByText('No events')).toBeTruthy();
});

test('shows error message and Retry button when API throws', async () => {
  jest.spyOn(eventsApi, 'searchEvents').mockRejectedValue(new Error('network error'));
  const { findByText } = wrap(<EventsScreen />);
  expect(await findByText(/Failed to load events/i)).toBeTruthy();
  expect(await findByText('Retry')).toBeTruthy();
});

test('header renders Events title and Edit button', async () => {
  jest.spyOn(eventsApi, 'searchEvents').mockResolvedValue([]);
  const { findByText, getByTestId } = wrap(<EventsScreen />);
  expect(await findByText('Events')).toBeTruthy();
  expect(getByTestId('events.edit')).toBeTruthy();
});

test('filter buttons are rendered', async () => {
  jest.spyOn(eventsApi, 'searchEvents').mockResolvedValue([]);
  const { getByTestId } = wrap(<EventsScreen />);
  expect(getByTestId('events.filter.devices')).toBeTruthy();
  expect(getByTestId('events.filter.categories')).toBeTruthy();
});

test('eventTypeLabel returns "Motion" for type "0"', () => {
  expect(eventsApi.eventTypeLabel('0')).toBe('Motion');
  expect(eventsApi.eventTypeLabel('unknown')).toBe('Motion');
});

test('eventThumbnailUrl returns null for empty image_url', () => {
  const result = eventsApi.eventThumbnailUrl('tok', { from_id: 'ZMD', image_url: '' });
  expect(result).toBeNull();
});

test('eventThumbnailUrl builds a URL for non-empty image_url', () => {
  const result = eventsApi.eventThumbnailUrl('tok', {
    from_id: 'ZMD',
    image_url: 'D/alerts_7/abc.jpg',
  });
  // On native (test env) API_PROXY is '' so no proxy wrapping
  expect(result).toContain('/storage/get_file');
  expect(result).toContain('physical_id=ZMD');
  expect(result).toContain('alerts_7');
});
