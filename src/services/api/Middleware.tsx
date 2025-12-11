import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';

import BaseUrl from './BaseUrl';
import { StorageManager } from '../storageManager'
import { setGlobalState } from '../context';
import { stopConversationsListener } from '../firebase';
import { navigationRef } from '../../navigation/RootNavigation';

const Api = axios.create({
    baseURL: BaseUrl,
    headers: {
        'Content-Type': 'application/json'
    }
});

Api.interceptors.request.use(async (config: any) => {
    config.headers.Authorization = `Bearer ${await StorageManager.getData(StorageManager.storageKeys.USER_TOKEN)}`
    return config;
})

Api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        if (error?.response?.status === 401 || error?.response?.status === 400) {
            const { getData, setData, deleteAll, storageKeys } = StorageManager
            let verificationId = await getData(storageKeys.FIREBASE_VERIFICATION_ID)
            await AsyncStorage.setItem('isRecommended', 'false');
            // await ApiServices.logout();
            // auth().signOut().catch();
            await deleteAll()
                .then(async () => {
                    setGlobalState({ currentUser: null })
                    // await setData(storageKeys.LANGUAGE, language);
                    await setData(storageKeys.FIREBASE_VERIFICATION_ID, verificationId);
                    await stopConversationsListener();
                    navigationRef.dispatch(
                        CommonActions.reset({
                            index: 1,
                            routes: [{ name: 'AuthWelcome' }],
                        }),
                    );
                })
                .catch(err => console.log({ err }));
        }
        return Promise.reject(error);
    }
);

// Api.interceptors.response.use(
//     (response) => {
//         return response;
//     },
//     async (error) => {
//         const originalRequest = error.config;
//         return Promise.reject(error);
//     })

export { Api }