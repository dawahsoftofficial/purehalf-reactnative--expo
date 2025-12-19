import AsyncStorage from '@react-native-async-storage/async-storage';

class GStorageManager {
  storageKeys = {
    LANGUAGE: 'LANGUAGE',
    USER: 'USER',
    IS_LOGGED_IN: 'IS_LOGGED_IN',
    USER_TOKEN: 'USER_TOKEN',
    FCM_TOKEN: 'FCM_TOKEN',
    ATTRIBUTE: 'ATTRIBUTE',
    PROFILE_DETAIL_LOCAL: 'PROFILE_DETAIL_LOCAL',
    CONVERSATIONS: 'CONVERSATIONS',
    OPENED_CONVERSATION_ID: 'OPENED_CONVERSATION_ID',
    VERIFICATION_CODE_TIMER: 'VERIFICATION_CODE_TIMER',
    FIREBASE_VERIFICATION_ID: 'FIREBASE_VERIFICATION_ID',
  };

  deleteAll = () => {
    return new Promise(async (resolve, reject) => {
      await AsyncStorage.clear()
        .then(() => resolve(''))
        .catch((error) => {
          console.log(
            'error while deleting all data from AsyncStorage =>',
            error
          );
          reject(error);
        });
    });
  };
  deleteMultipleItems = (keys: any) => {
    return new Promise(async (resolve, reject) => {
      await AsyncStorage.multiRemove(keys)
        .then(() => resolve(''))
        .catch((error) => {
          console.log(
            'error while deleting multi data from AsyncStorage =>',
            error
          );
          reject(error);
        });
    });
  };

  deleteData = (key: any) => {
    return new Promise(async (resolve, reject) => {
      await AsyncStorage.removeItem(key)
        .then(() => resolve(''))
        .catch((error) => {
          console.log('error while deleting data from AsyncStorage =>', error);
          reject(error);
        });
    });
  };

  getData = (key: any) => {
    return new Promise(async (resolve, reject) => {
      await AsyncStorage.getItem(key)
        .then((data) => {
          if (data != null) resolve(JSON.parse(data));
          else resolve(null);
        })
        .catch((error) => {
          console.log('error while reading data from AsyncStorage =>', error);
          reject(error);
        });
    });
  };

  setData = async (key: any, value: any) => {
    return new Promise(async (resolve, reject) => {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue)
        .then(() => resolve(''))
        .catch((error) => {
          console.log('Error while saving data in AsyncStorage =>', error);
          reject(error);
        });
    });
  };
}

const StorageManager = new GStorageManager();
export default StorageManager;
