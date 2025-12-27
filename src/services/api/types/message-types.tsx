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
  unread_count: number;
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
