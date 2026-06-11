import React from 'react';
import { Switch } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NotificationSettingsScreen from '../notification-settings';
import * as notifApi from '../../src/api/notifications';
import { useAuth } from '../../src/store/authStore';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
    canGoBack: () => true,
  }),
}));

jest.mock('../../src/api/notifications', () => ({
  getAiNotification: jest.fn(),
  setAiNotification: jest.fn(),
}));

beforeEach(() => {
  useAuth.setState({ token: 'tk', user: null, hydrated: true } as any);
  (notifApi.getAiNotification as jest.Mock).mockResolvedValue({
    people_motion: 1,
    vehicle_motion: 1,
    animal_motion: 1,
    other_motion: 1,
  });
  (notifApi.setAiNotification as jest.Mock).mockResolvedValue(undefined);
});

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

test('renders all 4 notification rows', async () => {
  const { getByTestId } = wrap(<NotificationSettingsScreen />);
  await waitFor(() => expect(getByTestId('notif.people')).toBeTruthy());
  expect(getByTestId('notif.vehicle')).toBeTruthy();
  expect(getByTestId('notif.animal')).toBeTruthy();
  expect(getByTestId('notif.other')).toBeTruthy();
});

test('toggling People calls setAiNotification with people_motion flipped to 0', async () => {
  const { getByTestId, UNSAFE_getAllByType } = wrap(<NotificationSettingsScreen />);
  // Wait for data to load
  await waitFor(() => expect(getByTestId('notif.people')).toBeTruthy());
  // People switch is first in the list (index 0)
  const switches = UNSAFE_getAllByType(Switch);
  fireEvent(switches[0], 'valueChange', false);
  await waitFor(() =>
    expect(notifApi.setAiNotification).toHaveBeenCalledWith(
      'tk',
      expect.objectContaining({ people_motion: 0 }),
    ),
  );
});
