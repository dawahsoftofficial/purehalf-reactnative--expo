import notifee, {
  AuthorizationStatus as NotifeeAuthorizationStatus,
} from '@notifee/react-native';
import { getApp } from '@react-native-firebase/app';
import {
  AuthorizationStatus,
  getMessaging,
  hasPermission,
  requestPermission,
} from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';

const firebaseApp = getApp();
const messaging = getMessaging(firebaseApp);

export type NotificationPermissionStatus =
  | 'granted'
  | 'denied'
  | 'blocked'
  | 'error';

const isAndroid13OrNewer = () =>
  Platform.OS === 'android' &&
  typeof Platform.Version === 'number' &&
  Platform.Version >= 33;

/**
 * Reads the app-level notification switch, including users who disabled
 * notifications later from the device settings.
 *
 * Android 13 reports both a first-time request and a blocked permission as
 * DENIED, so that distinction is finalized when the permission is requested.
 */
export const getNotificationPermissionStatus =
  async (): Promise<NotificationPermissionStatus> => {
    try {
      const settings = await notifee.getNotificationSettings();

      if (
        settings.authorizationStatus ===
          NotifeeAuthorizationStatus.AUTHORIZED ||
        settings.authorizationStatus === NotifeeAuthorizationStatus.PROVISIONAL
      ) {
        return 'granted';
      }

      if (settings.authorizationStatus === NotifeeAuthorizationStatus.DENIED) {
        // iOS never presents the prompt again after a denial. On Android 12 and
        // below there is no runtime notification permission, so a disabled app
        // switch can only be restored from Settings.
        return Platform.OS === 'ios' || !isAndroid13OrNewer()
          ? 'blocked'
          : 'denied';
      }

      return 'denied';
    } catch (error) {
      console.error('Error checking notification permission:', error);
      return 'error';
    }
  };

export const openNotificationSettings = () =>
  notifee.openNotificationSettings();

/**
 * Requests notification permissions for both iOS and Android
 * @returns Whether permission is granted, requestable, blocked, or unavailable
 */
const requestNotificationPermission =
  async (): Promise<NotificationPermissionStatus> => {
    try {
      if (Platform.OS === 'ios') {
        // M16 fix: don't prompt if iOS has already authorized — App.tsx fires
        // this on every cold start. If status is anything other than NOT_DETERMINED
        // we already know the user's answer.
        const existing = await hasPermission(messaging);
        if (
          existing === AuthorizationStatus.AUTHORIZED ||
          existing === AuthorizationStatus.PROVISIONAL
        ) {
          return 'granted';
        }
        if (existing === AuthorizationStatus.DENIED) {
          return 'blocked';
        }

        // Only NOT_DETERMINED reaches here — safe to show the system prompt.
        const authStatus = await requestPermission(messaging);
        const enabled =
          authStatus === AuthorizationStatus.AUTHORIZED ||
          authStatus === AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          return 'granted';
        }
        return 'denied';
      } else {
        // Android: Use PermissionsAndroid for Android 13+ (API 33+)
        // For Android 12 and below, notifications are granted by default
        const androidVersion = Platform.Version;
        if (typeof androidVersion === 'number' && androidVersion >= 33) {
          const granted = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );

          if (granted) {
            return 'granted';
          }

          try {
            const status = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
            );

            if (status === PermissionsAndroid.RESULTS.GRANTED) {
              return 'granted';
            }
            if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
              return 'blocked';
            }
            return 'denied';
          } catch (error) {
            console.error(
              'Error requesting Android notification permission:',
              error
            );
            return 'error';
          }
        }

        // Android 12 and below have no runtime prompt, but the user can still
        // disable the app-level notification switch in device settings.
        return getNotificationPermissionStatus();
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'error';
    }
  };

export default requestNotificationPermission;
