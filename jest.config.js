module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@tanstack/.*|@react-native-async-storage/.*))',
    'node_modules/react-native-reanimated/plugin/',
    'node_modules/@react-native/babel-preset/',
  ],
  moduleNameMapper: {
    '^@react-native-async-storage/async-storage$':
      '@react-native-async-storage/async-storage/jest/async-storage-mock',
    // Mock the icon font library so jest doesn't try to load native fonts.
    '^@expo/vector-icons$': '<rootDir>/__mocks__/expoVectorIconsMock.js',
    // Resolve platform-split CameraVideoView to the .web variant in Jest so
    // tests are deterministic regardless of jest-expo's haste platform setting.
    '^(.*)/CameraVideoView$': '$1/CameraVideoView.web',
  },
};
