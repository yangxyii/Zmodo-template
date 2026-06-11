import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import WelcomeScreen from '../welcome';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test('renders tagline', () => {
  const { getByText } = render(<WelcomeScreen />);
  expect(getByText('Smart Home, Smart Life')).toBeTruthy();
});

test('Login button press navigates to /login', () => {
  const { getByTestId } = render(<WelcomeScreen />);
  fireEvent.press(getByTestId('welcome.login'));
  expect(mockPush).toHaveBeenCalledWith('/login');
});

test('Sign Up button renders', () => {
  const { getByTestId } = render(<WelcomeScreen />);
  expect(getByTestId('welcome.signup')).toBeTruthy();
});
