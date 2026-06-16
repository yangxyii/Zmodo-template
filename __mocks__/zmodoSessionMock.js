// Jest mock for src/native/zmodoSession (both .native.ts and .ts).
// The native requireNativeModule is not available in the test environment,
// so we export a no-op connectServer stub.
module.exports = {
  connectServer: jest.fn().mockResolvedValue(undefined),
};
