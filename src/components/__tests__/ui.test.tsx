import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';
import { Cell } from '../Cell';
import { TextField } from '../TextField';
test('Button fires onPress', () => {
  const fn = jest.fn();
  const { getByText } = render(<Button title="OK" onPress={fn} />);
  fireEvent.press(getByText('OK'));
  expect(fn).toHaveBeenCalled();
});
test('Cell shows title + value', () => {
  const { getByText } = render(<Cell title="Name" value="Cam1" />);
  expect(getByText('Name')).toBeTruthy();
  expect(getByText('Cam1')).toBeTruthy();
});
test('Button does not fire onPress when disabled', () => {
  const fn = jest.fn();
  const { getByTestId } = render(<Button title="OK" onPress={fn} disabled testID="btn" />);
  fireEvent.press(getByTestId('btn'));
  expect(fn).not.toHaveBeenCalled();
});
test('TextField calls onChangeText', () => {
  const fn = jest.fn();
  const { getByTestId } = render(<TextField value="" onChangeText={fn} testID="tf" />);
  fireEvent.changeText(getByTestId('tf'), 'hello');
  expect(fn).toHaveBeenCalledWith('hello');
});
