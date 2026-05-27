// @testing-library/react-native v13+ bundles jest matchers — no extend-expect import needed.

// react-hook form setup for testing
// @ts-expect-error - Setting up global window for testing environment
global.window = {};
// @ts-expect-error - Assigning global to window for testing environment
global.window = global;
