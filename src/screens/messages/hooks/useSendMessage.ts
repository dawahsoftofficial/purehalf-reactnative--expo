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
  setMessages: (messages: Message[]) => void;
  conversationId: string;
  setConversationId: (id: string) => void;
  isBlockedByYou: boolean;
  setInputMessage: (message: string) => void;
};

type SendMessageResult = { type: 'blockedByYou' } | { type: 'sent' };

type UseSendMessageReturn = {
  onSendPress: (inputMessage: string) => Promise<SendMessageResult>;
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
  const sendMessage = async (inputMessage: string): Promise<void> => {
    setInputMessage('');

    // New conversation - check if conversationData is null/undefined or doesn't have an id
    if (!conversationData || !conversationData.id) {
      try {
        const createdConversation: Conversation =
          await messageServices.startConversation({
            receiver_id: otherUserData?.id,
            body: inputMessage,
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
      }
      return;
    }

    // Existing conversation - send message
    if (!conversationId) {
      flashErrorMessage('Conversation ID is missing');
      return;
    }

    try {
      const conversationIdNum = parseInt(conversationId, 10);
      if (isNaN(conversationIdNum)) {
        flashErrorMessage('Invalid conversation ID');
        return;
      }

      const sentMessage: Message =
        await messageServices.sendConversationMessage(conversationIdNum, {
          body: inputMessage,
        });

      // Add the new message and sort by created_at (newest first)
      const allMessages = [sentMessage, ...messages];
      const sortedMessages = allMessages.sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return timeB - timeA; // Descending order (newest first)
      });
      setMessages(sortedMessages);
    } catch (error: unknown) {
      flashErrorMessage(error as string);
    }
  };

  const onSendPress = async (
    inputMessage: string
  ): Promise<SendMessageResult> => {
    if (isBlockedByYou) {
      return { type: 'blockedByYou' };
    }

    await sendMessage(inputMessage);
    return { type: 'sent' };
  };

  return { onSendPress };
}
