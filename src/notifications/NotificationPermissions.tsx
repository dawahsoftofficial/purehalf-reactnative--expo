import { getApp } from '@react-native-firebase/app';
import {
  AuthorizationStatus,
  getMessaging,
  requestPermission,
} from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';

const firebaseApp = getApp();
const messaging = getMessaging(firebaseApp);

/**
 * Requests notification permissions for both iOS and Android
 * @returns Promise<'granted' | 'denied' | 'error'>
 */
const requestNotificationPermission = async (): Promise<
  'granted' | 'denied' | 'error'
> => {
  try {
    if (Platform.OS === 'ios') {
      // iOS: Use Firebase messaging requestPermission
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
          return 'denied';
        } catch (error) {
          console.error(
            'Error requesting Android notification permission:',
            error
          );
          return 'error';
        }
      }

      // Android 12 and below: notifications are granted by default
      return 'granted';
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'error';
  }
};

export default requestNotificationPermission;
