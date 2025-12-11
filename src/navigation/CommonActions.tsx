import { useEffect } from 'react';
import { Api, ApiServices, StorageManager, getConversationsOnce, startConversationsListener, stopConversationsListener, useGlobalContext } from '../services';
import { CommonActions } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import _ from 'lodash';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CommonActionProps {
    navigation?: any,
    userId?: string
}

const CommonActionsFun = (props: CommonActionProps) => {
    const { updateCurrentUser, language, currentUser, updateConversations, updateConversationLoading } = useGlobalContext();
    const {
        navigation = {},
        userId = ''
    } = props
    const { setData, deleteAll, storageKeys, getData } = StorageManager;

    const handleLogout = async () => {
        await AsyncStorage.setItem('isRecommended', "false");
        await auth().signOut();
        await deleteAll();
        updateCurrentUser(null);
        await setData(storageKeys.LANGUAGE, language);
        await stopConversationsListener();
        navigation?.dispatch(
            CommonActions.reset({
                index: 1,
                routes: [
                    { name: 'AuthWelcome' },
                ],
            })
        );
    };

    const handleApiErrors = () => {
        Api.interceptors.response.use(
            (response) => response,
            async (error) => {
                if (error?.response?.status === 401 || error?.response?.status === 403) {
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
                        updateConversations(res)
                        updateConversationLoading(false)
                    }
                })

                getConversationsOnce(userId, async (snapshot: any) => {
                    if (snapshot) {
                        let conversationsData: any = snapshot.val() ?
                            _.orderBy(Object.values(snapshot.val()), ['convDetails.latestMessageCreatedAt'], ['desc'])
                            : []
                        updateConversations(conversationsData);
                        updateConversationLoading(false);
                        await setData(storageKeys.CONVERSATIONS, conversationsData)
                            .then(() => resolve(''))
                            .catch(() => resolve(''))
                    }
                    else {
                        resolve('')
                    }
                })

            })

        };


        const onChildAdded = (conversationId: string, conversationData: any) => {
            if (!conversationData) {
                return;
            }

            const convLastMessageCreatedAt = conversationData?.convDetails?.latestMessageCreatedAt;
            if (convLastMessageCreatedAt < appOpeningTime) {
                return;
            }

            getData(storageKeys.CONVERSATIONS).then(async (res: any) => {
                if (!res || res.length === 0) {
                    updateConversations([conversationData]);
                    await setData(storageKeys.CONVERSATIONS, [conversationData]);
                    return;
                }

                const existingConversationIndex = res.findIndex((element: any) => element.convDetails.id === conversationId);

                if (existingConversationIndex !== -1) {
                    res[existingConversationIndex] = conversationData;
                } else {
                    res.unshift(conversationData);
                }

                updateConversations(res);
                await setData(storageKeys.CONVERSATIONS, res);
            });
        };

        const onChildChanged = (conversationId: string, conversationData: any) => {
            if (!conversationData || conversationData?.convDetails?.participantsDeleteFlag?.[userId]?.deleteStatus === true) {
                return;
            }
            getData(storageKeys.CONVERSATIONS).then(async (res: any) => {
                if (!res || res.length === 0) {
                    updateConversations([conversationData]);
                    await setData(storageKeys.CONVERSATIONS, [conversationData]);
                    return;
                }

                const existingConversationIndex = res.findIndex((element: any) => element?.convDetails?.id === conversationId);

                if (existingConversationIndex !== -1) {
                    res[existingConversationIndex] = conversationData;
                } else {
                    res.unshift(conversationData);
                }
                updateConversations(res);
                await setData(storageKeys.CONVERSATIONS, res);
            });
        }

        const onChildRemoved = (conversationId: string) => {
            if (conversationId) {
                getData(storageKeys.CONVERSATIONS).then(async (res: any) => {
                    if (res && res?.length !== 0) {
                        const existingConversationIndex = res.findIndex((element: any) => element.convDetails.id === conversationId);
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
                startConversationsListener(userId, onChildAdded, onChildChanged, onChildRemoved);
            })
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