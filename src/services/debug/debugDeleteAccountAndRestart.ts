import { Alert } from 'react-native';
import RNRestart from 'react-native-restart';

import ApiServices from '../api/Services';
import { Firebase } from '../firebase';
import { StorageManager } from '../storageManager';

const deleteAccountAndRestart = async (): Promise<void> => {
  try {
    await ApiServices.debugForceDeleteAccount();
  } catch (error) {
    console.log('debug: force-delete-account failed =>', error);
  }

  try {
    await StorageManager.deleteAll();
  } catch (error) {
    console.log('debug: clearing storage failed =>', error);
  }

  try {
    await Firebase.debugSignOut();
  } catch (error) {
    console.log('debug: firebase signOut failed =>', error);
  }

  RNRestart.restart();
};

export const confirmDebugDeleteAccountAndRestart = (): void => {
  Alert.alert(
    'Delete account?',
    'This permanently deletes your account and restarts the app. This cannot be undone.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteAccountAndRestart();
        },
      },
    ]
  );
};
