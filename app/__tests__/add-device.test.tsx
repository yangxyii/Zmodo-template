import { render } from '@testing-library/react-native';
import AddDeviceScreen from '../add-device';
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }));
test('renders scan placeholder + manual input', () => {
  const { getByTestId, getByText } = render(<AddDeviceScreen />);
  expect(getByTestId('adddevice.manualId')).toBeTruthy();
  expect(getByText(/scan|扫码|QR/i)).toBeTruthy();
});
