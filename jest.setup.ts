import '@testing-library/jest-native/extend-expect';

// Stub only useSafeAreaInsets in tests (it throws "No safe area value
// available" without a SafeAreaProvider). Keep all other real exports
// (SafeAreaView, SafeAreaProvider, etc.) so screens render normally.
jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  return {
    ...actual,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});
