import { render, fireEvent } from '@testing-library/react-native';
import { DeviceCard } from '../DeviceCard';
const dev = { physical_id: 'ZM1', device_name: 'Front', device_online: '1', device_type: '0' } as any;
test('shows name + online', () => {
  const { getByText } = render(<DeviceCard device={dev} onPress={jest.fn()} />);
  expect(getByText('Front')).toBeTruthy();
});
test('press on card fires onPress with physical_id', () => {
  const fn = jest.fn();
  const { getByTestId } = render(<DeviceCard device={dev} onPress={fn} />);
  fireEvent.press(getByTestId('home.cameraCard'));
  expect(fn).toHaveBeenCalledWith('ZM1');
});
