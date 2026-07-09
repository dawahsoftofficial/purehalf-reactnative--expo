import type React from 'react';

import { recordSentMessage } from '@/services/rating/ratingEngagement';

import { flashErrorMessage } from '../../../services';
import messageServices from '../../../services/api/message-services';
import type {
  Conversation,
  Message,
} from '../../../services/api/types/message-types';
import { presentChatCreditsPaywall } from '../../../services/paywall-service';

type OtherUserData = {
  id: number;
  [key: string]: unknown;
};

type UseSendMessageParams = {
  otherUserData: OtherUserData;
  conversationData: Conversation | null | undefined;
  setConversationData: (conversation: Conversation) => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  conversationId: string;
  setConversationId: (id: string) => void;
  isBlockedByYou: boolean;
  setInputMessage: (message: string) => void;
};

type SendMessageResult =
  | { type: 'blockedByYou' }
  | { type: 'sent' }
  | { type: 'failed' };

export type AudioSendInput = {
  type: 'audio';
  audio: { uri: string; name: string; type: string };
  duration_seconds: number;
  waveform_peaks?: number[];
};

export type SendMessageInput = string | AudioSendInput;

type UseSendMessageReturn = {
  onSendPress: (input: SendMessageInput) => Promise<SendMessageResult>;
};

export function useSendMessage({
  otherUserData,
  conversationData,
  setConversationData,
  messages,
  setMessages,
  conversationId,
  setConversationId,
  isBlockedByYou,
  setInputMessage,
}: UseSendMessageParams): UseSendMessageReturn {
  const sendMessage = async (input: SendMessageInput): Promise<boolean> => {
    setInputMessage('');

    // New conversation - check if conversationData is null/undefined or doesn't have an id
    if (!conversationData || !conversationData.id) {
      if (typeof input !== 'string') {
        flashErrorMessage('Please send a text message before voice notes.');
        return false;
      }

      try {
        const createdConversation: Conversation =
          await messageServices.startConversation({
            receiver_id: otherUserData?.id,
            body: input,
          });

        setConversationId(createdConversation.id.toString());
        setConversationData(createdConversation);

        // Use API message directly without conversion
        const apiMessage: Message | null =
          createdConversation.last_message_detail;
        if (apiMessage) {
          // Sort messages by created_at (newest first)
          const allMessages = [apiMessage, ...messages];
          const sortedMessages = allMessages.sort((a, b) => {
            const timeA = new Date(a.created_at).getTime();
            const timeB = new Date(b.created_at).getTime();
            return timeB - timeA; // Descending order (newest first)
          });
          setMessages(sortedMessages);
        }
        return true;
      } catch (error: unknown) {
        const errorMessage = error as string;
        // Check if error is about chat credits
        if (
          typeof errorMessage === 'string' &&
          errorMessage.toLowerCase().includes('you have no chat credits left')
        ) {
          flashErrorMessage(errorMessage);
          // Show chat credits paywall
          presentChatCreditsPaywall();
        } else {
          flashErrorMessage(errorMessage);
        }
        return false;
      }
    }

    // Existing conversation - send message
    if (!conversationId) {
      flashErrorMessage('Conversation ID is missing');
      return false;
    }

    try {
      const conversationIdNum = parseInt(conversationId, 10);
      if (isNaN(conversationIdNum)) {
        flashErrorMessage('Invalid conversation ID');
        return false;
      }

      const payload = typeof input === 'string' ? { body: input } : input;
      const sentMessage: Message =
        await messageServices.sendConversationMessage(
          conversationIdNum,
          payload
        );

      // Add the new message and sort by created_at (newest first)
      // Use functional update to avoid race conditions
      setMessages((prevMessages: Message[]) => {
        // Check if message already exists (might have come via Pusher)
        const exists = prevMessages.some(
          (msg: Message) => msg.id === sentMessage.id
        );
        if (exists) {
          console.log('[useSendMessage] Message already exists, skipping');
          return prevMessages;
        }

        const allMessages = [sentMessage, ...prevMessages];
        const sortedMessages = allMessages.sort((a, b) => {
          const timeA = new Date(a.created_at).getTime();
          const timeB = new Date(b.created_at).getTime();
          return timeB - timeA; // Descending order (newest first)
        });
        return sortedMessages;
      });
      return true;
    } catch (error: unknown) {
      flashErrorMessage(error as string);
      return false;
    }
  };

  const onSendPress = async (
    input: SendMessageInput
  ): Promise<SendMessageResult> => {
    if (isBlockedByYou) {
      return { type: 'blockedByYou' };
    }

    const didSend = await sendMessage(input);
    if (didSend) {
      recordSentMessage();
      return { type: 'sent' };
    }
    return { type: 'failed' };
  };

  return { onSendPress };
}
