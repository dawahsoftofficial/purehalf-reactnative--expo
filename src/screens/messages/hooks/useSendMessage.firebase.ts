import moment from 'moment';

import { ApiServices, Firebase, getTimeStamp } from '../../../services';
import { StorageManager } from '../../../services/storageManager';
import { containsRestrictedWord } from '../SingleChat.utils';

type UseSendMessageParams = {
  currentUser: any;
  otherUserData: any;

  conversationData: any;
  setConversationData: (v: any) => void;

  messages: any[];
  setMessages: (v: any) => void;

  setConversationId: (id: string) => void;

  isBlockedYou: boolean;
  isBlockedByYou: boolean;

  setInputMessage: (v: string) => void;

  updateCurrentUser: (v: any) => void;
  setData: (key: any, value: any) => Promise<unknown>;

  storageKeys: any;

  navigation: any;
  forceUpdate: () => void;
};

export function useSendMessage({
  currentUser,
  otherUserData,

  conversationData,
  setConversationData,

  messages,
  setMessages,

  setConversationId,

  isBlockedYou,
  isBlockedByYou,

  setInputMessage,

  updateCurrentUser,
  setData,
  storageKeys,

  navigation,
  forceUpdate,
}: UseSendMessageParams) {
  const onMessageSendingFailed = (msgs: any[]) => {
    const next = [...msgs];
    if (next[0]) next[0] = { ...next[0], status: 'failed' };
    setMessages(next);
    forceUpdate();
  };

  const sendMessageToFirebase = (
    messageData: any,
    convData: any,
    msgs: any[]
  ) => {
    Firebase.sendMessage(messageData, convData)
      .then(() => {
        const next = [...msgs];
        if (next[0]) next[0] = { ...next[0], status: 'sent' };

        setMessages(next);
        forceUpdate();

        const data = {
          title: currentUser?.full_name,
          body: messageData?.message,
          pressAction: 'openChat',
          data: {
            user: {
              image: currentUser?.media?.primary_image,
              name: currentUser?.full_name,
              id: currentUser?.id,
            },
            conversationId: convData?.id,
            message: messageData,
          },
        };

        const token = otherUserData?.token;
        Firebase.sendMessageNotification(token, data);
      })
      .catch(() => onMessageSendingFailed(msgs));
  };

  const isPremiumUser = () => {
    return new Promise<'premiumUser'>((resolve) => {
      const now = moment();
      const membershipExpiry = currentUser?.membership_expiry;

      if (membershipExpiry !== null && moment(membershipExpiry).isAfter(now)) {
        resolve('premiumUser');
        return;
      }

      ApiServices.getCurrentUserDetail()
        .then((res: any) => {
          const latestExpiry = res?.membership_expiry;
          updateCurrentUser(res);

          if (latestExpiry === null || moment(latestExpiry).isBefore(now)) {
            navigation.navigate('ProFeaturesPromotion', {
              navigateTo: 'goBack',
            });
          } else {
            resolve('premiumUser');
          }
        })
        .catch(() => {});
    });
  };

  const sendMessage = async (inputMessage: string) => {
    // Clear input instantly for UI
    setInputMessage('');

    const timestamp = await getTimeStamp();

    const messageData: any = {
      createdAt: timestamp,
      id: `id-${timestamp}`,
      sender: currentUser?.id,
      message: inputMessage,
      status: 'sending',
      readBy: {
        [currentUser?.id]: { seen: true, seenAt: timestamp },
        [otherUserData?.id]: { seen: false, seenAt: null },
      },
    };

    // mark blocked participants (if user is blocked)
    if (isBlockedYou) {
      messageData.blockedParticipants = {
        ...messageData?.blockedParticipants,
        [currentUser?.id]: true,
      };
    }

    // report chat if contains restricted word
    if (
      !currentUser?.is_chat_reported &&
      containsRestrictedWord(inputMessage)
    ) {
      ApiServices.updateUserInfo({ is_chat_reported: true })
        .then(async (res: any) => {
          const nextUser = {
            ...currentUser,
            is_chat_reported: res?.is_chat_reported,
          };
          await setData(storageKeys.USER, nextUser);
          updateCurrentUser(nextUser);
        })
        .catch(() => {});
    }

    // new conversation
    if (!conversationData || conversationData?.length === 0) {
      const nextMsgs = [messageData, ...messages];
      setMessages(nextMsgs);

      const conversation = {
        participantsDeleteFlag: {
          [currentUser?.id]: { deleteStatus: false },
          [otherUserData?.id]: { deleteStatus: false },
        },
        deletedAt: [],
        createdBy: currentUser?.id,
        participantsBlockFlag: {
          [currentUser?.id]: { blockStatus: false },
          [otherUserData?.id]: { blockStatus: false },
        },
        unReadCount: {
          [currentUser?.id]: 0,
          [otherUserData?.id]: 1,
        },
        participantsData: [
          {
            image: currentUser?.media?.primary_image,
            name: currentUser?.full_name,
            id: currentUser?.id,
          },
          {
            image: otherUserData?.image,
            name: otherUserData?.name,
            id: otherUserData?.id,
          },
        ],
        createdAt: timestamp,
        id: `id-${timestamp}`,
        latestMessage: inputMessage,
        latestMessageCreatedAt: messageData?.createdAt,
      };

      setConversationId(conversation?.id);
      setConversationData(conversation);

      Firebase.createChat(conversation).then(() => {
        sendMessageToFirebase(messageData, conversation, nextMsgs);
      });
    } else {
      // existing conversation
      const nextMsgs = [messageData, ...messages];
      setMessages(nextMsgs);

      const nextConversation = {
        ...conversationData,
        participantsDeleteFlag: {
          ...(conversationData?.participantsDeleteFlag || {}),
          ...(currentUser?.id !== 'guardian' && {
            [currentUser?.id]: { deleteStatus: false },
          }),
          [otherUserData?.id]: { deleteStatus: false },
        },
        participantsData: [
          ...(currentUser?.id !== 'guardian' && currentUser?.id
            ? [
                {
                  image: currentUser?.media?.primary_image,
                  name: currentUser?.full_name,
                  id: currentUser?.id,
                },
              ]
            : []),
          ...(otherUserData?.id
            ? [
                {
                  image: otherUserData?.image,
                  name: otherUserData?.name,
                  id: otherUserData?.id,
                },
              ]
            : []),
          ...(conversationData.participantsData || []).filter(
            (p: any) => p.id !== currentUser?.id && p.id !== otherUserData?.id
          ),
        ],
        unReadCount: {
          ...conversationData.unReadCount,
          [currentUser?.id]: 0,
          [otherUserData?.id]: isBlockedYou
            ? conversationData?.unReadCount?.[otherUserData?.id]
            : (conversationData?.unReadCount?.[otherUserData?.id] || 0) + 1,
        },
        latestMessage: isBlockedYou
          ? conversationData?.lastestMessage
          : inputMessage,
        latestMessageCreatedAt: isBlockedYou
          ? conversationData?.latestMessageCreatedAt
          : messageData?.createdAt,
      };

      setConversationData(nextConversation);
      sendMessageToFirebase(messageData, nextConversation, nextMsgs);
    }

    // throttle API push (your existing logic)
    try {
      const lastMessageTimestamp = StorageManager.getString(
        'lastMessageTimestamp'
      );

      const wordsArray = inputMessage.split(' ');
      const firstFiveWords = wordsArray.slice(0, 5);
      const resultWords = firstFiveWords.join(' ');

      if (lastMessageTimestamp !== null) {
        const lastMessageTime = new Date(parseInt(lastMessageTimestamp!, 10));
        const currentTime = new Date();
        const timeDifference =
          (currentTime.getTime() - lastMessageTime.getTime()) / (1000 * 60); // minutes

        if (timeDifference > 1) {
          await ApiServices.snedMessageNotification({
            other_user_id: otherUserData?.id,
            other_username: currentUser?.full_name,
            country: 'Pakistan',
            message_first_five_words: resultWords,
          });

          StorageManager.setString(
            'lastMessageTimestamp',
            new Date().getTime().toString()
          );
        }
      } else {
        await ApiServices.snedMessageNotification({
          other_user_id: otherUserData?.id,
          other_username: otherUserData?.name,
          country: 'Pakistan',
          message_first_five_words: resultWords,
        });

        StorageManager.setString(
          'lastMessageTimestamp',
          new Date().getTime().toString()
        );
      }
    } catch (error) {
      // keep silent, do not break sending
    }
  };

  const onSendPress = async (inputMessage: string) => {
    if (isBlockedByYou) {
      return { type: 'blockedByYou' as const };
    }

    const needsPremiumGate =
      (currentUser?.gender === 'male' &&
        (currentUser?.membership_status === 0 ||
          currentUser?.membership_status === null)) ||
      currentUser?.membership_status === null;

    if (needsPremiumGate) {
      await isPremiumUser();
      await sendMessage(inputMessage);
      return { type: 'sent' as const };
    }

    await sendMessage(inputMessage);
    return { type: 'sent' as const };
  };

  return { onSendPress };
}
