import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { PhoneFrame } from '../PhoneFrame';
test('renders children on non-web platform', () => {
  const { getByText } = render(<PhoneFrame><Text>hi</Text></PhoneFrame>);
  expect(getByText('hi')).toBeTruthy();
});
