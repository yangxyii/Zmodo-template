import React from 'react';
import { render } from '@testing-library/react-native';
import VaultScreen from '../(tabs)/vault';
import { useAuth } from '../../src/store/authStore';
import { vaultWebUrl } from '../../src/api/vault';
import { setHostList, clearHosts } from '../../src/api/hostStore';

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...rest }: any) => require('react').createElement(View, rest, children),
  };
});

beforeEach(() => {
  clearHosts();
  useAuth.setState({ token: 'test-token', user: null, hydrated: true } as any);
});

afterEach(() => {
  clearHosts();
});

test('renders vault container with testID when token present', () => {
  const { getByTestId } = render(<VaultScreen />);
  expect(getByTestId('vault.webview')).toBeTruthy();
});

test('shows "Please log in" when no token', () => {
  useAuth.setState({ token: null, user: null, hydrated: true } as any);
  const { getByText } = render(<VaultScreen />);
  expect(getByText('Please log in')).toBeTruthy();
});

test('vaultWebUrl contains storage.meshare.com and token param by default', () => {
  const url = vaultWebUrl('tk');
  expect(url).toContain('storage');
  expect(url).toContain('token=tk');
});

test('vaultWebUrl uses vdr_web_address from hostStore when set', () => {
  setHostList({ vdr_web_address: ['https://vdr.custom.com'] });
  const url = vaultWebUrl('mytoken');
  expect(url).toContain('vdr.custom.com');
  expect(url).toContain('token=mytoken');
});

test('vaultWebUrl falls back to default when no vdr_web_address set', () => {
  // clearHosts was called in beforeEach; no vdr_web_address in memory
  const url = vaultWebUrl('tk2');
  expect(url).toContain('storage.meshare.com');
  expect(url).toContain('token=tk2');
});
