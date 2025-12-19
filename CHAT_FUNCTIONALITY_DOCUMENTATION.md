# Chat Functionality Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Features](#features)
5. [Data Structures](#data-structures)
6. [Firebase Services](#firebase-services)
7. [State Management](#state-management)
8. [Implementation Details](#implementation-details)
9. [API Reference](#api-reference)
10. [User Flows](#user-flows)
11. [Security & Privacy](#security--privacy)
12. [Troubleshooting](#troubleshooting)

---

## Overview

The PureHalf app implements a comprehensive real-time chat system using **Firebase Realtime Database**. The chat functionality supports one-on-one conversations with features like read receipts, message status tracking, blocking/unblocking, push notifications, and more.

### Key Technologies

- **Firebase Realtime Database** - Real-time message synchronization
- **Firebase Cloud Functions** - Push notification delivery
- **Firebase Cloud Messaging (FCM)** - Device token management
- **React Context API** - Global state management
- **React Native MMKV** - Local storage/caching

---

## Architecture

### System Flow

```
User Action → Component → Firebase Service → Firebase Realtime Database
                                      ↓
                              Real-time Listeners
                                      ↓
                              State Update → UI Update
```

### Component Hierarchy

```
Messages.tsx (List Screen)
  ├── Conversation Items
  └── Navigation to SingleChat

SingleChat.tsx (Chat Screen)
  ├── SingleChatHeader.tsx
  ├── Message List (VirtualizedList)
  └── Message Input

Firebase Services
  ├── ConversationsListener.tsx
  ├── Firebase.tsx
  └── FirebaseConfig.tsx
```

---

## Core Components

### 1. Messages Screen (`src/screens/messages/Messages.tsx`)

**Purpose**: Displays list of all conversations

**Key Features**:

- Shows conversation preview with last message
- Displays unread message count badges
- Shows "seen" indicators (profile picture on last seen message)
- RTL language support
- Chat credits display
- Guardian mode support

**State Management**:

- Uses `useGlobalContext()` to access conversations
- Displays loading state during data fetch

**Navigation**:

- Navigates to `SingleChat` screen on conversation tap
- Passes `conversationData` and `otherUserData` as params

### 2. Single Chat Screen (`src/screens/messages/SingleChat.tsx`)

**Purpose**: Individual conversation view with real-time messaging

**Key Features**:

- Real-time message synchronization
- Message status indicators (sending, sent, seen, failed)
- Pagination for loading older messages
- Read receipt handling
- Message deletion filtering
- Block/unblock handling
- Premium membership validation
- Message input with 350 character limit

**Real-time Listeners**:

- `onChildAdded` - New messages
- `onChildChanged` - Message updates (status, read receipts)
- Block status changes

**Message States**:

- `sending` - Message being sent
- `sent` - Message delivered (double gray checkmark)
- `seen` - Message read by recipient (blue double checkmark)
- `failed` - Sending failed

### 3. Single Chat Header (`src/screens/messages/SingleChatHeader.tsx`)

**Purpose**: Chat header with user info and actions

**Features**:

- User profile display
- Block/Unblock user
- Clear chat
- Delete conversation
- Blur/Unblur profile picture
- View profile navigation

---

## Features

### 1. Real-Time Messaging

**Implementation**: Firebase Realtime Database listeners

**Location**: `src/screens/messages/SingleChat.tsx` (lines 230-361)

**How it works**:

- Listens to `/conversations/{conversationId}/messages` path
- Filters messages by `createdAt >= chatOpenTimeStamp`
- Handles new messages from other users and own messages from other devices
- Updates message status in real-time

**Code Reference**:

```typescript
const messagesQuery = query(
  messagesDatabaseRef,
  orderByChild('createdAt'),
  startAt(chatOpenTimeStamp)
);

const unsubscribeChildAdded = onChildAdded(messagesQuery, (snapshot) => {
  // Handle new message
});
```

### 2. Message Status Tracking

**Status Types**:

- **Sending**: Single gray checkmark
- **Sent**: Double gray checkmark (delivered)
- **Seen**: Double blue checkmark (read)
- **Failed**: Single gray checkmark (with error)

**Special Cases**:

- Messages sent while blocked: Single gray checkmark (preserved even after unblocking)
- Currently blocked: Single gray checkmark only

**Implementation**: `MessageStatusIcon` component in `SingleChat.tsx` (lines 909-990)

### 3. Read Receipts

**How it works**:

1. When chat is opened, all unread messages are marked as read
2. Updates `readBy[userId].seen = true` and `seenAt = timestamp`
3. Updates conversation `unReadCount[userId] = 0`
4. Syncs changes to Firebase

**Implementation**: `handleReadBy` function in `SingleChat.tsx` (lines 382-438)

**Firebase Update**:

```typescript
Firebase.updateMessagesReadBy(filteredMessages, currentUserId, conversationId);
```

### 4. Unread Message Count

**Storage**: `convDetails.unReadCount[userId]`

**Behavior**:

- Increments when new message received
- Resets to 0 when chat opened
- Displayed as badge in messages list
- Not incremented if user is blocked

**Update Location**: `Firebase.tsx` - `updateConvUnReadCount` (lines 273-289)

### 5. Message Pagination

**Initial Load**: 15 most recent messages

**Pagination**:

- Loads more on scroll to top (end reached)
- Loads next 15 messages
- Handles deleted messages during pagination
- Shows loading indicator

**Implementation**: `handleEndReached` in `SingleChat.tsx` (lines 992-1023)

**Optimization**:

- Uses `VirtualizedList` for performance
- Inverted list (newest at bottom)
- `initialNumToRender={10}`, `windowSize={15}`

### 6. Block/Unblock Users

**Blocking Behavior**:

- Blocks sending/receiving messages
- Messages sent while blocked are marked
- Block status synced in real-time
- Unblock restores functionality

**Implementation**: `blockUnBlockConv` in `Firebase.tsx` (lines 398-425)

**UI Updates**:

- Real-time listener for block status changes
- Updates `isBlockedByYou` and `isBlockedYou` states
- Prevents message sending when blocked

### 7. Delete/Clear Conversation

**Clear Chat**:

- Marks all messages as deleted for current user
- Keeps conversation in list
- Uses `deletedBy[userId] = true` flag
- Implementation: `clearChat` in `Firebase.tsx` (lines 309-326)

**Delete Conversation**:

- Removes conversation from list
- Sets `participantsDeleteFlag[userId].deleteStatus = true`
- Implementation: `updateMessageDeletedBy` in `Firebase.tsx` (lines 328-362)

**Message Filtering**:

- Filters out messages where `deletedBy[currentUserId] === true`
- Implementation: `handleLastDeletedBy` in `SingleChat.tsx` (lines 90-121)

### 8. Push Notifications

**Trigger**: When new message is sent

**Implementation**:

- Uses Firebase Cloud Functions
- Calls `sendNotification` function
- Includes message preview and navigation data

**Code**: `sendMessageNotification` in `Firebase.tsx` (lines 217-232)

**Notification Data**:

```typescript
{
  title: senderName,
  body: messageText,
  pressAction: 'openChat',
  data: {
    user: { id, name, image },
    conversationId: string,
    message: messageData
  }
}
```

### 9. Profile Picture Blur

**Feature**: Privacy control for profile pictures

**Implementation**:

- API call to `interactionAction` with `type: 9`
- Toggles blur status
- Updates UI immediately

**Code**: `onChangeBlur` in `SingleChatHeader.tsx` (lines 259-279)

### 10. Guardian Mode

**Purpose**: Allows guardians to monitor conversations

**Features**:

- Special user role: `role === 'guardian'`
- Guardian messages have different styling
- Can access user's conversations
- Different UI indicators

**Detection**: `isGuardian` check in message rendering (lines 784-785)

### 11. Premium Membership Checks

**Requirement**: Male users must have premium to send messages

**Validation**:

- Checks `membership_expiry` timestamp
- Redirects to premium promotion if expired
- Validates before each message send

**Implementation**: `isPremiumUser` in `SingleChat.tsx` (lines 477-505)

### 12. Chat Credits System

**Display**: Shows in messages list header

**Purpose**: Tracks available chat credits per user

**Storage**: `currentUser.chat_credits`

**UI**: Displayed in header when available (lines 325-343 in Messages.tsx)

### 13. Message Filtering

**Filters Applied**:

1. Messages deleted by current user
2. Messages blocked by other participant
3. Messages before last deleted message

**Implementation**: `handleLastDeletedBy` in `SingleChat.tsx` (lines 90-121)

### 14. Real-Time Conversation Listener

**Purpose**: Syncs conversation list in real-time

**Implementation**: `ConversationsListener.tsx`

**Listeners**:

- `onChildAdded` - New conversations
- `onChildChanged` - Conversation updates
- `onChildRemoved` - Deleted conversations

**Filtering**: Only shows conversations where `participantsDeleteFlag[userId].deleteStatus === false`

**Start/Stop**:

- `startConversationsListener(userId, callbacks)`
- `stopConversationsListener()`

### 15. Message Time Display

**Formats**:

- Inline: `hh:mm A` (e.g., "02:30 PM")
- Detailed (on tap):
  - Today: "Sent at 02:30 PM"
  - Yesterday: "Sent Yesterday at 02:30 PM"
  - This week: "Sent 3 days ago at 02:30 PM"
  - Older: "Sent 15-Jan-24 at 02:30 PM"

**Implementation**: `getMessageTime` and `getTimeAgo` in `SingleChat.tsx` (lines 885-907)

### 16. RTL Language Support

**Supported Languages**: Urdu, Roman Urdu

**Features**:

- Layout direction adapts (row-reverse)
- Text alignment adjusts
- Icon positioning reverses

**Implementation**: `CheckRtl()` hook used throughout components

### 17. Last Seen Indicator

**Feature**: Shows recipient's profile picture on last seen message

**Conditions**:

- Only for messages sent by current user
- Only if message is seen by recipient
- Only if recipient has profile picture
- Not shown if user is blocked

**Implementation**: `getLastSeenMessageIndex` and rendering in `SingleChat.tsx` (lines 740-770, 853-866)

---

## Data Structures

### Conversation Structure

```typescript
{
  convDetails: {
    id: string,                          // Unique conversation ID
    participantsData: Array<{            // User data for participants
      id: string,
      name: string,
      image: string
    }>,
    participantsBlockFlag: {             // Block status per user
      [userId]: {
        blockStatus: boolean
      }
    },
    participantsDeleteFlag: {            // Delete status per user
      [userId]: {
        deleteStatus: boolean
      }
    },
    unReadCount: {                       // Unread count per user
      [userId]: number
    },
    latestMessage: string,               // Last message text
    latestMessageCreatedAt: number,      // Timestamp of last message
    createdAt: number,                    // Conversation creation timestamp
    createdBy: string                     // User ID who created conversation
  },
  messages: {
    [messageId]: Message                 // Messages object
  }
}
```

### Message Structure

```typescript
{
  id: string,                            // Message ID (Firebase key)
  sender: string,                        // User ID of sender
  message: string,                       // Message text (max 350 chars)
  createdAt: number,                     // Timestamp
  status?: 'sending' | 'sent' | 'failed', // Sending status (client-side)
  readBy: {                             // Read status per user
    [userId]: {
      seen: boolean,                     // Whether message was seen
      seenAt: number | null               // Timestamp when seen
    }
  },
  deletedBy?: {                         // Deletion status per user
    [userId]: boolean
  },
  blockedParticipants?: {               // Block status when message sent
    [userId]: boolean
  }
}
```

### Firebase Path Structure

```
/conversations/
  {conversationId}/
    convDetails/
      id
      participantsData[]
      participantsBlockFlag{}
      participantsDeleteFlag{}
      unReadCount{}
      latestMessage
      latestMessageCreatedAt
      createdAt
      createdBy
    messages/
      {messageId}/
        id
        sender
        message
        createdAt
        readBy{}
        deletedBy{}
        blockedParticipants{}
```

---

## Firebase Services

### ConversationsListener (`src/services/firebase/ConversationsListener.tsx`)

**Purpose**: Manages real-time conversation list updates

**Functions**:

#### `startConversationsListener(params)`

Starts listening to conversation changes for a user.

**Parameters**:

```typescript
{
  userId: string,
  onChildAdded: (conversationId, data) => void,
  onChildChanged: (conversationId, data) => void,
  onChildRemoved: (conversationId) => void
}
```

**Returns**: Unsubscribe function

**Query**: Filters by `participantsDeleteFlag[userId].deleteStatus === false`

#### `stopConversationsListener()`

Stops all active conversation listeners.

#### `getConversationsOnce(userId, callback)`

Fetches conversations once (not real-time).

---

### Firebase Service (`src/services/firebase/Firebase.tsx`)

**Main Methods**:

#### `createChat(conversationData)`

Creates a new conversation in Firebase.

**Parameters**: Conversation data object

**Returns**: Promise

#### `sendMessage(messageData, conversationData)`

Sends a message to Firebase.

**Parameters**:

- `messageData`: Message object (without status)
- `conversationData`: Updated conversation details

**Returns**: Promise

**Actions**:

1. Saves message to `/conversations/{id}/messages/{messageId}`
2. Updates conversation details (unReadCount, latestMessage, etc.)

#### `updateConvUnReadCount(convId, userId)`

Resets unread count for a user in a conversation.

**Parameters**:

- `convId`: Conversation ID
- `userId`: User ID

#### `updateMessagesReadBy(filteredMessages, currentUserId, conversationId)`

Updates read status for multiple messages.

**Parameters**:

- `filteredMessages`: Array of messages to update
- `currentUserId`: User ID marking as read
- `conversationId`: Conversation ID

**Implementation**: Batch update using Firebase `update()`

#### `clearChat(conversationId, lastMessageId, currentUserId)`

Marks all messages as deleted for a user.

**Parameters**:

- `conversationId`: Conversation ID
- `lastMessageId`: ID of last message (marker)
- `currentUserId`: User ID

#### `updateMessageDeletedBy(conversationId, lastMessageId, currentUserId)`

Deletes conversation for a user.

**Parameters**:

- `conversationId`: Conversation ID
- `lastMessageId`: Last message ID
- `currentUserId`: User ID

**Actions**:

1. Sets `participantsDeleteFlag[userId].deleteStatus = true`
2. Marks last message as deleted

#### `blockUnBlockConv(conversationId, userId, blockUser)`

Blocks or unblocks a user in a conversation.

**Parameters**:

- `conversationId`: Conversation ID
- `userId`: User ID to block/unblock
- `blockUser`: Boolean (true = block, false = unblock)

#### `sendMessageNotification(token, data)`

Sends push notification via Cloud Function.

**Parameters**:

- `token`: FCM token array
- `data`: Notification payload

**Cloud Function**: `sendNotification`

#### `getNoOfChats(userId, conversationId)`

Gets count of chats created today by a user.

**Returns**: Promise<number>

---

## State Management

### Global Context (`src/services/context/Context.tsx`)

**State Structure**:

```typescript
{
  conversations: Array<Conversation>,    // All conversations
  coversationLoading: boolean,             // Loading state
  currentUser: User | null,               // Current user data
  openedConversationId: string | null,    // Currently open chat
  // ... other state
}
```

### Actions

#### `updateConversations(conversations)`

Updates the conversations array in global state.

#### `updateConversationLoading(loading)`

Updates loading state.

#### `updateOpenedConversationId(conversationId)`

Tracks which conversation is currently open.

### Local Storage

**Storage Keys** (MMKV):

- `CONVERSATIONS`: Cached conversations
- `OPENED_CONVERSATION_ID`: Currently open conversation
- `USER`: Current user data

**Usage**: `StorageManager.setData(key, value)` and `StorageManager.getData(key)`

---

## Implementation Details

### Message Sending Flow

1. User types message and presses send
2. Premium check (for male users)
3. Block check
4. Create message object with status `'sending'`
5. Add to local state immediately (optimistic update)
6. Update conversation data (unReadCount, latestMessage)
7. Send to Firebase (`Firebase.sendMessage`)
8. Update status to `'sent'` on success
9. Send push notification
10. Handle errors (set status to `'failed'`)

### Message Receiving Flow

1. Firebase listener detects new message
2. Check if message is from blocked participant (skip if blocked)
3. Check if message already exists (handle duplicates)
4. Add to messages array (sorted by createdAt desc)
5. Update read receipts if chat is open
6. Update unread count
7. Trigger UI update

### Read Receipt Flow

1. Chat screen opens
2. `handleReadBy` is called
3. Filter messages that are unread and not blocked
4. Update `readBy[currentUserId].seen = true`
5. Update `readBy[currentUserId].seenAt = timestamp`
6. Batch update to Firebase
7. Reset conversation `unReadCount[currentUserId] = 0`
8. Update conversation data in Firebase

### Conversation List Update Flow

1. `startConversationsListener` is called on app start
2. Listener filters conversations by delete status
3. On new conversation: Add to list
4. On conversation change: Update in list
5. On conversation removed: Remove from list
6. Update global state
7. Cache to local storage

### Block/Unblock Flow

1. User selects block/unblock from menu
2. API call to `interactionAction` (type 7 or 8)
3. Update Firebase: `participantsBlockFlag[userId].blockStatus = true/false`
4. Real-time listener updates UI
5. Prevent message sending if blocked
6. Filter blocked messages from display

---

## API Reference

### Internal API Services

#### `ApiServices.getUserDetail(userId)`

Gets user details including FCM tokens.

**Returns**: `{ fcm_token: Array<{fcm_token: string}> }`

#### `ApiServices.getUserDetailGuardian(userId)`

Gets user details for guardian mode.

#### `ApiServices.interactionAction(params)`

Performs user interaction actions.

**Parameters**:

```typescript
{
  type: number,              // 7 = block, 8 = block+report, 9 = blur
  action_user_id: string,
  allow_photo_request?: number
}
```

#### `ApiServices.getCurrentUserDetail()`

Gets current user details (for membership check).

#### `ApiServices.snedMessageNotification(params)`

Sends message notification to backend.

**Parameters**:

```typescript
{
  other_user_id: string,
  other_username: string,
  country: string,
  message_first_five_words: string
}
```

**Note**: Called every 1 minute when sending messages (rate limiting).

---

## User Flows

### Starting a New Conversation

1. User navigates to Messages screen
2. Taps on a user (from another screen)
3. `SingleChat` screen opens
4. User types first message
5. `sendMessage` creates new conversation:
   - Generates conversation ID
   - Sets up participants data
   - Initializes block/delete flags
   - Sets unread count (sender: 0, receiver: 1)
6. Creates conversation in Firebase
7. Sends first message
8. Conversation appears in list

### Receiving a Message

1. Firebase listener detects new message
2. Message added to conversation
3. Unread count incremented
4. Push notification sent (if app in background)
5. Conversation list updates with new message preview
6. Badge shows unread count

### Opening a Chat

1. User taps conversation in list
2. `SingleChat` screen opens
3. Loads last 15 messages
4. Filters deleted messages
5. Marks all messages as read
6. Resets unread count to 0
7. Sets up real-time listeners
8. Scrolls to bottom (newest message)

### Blocking a User

1. User opens menu in chat header
2. Selects "Block user" or "Report and block user"
3. API call to `interactionAction`
4. Updates Firebase block flag
5. Real-time listener updates UI
6. Input disabled (can't send messages)
7. Blocked messages filtered from display

### Clearing Chat

1. User selects "Clear chat" from menu
2. Confirmation dialog appears
3. Finds last message ID
4. Marks all messages as deleted (`deletedBy[currentUserId] = true`)
5. Updates Firebase
6. Messages filtered from display
7. Conversation remains in list (empty)

### Deleting Conversation

1. User selects "Delete conversation" from menu
2. Confirmation dialog appears
3. Sets `participantsDeleteFlag[currentUserId].deleteStatus = true`
4. Marks last message as deleted
5. Removes from conversation list
6. Navigates back to Messages screen

---

## Security & Privacy

### Blocking System

- Prevents message exchange between blocked users
- Messages sent while blocked are marked but not delivered
- Block status synced in real-time

### Message Deletion

- Soft delete (per-user)
- Messages remain in Firebase but hidden from user
- Other participant still sees messages

### Profile Privacy

- Profile picture blur feature
- Controlled via API interaction
- Respects user privacy settings

### Guardian Monitoring

- Special role for guardians
- Can monitor user conversations
- Different UI indicators

### Premium Gating

- Male users require premium to send messages
- Validated before each message send
- Redirects to premium promotion if needed

### Data Validation

- Message length limit: 350 characters
- Input sanitization
- Block status validation before sending

---

## Troubleshooting

### Messages Not Appearing

**Possible Causes**:

1. Firebase listener not started
2. User is blocked
3. Messages filtered by delete status
4. Network connectivity issues

**Solutions**:

- Check `startConversationsListener` is called
- Verify block status in `participantsBlockFlag`
- Check `deletedBy` flags
- Verify Firebase connection

### Read Receipts Not Updating

**Possible Causes**:

1. `handleReadBy` not called
2. User is blocked
3. Firebase update failed

**Solutions**:

- Ensure chat screen is focused
- Check block status
- Verify Firebase permissions
- Check network connection

### Push Notifications Not Received

**Possible Causes**:

1. FCM token not registered
2. Cloud Function error
3. Notification permissions not granted

**Solutions**:

- Verify `getFcmToken()` is called
- Check FCM token in user data
- Verify Cloud Function is deployed
- Check notification permissions

### Conversation List Not Updating

**Possible Causes**:

1. Listener not started
2. Delete flag filtering
3. State not updating

**Solutions**:

- Verify `startConversationsListener` in `CommonActions`
- Check `participantsDeleteFlag[userId].deleteStatus`
- Verify `updateConversations` is called
- Check local storage cache

### Message Status Stuck on "Sending"

**Possible Causes**:

1. Firebase write failed
2. Network error
3. Status not updated on success

**Solutions**:

- Check Firebase permissions
- Verify network connection
- Check `sendMessageToFirebase` error handling
- Verify status update in success callback

### Pagination Not Working

**Possible Causes**:

1. `handleEndReached` not triggered
2. All messages loaded
3. Deleted messages filtering issue

**Solutions**:

- Verify `onEndReachedThreshold` is set
- Check `totalMessages.length`
- Verify `handleLastDeletedBy` logic
- Check message filtering

---

## Code Locations

### Key Files

- **Messages List**: `src/screens/messages/Messages.tsx`
- **Single Chat**: `src/screens/messages/SingleChat.tsx`
- **Chat Header**: `src/screens/messages/SingleChatHeader.tsx`
- **Firebase Service**: `src/services/firebase/Firebase.tsx`
- **Conversations Listener**: `src/services/firebase/ConversationsListener.tsx`
- **Global Context**: `src/services/context/Context.tsx`
- **State Reducer**: `src/services/context/Reducer.tsx`
- **Navigation**: `src/navigation/CommonActions.tsx`

### Important Functions

- **Message Sending**: `sendMessage()` in `SingleChat.tsx` (line 512)
- **Read Receipts**: `handleReadBy()` in `SingleChat.tsx` (line 382)
- **Message Filtering**: `handleLastDeletedBy()` in `SingleChat.tsx` (line 90)
- **Pagination**: `handleEndReached()` in `SingleChat.tsx` (line 992)
- **Status Icon**: `MessageStatusIcon` in `SingleChat.tsx` (line 909)

---

## Best Practices

### Performance

- Use `VirtualizedList` for large message lists
- Implement pagination to limit initial load
- Cache conversations in local storage
- Clean up listeners on unmount

### Error Handling

- Always handle Firebase errors
- Show user-friendly error messages
- Implement retry logic for failed sends
- Handle network connectivity issues

### State Management

- Use optimistic updates for better UX
- Sync state with Firebase in real-time
- Cache data locally for offline support
- Update UI immediately, sync to Firebase async

### Security

- Validate user permissions before actions
- Check block status before sending
- Sanitize message input
- Verify premium status for male users

---

## Future Enhancements

### Potential Features

- Message reactions/emojis
- File/image sharing
- Voice messages
- Message search
- Group conversations
- Message forwarding
- Typing indicators
- Online/offline status
- Message editing/deleting (with time limit)
- End-to-end encryption

---

## Version History

- **Current Version**: 1.0
- **Last Updated**: 2024
- **Maintained By**: PureHalf Development Team

---

## Support

For issues or questions regarding the chat functionality, please contact the development team or refer to the main project README.

---

**Document End**
