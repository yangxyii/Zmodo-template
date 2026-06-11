import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AccountScreen from '../account';
import * as authApi from '../../src/api/auth';
import { useAuth } from '../../src/store/authStore';
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    back: mockBack,
    push: mockPush,
    canGoBack: () => false,
  }),
}));
beforeEach(() => {
  useAuth.setState({ token: 'tk', user: { id: '1', username: 'u', email: 'e@x.com' } as any, hydrated: true });
  mockReplace.mockClear();
  mockBack.mockClear();
  mockPush.mockClear();
});

test('logout clears session and redirects', async () => {
  const spy = jest.spyOn(authApi, 'logout').mockResolvedValue(undefined as any);
  const { getByTestId } = render(<AccountScreen />);
  fireEvent.press(getByTestId('settings.logoutButton'));
  await waitFor(() => expect(spy).toHaveBeenCalledWith('tk'));
  await waitFor(() => expect(useAuth.getState().token).toBeNull());
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/welcome'));
});

test('logout-throws-still-clears: finally block runs even when logout rejects', async () => {
  jest.spyOn(authApi, 'logout').mockRejectedValue(new Error('network error'));
  const { getByTestId } = render(<AccountScreen />);
  fireEvent.press(getByTestId('settings.logoutButton'));
  await waitFor(() => expect(useAuth.getState().token).toBeNull());
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/welcome'));
});

test('Me page renders user email', () => {
  jest.spyOn(authApi, 'logout').mockResolvedValue(undefined as any);
  const { getByText } = render(<AccountScreen />);
  expect(getByText('e@x.com')).toBeTruthy();
});

test('Me page renders all row labels', () => {
  jest.spyOn(authApi, 'logout').mockResolvedValue(undefined as any);
  const { getByText } = render(<AccountScreen />);
  expect(getByText('Contact Support')).toBeTruthy();
  expect(getByText('Sharing')).toBeTruthy();
  expect(getByText('Moments')).toBeTruthy();
  expect(getByText('Payment Management')).toBeTruthy();
  expect(getByText('Order History')).toBeTruthy();
  expect(getByText('System Settings')).toBeTruthy();
  expect(getByText('Help')).toBeTruthy();
  expect(getByText('Log out')).toBeTruthy();
});

test('pressing System Settings row calls router.push(/system-settings)', () => {
  jest.spyOn(authApi, 'logout').mockResolvedValue(undefined as any);
  const { getByTestId } = render(<AccountScreen />);
  fireEvent.press(getByTestId('me.row.systemSettings'));
  expect(mockPush).toHaveBeenCalledWith('/system-settings');
});
