import { getApp } from '@react-native-firebase/app';
import { getAuth, signOut } from '@react-native-firebase/auth';
import Purchases from 'react-native-purchases';

import {
  useConversationStore,
  usePremiumStore,
  useSettingsStore,
  useUserStatsStore,
} from '../stores';
import { stopConversationsListener } from './firebase';
import pusherService from './pusher/pusher-service';
import { StorageManager } from './storageManager';

const firebaseApp = getApp();
const auth = getAuth(firebaseApp);

type CleanupOptions = {
  /** Language code to re-write to storage after the wipe (preserve UI lang). */
  language?: string | null;
  /** When true (default), preserves the Firebase verification id across the wipe. */
  preserveVerificationId?: boolean;
};

/**
 * Tear down all session-scoped state so the next user signing in on the same
 * device does not inherit anything from the previous account.
 *
 * Used by both logout (CommonActions.handleLogout) and account deletion
 * (AccountDeleted screen, FCM-driven account_suspended). Every step is wrapped
 * so a single failure does not block the rest.
 *
 * Does NOT touch React context or navigation — the caller is responsible for
 * `updateCurrentUser(null)` / `updateConversations([])` / route reset.
 */
export async function cleanupSession(
  options: CleanupOptions = {}
): Promise<void> {
  const { language = null, preserveVerificationId = true } = options;
  const { storageKeys, deleteAll, getData, setData, setString } =
    StorageManager;

  // Capture what we want to preserve BEFORE wiping storage.
  let savedVerificationId: unknown = null;
  if (preserveVerificationId) {
    try {
      savedVerificationId = await getData(storageKeys.FIREBASE_VERIFICATION_ID);
    } catch (error) {
      console.log('[cleanupSession] read verificationId failed:', error);
    }
  }

  // Reset the "recommended" tutorial flag — consistent with prior behavior.
  try {
    setString(storageKeys.IS_RECOMMENDED, 'false');
  } catch (error) {
    console.log('[cleanupSession] set IS_RECOMMENDED failed:', error);
  }

  // 1. Firebase Auth.
  try {
    if (auth.currentUser) {
      await signOut(auth);
    }
  } catch (error) {
    console.log('[cleanupSession] firebase signOut failed:', error);
  }

  // 2. Firestore / RTDB conversation listener.
  try {
    await stopConversationsListener();
  } catch (error) {
    console.log('[cleanupSession] stopConversationsListener failed:', error);
  }

  // 3. Pusher — disconnect all channels.
  try {
    await pusherService.disconnect();
  } catch (error) {
    console.log('[cleanupSession] pusher disconnect failed:', error);
  }

  // 4. RevenueCat — detach the appUserID so subscriptions don't bleed across
  //    accounts on shared devices. logOut on an anonymous user throws —
  //    swallow that case.
  try {
    await Purchases.logOut();
  } catch (error) {
    console.log('[cleanupSession] Purchases.logOut failed:', error);
  }

  // 5. Reset Zustand stores so cached counters / entitlements / settings are
  //    not visible to the next sign-in.
  try {
    usePremiumStore.getState().reset();
    useConversationStore.getState().reset();
    useUserStatsStore.getState().reset();
    useSettingsStore.getState().clearSettings();
  } catch (error) {
    console.log('[cleanupSession] store reset failed:', error);
  }

  // 6. MMKV — wipe everything.
  try {
    await deleteAll();
  } catch (error) {
    console.log('[cleanupSession] deleteAll failed:', error);
  }

  // 7. Restore preserved values.
  if (language) {
    try {
      await setData(storageKeys.LANGUAGE, language);
    } catch (error) {
      console.log('[cleanupSession] restore language failed:', error);
    }
  }
  if (preserveVerificationId && savedVerificationId) {
    try {
      await setData(storageKeys.FIREBASE_VERIFICATION_ID, savedVerificationId);
    } catch (error) {
      console.log('[cleanupSession] restore verificationId failed:', error);
    }
  }
}
