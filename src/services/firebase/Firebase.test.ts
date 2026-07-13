jest.mock('@react-native-firebase/app', () => ({
  getApp: jest.fn(() => ({})),
}));

jest.mock('@react-native-firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  signInWithPhoneNumber: jest.fn(),
}));

jest.mock('@react-native-firebase/functions', () => ({
  getFunctions: jest.fn(() => ({})),
  httpsCallable: jest.fn(),
}));

const mockGetToken = jest.fn();
const mockIsDeviceRegisteredForRemoteMessages = jest.fn();
const mockRegisterDeviceForRemoteMessages = jest.fn();
const mockRequestPermission = jest.fn();

jest.mock('@react-native-firebase/messaging', () => ({
  AuthorizationStatus: {
    AUTHORIZED: 1,
    PROVISIONAL: 2,
    DENIED: 0,
  },
  getMessaging: jest.fn(() => ({})),
  getToken: (...args: unknown[]) => mockGetToken(...args),
  isDeviceRegisteredForRemoteMessages: (...args: unknown[]) =>
    mockIsDeviceRegisteredForRemoteMessages(...args),
  registerDeviceForRemoteMessages: (...args: unknown[]) =>
    mockRegisterDeviceForRemoteMessages(...args),
  requestPermission: (...args: unknown[]) => mockRequestPermission(...args),
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    hasPlayServices: jest.fn(),
    signIn: jest.fn(),
  },
}));

jest.mock('../FlashMessages', () => ({
  flashErrorMessage: jest.fn(),
}));

jest.mock('../storageManager', () => ({
  StorageManager: {
    setData: jest.fn(),
    storageKeys: {
      FCM_TOKEN: 'FCM_TOKEN',
    },
  },
}));

import Firebase from './Firebase';

describe('Firebase.getFcmToken', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('uses the placeholder token when notification permission is not granted', async () => {
    mockRequestPermission.mockResolvedValue(0);

    await expect(Firebase.getFcmToken()).resolves.toBe('FcmToken');
    expect(mockGetToken).not.toHaveBeenCalled();
    expect(mockRegisterDeviceForRemoteMessages).not.toHaveBeenCalled();
  });

  it('uses the placeholder token when FCM token retrieval fails', async () => {
    mockRequestPermission.mockResolvedValue(1);
    mockIsDeviceRegisteredForRemoteMessages.mockReturnValue(true);
    mockGetToken.mockRejectedValue(new Error('Network Error'));

    await expect(Firebase.getFcmToken()).resolves.toBe('FcmToken');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Error while getting FCM token =>',
      expect.any(Error)
    );
  });
});
