import React from 'react';
import { Alert } from 'react-native';
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

// Jest runs as native (Platform.OS === 'ios'), so confirmDelete uses
// Alert.alert. Spy on it and invoke the "Delete" button's onPress so the
// delete proceeds without real user interaction.
beforeAll(() => {
  jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
    const del = (buttons ?? []).find((b) => b.style === 'destructive');
    del?.onPress?.();
  });
});
afterAll(() => {
  (Alert.alert as jest.Mock).mockRestore();
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
