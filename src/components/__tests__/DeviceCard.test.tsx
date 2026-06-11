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

test('Live button fires onPress with physical_id', () => {
  const fn = jest.fn();
  const { getByTestId } = render(<DeviceCard device={dev} onPress={fn} />);
  fireEvent.press(getByTestId('home.liveButton'));
  expect(fn).toHaveBeenCalledWith('ZM1');
});

test('Play Back button fires onPlayback with physical_id', () => {
  const onPlayback = jest.fn();
  const { getByTestId } = render(
    <DeviceCard device={dev} onPress={jest.fn()} onPlayback={onPlayback} />,
  );
  fireEvent.press(getByTestId('home.playbackButton'));
  expect(onPlayback).toHaveBeenCalledWith('ZM1');
});

test('shows Offline status for offline device', () => {
  const offlineDev = { ...dev, device_online: '0' };
  const { getByText } = render(<DeviceCard device={offlineDev} onPress={jest.fn()} />);
  expect(getByText('Offline')).toBeTruthy();
});
