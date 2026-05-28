import { getApp } from '@react-native-firebase/app';
import {
  type DataSnapshot,
  get,
  getDatabase,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  type Query,
  ref,
} from '@react-native-firebase/database';

import conversationsPath from './FirebaseConfig';

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
 * Returns the RTDB query for the global conversations node.
 *
 * NOTE: This used to claim it "filters by user ID" but the implementation
 * never did — `conversationsPath` is a single global node and the userId
 * parameter is unused. Filtering to the current user's conversations relies
 * on (a) Firebase Realtime Database security rules being correctly scoped on
 * the server, and (b) callbacks that consume this query checking participant
 * membership client-side (see `CommonActions.onChildChanged` which checks
 * `participantsDeleteFlag[userId]`).
 *
 * Audited as M1. A proper fix is a server-side schema/rules change — out of
 * scope for this client repo.
 */
const getConversationsQuery = (_userId: string): Query => {
  const conversationsRef = ref(database, conversationsPath);
  return conversationsRef;
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
  const {
    userId,
    onChildAdded: onChildAddedCallback,
    onChildChanged: onChildChangedCallback,
    onChildRemoved: onChildRemovedCallback,
  } = params;

  // Clean up any existing listeners first
  stopConversationsListener();

  const conversationsQuery = getConversationsQuery(userId);

  // Set up child_added listener
  const childAddedUnsubscribe = onChildAdded(
    conversationsQuery,
    (snapshot: DataSnapshot) => {
      if (!snapshot || !snapshot.key) {
        return;
      }
      const conversationId = snapshot.key;
      const conversationData = snapshot.val();
      onChildAddedCallback(conversationId, conversationData);
    }
  );

  // Set up child_changed listener
  const childChangedUnsubscribe = onChildChanged(
    conversationsQuery,
    (snapshot: DataSnapshot) => {
      if (!snapshot || !snapshot.key) {
        return;
      }
      const conversationId = snapshot.key;
      const conversationData = snapshot.val();
      onChildChangedCallback(conversationId, conversationData);
    }
  );

  // Set up child_removed listener (no query filter needed)
  const conversationsRef = ref(database, conversationsPath);
  const childRemovedUnsubscribe = onChildRemoved(
    conversationsRef,
    (snapshot: DataSnapshot) => {
      if (!snapshot || !snapshot.key) {
        return;
      }
      const conversationId = snapshot.key;
      onChildRemovedCallback(conversationId);
    }
  );

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
  const conversationsQuery = getConversationsQuery(userId);
  get(conversationsQuery)
    .then((snapshot: DataSnapshot) => {
      onValue(snapshot);
    })
    .catch((error) => {
      console.error('Error fetching conversations:', error);
    });
};
