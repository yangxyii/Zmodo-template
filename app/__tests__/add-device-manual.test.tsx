import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ManualAddScreen from '../add-device/manual';
import * as devicesApi from '../../src/api/devices';
import { useAuth } from '../../src/store/authStore';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockInvalidateQueries = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: mockReplace,
    canGoBack: () => true,
  }),
}));

jest.mock('../../src/api/devices', () => ({
  ...jest.requireActual('../../src/api/devices'),
  addDevice: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: mockInvalidateQueries,
    }),
  };
});

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  mockPush.mockClear();
  mockBack.mockClear();
  mockReplace.mockClear();
  mockInvalidateQueries.mockClear();
  useAuth.setState({ token: 'test-token', user: null, hydrated: true } as any);
  (devicesApi.addDevice as jest.Mock).mockResolvedValue({ result: 'ok' });
});

test('Add button is disabled when Device ID is empty', () => {
  const { getByTestId } = wrap(<ManualAddScreen />);
  const btn = getByTestId('adddevice.manual.submit');
  expect(btn.props.accessibilityState?.disabled).toBe(true);
});

test('Add button becomes enabled after typing a device ID', () => {
  const { getByTestId } = wrap(<ManualAddScreen />);
  fireEvent.changeText(getByTestId('adddevice.manual.id'), 'ZMD19H2IHA01172');
  const btn = getByTestId('adddevice.manual.submit');
  expect(btn.props.accessibilityState?.disabled).toBe(false);
});

test('pressing Add calls addDevice with token, id, name', async () => {
  const { getByTestId } = wrap(<ManualAddScreen />);

  fireEvent.changeText(getByTestId('adddevice.manual.id'), 'ZMD19H2IHA01172');
  fireEvent.changeText(getByTestId('adddevice.manual.name'), 'Front Door');
  fireEvent.press(getByTestId('adddevice.manual.submit'));

  await waitFor(() => {
    expect(devicesApi.addDevice).toHaveBeenCalledWith(
      'test-token',
      'ZMD19H2IHA01172',
      'Front Door',
    );
  });
});

test('uses device ID as name when name is empty', async () => {
  const { getByTestId } = wrap(<ManualAddScreen />);

  fireEvent.changeText(getByTestId('adddevice.manual.id'), 'ZMD19H2IHA01172');
  fireEvent.press(getByTestId('adddevice.manual.submit'));

  await waitFor(() => {
    expect(devicesApi.addDevice).toHaveBeenCalledWith(
      'test-token',
      'ZMD19H2IHA01172',
      'ZMD19H2IHA01172',
    );
  });
});

test('on success invalidates devices query and navigates home', async () => {
  const { getByTestId } = wrap(<ManualAddScreen />);

  fireEvent.changeText(getByTestId('adddevice.manual.id'), 'ZMD19H2IHA01172');
  fireEvent.press(getByTestId('adddevice.manual.submit'));

  await waitFor(() => {
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['devices', 'test-token'],
    });
    expect(mockReplace).toHaveBeenCalledWith('/home');
  });
});

test('shows error banner on API failure', async () => {
  (devicesApi.addDevice as jest.Mock).mockRejectedValueOnce(
    new Error('Device not found'),
  );
  const { getByTestId, findByText } = wrap(<ManualAddScreen />);

  fireEvent.changeText(getByTestId('adddevice.manual.id'), 'BADID');
  fireEvent.press(getByTestId('adddevice.manual.submit'));

  const errMsg = await findByText('Device not found');
  expect(errMsg).toBeTruthy();
  expect(mockReplace).not.toHaveBeenCalled();
});
