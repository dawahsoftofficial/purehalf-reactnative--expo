import { CommonActions } from '@react-navigation/native';
import { useEffect } from 'react';

import { Api, cleanupSession, useGlobalContext } from '../services';

interface CommonActionProps {
  navigation?: any;
  userId?: string;
}

const CommonActionsFun = (props: CommonActionProps) => {
  const { updateCurrentUser, language } = useGlobalContext();
  const { navigation = {} } = props;

  const handleLogout = async () => {
    // Full session teardown — see services/session.ts. The helper handles
    // Firebase signOut, Pusher, RevenueCat, Zustand stores, MMKV wipe, and
    // preserving language + verification id.
    await cleanupSession({ language });

    // Context + navigation are React-scoped, so the helper can't touch them.
    updateCurrentUser(null);

    navigation?.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [{ name: 'AuthWelcome' }],
      })
    );
  };

  const handleApiErrors = () => {
    Api.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Only treat 401 as authentication error
        // 403 can be rate limiting or business logic errors (e.g., "Wait for reply")
        if (error?.response?.status === 401) {
          handleLogout();
        }
        return Promise.reject(error);
      }
    );
  };

  useEffect(() => {
    handleApiErrors();
  }, []);

  return null;
};

export default CommonActionsFun;
