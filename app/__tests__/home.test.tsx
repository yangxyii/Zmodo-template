import { render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomeScreen from '../home';
import * as devicesApi from '../../src/api/devices';
import { useAuth } from '../../src/store/authStore';
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}
beforeEach(() => { useAuth.setState({ token: 'tk', user: null, hydrated: true } as any); });
test('renders devices from API', async () => {
  jest.spyOn(devicesApi, 'deviceList').mockResolvedValue([
    { physical_id: 'A', device_name: 'Cam A', device_online: '1', device_type: '0' },
    { physical_id: 'B', device_name: 'Cam B', device_online: '0', device_type: '0' },
  ] as any);
  const { findByText } = wrap(<HomeScreen />);
  expect(await findByText('Cam A')).toBeTruthy();
  expect(await findByText('Cam B')).toBeTruthy();
});

test('shows empty state when API returns no devices', async () => {
  jest.spyOn(devicesApi, 'deviceList').mockResolvedValue([] as any);
  const { findByText } = wrap(<HomeScreen />);
  expect(await findByText(/no devices/i)).toBeTruthy();
});
