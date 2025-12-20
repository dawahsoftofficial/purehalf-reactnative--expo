import { useCallback } from 'react';

import { Firebase, getTimeStamp } from '../../../services';

type Params = {
  currentUserId: any;
  otherUserId: any;

  setConversationData: (data: any) => void;
};

export function useReadReceipts({
  currentUserId,
  otherUserId,
  setConversationData,
}: Params) {
  const handleReadBy = useCallback(
    async (convDetails: any, messages: any, fromNewMessage = false) => {
      if (
        convDetails?.length !== 0 &&
        !convDetails?.participantsBlockFlag?.[otherUserId]?.blockStatus
      ) {
        if (convDetails?.unReadCount?.[currentUserId] !== 0 || fromNewMessage) {
          Firebase.updateConvUnReadCount(convDetails?.id, currentUserId).then(
            () => {
              const updatedUnReadCount = {
                ...(convDetails?.unReadCount || {}),
                [currentUserId]: 0,
              };

              const updatedConvDetails = {
                ...convDetails,
                unReadCount: updatedUnReadCount,
              };
              setConversationData(updatedConvDetails);
            }
          );
        }

        const seenAtTimestamp = await getTimeStamp();

        const filteredMessages = (messages || []).map((message: any) => {
          const isUnread = message?.readBy?.[currentUserId]?.seen === false;
          const isBlockedForReceiver =
            message?.blockedParticipants?.[otherUserId] === true;

          if (isUnread && !isBlockedForReceiver) {
            return {
              ...message,
              readBy: {
                ...(message?.readBy || {}),
                [currentUserId]: {
                  seen: true,
                  seenAt: seenAtTimestamp,
                },
              },
            };
          }

          return message;
        });

        if (filteredMessages?.length !== 0) {
          Firebase.updateMessagesReadBy(
            filteredMessages,
            currentUserId,
            convDetails?.id
          );
        }
      }
    },
    [currentUserId, otherUserId, setConversationData]
  );

  return { handleReadBy };
}
