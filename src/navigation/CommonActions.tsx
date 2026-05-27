import { CommonActions } from '@react-navigation/native';
import _ from 'lodash';
import { useEffect } from 'react';

import {
  Api,
  cleanupSession,
  getConversationsOnce,
  startConversationsListener,
  stopConversationsListener,
  StorageManager,
  useGlobalContext,
} from '../services';

interface CommonActionProps {
  navigation?: any;
  userId?: string;
}

const CommonActionsFun = (props: CommonActionProps) => {
  const {
    updateCurrentUser,
    language,
    updateConversations,
    updateConversationLoading,
  } = useGlobalContext();
  const { navigation = {}, userId = '' } = props;
  const { setData, storageKeys, getData } = StorageManager;

  const handleLogout = async () => {
    // Full session teardown — see services/session.ts. The helper handles
    // Firebase signOut, conversations listener, Pusher, RevenueCat,
    // Zustand stores, MMKV wipe, and preserving language + verification id.
    await cleanupSession({ language });

    // Context + navigation are React-scoped, so the helper can't touch them.
    updateCurrentUser(null);
    updateConversations([]);

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
    const appOpeningTime = Date.now();
    const getConversations = async () => {
      return new Promise(async (resolve) => {
        await getData(storageKeys.CONVERSATIONS).then((res) => {
          if (res) {
            updateConversations(res);
            updateConversationLoading(false);
          }
        });

        getConversationsOnce(userId, async (snapshot: any) => {
          if (snapshot) {
            const conversationsData: any = snapshot.val()
              ? _.orderBy(
                  Object.values(snapshot.val()),
                  ['convDetails.latestMessageCreatedAt'],
                  ['desc']
                )
              : [];
            updateConversations(conversationsData);
            updateConversationLoading(false);
            await setData(storageKeys.CONVERSATIONS, conversationsData)
              .then(() => resolve(''))
              .catch(() => resolve(''));
          } else {
            resolve('');
          }
        });
      });
    };

    const onChildAdded = (
      conversationId: string | null,
      conversationData: any
    ) => {
      if (!conversationData || !conversationId) {
        return;
      }

      const convLastMessageCreatedAt =
        conversationData?.convDetails?.latestMessageCreatedAt;
      if (convLastMessageCreatedAt < appOpeningTime) {
        return;
      }

      getData(storageKeys.CONVERSATIONS).then(async (res: any) => {
        if (!res || res.length === 0) {
          updateConversations([conversationData]);
          await setData(storageKeys.CONVERSATIONS, [conversationData]);
          return;
        }

        const existingConversationIndex = res.findIndex(
          (element: any) => element.convDetails.id === conversationId
        );

        if (existingConversationIndex !== -1) {
          res[existingConversationIndex] = conversationData;
        } else {
          res.unshift(conversationData);
        }

        updateConversations(res);
        await setData(storageKeys.CONVERSATIONS, res);
      });
    };

    const onChildChanged = (
      conversationId: string | null,
      conversationData: any
    ) => {
      if (
        !conversationData ||
        !conversationId ||
        conversationData?.convDetails?.participantsDeleteFlag?.[userId]
          ?.deleteStatus === true
      ) {
        return;
      }
      getData(storageKeys.CONVERSATIONS).then(async (res: any) => {
        if (!res || res.length === 0) {
          updateConversations([conversationData]);
          await setData(storageKeys.CONVERSATIONS, [conversationData]);
          return;
        }

        const existingConversationIndex = res.findIndex(
          (element: any) => element?.convDetails?.id === conversationId
        );

        if (existingConversationIndex !== -1) {
          res[existingConversationIndex] = conversationData;
        } else {
          res.unshift(conversationData);
        }
        updateConversations(res);
        await setData(storageKeys.CONVERSATIONS, res);
      });
    };

    const onChildRemoved = (conversationId: string | null) => {
      if (conversationId) {
        getData(storageKeys.CONVERSATIONS).then(async (res: any) => {
          if (res && res?.length !== 0) {
            const existingConversationIndex = res.findIndex(
              (element: any) => element.convDetails.id === conversationId
            );
            if (existingConversationIndex !== -1) {
              res.splice(existingConversationIndex, 1);
              updateConversations(res);
              await setData(storageKeys.CONVERSATIONS, res);
            }
          }
        });
      }
    };

    const startConversationsListeners = async () => {
      getConversations().then(() => {
        startConversationsListener({
          userId,
          onChildAdded,
          onChildChanged,
          onChildRemoved,
        });
      });
    };

    startConversationsListeners();
    handleApiErrors();
    return () => {
      stopConversationsListener();
    };
  }, []);

  return null;
};

export default CommonActionsFun;
