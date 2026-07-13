const mockPurchasesLogOut = jest.fn();
const mockPusherDisconnect = jest.fn();
const mockDeleteAll = jest.fn();
const mockGetData = jest.fn();
const mockSetData = jest.fn();
const mockSetString = jest.fn();
const mockPremiumReset = jest.fn();
const mockConversationReset = jest.fn();
const mockUserStatsReset = jest.fn();
const mockClearSettings = jest.fn();

jest.mock('@react-native-firebase/app', () => ({
  getApp: jest.fn(() => ({})),
}));

jest.mock('@react-native-firebase/auth', () => ({
  __mockAuth: { currentUser: { uid: 'firebase-user' } },
  getAuth: jest.fn(() => ({ currentUser: { uid: 'firebase-user' } })),
  signOut: jest.fn(),
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    signOut: jest.fn(),
  },
}));

jest.mock('react-native-purchases', () => ({
  logOut: (...args: unknown[]) => mockPurchasesLogOut(...args),
}));

jest.mock('../stores', () => ({
  useConversationStore: {
    getState: () => ({ reset: mockConversationReset }),
  },
  usePremiumStore: {
    getState: () => ({ reset: mockPremiumReset }),
  },
  useSettingsStore: {
    getState: () => ({ clearSettings: mockClearSettings }),
  },
  useUserStatsStore: {
    getState: () => ({ reset: mockUserStatsReset }),
  },
}));

jest.mock('./pusher/pusher-service', () => ({
  disconnect: (...args: unknown[]) => mockPusherDisconnect(...args),
}));

jest.mock('./storageManager', () => ({
  StorageManager: {
    deleteAll: (...args: unknown[]) => mockDeleteAll(...args),
    getData: (...args: unknown[]) => mockGetData(...args),
    setData: (...args: unknown[]) => mockSetData(...args),
    setString: (...args: unknown[]) => mockSetString(...args),
    storageKeys: {
      FIREBASE_VERIFICATION_ID: 'FIREBASE_VERIFICATION_ID',
      IS_RECOMMENDED: 'IS_RECOMMENDED',
      LANGUAGE: 'LANGUAGE',
    },
  },
}));

import { signOut as firebaseSignOut } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { cleanupSession } from './session';

const mockFirebaseSignOut = firebaseSignOut as jest.Mock;
const mockGoogleSignOut = GoogleSignin.signOut as jest.Mock;

describe('cleanupSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFirebaseSignOut.mockResolvedValue(undefined);
    mockGoogleSignOut.mockResolvedValue(undefined);
    mockPurchasesLogOut.mockResolvedValue(undefined);
    mockPusherDisconnect.mockResolvedValue(undefined);
    mockDeleteAll.mockResolvedValue(undefined);
    mockGetData.mockResolvedValue('verification-id');
    mockSetData.mockResolvedValue(undefined);
  });

  it('signs out of Google provider state during session cleanup', async () => {
    await cleanupSession({ language: 'en' });

    expect(mockGoogleSignOut).toHaveBeenCalledTimes(1);
  });
});
