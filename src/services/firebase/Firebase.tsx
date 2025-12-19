import { getApp } from '@react-native-firebase/app';
import { getAuth, signInWithPhoneNumber } from '@react-native-firebase/auth';
import {
  equalTo,
  get,
  getDatabase,
  orderByChild,
  query,
  ref,
  remove,
  set,
  startAt,
  update,
} from '@react-native-firebase/database';
import { getFunctions } from '@react-native-firebase/functions';
import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  requestPermission,
} from '@react-native-firebase/messaging';
import {
  GoogleSignin,
  type SignInResponse,
} from '@react-native-google-signin/google-signin';

import { flashErrorMessage } from '../FlashMessages';
import { StorageManager } from '../storageManager';
import conversationsPath from './FirebaseConfig';
const { storageKeys, setData } = StorageManager;

const firebaseApp = getApp();
const auth = getAuth(firebaseApp);
const database = getDatabase(firebaseApp);
const functions = getFunctions(firebaseApp);
const messaging = getMessaging(firebaseApp);

class GFirebase {
  googleSignIn = () => {
    return new Promise<SignInResponse>((resolve, reject) => {
      GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      GoogleSignin.signIn()
        .then((res: SignInResponse) => {
          resolve(res);
        })
        .catch((error: Error) => {
          console.log({ error });
          flashErrorMessage(error?.message || 'An error occurred', 4);
          reject(error);
        });
    });
  };

  sendVerificationCode = (phoneNumber: any, forceResend = false) => {
    return new Promise((resolve, reject) => {
      signInWithPhoneNumber(auth, phoneNumber, undefined, forceResend)
        .then((confirmResult: any) => {
          resolve(confirmResult);
        })
        .catch((error: any) => {
          console.log('Error while sending verification code =>', error);
          if (error?.code === 'missing-phone-number') {
            flashErrorMessage('Missing Phone Number', 4);
          } else if (error?.code === 'auth/invalid-phone-number') {
            flashErrorMessage('Invalid Phone Number', 4);
          } else if (error?.code === 'auth/quota-exceeded') {
            flashErrorMessage('SMS quota exceeded.Please try again later', 4);
          } else if (error?.code === 'auth/user-disabled') {
            flashErrorMessage(
              'Phone Number disabled. Please contact support',
              4
            );
          } else {
            console.log('Unexpected Error.' + error?.code);
            flashErrorMessage(
              'Unexpected Error Occured. Please contact support',
              4
            );
          }
          reject('');
        });
    });
  };

  handleIsLoggedIn = async (isLoggedIn: any) => {
    return new Promise((resolve, reject) => {
      setData(storageKeys.IS_LOGGED_IN, isLoggedIn)
        .then(() => {
          resolve('');
        })
        .catch((error: any) => {
          console.log('error while saving isLoggedIn =>', error);
          reject('');
        });
    });
  };

  matchLoginVerificationCode = (phoneNumberFirebaseRes: any, value: any) => {
    return new Promise(async (resolve, reject) => {
      const user: any = auth.currentUser;
      if (user && user.uid) {
        this.handleIsLoggedIn(true)
          .then(() => {
            resolve('');
          })
          .catch(() => reject(''));
      } else {
        phoneNumberFirebaseRes
          .confirm(value)
          .then(async () => {
            this.handleIsLoggedIn(true)
              .then(() => {
                resolve('');
              })
              .catch(() => reject(''));
          })
          .catch((error: any) => {
            switch (error.code) {
              case 'auth/invalid-verification-code':
                flashErrorMessage('Invalid code');
                break;
              default:
                flashErrorMessage(error.message);
            }
            reject('');
            console.log(
              'Error while matching firebase verification code =>',
              error
            );
          });
      }
    });
  };

  createChat = (conversationData: any) => {
    return new Promise((resolve, reject) => {
      const conversationId = conversationData?.id;
      const conversationRef = ref(
        database,
        `${conversationsPath}/${conversationId}`
      );
      set(conversationRef, {
        convDetails: conversationData,
        messages: [],
      })
        .then(() => {
          resolve('');
        })
        .catch((error) => {
          console.log('error while creating conversation =>', error);
          reject('');
        });
    });
  };

  sendMessage = (messageData: any, conversationData: any) => {
    return new Promise((resolve, reject) => {
      delete messageData?.status;
      const {
        id,
        participantsDeleteFlag,
        participantsData,
        unReadCount,
        latestMessage,
        latestMessageCreatedAt,
      } = conversationData;
      const messageId = messageData?.id;
      const messagesRef = ref(
        database,
        `/${conversationsPath}/${id}/messages/${messageId}`
      );
      set(messagesRef, { ...messageData })
        .then(() => {
          const convDetailsRef = ref(
            database,
            `/${conversationsPath}/${id}/convDetails`
          );
          update(convDetailsRef, {
            participantsDeleteFlag: participantsDeleteFlag,
            participantsData: participantsData,
            unReadCount: unReadCount,
            latestMessage: latestMessage,
            latestMessageCreatedAt: latestMessageCreatedAt,
          })
            .then((res) => {
              resolve(res);
            })
            .catch((error) => {
              reject('');
              console.log('error while updating conversation data =>', error);
            });
        })
        .catch((error) => {
          reject('');
          console.log('error while pushing message to firebase chat =>', error);
        });
    });
  };

  getFcmToken = () => {
    return new Promise(async (resolve, reject) => {
      const authStatus = await requestPermission(messaging);
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;
      if (enabled) {
        getToken(messaging)
          .then((token) => resolve(token))
          .catch((err) => {
            console.log('Error while getting device token =>', err);
            reject('');
          });
      }
    });
  };

  sendMessageNotification = async (token: any, data: any) => {
    const sendNotification = functions.httpsCallable('sendNotification');
    try {
      await sendNotification({
        token: token,
        data: {
          title: data?.title,
          body: data?.body,
          pressAction: data?.pressAction,
          data: JSON.stringify(data?.data),
        },
      });
    } catch (error) {
      console.log('error while sending notificaiton =>', error);
    }
  };

  deleteChat = (id: any) => {
    return new Promise((resolve, reject) => {
      const chatRef = ref(database, `/chats/${id}`);
      remove(chatRef)
        .then(() => {
          resolve('');
        })
        .catch((error) => {
          console.log('error while deleting chat =>', error);
          flashErrorMessage();
          reject('');
        });
    });
  };

  matchOTP = (phoneNumberFirebaseRes: any, code: any) => {
    return new Promise((resolve, reject) => {
      phoneNumberFirebaseRes
        .confirm(code)
        .then(async () => {
          resolve('');
        })
        .catch((error: any) => {
          switch (error.code) {
            case 'auth/invalid-verification-code':
              flashErrorMessage('Invalid code');
              break;
            default:
              flashErrorMessage(error.message);
          }
          reject('');
          console.log(
            'Error while matching firebase verification code =>',
            error
          );
        });
    });
  };

  updateConvUnReadCount = (convId: any, userId: any) => {
    return new Promise((resolve, reject) => {
      const unReadCountRef = ref(
        database,
        `/${conversationsPath}/${convId}/convDetails/unReadCount`
      );
      update(unReadCountRef, { [userId]: 0 })
        .then(() => resolve(''))
        .catch((error: any) => {
          console.log(
            'error while updating unreadCount of conversation =>',
            error
          );
          reject('');
        });
    });
  };

  updateMessagesReadBy = (
    filteredMessages: any,
    currentUserId: any,
    conversationId: any
  ) => {
    const updates: any = {};
    filteredMessages.forEach((message: any) => {
      const messageId = message?.id;
      updates[
        `/${conversationsPath}/${conversationId}/messages/${messageId}/readBy/${currentUserId}`
      ] = message?.readBy[currentUserId];
    });
    const rootRef = ref(database);
    update(rootRef, updates).catch((error) => {
      console.log('error while updating messages readBy =>', error);
    });
  };

  clearChat = (conversationId: any, lastMessageId: any, currentUserId: any) => {
    return new Promise((resolve, reject) => {
      const messageRef = ref(
        database,
        `/${conversationsPath}/${conversationId}/messages/${lastMessageId}/deletedBy`
      );
      update(messageRef, {
        [currentUserId]: true,
      })
        .then(() => {
          resolve('');
        })
        .catch((error) => {
          console.log('error while clearing chat =>', error);
          reject('');
        });
    });
  };

  updateMessageDeletedBy = (
    conversationId: any,
    lastMessageId: any,
    currentUserId: any
  ) => {
    return new Promise((resolve, reject) => {
      const conversationRef = ref(
        database,
        `/${conversationsPath}/${conversationId}/convDetails/participantsDeleteFlag`
      );
      const messageRef = ref(
        database,
        `/${conversationsPath}/${conversationId}/messages/${lastMessageId}/deletedBy`
      );
      update(conversationRef, {
        [currentUserId]: {
          deleteStatus: true,
        },
      })
        .then(() => {
          update(messageRef, {
            [currentUserId]: true,
          }).catch((error) => {
            console.log('error while updating message deleted by =>', error);
            reject('');
          });
          resolve('');
        })
        .catch((error) => {
          console.log('error while updating conversation deleted by =>', error);
          flashErrorMessage();
          reject('');
        });
    });
  };

  getSingleConversation = (currentUserId: any, otherUserId: any) => {
    return new Promise((resolve, reject) => {
      const conversationsRef = ref(database, conversationsPath);
      const conversationsQuery = query(
        conversationsRef,
        orderByChild(
          `convDetails/participantsDeleteFlag/${currentUserId}/deleteStatus`
        ),
        equalTo(true)
      );
      get(conversationsQuery)
        .then((snapshot: any) => {
          const data = snapshot.val();
          if (data) {
            const filteredConversations = Object.values(data).filter(
              (conversation: any) => {
                const participantKeys = Object.keys(
                  conversation.convDetails.participantsDeleteFlag
                );
                return (
                  participantKeys.includes(JSON.stringify(currentUserId)) &&
                  participantKeys.includes(JSON.stringify(otherUserId))
                );
              }
            );
            resolve(filteredConversations);
          } else {
            resolve([]);
          }
        })
        .catch(() => reject(''));
    });
  };

  blockUnBlockConv = (conversationId: any, userId: any, blockUser: any) => {
    return new Promise((resolve, reject) => {
      const conversationRef = ref(
        database,
        `/${conversationsPath}/${conversationId}/convDetails/participantsBlockFlag`
      );
      update(
        conversationRef,
        blockUser
          ? {
              [userId]: {
                blockStatus: true,
              },
            }
          : {
              [userId]: { blockStatus: false },
            }
      )
        .then(() => {
          resolve('');
        })
        .catch((error) => {
          console.log('error while blocking user =>', error);
          flashErrorMessage();
          reject('');
        });
    });
  };

  getNoOfChats = (userId: number, conversationId: string) => {
    const todayTimestamp = new Date().setHours(0, 0, 0, 0);
    return new Promise((resolve, reject) => {
      const conversationsRef = ref(database, conversationsPath);
      const conversationsQuery = query(
        conversationsRef,
        orderByChild('convDetails/createdAt'),
        startAt(todayTimestamp)
      );
      get(conversationsQuery)
        .then((snapshot: any) => {
          let numberOfChats: number = 0;
          snapshot.forEach((childSnapshot: any) => {
            const chat = childSnapshot.val() as any;
            if (
              chat.convDetails.createdBy === userId &&
              chat.convDetails.participantsDeleteFlag[userId]?.deleteStatus ===
                false &&
              chat?.convDetails?.id !== conversationId
            ) {
              numberOfChats++;
            }
          });
          resolve(numberOfChats);
        })
        .catch((error) => {
          console.error('Error reading data: ', error);
          flashErrorMessage();
          reject('');
        });
    });
  };
}

const FirebaseServices = new GFirebase();
export default FirebaseServices;
