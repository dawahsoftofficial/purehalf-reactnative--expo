const mockGetNotificationSettings = jest.fn();
const mockOpenNotificationSettings = jest.fn();
const mockHasPermission = jest.fn();
const mockRequestPermission = jest.fn();

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    getNotificationSettings: (...args: unknown[]) =>
      mockGetNotificationSettings(...args),
    openNotificationSettings: (...args: unknown[]) =>
      mockOpenNotificationSettings(...args),
  },
  AuthorizationStatus: {
    NOT_DETERMINED: -1,
    DENIED: 0,
    AUTHORIZED: 1,
    PROVISIONAL: 2,
  },
}));

jest.mock('@react-native-firebase/app', () => ({
  getApp: jest.fn(() => ({})),
}));

jest.mock('@react-native-firebase/messaging', () => ({
  AuthorizationStatus: {
    NOT_DETERMINED: -1,
    DENIED: 0,
    AUTHORIZED: 1,
    PROVISIONAL: 2,
  },
  getMessaging: jest.fn(() => ({})),
  hasPermission: (...args: unknown[]) => mockHasPermission(...args),
  requestPermission: (...args: unknown[]) => mockRequestPermission(...args),
}));

import { PermissionsAndroid, Platform } from 'react-native';

import requestNotificationPermission, {
  getNotificationPermissionStatus,
  openNotificationSettings,
} from './NotificationPermissions';

const originalOS = Platform.OS;
const originalVersion = Platform.Version;

function setPlatform(os: 'android' | 'ios', version: number) {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: os });
  Object.defineProperty(Platform, 'Version', {
    configurable: true,
    value: version,
  });
}

describe('NotificationPermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: originalOS,
    });
    Object.defineProperty(Platform, 'Version', {
      configurable: true,
      value: originalVersion,
    });
  });

  it('reports authorized notification settings as granted', async () => {
    mockGetNotificationSettings.mockResolvedValue({
      authorizationStatus: 1,
    });

    await expect(getNotificationPermissionStatus()).resolves.toBe('granted');
  });

  it('reports an iOS denial as blocked', async () => {
    setPlatform('ios', 18);
    mockGetNotificationSettings.mockResolvedValue({
      authorizationStatus: 0,
    });

    await expect(getNotificationPermissionStatus()).resolves.toBe('blocked');
  });

  it('keeps an Android 13 denial requestable until the OS confirms blocking', async () => {
    setPlatform('android', 33);
    mockGetNotificationSettings.mockResolvedValue({
      authorizationStatus: 0,
    });

    await expect(getNotificationPermissionStatus()).resolves.toBe('denied');
  });

  it('treats disabled notifications on Android 12 as settings-only', async () => {
    setPlatform('android', 32);
    mockGetNotificationSettings.mockResolvedValue({
      authorizationStatus: 0,
    });

    await expect(getNotificationPermissionStatus()).resolves.toBe('blocked');
  });

  it('returns blocked when Android says never ask again', async () => {
    setPlatform('android', 33);
    jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(false);
    jest
      .spyOn(PermissionsAndroid, 'request')
      .mockResolvedValue(PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN);

    await expect(requestNotificationPermission()).resolves.toBe('blocked');
  });

  it('opens the app notification settings', async () => {
    mockOpenNotificationSettings.mockResolvedValue(undefined);

    await openNotificationSettings();

    expect(mockOpenNotificationSettings).toHaveBeenCalledTimes(1);
  });
});
