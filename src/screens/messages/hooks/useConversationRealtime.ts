import { getApp } from '@react-native-firebase/app';
import {
  getDatabase,
  onChildAdded,
  onChildChanged,
  orderByChild,
  query,
  ref,
  startAt,
} from '@react-native-firebase/database';
import _ from 'lodash';
import { useEffect } from 'react';

import conversationsPath from '@/services/firebase/FirebaseConfig';

type Params = {
  conversationId: string;
  chatOpenTimeStamp: number | null;

  currentUserId: any;
  otherUserId: any;

  conversationData: any;

  setMessages: (updater: any) => void;
  messagesRef: any;

  setConversationData: (updater: any) => void;
  setIsBlockedYou: (val: boolean) => void;
  setIsBlockedByYou: (val: boolean) => void;

  setOpenedConversation: (id: any) => Promise<unknown>;
  clearOpenedConversation: () => Promise<unknown>;

  handleReadBy: (
    convDetails: any,
    messages: any,
    fromNewMessage?: boolean
  ) => Promise<void>;

  forceUpdate: () => void;
};

const firebaseApp = getApp();
const database = getDatabase(firebaseApp);

export const useConversationRealtime = ({
  conversationId,
  chatOpenTimeStamp,
  currentUserId,
  otherUserId,
  conversationData,

  setMessages,
  messagesRef,

  setConversationData,
  setIsBlockedYou,
  setIsBlockedByYou,

  setOpenedConversation,
  clearOpenedConversation,

  handleReadBy,
  forceUpdate,
}: Params) => {
  useEffect(() => {
    if (!conversationId || conversationId.length === 0) return;
    if (chatOpenTimeStamp === null) return;

    // Save opened conversation id in storage
    setOpenedConversation(conversationId).catch(() => {});

    const messagesDatabaseRef = ref(
      database,
      `/${conversationsPath}/${conversationId}/messages`
    );

    const messagesQuery = query(
      messagesDatabaseRef,
      orderByChild('createdAt'),
      startAt(chatOpenTimeStamp)
    );

    const unsubscribeChildChanged = onChildChanged(
      messagesQuery,
      (snapshot: any) => {
        const updatedMessage = snapshot.val();

        setMessages((prevMessages: any[]) => {
          const prev = Array.isArray(prevMessages) ? prevMessages : [];

          // immutably replace the updated message (no ref mutation here)
          const next = prev.map((m: any) =>
            m?.id === updatedMessage?.id ? updatedMessage : m
          );

          return next;
        });

        forceUpdate();
      }
    );

    const blockFlagRef = ref(
      database,
      `/${conversationsPath}/${conversationId}/convDetails/participantsBlockFlag`
    );

    const unsubscribeBlockChanged = onChildChanged(
      blockFlagRef,
      (snapshot: any) => {
        setConversationData((prevConversationData: any) => {
          const updatedConversationData = { ...prevConversationData };

          updatedConversationData.participantsBlockFlag[snapshot.key] =
            snapshot.val();

          // If current user is blocked/unblocked
          if (
            updatedConversationData?.participantsBlockFlag?.[currentUserId]
              ?.blockStatus === true
          ) {
            setIsBlockedYou(true);
          } else {
            setIsBlockedYou(false);
            handleReadBy(updatedConversationData, messagesRef?.current).catch(
              () => {}
            );
          }

          // If other user is blocked/unblocked by you
          if (
            updatedConversationData?.participantsBlockFlag?.[otherUserId]
              ?.blockStatus === true
          ) {
            setIsBlockedByYou(true);
          } else {
            setIsBlockedByYou(false);
          }

          return updatedConversationData;
        });

        forceUpdate();
      }
    );

    const unsubscribeChildAdded = onChildAdded(
      messagesQuery,
      (snapshot: any) => {
        const newMessage = snapshot.val();

        // Only react when the other user sends a new message
        if (newMessage?.sender !== currentUserId) {
          if (newMessage?.blockedParticipants?.[otherUserId] === true) {
            // Skip blocked messages
            return;
          }

          const lastMessage: any = _.first(messagesRef?.current);

          if (!lastMessage || newMessage.createdAt > lastMessage.createdAt) {
            newMessage.id = snapshot.key;

            setMessages((prevMessages: any) => [newMessage, ...prevMessages]);
            forceUpdate();

            handleReadBy(conversationData, messagesRef?.current, true).catch(
              () => {}
            );
          }
        }
      }
    );

    return () => {
      unsubscribeChildChanged();
      unsubscribeChildAdded();
      unsubscribeBlockChanged();
      clearOpenedConversation().catch(() => {});
    };
  }, [conversationId, chatOpenTimeStamp]);
};
