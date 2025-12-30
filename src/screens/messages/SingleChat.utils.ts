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
  const time = moment(timestamp);
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
  return moment(timestamp).format('hh:mm A');
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
      const statuses = message?.statuses || [];
      const otherUserStatus = statuses.find(
        (status: any) => status.participant_id === otherUserId
      );
      if (otherUserStatus?.read_at !== null) {
        lastSeenMessage = message;
        break;
      }
    }
  }

  if (!lastSeenMessage) return -1;

  return messages.findIndex((msg: any) => msg?.id === lastSeenMessage?.id);
};
