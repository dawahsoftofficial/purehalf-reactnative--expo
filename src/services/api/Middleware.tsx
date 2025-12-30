import { CommonActions } from '@react-navigation/native';
import axios from 'axios';

import { navigationRef } from '../../navigation/RootNavigation';
import { setGlobalState } from '../context';
import { stopConversationsListener } from '../firebase';
import { StorageManager } from '../storageManager';
import BaseUrl from './BaseUrl';

const Api = axios.create({
  baseURL: BaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

Api.interceptors.request.use(
  async (config: any) => {
    const token = await StorageManager.getData(
      StorageManager.storageKeys.USER_TOKEN
    );
    config.headers.Authorization = `Bearer ${token}`;

    // Log request details
    const requestInfo = {
      timestamp: new Date().toISOString(),
      method: config.method?.toUpperCase(),
      url: config.url,
      fullUrl: `${config.baseURL || ''}${config.url}`,
      headers: {
        ...config.headers,
        Authorization: config.headers.Authorization
          ? `Bearer ${token}`
          : 'No token',
      },
      data: config.data,
      params: config.params,
      hasData: !!config.data,
      dataSize: config.data ? JSON.stringify(config.data).length : 0,
    };

    console.log('[API Request]', JSON.stringify(requestInfo, null, 4));

    // Store request timestamp for response time calculation
    config.metadata = { startTime: Date.now() };

    return config;
  },
  (error: any) => {
    console.error('[API Request Error]', JSON.stringify(error, null, 4));
    return Promise.reject(error);
  }
);

Api.interceptors.response.use(
  (response: any) => {
    const requestDuration = response.config?.metadata?.startTime
      ? Date.now() - response.config.metadata.startTime
      : null;

    const responseInfo = {
      timestamp: new Date().toISOString(),
      method: response.config?.method?.toUpperCase(),
      url: response.config?.url,
      fullUrl: `${response.config?.baseURL || ''}${response.config?.url}`,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      dataSize: response.data ? JSON.stringify(response.data).length : 0,
      requestDuration: requestDuration ? `${requestDuration}ms` : null,
      hasData: !!response.data,
    };

    // console.log(
    //   '[API Response Success]',
    //   JSON.stringify(responseInfo, null, 4)
    // );

    return response;
  },
  async (error: any) => {
    const requestDuration = error?.config?.metadata?.startTime
      ? Date.now() - error.config.metadata.startTime
      : null;

    const errorInfo = {
      timestamp: new Date().toISOString(),
      method: error?.config?.method?.toUpperCase(),
      url: error?.config?.url,
      fullUrl: `${error?.config?.baseURL || ''}${error?.config?.url}`,
      requestData: error?.config?.data,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      errorMessage: error?.message,
      errorCode: error?.code,
      responseData: error?.response?.data,
      responseHeaders: error?.response?.headers,
      requestDuration: requestDuration ? `${requestDuration}ms` : null,
      hasResponse: !!error?.response,
      hasRequest: !!error?.config,
    };

    console.error('[API Response Error]', JSON.stringify(errorInfo, null, 4));

    // Handle authentication errors
    if (error?.response?.status === 401 || error?.response?.status === 400) {
      const { getData, setData, deleteAll, storageKeys } = StorageManager;
      const verificationId = await getData(
        storageKeys.FIREBASE_VERIFICATION_ID
      );
      StorageManager.setString(storageKeys.IS_RECOMMENDED, 'false');
      // await ApiServices.logout();
      // auth().signOut().catch();
      await deleteAll()
        .then(async () => {
          setGlobalState({ currentUser: null });
          // await setData(storageKeys.LANGUAGE, language);
          await setData(storageKeys.FIREBASE_VERIFICATION_ID, verificationId);
          await stopConversationsListener();
          navigationRef.dispatch(
            CommonActions.reset({
              index: 1,
              routes: [{ name: 'AuthWelcome' }],
            })
          );
          // console.log(
          //   '[API Response Error] User logged out and navigated to AuthWelcome'
          // );
        })
        .catch((err) =>
          console.error(
            '[API Response Error] Error during logout cleanup:',
            err
          )
        );
    }
    return Promise.reject(error);
  }
);

export { Api };
