import { getApp } from '@react-native-firebase/app';
import {
  type DataSnapshot,
  getDatabase,
  type Query,
} from '@react-native-firebase/database';

const firebaseApp = getApp();
const database = getDatabase(firebaseApp);

type ConversationCallback = (
  conversationId: string | null,
  data: Record<string, unknown>
) => void;
type ValueCallback = (snapshot: DataSnapshot) => void;

// Store active listeners for proper cleanup
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UnsubscribeFunction = (...args: any[]) => void;

let activeListeners: {
  childAdded?: UnsubscribeFunction;
  childChanged?: UnsubscribeFunction;
  childRemoved?: UnsubscribeFunction;
} = {};

/**
 * Creates a query reference for conversations filtered by user ID
 */
const getConversationsQuery = (userId: string): Query => {
  return database
    .ref('conversations')
    .orderByChild(`convDetails/participantsDeleteFlag/${userId}/deleteStatus`)
    .equalTo(false);
};

type StartConversationsListenerParams = {
  userId: string;
  onChildAdded: ConversationCallback;
  onChildChanged: ConversationCallback;
  onChildRemoved: (conversationId: string | null) => void;
};

/**
 * Starts listening to conversation changes for a specific user
 * Returns unsubscribe function for proper cleanup
 */
export const startConversationsListener = (
  params: StartConversationsListenerParams
): (() => void) => {
  const { userId, onChildAdded, onChildChanged, onChildRemoved } = params;

  // Clean up any existing listeners first
  stopConversationsListener();

  const query = getConversationsQuery(userId);

  // Set up child_added listener
  const childAddedUnsubscribe = query.on(
    'child_added',
    (snapshot: DataSnapshot) => {
      const conversationId = snapshot.key;
      const conversationData = snapshot.val();
      onChildAdded(conversationId, conversationData);
    }
  );

  // Set up child_changed listener
  const childChangedUnsubscribe = query.on(
    'child_changed',
    (snapshot: DataSnapshot) => {
      const conversationId = snapshot.key;
      const conversationData = snapshot.val();
      onChildChanged(conversationId, conversationData);
    }
  );

  // Set up child_removed listener (no query filter needed)
  const childRemovedUnsubscribe = database
    .ref('conversations')
    .on('child_removed', (snapshot: DataSnapshot) => {
      const conversationId = snapshot.key;
      onChildRemoved(conversationId);
    });

  // Store unsubscribe functions
  activeListeners = {
    childAdded: childAddedUnsubscribe,
    childChanged: childChangedUnsubscribe,
    childRemoved: childRemovedUnsubscribe,
  };

  // Return combined unsubscribe function
  return () => {
    stopConversationsListener();
  };
};

/**
 * Stops all active conversation listeners
 */
export const stopConversationsListener = (): void => {
  if (activeListeners.childAdded) {
    activeListeners.childAdded();
    activeListeners.childAdded = undefined;
  }
  if (activeListeners.childChanged) {
    activeListeners.childChanged();
    activeListeners.childChanged = undefined;
  }
  if (activeListeners.childRemoved) {
    activeListeners.childRemoved();
    activeListeners.childRemoved = undefined;
  }
};

/**
 * Fetches conversations once for a specific user
 */
export const getConversationsOnce = (
  userId: string,
  onValue: ValueCallback
): void => {
  const query = getConversationsQuery(userId);
  query.once('value', onValue);
};
