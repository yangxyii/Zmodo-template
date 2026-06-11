import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ShareScreen from '../camera/[id]/share';
import * as shareApi from '../../src/api/share';
import { useAuth } from '../../src/store/authStore';
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ id: 'ZM1' }), useRouter: () => ({ back: jest.fn() }) }));
beforeEach(() => { useAuth.setState({ token: 'tk', user: null, hydrated: true } as any); });
test('submitting an email calls shareAdd', async () => {
  const spy = jest.spyOn(shareApi, 'shareAdd').mockResolvedValue({ result: 'ok' } as any);
  const { getByTestId } = render(<ShareScreen />);
  fireEvent.changeText(getByTestId('share.email'), 'friend@example.com');
  fireEvent.press(getByTestId('share.submit'));
  await waitFor(() => expect(spy).toHaveBeenCalledWith('tk', 'ZM1', 'friend@example.com'));
});

test('shareAdd error shows error message', async () => {
  jest.spyOn(shareApi, 'shareAdd').mockRejectedValue(new Error('nope'));
  const { getByTestId, findByText } = render(<ShareScreen />);
  fireEvent.changeText(getByTestId('share.email'), 'friend@example.com');
  fireEvent.press(getByTestId('share.submit'));
  await findByText('nope');
});
