import '@testing-library/react-native/extend-expect';

// react-hook form setup for testing
// @ts-expect-error - Setting up global window for testing environment
global.window = {};
// @ts-expect-error - Assigning global to window for testing environment
global.window = global;
