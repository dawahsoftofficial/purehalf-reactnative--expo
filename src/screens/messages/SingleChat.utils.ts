import _ from 'lodash';
import moment from 'moment';

/**
 * Checks if a message contains restricted words.
 * Keep the list here so it’s easy to maintain.
 */
export const containsRestrictedWord = (message: string) => {
  const restrictedWords = ['bad', 'inappropriate', 'harmful'];
  const lower = (message || '').toLowerCase();
  return restrictedWords.some((word) => lower.includes(word));
};

export const getTimeAgo = (timestamp: any) => {
  const now = moment();
  // Parse UTC timestamp and convert to local timezone
  const time = moment.utc(timestamp).local();
  const daysDiff = now.diff(time, 'days');

  if (daysDiff === 0) {
    return `at ${time.format('hh:mm A')}`;
  }

  if (daysDiff === 1) {
    return `Yesterday  at ${time.format('hh:mm A')}`;
  }

  if (daysDiff < 7) {
    return `${daysDiff} days ago at ${time.format('hh:mm A')}`;
  }

  return `${time.format('DD-MMM-YY')} at ${time.format('hh:mm A')}`;
};

export const getMessageTime = (timestamp: any) => {
  // Parse UTC timestamp from backend and convert to user's local timezone
  return moment.utc(timestamp).local().format('hh:mm A');
};

const idsMatch = (left: any, right: any) => {
  if (
    left === null ||
    left === undefined ||
    right === null ||
    right === undefined
  ) {
    return false;
  }

  return String(left) === String(right);
};

export const getMessageParticipantStatus = (
  message: any,
  participantId: any
) => {
  const statuses = message?.statuses || [];

  return statuses.find((status: any) =>
    idsMatch(status.participant_id, participantId)
  );
};

export const hasReadAt = (status: any) =>
  status?.read_at !== null && status?.read_at !== undefined;

export const hasDeliveredOrReadAt = (status: any) =>
  (status?.delivered_at !== null && status?.delivered_at !== undefined) ||
  hasReadAt(status);

export const isLastMessageReadByParticipant = (
  lastMessage: any,
  participant: any,
  currentUserId: any
) => {
  if (!lastMessage || !participant) return false;

  if (!idsMatch(lastMessage.sender_id, currentUserId)) {
    return false;
  }

  const status = getMessageParticipantStatus(lastMessage, participant.id);
  if (hasReadAt(status)) {
    return true;
  }

  const lastReadMessageId = participant.last_read_message_id;
  if (lastReadMessageId === null || lastReadMessageId === undefined) {
    return false;
  }

  return Number(lastReadMessageId) >= Number(lastMessage.id);
};

/**
 * Finds the last message sent by current user that was seen by other user.
 * Returns the index in the *original* `messages` array (not the sorted one).
 * Updated to use new API structure: sender_id, created_at, statuses array
 */
export const getLastSeenMessageIndex = (
  messages: any[],
  currentUserID: any,
  otherUserId: any
) => {
  if (!messages || messages.length === 0) return -1;

  // Sort oldest -> newest, then scan from end for last "seen"
  const sortedMessages = _.orderBy(messages, ['created_at'], ['asc']);

  let lastSeenMessage: any = null;
  // Convert to strings for comparison (API returns numbers, currentUserID might be string)
  const currentUserIDStr = currentUserID != null ? String(currentUserID) : null;
  for (let i = sortedMessages.length - 1; i >= 0; i--) {
    const message = sortedMessages[i];
    // Check if message is from current user (convert sender_id to string for comparison)
    const messageSenderId =
      message?.sender_id != null ? String(message.sender_id) : null;
    if (messageSenderId === currentUserIDStr) {
      // Check statuses array for read status from other user
      const otherUserStatus = getMessageParticipantStatus(message, otherUserId);
      if (hasReadAt(otherUserStatus)) {
        lastSeenMessage = message;
        break;
      }
    }
  }

  if (!lastSeenMessage) return -1;

  return messages.findIndex((msg: any) => msg?.id === lastSeenMessage?.id);
};
