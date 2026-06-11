import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LiveScreen from '../camera/[id]/live';
import * as devicesApi from '../../src/api/devices';
import { useAuth } from '../../src/store/authStore';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'ZM1' }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

beforeEach(() => {
  useAuth.setState({ token: 'tk', user: null, hydrated: true } as any);
});

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

test('renders video placeholder + controls', async () => {
  jest.spyOn(devicesApi, 'deviceList').mockResolvedValue([
    { physical_id: 'ZM1', device_name: 'Cam A', device_online: '1', device_type: '0' },
  ] as any);
  const { findByTestId } = wrap(<LiveScreen />);
  expect(await findByTestId('camera.liveView')).toBeTruthy();
});

test('control bar buttons are rendered', async () => {
  jest.spyOn(devicesApi, 'deviceList').mockResolvedValue([
    { physical_id: 'ZM1', device_name: 'Cam A', device_online: '1', device_type: '0' },
  ] as any);
  const { findByTestId } = wrap(<LiveScreen />);
  expect(await findByTestId('live.snapshot')).toBeTruthy();
  expect(await findByTestId('live.record')).toBeTruthy();
  expect(await findByTestId('live.quality')).toBeTruthy();
  expect(await findByTestId('live.talk')).toBeTruthy();
});

test('shows device name in header', async () => {
  jest.spyOn(devicesApi, 'deviceList').mockResolvedValue([
    { physical_id: 'ZM1', device_name: 'Cam A', device_online: '1', device_type: '0' },
  ] as any);
  const { findByText } = wrap(<LiveScreen />);
  expect(await findByText('Cam A')).toBeTruthy();
});

test('falls back to id when device not found', async () => {
  jest.spyOn(devicesApi, 'deviceList').mockResolvedValue([] as any);
  const { findByText } = wrap(<LiveScreen />);
  // Device not found → shows the raw id
  expect(await findByText('ZM1')).toBeTruthy();
});

test('playback entry button is rendered', async () => {
  jest.spyOn(devicesApi, 'deviceList').mockResolvedValue([
    { physical_id: 'ZM1', device_name: 'Cam A', device_online: '1', device_type: '0' },
  ] as any);
  const { findByTestId } = wrap(<LiveScreen />);
  expect(await findByTestId('live.playback')).toBeTruthy();
});

test('PTZ pad is rendered', async () => {
  jest.spyOn(devicesApi, 'deviceList').mockResolvedValue([
    { physical_id: 'ZM1', device_name: 'Cam A', device_online: '1', device_type: '0' },
  ] as any);
  const { findByTestId } = wrap(<LiveScreen />);
  expect(await findByTestId('ptz.up')).toBeTruthy();
  expect(await findByTestId('ptz.down')).toBeTruthy();
  expect(await findByTestId('ptz.left')).toBeTruthy();
  expect(await findByTestId('ptz.right')).toBeTruthy();
});
