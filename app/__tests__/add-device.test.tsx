import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AddDeviceScreen from '../add-device';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: mockReplace,
    canGoBack: () => true,
  }),
}));

beforeEach(() => {
  mockPush.mockClear();
  mockBack.mockClear();
  mockReplace.mockClear();
});

test('renders all 5 category rows', () => {
  const { getByTestId } = render(<AddDeviceScreen />);
  expect(getByTestId('adddevice.cat.qr')).toBeTruthy();
  expect(getByTestId('adddevice.cat.wifi')).toBeTruthy();
  expect(getByTestId('adddevice.cat.smarthome')).toBeTruthy();
  expect(getByTestId('adddevice.cat.legacy')).toBeTruthy();
  expect(getByTestId('adddevice.cat.bluetooth')).toBeTruthy();
});

test('renders manual option', () => {
  const { getByTestId } = render(<AddDeviceScreen />);
  expect(getByTestId('adddevice.manual')).toBeTruthy();
});

test('pressing QR category calls router.push with /add-device/qr', () => {
  const { getByTestId } = render(<AddDeviceScreen />);
  fireEvent.press(getByTestId('adddevice.cat.qr'));
  expect(mockPush).toHaveBeenCalledWith('/add-device/qr');
});

test('pressing Wi-Fi category calls router.push with /add-device/wifi', () => {
  const { getByTestId } = render(<AddDeviceScreen />);
  fireEvent.press(getByTestId('adddevice.cat.wifi'));
  expect(mockPush).toHaveBeenCalledWith('/add-device/wifi');
});

test('pressing manual option calls router.push with /add-device/manual', () => {
  const { getByTestId } = render(<AddDeviceScreen />);
  fireEvent.press(getByTestId('adddevice.manual'));
  expect(mockPush).toHaveBeenCalledWith('/add-device/manual');
});
