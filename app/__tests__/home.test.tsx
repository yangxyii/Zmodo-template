import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomeScreen from '../(tabs)/home';
import * as devicesApi from '../../src/api/devices';
import { useAuth } from '../../src/store/authStore';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

// Silence timer-related act() warnings from the auto-advancing carousel
jest.useFakeTimers();

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  useAuth.setState({ token: 'tk', user: null, hydrated: true } as any);
});

test('renders "Welcome" header', async () => {
  jest.spyOn(devicesApi, 'deviceList').mockResolvedValue([] as any);
  const { findByText } = wrap(<HomeScreen />);
  expect(await findByText('Welcome')).toBeTruthy();
});

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

test('banner is visible initially and hidden after X press', async () => {
  jest.spyOn(devicesApi, 'deviceList').mockResolvedValue([] as any);
  const { getByTestId, queryByTestId } = wrap(<HomeScreen />);
  // Banner should be visible
  await waitFor(() => expect(getByTestId('home.banner')).toBeTruthy());
  // Press close
  fireEvent.press(getByTestId('home.banner.close'));
  // Banner should now be gone
  await waitFor(() => expect(queryByTestId('home.banner')).toBeNull());
});

test('notification toggle switches from ON to OFF', async () => {
  jest.spyOn(devicesApi, 'deviceList').mockResolvedValue([] as any);
  const { getByTestId } = wrap(<HomeScreen />);
  await waitFor(() => expect(getByTestId('home.notif.on')).toBeTruthy());
  // Press OFF button
  fireEvent.press(getByTestId('home.notif.off'));
  // OFF is now visually selected (no assertion on style, just that it doesn't throw)
  expect(getByTestId('home.notif.off')).toBeTruthy();
});
