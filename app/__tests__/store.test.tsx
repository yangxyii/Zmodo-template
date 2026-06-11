import React from 'react';
import { render } from '@testing-library/react-native';
import StoreScreen from '../(tabs)/store';

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...rest }: any) =>
      require('react').createElement(View, rest, children),
  };
});

test('renders store container with testID', () => {
  const { getByTestId } = render(<StoreScreen />);
  expect(getByTestId('store.webview')).toBeTruthy();
});
