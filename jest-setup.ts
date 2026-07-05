// @testing-library/react-native v13+ bundles jest matchers — no extend-expect import needed.

// react-native-mmkv needs the native NitroModules binary, which isn't available
// under jest. Route createMMKV through the in-memory mock the library ships so
// modules that import StorageManager can be required in tests.
jest.mock('react-native-mmkv', () => ({
  createMMKV: require('react-native-mmkv/lib/createMMKV/createMockMMKV')
    .createMockMMKV,
}));

// react-hook form setup for testing
// @ts-expect-error - Setting up global window for testing environment
global.window = {};
// @ts-expect-error - Assigning global to window for testing environment
global.window = global;
