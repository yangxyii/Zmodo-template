import { render } from '@testing-library/react-native';
import { CameraVideoView } from '../CameraVideoView.web';

test('web shows placeholder', () => {
  const { getByText } = render(<CameraVideoView physicalId="ZM1" mode="live" />);
  expect(getByText(/View live video in the mobile app/i)).toBeTruthy();
});

test('web placeholder has testID camera.liveView', () => {
  const { getByTestId } = render(<CameraVideoView physicalId="ZM1" mode="live" />);
  expect(getByTestId('camera.liveView')).toBeTruthy();
});

test('web placeholder renders with playback mode', () => {
  const { getByTestId } = render(<CameraVideoView physicalId="ZM1" mode="playback" />);
  expect(getByTestId('camera.liveView')).toBeTruthy();
});
