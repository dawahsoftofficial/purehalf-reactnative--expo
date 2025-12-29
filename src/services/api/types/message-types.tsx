/**
 * TypeScript types for Message API endpoints
 * Based on Swagger API specifications
 */

/**
 * Participant in a conversation
 */
export type Participant = {
  id: number;
  type: string;
  name: string;
  is_blocked: boolean;
  last_seen_at: string;
  last_read_message_id: number;
  unread_count: number;
};

/**
 * Message status (delivery/read status)
 */
export type MessageStatus = {
  participant_type: string;
  participant_id: number;
  delivered_at: string | null;
  read_at: string | null;
};

/**
 * Message object (used in messages list and last message detail)
 */
export type Message = {
  id: number;
  conversation_id: number;
  body: string;
  type: string;
  sender_type: string;
  sender_id: number;
  created_at: string;
  statuses: MessageStatus[];
};

/**
 * Last message details in a conversation (alias for Message)
 */
export type LastMessageDetail = Message;

/**
 * Conversation object from API
 */
export type Conversation = {
  id: number;
  type: string;
  last_message: string;
  last_message_at: string;
  participants: Participant[];
  last_message_detail: LastMessageDetail | null;
};

/**
 * Start Conversation Request Payload
 */
export type StartConversationPayload = {
  receiver_id: number;
  body: string;
};

/**
 * Start Conversation Response
 */
export type StartConversationResponse = {
  message: string;
  error: boolean;
  code: number;
  results: Conversation;
};

/**
 * Get Conversations List Query Parameters
 */
export type GetConversationsListParams = {
  per_page?: number;
};

/**
 * Get Conversations List Response
 */
export type GetConversationsListResponse = {
  message: string;
  error: boolean;
  code: number;
  results: Conversation[];
};

/**
 * Get Conversation Messages Query Parameters
 */
export type GetConversationMessagesParams = {
  per_page?: number;
};

/**
 * Get Conversation Messages Response
 */
export type GetConversationMessagesResponse = {
  message: string;
  error: boolean;
  code: number;
  results: Message[];
};

/**
 * Send Conversation Message Request Payload
 */
export type SendConversationMessagePayload = {
  body: string;
};

/**
 * Send Conversation Message Response
 */
export type SendConversationMessageResponse = {
  message: string;
  error: boolean;
  code: number;
  results: Message;
};

/**
 * Report Message Request Payload
 */
export type ReportMessagePayload = {
  reason: string;
};

/**
 * Standard API Response (for operations without specific return data)
 */
export type StandardResponse = {
  message: string;
  error: boolean;
  code: number;
  results?: unknown;
};

/**
 * Pusher Event Data Types
 * These types represent the data structure sent from backend via Pusher events
 */

/**
 * MessageSent event data (from Pusher)
 * Nested structure with message and conversation objects
 */
export type MessageSentEventData = {
  event: 'MessageSent';
  message: {
    id: number;
    conversation_id: number;
    body: string;
    type: string;
    sender_type: string;
    sender_id: number;
    created_at: string;
    statuses?: MessageStatus[];
  };
  conversation: {
    id: number;
    last_message: string;
    last_message_at: string;
    participants: Array<{
      id: number;
      unread_count: number;
    }>;
  };
};

/**
 * MessageRead event data (from Pusher)
 */
export type MessageReadEventData = {
  event?: string;
  message_id: number;
  conversation_id?: number; // May not be in event, will be extracted from message
  read_by: {
    id: number;
    type: string;
  };
  read_at?: string; // May not be in event, will use current timestamp if missing
};

/**
 * MessageDelivered event data (from Pusher)
 */
export type MessageDeliveredEventData = {
  event?: string;
  message_id: number;
  conversation_id?: number; // May not be in event, will be extracted from message
  delivered_by: {
    id: number;
    type: string;
  };
  delivered_at?: string; // May not be in event, will use current timestamp if missing
};

/**
 * ConversationUpdated event data (from Pusher)
 * Sent on user channel when conversation is updated (message sent, read, etc.)
 */
export type ConversationUpdatedEventData = {
  event: 'ConversationUpdated';
  update_type: 'sent' | 'read' | 'delivered' | string;
  conversation: Conversation;
};

/**
 * ParticipantBlocked event data (from Pusher)
 */
export type ParticipantBlockedEventData = {
  conversation_id: number;
  blocked_user_id: number;
  blocked_by_id: number;
};

/**
 * Typing event data (from Pusher client events)
 */
export type TypingEventData = {
  user_id: number;
  is_typing: boolean;
  conversation_id?: number;
};
