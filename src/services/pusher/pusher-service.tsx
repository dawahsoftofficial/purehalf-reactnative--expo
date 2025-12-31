import {
  Pusher,
  type PusherChannel,
  type PusherEvent,
} from '@pusher/pusher-websocket-react-native';
import axios from 'axios';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useConversationStore } from '../../stores/conversation-store';
import BaseUrl from '../api/BaseUrl';
import { StorageManager } from '../storageManager';

type PusherConfig = {
  apiKey: string;
  cluster: string;
  authEndpoint?: string;
  useTLS?: boolean;
};

/**
 * Pusher Service for Real-Time Chat
 * Handles WebSocket connections for real-time messaging
 */
class PusherService {
  private pusher: Pusher | null = null;
  private channels: Map<string, PusherChannel> = new Map();
  private config: PusherConfig | null = null;
  private isConnected = false;
  private initialized = false;

  /**
   * Initialize Pusher with configuration
   * @param config - Pusher configuration
   */
  initialize = async (config: PusherConfig) => {
    try {
      if (this.initialized && this.pusher) {
        console.log('[PusherService] Already initialized');
        return this.pusher;
      }

      this.config = config;

      // Get singleton instance
      this.pusher = Pusher.getInstance();

      if (!this.pusher) {
        throw new Error('Pusher.getInstance() returned null');
      }

      // Initialize Pusher
      // Note: We use onAuthorizer instead of authEndpoint to have control over headers
      // If authEndpoint is provided, we'll use it in onAuthorizer with proper headers
      await this.pusher.init({
        apiKey: config.apiKey,
        cluster: config.cluster,
        // Don't set authEndpoint here - use onAuthorizer instead for custom headers
        useTLS: config.useTLS ?? true,
        onConnectionStateChange: (
          currentState: string,
          previousState: string
        ) => {
          console.log('[PusherService] Connection state changed:', {
            previous: previousState,
            current: currentState,
          });
          this.isConnected = currentState === 'CONNECTED';
        },
        onError: (message: string, code: any, error: unknown) => {
          console.error('[PusherService] Error:', { message, code, error });
          if (
            message.includes('Auth value') ||
            message.includes('authentication')
          ) {
            console.error(
              '[PusherService] ⚠️ Authentication error - Private channels require AuthEndpoint. ' +
                'Make sure PUSHER_AUTH_ENDPOINT is set in your .env file and your backend endpoint is configured.'
            );
          }
          this.isConnected = false;
        },
        onAuthorizer: async (channelName: string, socketId: string) => {
          // Custom authorizer for private channels
          // NOTE: When authEndpoint is provided, Pusher SDK should call it automatically
          // This onAuthorizer is a fallback or can be used for custom logic
          // However, if authEndpoint is set, the SDK might use it instead of this function

          if (!config.authEndpoint) {
            console.warn(
              '[PusherService] No authEndpoint provided, custom authorizer cannot work'
            );
            return {
              auth: '',
            };
          }

          try {
            // Get user token from storage
            const token = await StorageManager.getData(
              StorageManager.storageKeys.USER_TOKEN
            );

            if (!token) {
              console.error(
                '[PusherService] No user token found for authorization'
              );
              throw new Error('User not authenticated');
            }

            // Determine if authEndpoint is absolute or relative URL
            const isAbsoluteUrl =
              config.authEndpoint.startsWith('http://') ||
              config.authEndpoint.startsWith('https://');

            const authUrl = isAbsoluteUrl
              ? config.authEndpoint
              : `${BaseUrl}${config.authEndpoint.startsWith('/') ? '' : '/'}${config.authEndpoint}`;

            console.log(
              '[PusherService] Custom authorizer - Making auth request to:',
              authUrl
            );
            console.log('[PusherService] Request data:', {
              socket_id: socketId,
              channel_name: channelName,
            });

            const response = await axios.post(
              authUrl,
              {
                socket_id: socketId,
                channel_name: channelName,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            console.log(
              '[PusherService] Custom authorizer - Auth response:',
              response.data
            );
            console.log('response.data', response.data);
            // Return the auth signature from backend
            // Note: channel_data is only needed for presence channels
            // For private channels, omit it if not provided (empty string is invalid JSON)
            const authResponse: { auth: string; channel_data?: string } = {
              auth: response.data.auth || '',
            };

            // Only include channel_data if it's provided and not empty
            if (response.data.channel_data) {
              authResponse.channel_data = response.data.channel_data;
            }

            return authResponse;
          } catch (error: any) {
            console.error('[PusherService] Custom authorizer error:', error);
            if (error.response) {
              console.error(
                '[PusherService] Response status:',
                error.response.status
              );
              console.error(
                '[PusherService] Response data:',
                error.response.data
              );
            }
            throw error;
          }
        },
      });

      // Connect to Pusher
      if (!this.pusher) {
        throw new Error('Pusher instance is null after init');
      }

      await this.pusher.connect();
      this.initialized = true;
      this.isConnected = true;

      console.log('[PusherService] Initialized and connected');
      return this.pusher;
    } catch (error) {
      console.error('[PusherService.initialize] Error:', error);
      this.isConnected = false;
      this.initialized = false;
      this.pusher = null;
      throw error;
    }
  };

  /**
   * Unsubscribe from a channel
   * @param channelName - Channel name to unsubscribe from
   */
  unsubscribeFromChannel = async (channelName: string) => {
    const channel = this.channels.get(channelName);
    if (channel && this.pusher) {
      try {
        await this.pusher.unsubscribe({ channelName });
        this.channels.delete(channelName);
        console.log('[PusherService] Unsubscribed from:', channelName);
      } catch (error) {
        console.error('[PusherService.unsubscribeFromChannel] Error:', error);
      }
    }
  };

  /**
   * Disconnect from Pusher
   */
  disconnect = async () => {
    if (this.pusher) {
      try {
        // Unsubscribe from all channels
        const unsubscribePromises = Array.from(this.channels.keys()).map(
          (channelName) => this.unsubscribeFromChannel(channelName)
        );
        await Promise.all(unsubscribePromises);

        await this.pusher.disconnect();
        this.pusher = null;
        this.isConnected = false;
        this.initialized = false;
        console.log('[PusherService] Disconnected from Pusher');
      } catch (error) {
        console.error('[PusherService.disconnect] Error:', error);
      }
    }
  };

  /**
   * Get connection status
   */
  getConnectionStatus = () => {
    return this.isConnected && this.initialized && this.pusher !== null;
  };

  /**
   * Check if Pusher is fully initialized and ready
   */
  isReady = () => {
    return this.initialized && this.pusher !== null;
  };

  /**
   * Subscribe to any channel (public or private)
   * @param channelName - Channel name to subscribe to
   * @param onEvent - Callback for any event received on this channel
   */
  subscribeToChannel = async (
    channelName: string,
    onEvent?: (event: PusherEvent) => void
  ) => {
    if (!this.isReady() || !this.pusher) {
      console.error('[PusherService] Pusher not initialized or ready', {
        initialized: this.initialized,
        pusherExists: this.pusher !== null,
        isConnected: this.isConnected,
      });
      return () => {};
    }

    try {
      const channel = await this.pusher.subscribe({
        channelName,
        onSubscriptionSucceeded: () => {
          console.log(
            '[PusherService] ✅ Successfully subscribed to channel:',
            channelName
          );
        },
        onSubscriptionError: (channelName: string, message: string) => {
          console.error('[PusherService] ❌ Subscription error:', {
            channelName,
            message,
          });

          // Check if it's a method not allowed error
          if (
            message.includes('MethodNotAllowed') ||
            message.includes('POST method is not supported')
          ) {
            console.error(
              '[PusherService] ⚠️ Backend Route Error: ' +
                'The broadcasting/auth endpoint must accept POST requests. ' +
                'Please ask your backend developer to ensure the route accepts POST method.'
            );
          }
        },
        onEvent: (event: PusherEvent) => {
          // Handle subscription errors separately
          if (event.eventName === 'pusher:subscription_error') {
            console.error(
              '[PusherService] ❌ Subscription error event received'
            );
            try {
              const errorData =
                typeof event.data === 'string'
                  ? JSON.parse(event.data)
                  : event.data;
              console.error(
                '[PusherService] Subscription error details:',
                errorData
              );
            } catch (e) {
              console.error(
                '[PusherService] Error parsing subscription error:',
                e
              );
              // Check if it's an HTML error page (Laravel error)
              if (
                typeof event.data === 'string' &&
                event.data.includes('<!DOCTYPE html>')
              ) {
                if (event.data.includes('MethodNotAllowedHttpException')) {
                  console.error(
                    '[PusherService] ⚠️ Backend Configuration Issue:\n' +
                      'The broadcasting/auth route only accepts GET/HEAD, but Pusher requires POST.\n' +
                      'Backend fix needed: Ensure the route accepts POST method.\n' +
                      'In Laravel, check routes/channels.php or broadcasting.php configuration.'
                  );
                } else {
                  console.error(
                    '[PusherService] Backend returned HTML error page instead of JSON'
                  );
                }
              } else {
                console.error(
                  '[PusherService] Error parsing subscription error:',
                  event.data
                );
              }
            }
            return; // Don't call onEvent for subscription errors
          }

          console.log(
            '[PusherService] 📨 Event received on',
            channelName,
            ':',
            {
              eventName: event.eventName,
              data: event.data,
            }
          );
          try {
            const data =
              typeof event.data === 'string'
                ? JSON.parse(event.data)
                : event.data;
            console.log('[PusherService] 📦 Parsed event data:', data);
          } catch (_error) {
            console.log('[PusherService] 📦 Raw event data:', event.data);
          }
          onEvent?.(event);
        },
      });

      this.channels.set(channelName, channel);

      return () => {
        this.unsubscribeFromChannel(channelName);
      };
    } catch (error) {
      console.error('[PusherService.subscribeToChannel] Error:', error);
      return () => {};
    }
  };
}

// Singleton instance
const pusherService = new PusherService();
export default pusherService;

/**
 * React Hook for using Pusher in components
 */
export function usePusher(config: PusherConfig | null) {
  const [, setIsConnected] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!config) {
      return;
    }

    // Don't re-initialize if already initialized with same config
    if (initializedRef.current) {
      return;
    }

    const initPusher = async () => {
      try {
        await pusherService.initialize(config);
        // Wait a bit for connection to establish
        setTimeout(() => {
          setIsConnected(pusherService.getConnectionStatus());
        }, 500);
        initializedRef.current = true;
      } catch (error) {
        console.error('[usePusher] Initialization error:', error);
        initializedRef.current = false;
      }
    };

    initPusher();

    return () => {
      // Don't disconnect on unmount, just reset the ref
      initializedRef.current = false;
    };
  }, [config]);

  // Poll connection status to update state
  useEffect(() => {
    if (!config) return;

    const updateStatus = () => {
      const status =
        pusherService.getConnectionStatus() && pusherService.isReady();
      setIsConnected(status);
    };

    // Initial check
    updateStatus();

    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, [config]);

  return {
    pusherService,
    isConnected: pusherService.getConnectionStatus() && pusherService.isReady(),
  };
}

/**
 * React Hook for subscribing to user counters channel globally
 * This hook subscribes to private-user.counters.{userId} channel
 * and handles counter-related events app-wide
 */
export function useUserCountersChannel(
  currentUser: { id: string | number; user?: { id: string | number } } | null,
  updateCurrentUser: (user: unknown) => void
) {
  const unsubscribeCountersChannelRef = useRef<(() => void) | null>(null);
  const subscribedUserIdRef = useRef<string | number | null>(null);

  // Extract userId using useMemo to avoid unnecessary re-renders
  const userId = useMemo(() => {
    return currentUser?.id === 'guardian'
      ? currentUser?.user?.id
      : currentUser?.id;
  }, [currentUser?.id, currentUser?.user?.id]);

  useEffect(() => {
    // If no user or Pusher not ready, cleanup and return
    if (!currentUser || !pusherService.isReady() || !userId) {
      // Only cleanup if we were subscribed to a different user
      if (
        unsubscribeCountersChannelRef.current &&
        subscribedUserIdRef.current !== userId
      ) {
        console.log(
          '[useUserCountersChannel] Cleaning up counters channel for user:',
          subscribedUserIdRef.current
        );
        unsubscribeCountersChannelRef.current();
        unsubscribeCountersChannelRef.current = null;
        subscribedUserIdRef.current = null;
      }
      return;
    }

    // If already subscribed to the same user, don't resubscribe
    if (
      subscribedUserIdRef.current === userId &&
      unsubscribeCountersChannelRef.current
    ) {
      console.log(
        '[useUserCountersChannel] Already subscribed to counters channel for user:',
        userId
      );
      return;
    }

    const setupCountersChannel = async () => {
      try {
        // Cleanup previous subscription if switching users
        if (
          unsubscribeCountersChannelRef.current &&
          subscribedUserIdRef.current !== userId
        ) {
          console.log(
            '[useUserCountersChannel] Unsubscribing from previous user:',
            subscribedUserIdRef.current
          );
          unsubscribeCountersChannelRef.current();
          unsubscribeCountersChannelRef.current = null;
        }

        console.log(
          '[useUserCountersChannel] Setting up counters channel for user:',
          userId
        );

        // Subscribe to user counters channel: private-user.counters.{userId}
        const countersChannelName = `private-user.counters.${userId}`;

        const unsubscribeCounters = await pusherService.subscribeToChannel(
          countersChannelName,
          (event) => {
            console.log(
              '[useUserCountersChannel] Counter event received:',
              event.eventName
            );

            try {
              const rawData =
                typeof event.data === 'string'
                  ? JSON.parse(event.data)
                  : event.data;

              // Extract event type from Laravel event class name or from data.event
              let eventType = event.eventName;
              if (eventType.includes('\\')) {
                // Laravel event class name format: App\Events\User\CounterUpdated
                eventType = eventType.split('\\').pop() || eventType;
              }

              // If data has an 'event' field, use that as the event type
              if (rawData?.event) {
                eventType = rawData.event;
              }

              console.log(
                '[useUserCountersChannel] Normalized counter event type:',
                eventType
              );

              // Handle counter events - use current user from closure
              // Get fresh currentUser from the latest state
              const latestUserId =
                currentUser?.id === 'guardian'
                  ? currentUser?.user?.id
                  : currentUser?.id;

              if (latestUserId === userId) {
                handleCounterEvent(
                  eventType,
                  rawData,
                  currentUser,
                  updateCurrentUser
                );
              }
            } catch (error) {
              console.error(
                '[useUserCountersChannel] Error handling counter event:',
                error
              );
            }
          }
        );

        unsubscribeCountersChannelRef.current = unsubscribeCounters;
        subscribedUserIdRef.current = userId;
        console.log(
          '[useUserCountersChannel] ✅ Subscribed to user counters channel'
        );
      } catch (error) {
        console.error(
          '[useUserCountersChannel] Error setting up counters channel:',
          error
        );
        subscribedUserIdRef.current = null;
      }
    };

    setupCountersChannel();

    return () => {
      // Only cleanup on unmount or when userId actually changes
      // This cleanup will run when the component unmounts or userId changes
      if (
        unsubscribeCountersChannelRef.current &&
        subscribedUserIdRef.current !== userId
      ) {
        console.log(
          '[useUserCountersChannel] Cleanup: Unsubscribing from user:',
          subscribedUserIdRef.current
        );
        unsubscribeCountersChannelRef.current();
        unsubscribeCountersChannelRef.current = null;
        subscribedUserIdRef.current = null;
      }
    };
    // Only depend on userId to avoid resubscribing when currentUser object reference changes
    // but userId remains the same. We intentionally don't include currentUser in deps
    // because we only want to resubscribe when the userId changes, not when user data updates.
  }, [userId, updateCurrentUser]);
}

/**
 * Handle counter-related events from the counters channel
 */
// eslint-disable-next-line max-params
function handleCounterEvent(
  eventType: string,
  rawData: unknown,
  currentUser: { id: string | number; user?: { id: string | number } } | null,
  updateCurrentUser: (user: unknown) => void
) {
  console.log(
    '[useUserCountersChannel] Counter event received:',
    eventType,
    rawData
  );

  try {
    // Handle different counter event types
    switch (eventType) {
      case 'counterUpdate':
        // Counter update event with participant data
        // Data structure: { event: 'counterUpdate', participant: { id, unread_conversations_count, unread_messages_count, chat_credits } }
        console.log(
          '[useUserCountersChannel] Counter update received:',
          rawData
        );

        if (
          rawData &&
          typeof rawData === 'object' &&
          'participant' in rawData &&
          currentUser
        ) {
          const participant = rawData.participant as {
            id?: number;
            unread_conversations_count?: number;
            unread_messages_count?: number | string;
            chat_credits?: number;
          };

          // Update chat credits if present
          if (participant.chat_credits !== undefined) {
            const credits =
              typeof participant.chat_credits === 'number'
                ? participant.chat_credits
                : parseInt(String(participant.chat_credits), 10) || 0;

            console.log(
              '[useUserCountersChannel] Updating chat credits:',
              credits
            );
            updateCurrentUser({
              ...currentUser,
              chat_credits: credits,
            });
          }

          // Update unread counts if present
          if (
            participant.unread_conversations_count !== undefined ||
            participant.unread_messages_count !== undefined
          ) {
            const unreadConversationsCount =
              participant.unread_conversations_count || 0;
            const unreadMessagesCount =
              typeof participant.unread_messages_count === 'string'
                ? parseInt(participant.unread_messages_count, 10) || 0
                : participant.unread_messages_count || 0;

            console.log(
              '[useUserCountersChannel] Updating unread counts:',
              unreadConversationsCount,
              'conversations,',
              unreadMessagesCount,
              'messages'
            );

            // Update conversation store
            useConversationStore
              .getState()
              .setUnreadCounts(unreadConversationsCount, unreadMessagesCount);
          }
        }
        break;

      case 'CounterUpdated':
      case 'CountersUpdated':
        // Generic counter update event
        console.log('[useUserCountersChannel] Counter updated:', rawData);
        // You can add specific counter update logic here
        // For example, updating chat credits, matches, etc.
        break;

      case 'ChatCreditsUpdated':
        // Chat credits counter update
        console.log('[useUserCountersChannel] Chat credits updated:', rawData);
        if (
          rawData &&
          typeof rawData === 'object' &&
          'chat_credits' in rawData &&
          currentUser
        ) {
          const credits =
            typeof rawData.chat_credits === 'number'
              ? rawData.chat_credits
              : parseInt(String(rawData.chat_credits), 10) || 0;
          updateCurrentUser({
            ...currentUser,
            chat_credits: credits,
          });
        }
        break;

      case 'MatchesCountUpdated':
        // Matches counter update
        console.log('[useUserCountersChannel] Matches count updated:', rawData);
        // Add matches count update logic if needed
        break;

      default:
        console.log(
          '[useUserCountersChannel] Unknown counter event type:',
          eventType,
          rawData
        );
    }
  } catch (error) {
    console.error(
      '[useUserCountersChannel] Error handling counter event:',
      error
    );
  }
}
