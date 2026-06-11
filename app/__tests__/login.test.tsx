import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../login';
import * as authApi from '../../src/api/auth';
import { useAuth } from '../../src/store/authStore';

jest.mock('expo-router', () => ({ useRouter: () => ({ replace: jest.fn() }) }));

beforeEach(() => {
  useAuth.setState({ token: null, user: null, hydrated: false });
  jest.clearAllMocks();
});

test('submits credentials and sets session', async () => {
  jest.spyOn(authApi, 'login').mockResolvedValue({ token: 'tk', user: { id: '1', username: 'u', email: 'e@x.com' } as any });
  const { getByTestId } = render(<LoginScreen />);
  fireEvent.changeText(getByTestId('auth.login.emailInput'), 'e@x.com');
  fireEvent.changeText(getByTestId('auth.login.passwordInput'), 'pw');
  fireEvent.press(getByTestId('login.submit'));
  await waitFor(() => expect(authApi.login).toHaveBeenCalledWith('e@x.com', 'pw'));
  await waitFor(() => expect(useAuth.getState().token).toBe('tk'));
});

test('shows error banner and keeps token null on login failure', async () => {
  jest.spyOn(authApi, 'login').mockRejectedValue(new Error('Invalid credentials'));
  const { getByTestId, findByText } = render(<LoginScreen />);
  fireEvent.changeText(getByTestId('auth.login.emailInput'), 'bad@x.com');
  fireEvent.changeText(getByTestId('auth.login.passwordInput'), 'wrongpw');
  fireEvent.press(getByTestId('login.submit'));
  await findByText('Invalid credentials');
  expect(useAuth.getState().token).toBeNull();
});

test('submit button is disabled while login is pending', async () => {
  let resolve!: (v: { token: string; user: any }) => void;
  jest.spyOn(authApi, 'login').mockReturnValue(
    new Promise<{ token: string; user: any }>((res) => { resolve = res; }),
  );
  const { getByTestId } = render(<LoginScreen />);
  fireEvent.changeText(getByTestId('auth.login.emailInput'), 'e@x.com');
  fireEvent.changeText(getByTestId('auth.login.passwordInput'), 'pw');
  fireEvent.press(getByTestId('login.submit'));
  // While in-flight the button should have accessibilityState.disabled = true
  await waitFor(() => {
    const btn = getByTestId('login.submit');
    expect(btn.props.accessibilityState?.disabled).toBe(true);
  });
  // Resolve so the test cleans up properly
  resolve({ token: 'tk', user: { id: '1', username: 'u', email: 'e@x.com' } as any });
});
