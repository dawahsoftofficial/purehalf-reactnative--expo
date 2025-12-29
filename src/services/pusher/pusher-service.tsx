import {
  Pusher,
  type PusherChannel,
  PusherEvent,
} from '@pusher/pusher-websocket-react-native';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';

import BaseUrl from '../api/BaseUrl';
import type { Conversation, Message } from '../api/types/message-types';
import { StorageManager } from '../storageManager';

type PusherConfig = {
  apiKey: string;
  cluster: string;
  authEndpoint?: string;
  useTLS?: boolean;
};

type PusherEventCallbacks = {
  onConversationUpdated?: (conversation: Conversation) => void;
  onNewConversation?: (conversation: Conversation) => void;
  onMessageReceived?: (message: Message, conversationId: number) => void;
  onMessageUpdated?: (message: Message, conversationId: number) => void;
  onTypingStart?: (userId: number, conversationId: number) => void;
  onTypingStop?: (userId: number, conversationId: number) => void;
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
   * Subscribe to user's private channel for conversation updates
   * @param userId - Current user ID
   * @param callbacks - Event callbacks
   */
  subscribeToUserChannel = async (
    userId: number | string,
    callbacks: PusherEventCallbacks
  ) => {
    if (!this.pusher || !this.initialized) {
      console.error('[PusherService] Pusher not initialized');
      return () => {};
    }

    const channelName = `private-user.${userId}`;

    try {
      const channel = await this.pusher.subscribe({
        channelName,
        onSubscriptionSucceeded: () => {
          console.log(
            '[PusherService] Subscribed to user channel:',
            channelName
          );
        },
        onSubscriptionError: (channelName: string, message: string) => {
          console.error('[PusherService] Subscription error:', {
            channelName,
            message,
          });
        },
        onEvent: (event: PusherEvent) => {
          try {
            const data =
              typeof event.data === 'string'
                ? JSON.parse(event.data)
                : event.data;

            switch (event.eventName) {
              case 'conversation.updated':
                console.log('[PusherService] Conversation updated:', data);
                callbacks.onConversationUpdated?.(data as Conversation);
                break;
              case 'conversation.created':
                console.log('[PusherService] New conversation:', data);
                callbacks.onNewConversation?.(data as Conversation);
                break;
              default:
                console.log(
                  '[PusherService] Unhandled event:',
                  event.eventName
                );
            }
          } catch (error) {
            console.error('[PusherService] Error parsing event data:', error);
          }
        },
      });

      this.channels.set(channelName, channel);

      return () => {
        this.unsubscribeFromChannel(channelName);
      };
    } catch (error) {
      console.error('[PusherService.subscribeToUserChannel] Error:', error);
      return () => {};
    }
  };

  /**
   * Subscribe to a conversation channel for real-time messages
   * @param conversationId - Conversation ID
   * @param callbacks - Event callbacks
   */
  subscribeToConversation = async (
    conversationId: number | string,
    callbacks: PusherEventCallbacks
  ) => {
    if (!this.pusher || !this.initialized) {
      console.error('[PusherService] Pusher not initialized');
      return () => {};
    }

    const channelName = `private-conversation.${conversationId}`;

    try {
      const channel = await this.pusher.subscribe({
        channelName,
        onSubscriptionSucceeded: () => {
          console.log(
            '[PusherService] Subscribed to conversation:',
            channelName
          );
        },
        onSubscriptionError: (channelName: string, message: string) => {
          console.error('[PusherService] Subscription error:', {
            channelName,
            message,
          });
        },
        onEvent: (event: PusherEvent) => {
          try {
            const data =
              typeof event.data === 'string'
                ? JSON.parse(event.data)
                : event.data;

            switch (event.eventName) {
              case 'message.created':
                console.log('[PusherService] New message:', data);
                callbacks.onMessageReceived?.(
                  data as Message,
                  Number(conversationId)
                );
                break;
              case 'message.updated':
                console.log('[PusherService] Message updated:', data);
                callbacks.onMessageUpdated?.(
                  data as Message,
                  Number(conversationId)
                );
                break;
              case 'typing.start':
                console.log('[PusherService] User typing started:', data);
                callbacks.onTypingStart?.(data.user_id, Number(conversationId));
                break;
              case 'typing.stop':
                console.log('[PusherService] User typing stopped:', data);
                callbacks.onTypingStop?.(data.user_id, Number(conversationId));
                break;
              default:
                console.log(
                  '[PusherService] Unhandled event:',
                  event.eventName
                );
            }
          } catch (error) {
            console.error('[PusherService] Error parsing event data:', error);
          }
        },
      });

      this.channels.set(channelName, channel);

      return () => {
        this.unsubscribeFromChannel(channelName);
      };
    } catch (error) {
      console.error('[PusherService.subscribeToConversation] Error:', error);
      return () => {};
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
   * Subscribe to any channel (public or private) - for testing purposes
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

  /**
   * Trigger a client event on a channel (e.g., typing indicator)
   * @param channelName - Channel name
   * @param eventName - Event name
   * @param data - Event data
   */
  triggerClientEvent = async (
    channelName: string,
    eventName: string,
    data: unknown
  ) => {
    const channel = this.channels.get(channelName);
    if (channel) {
      try {
        const event = new PusherEvent({
          channelName,
          eventName: `client-${eventName}`,
          data: typeof data === 'string' ? data : JSON.stringify(data),
        });
        await channel.trigger(event);
      } catch (error) {
        console.error('[PusherService.triggerClientEvent] Error:', error);
      }
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
