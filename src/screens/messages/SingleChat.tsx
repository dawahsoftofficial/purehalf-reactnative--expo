import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  VirtualizedList,
} from 'react-native';
import Ripple from 'react-native-material-ripple';
import Ionicons from 'react-native-vector-icons/Ionicons';

import pusherService from '@/services/pusher';
import { evaluateAndMaybeShowRatingPrompt } from '@/services/rating/ratingEngagement';

import { Container } from '../../components';
import { wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Images } from '../../res';
import {
  ApiServices,
  flashErrorMessage,
  flashInfoMessage,
  useGlobalContext,
} from '../../services';
import messageServices from '../../services/api/message-services';
import type {
  Message,
  MessageDeliveredEventData,
  MessageReadEventData,
  MessageSentEventData,
  ParticipantBlockedEventData,
} from '../../services/api/types/message-types';
import chatAudioService from '../../services/audio/chat-audio-service';
import MessageBubble from './components/MessageBubble';
import TypingIndicator from './components/TypingIndicator';
import VoiceRecorderBar from './components/VoiceRecorderBar';
import { useSendMessage } from './hooks/useSendMessage';
import Styles from './SingleChat.styles';
import SingleChatHeader from './SingleChatHeader';

const SingleChat = (props: any) => {
  const Rtl = CheckRtl();
  const flatListRef: any = useRef(null);
  const inputRef: any = useRef(null);
  const { t }: any = useTranslation();
  const { currentUser } = useGlobalContext();
  const fromNotification =
    props?.route?.params?.from === 'notification' ? true : false;
  const fromMessages = props?.route?.params?.from === 'messages' ? true : false;
  const guardian = currentUser?.guardian ? currentUser?.guardian : false;
  const [otherUserData, setOtherUserData] = useState(
    props?.route?.params?.otherUserData
  );
  const [isBlockedByYou, _setIsBlockedByYou] = useState(false);
  const [isBlockedYou, setIsBlockedYou] = useState(false);
  const [loader, setLoader] = useState(true);
  const [messagePressedId, setMessagePressedId] = useState<number | null>(null);
  const [quote, setQuote] = useState('');

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationData, setConversationData] = useState<any>({});
  const [conversationId, setConversationId] = useState('');

  // Pusher real-time features
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unsubscribeConversationRef = useRef<(() => void) | null>(null);
  const lastTypingEventRef = useRef<number>(0);
  // Track which messages have been marked as read to avoid duplicate API calls
  const markedAsReadRef = useRef<Set<number>>(new Set());
  // Track which messages have been marked as delivered to avoid duplicate API calls
  const markedAsDeliveredRef = useRef<Set<number>>(new Set());
  // Track messages to avoid race conditions between fetchMessages and Pusher events
  const messagesRef = useRef<Message[]>([]);
  const isFetchingMessagesRef = useRef<boolean>(false);

  const [inputMessage, setInputMessage] = useState('');
  const onChangeInputMessage = (text: string) => {
    setInputMessage(text);
    // TODO: Send typing indicator when user types
  };

  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceElapsedSeconds, setVoiceElapsedSeconds] = useState(0);
  const [isSendingVoice, setIsSendingVoice] = useState(false);
  const voiceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getOtherUserData = async () => {
    if (currentUser?.id === 'guardian') {
      const response = await ApiServices.getUserDetailGuardian(
        otherUserData?.id
      );
      setOtherUserData((prev: any) => ({
        ...prev,
        ...response,
      }));
    } else {
      ApiServices.getUserDetail(otherUserData?.id).then((res: any) => {
        setOtherUserData((prev: any) => ({
          ...prev,
          ...res,
        }));
      });
    }
  };

  useEffect(() => {
    if (fromMessages) {
      getOtherUserData();
    } else if (fromNotification) {
      setLoader(false);
    }
  }, [fromMessages, fromNotification]);

  useEffect(() => {
    const routeConversationData = props?.route?.params?.conversationData;
    if (routeConversationData) {
      // New API structure (Conversation type)
      if (routeConversationData.id) {
        setConversationData(routeConversationData);
        setConversationId(routeConversationData.id.toString());

        // Check blocked status from participants
        const currentUserId =
          currentUser?.id === 'guardian'
            ? currentUser?.user?.id
            : currentUser?.id;
        const otherParticipant = routeConversationData.participants.find(
          (p: any) => p.id !== currentUserId
        );
        if (otherParticipant) {
          setIsBlockedYou(otherParticipant.is_blocked);
        }

        // Keep loader true - it will be set to false after messages are fetched
        // Don't set loader to false here, wait for fetchMessages to complete
      }
    } else if (!fromNotification) {
      setLoader(false);
    }
  }, [
    props?.route?.params?.conversationData,
    currentUser,
    otherUserData,
    fromNotification,
  ]);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;

    // Prevent duplicate fetches if already fetching
    if (isFetchingMessagesRef.current) {
      console.log('[SingleChat] Already fetching messages, skipping');
      return;
    }

    // Set loader to true when starting to fetch messages
    setLoader(true);
    isFetchingMessagesRef.current = true;

    try {
      const conversationIdNum = parseInt(conversationId, 10);
      if (isNaN(conversationIdNum)) {
        setLoader(false);
        isFetchingMessagesRef.current = false;
        return;
      }

      const fetchedMessages = await messageServices.getConversationMessages(
        conversationIdNum,
        { per_page: 50 }
      );

      // Merge fetched messages with existing messages to avoid losing Pusher messages
      // Get current messages from ref to avoid stale closure
      const currentMessages = messagesRef.current;

      // Create a map of existing messages by ID for quick lookup
      const existingMessagesMap = new Map(
        currentMessages.map((msg) => [msg.id, msg])
      );

      // Add fetched messages, keeping existing ones if they're newer or have updates
      fetchedMessages.forEach((fetchedMsg) => {
        const existingMsg = existingMessagesMap.get(fetchedMsg.id);
        if (!existingMsg) {
          // New message from API, add it
          existingMessagesMap.set(fetchedMsg.id, fetchedMsg);
        } else {
          // Message exists, keep the one with more complete data (prefer existing if it has statuses)
          if (existingMsg.statuses && existingMsg.statuses.length > 0) {
            // Keep existing message but update other fields if needed
            existingMessagesMap.set(fetchedMsg.id, {
              ...fetchedMsg,
              statuses: existingMsg.statuses,
            });
          } else {
            // Use fetched message if it has better data
            existingMessagesMap.set(fetchedMsg.id, fetchedMsg);
          }
        }
      });

      // Convert map back to array and sort by created_at (newest first)
      const mergedMessages = Array.from(existingMessagesMap.values());
      const sortedMessages = mergedMessages.sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return timeB - timeA; // Descending order (newest first)
      });

      setMessages(sortedMessages);
      messagesRef.current = sortedMessages;
      setLoader(false);
      isFetchingMessagesRef.current = false;

      // Reset the marked as read/delivered tracking when messages are fetched
      // This ensures we can mark messages as read/delivered when screen is focused
      markedAsReadRef.current.clear();
      markedAsDeliveredRef.current.clear();
    } catch (error: unknown) {
      console.error('[SingleChat.fetchMessages] Error:', error);
      setLoader(false);
      isFetchingMessagesRef.current = false;
    }
  }, [conversationId]);

  // Store handler refs (will be initialized after handlers are defined)
  const handleNewMessageRef = useRef<
    ((data: MessageSentEventData['message']) => void) | null
  >(null);
  const handleMessageReadRef = useRef<
    ((data: MessageReadEventData) => void) | null
  >(null);
  const handleMessageDeliveredRef = useRef<
    ((data: MessageDeliveredEventData) => void) | null
  >(null);
  const handleParticipantBlockedRef = useRef<
    ((data: ParticipantBlockedEventData) => void) | null
  >(null);

  // Setup Pusher real-time listeners for this conversation
  const setupPusherListeners = useCallback(async () => {
    if (!conversationId || !pusherService.isReady()) {
      console.log('[SingleChat] Pusher not ready or no conversation ID');
      return;
    }

    // M6 fix: if a previous subscription is still active (e.g. the screen
    // re-mounted with the same conversationId or the effect re-ran), unsubscribe
    // it first — otherwise the ref gets overwritten and the old subscription
    // becomes an orphan that keeps receiving events.
    if (unsubscribeConversationRef.current) {
      try {
        unsubscribeConversationRef.current();
      } catch (error) {
        console.error(
          '[SingleChat] Error unsubscribing previous channel:',
          error
        );
      }
      unsubscribeConversationRef.current = null;
    }

    try {
      console.log(
        '[SingleChat] Setting up Pusher for conversation:',
        conversationId
      );

      // Subscribe to conversation channel: conversation.{conversation-id}
      const channelName = `private-conversation.${conversationId}`;

      const unsubscribe = await pusherService.subscribeToChannel(
        channelName,
        (event) => {
          console.log('[SingleChat] Pusher event received:', event.eventName);

          try {
            const rawData =
              typeof event.data === 'string'
                ? JSON.parse(event.data)
                : event.data;

            // Extract event type from Laravel event class name or from data.event
            let eventType = event.eventName;
            if (eventType.includes('\\')) {
              // Laravel event class name format: App\Events\Conversation\MessageSent
              eventType = eventType.split('\\').pop() || eventType;
            }

            // If data has an 'event' field, use that as the event type
            if (rawData?.event) {
              eventType = rawData.event;
            }

            console.log('[SingleChat] Normalized event type:', eventType);

            switch (eventType) {
              case 'MessageSent': {
                // Handle nested structure: {event: 'MessageSent', message: {...}, conversation: {...}}
                const messageData = rawData.message;
                if (!messageData) {
                  console.error(
                    '[SingleChat] MessageSent event missing message data:',
                    rawData
                  );
                  break;
                }
                console.log('[SingleChat] New message received:', messageData);
                // Use handler from closure - will be updated via dependency array
                if (handleNewMessageRef.current) {
                  handleNewMessageRef.current(
                    messageData as MessageSentEventData['message']
                  );
                }
                break;
              }

              case 'MessageRead': {
                // Backend sends: {event: 'MessageRead', message_id: 50, read_by: {id: 3642, type: 'User'}}
                const readData = rawData;
                console.log('[SingleChat] Message read:', readData);
                if (handleMessageReadRef.current) {
                  handleMessageReadRef.current(
                    readData as MessageReadEventData
                  );
                }
                break;
              }

              case 'MessageDelivered': {
                // Backend sends: {event: 'MessageDelivered', message_id: 50, delivered_by: {id: 3642, type: 'User'}}
                const deliveredData = rawData;
                console.log('[SingleChat] Message delivered:', deliveredData);
                if (handleMessageDeliveredRef.current) {
                  handleMessageDeliveredRef.current(
                    deliveredData as MessageDeliveredEventData
                  );
                }
                break;
              }

              case 'ParticipantBlocked': {
                console.log('[SingleChat] Participant blocked:', rawData);
                if (handleParticipantBlockedRef.current) {
                  handleParticipantBlockedRef.current(
                    rawData as ParticipantBlockedEventData
                  );
                }
                break;
              }

              default:
                console.log('[SingleChat] Unhandled event:', eventType);
            }
          } catch (error) {
            console.error('[SingleChat] Error handling Pusher event:', error);
          }
        }
      );

      unsubscribeConversationRef.current = unsubscribe;
      console.log('[SingleChat] ✅ Subscribed to conversation channel');

      // Mark all messages as read after subscription if there are unread messages
      const currentUserId =
        currentUser?.id === 'guardian'
          ? currentUser?.user?.id
          : currentUser?.id;
      const currentUserIdStr =
        currentUserId != null ? String(currentUserId) : null;

      if (currentUserIdStr && conversationData?.participants) {
        const currentUserParticipant = conversationData.participants.find(
          (p: any) => String(p.id) === currentUserIdStr
        );
        const unReadCount = currentUserParticipant?.unread_count || 0;

        if (unReadCount > 0) {
          console.log(
            '[SingleChat] Marking all messages as read for conversation:',
            conversationId,
            'unread_count:',
            unReadCount
          );
          messageServices
            .markAllMessagesAsRead(parseInt(conversationId, 10))
            .then(() => {
              console.log(
                '[SingleChat] ✅ All messages marked as read for conversation:',
                conversationId
              );
            })
            .catch((error) => {
              console.error(
                '[SingleChat] Error marking all messages as read:',
                error
              );
            });
        }
      }
    } catch (error) {
      console.error('[SingleChat] Error setting up Pusher:', error);
    }
  }, [conversationId, conversationData, currentUser]);

  // Handle new message from Pusher
  // Note: messageData is the nested message object from MessageSentEventData
  const handleNewMessage = useCallback(
    (messageData: MessageSentEventData['message']) => {
      const currentUserId =
        currentUser?.id === 'guardian'
          ? currentUser?.user?.id
          : currentUser?.id;

      // Don't add message if it's from current user (already added optimistically)
      if (messageData.sender_id === currentUserId) {
        console.log('[SingleChat] Message from current user, skipping');
        return;
      }

      // Transform event data to Message type
      const message: Message = {
        id: messageData.id,
        conversation_id: messageData.conversation_id,
        body: messageData.body,
        type: messageData.type || 'text',
        sender_type: messageData.sender_type || 'user',
        sender_id: messageData.sender_id,
        created_at: messageData.created_at,
        statuses: messageData.statuses || [],
      };

      // Add new message to list
      setMessages((prevMessages) => {
        // Check if message already exists
        const exists = prevMessages.some((msg) => msg.id === message.id);
        if (exists) {
          console.log('[SingleChat] Message already exists, skipping');
          return prevMessages;
        }

        // Always add the message, even if we're fetching
        // The fetchMessages function will merge and deduplicate
        const newMessages = [message, ...prevMessages];
        const sortedMessages = newMessages.sort((a, b) => {
          const timeA = new Date(a.created_at).getTime();
          const timeB = new Date(b.created_at).getTime();
          return timeB - timeA;
        });

        // Update ref to keep it in sync
        messagesRef.current = sortedMessages;
        return sortedMessages;
      });

      // Mark this specific message as read immediately since user is viewing the chat
      // When User B receives a message from User A while viewing the chat, mark it as read instantly
      if (message.id && !markedAsReadRef.current.has(message.id)) {
        // Add to tracking set immediately to prevent duplicate calls
        markedAsReadRef.current.add(message.id);

        // Call API to mark message as read
        messageServices
          .markMessageAsRead(message.id)
          .then(() => {
            console.log(
              '[SingleChat] ✅ Message marked as read (received while viewing):',
              message.id
            );
          })
          .catch((error) => {
            console.error(
              '[SingleChat] ❌ Error marking message as read:',
              error
            );
            // Remove from set on error so we can retry if needed
            markedAsReadRef.current.delete(message.id);
          });
      }

      // Mark message as delivered
      if (message.id && !markedAsDeliveredRef.current.has(message.id)) {
        // Add to tracking set immediately to prevent duplicate calls
        markedAsDeliveredRef.current.add(message.id);

        messageServices
          .markMessageDelivered(message.id)
          .then(() => {
            console.log(
              '[SingleChat] ✅ Message marked as delivered (received while viewing):',
              message.id
            );
          })
          .catch((error) => {
            console.error(
              '[SingleChat] ❌ Error marking message as delivered:',
              error
            );
            // Remove from set on error so we can retry if needed
            markedAsDeliveredRef.current.delete(message.id);
          });
      }

      // Clear typing indicator when message is received
      setIsOtherUserTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    },
    [currentUser, conversationId]
  );

  // Handle message read status update
  const handleMessageRead = useCallback((data: MessageReadEventData) => {
    console.log('[SingleChat] Updating message read status:', data);

    const readerId = data.read_by?.id;
    const readAt = data.read_at || new Date().toISOString();

    if (!readerId) {
      console.error('[SingleChat] MessageRead event missing read_by.id');
      return;
    }

    setMessages((prevMessages) =>
      prevMessages.map((msg) => {
        if (msg.id === data.message_id) {
          // Find existing status for this reader or create new one
          const existingStatusIndex = msg.statuses?.findIndex(
            (status) => status.participant_id === readerId
          );

          const updatedStatuses =
            existingStatusIndex !== undefined && existingStatusIndex >= 0
              ? // Update existing status
                msg.statuses?.map((status, index) =>
                  index === existingStatusIndex
                    ? { ...status, read_at: readAt }
                    : status
                ) || []
              : // Create new status entry for this reader
                [
                  ...(msg.statuses || []),
                  {
                    participant_type: data.read_by?.type || 'User',
                    participant_id: readerId,
                    delivered_at: null,
                    read_at: readAt,
                  },
                ];

          return {
            ...msg,
            statuses: updatedStatuses,
          };
        }
        return msg;
      })
    );
  }, []);

  // Handle message delivered status update
  const handleMessageDelivered = useCallback(
    (data: MessageDeliveredEventData) => {
      console.log('[SingleChat] Updating message delivered status:', data);

      const deliveredById = data.delivered_by?.id;
      const deliveredAt = data.delivered_at || new Date().toISOString();

      if (!deliveredById) {
        console.error(
          '[SingleChat] MessageDelivered event missing delivered_by.id'
        );
        return;
      }

      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if (msg.id === data.message_id) {
            // Find existing status for this recipient or create new one
            const existingStatusIndex = msg.statuses?.findIndex(
              (status) => status.participant_id === deliveredById
            );

            const updatedStatuses =
              existingStatusIndex !== undefined && existingStatusIndex >= 0
                ? // Update existing status
                  msg.statuses?.map((status, index) =>
                    index === existingStatusIndex
                      ? { ...status, delivered_at: deliveredAt }
                      : status
                  ) || []
                : // Create new status entry for this recipient
                  [
                    ...(msg.statuses || []),
                    {
                      participant_type: data.delivered_by?.type || 'User',
                      participant_id: deliveredById,
                      delivered_at: deliveredAt,
                      read_at: null,
                    },
                  ];

            return {
              ...msg,
              statuses: updatedStatuses,
            };
          }
          return msg;
        })
      );
    },
    []
  );

  // Handle participant blocked event
  const handleParticipantBlocked = useCallback(
    (data: ParticipantBlockedEventData) => {
      console.log('[SingleChat] Participant blocked event:', data);

      const currentUserId =
        currentUser?.id === 'guardian'
          ? currentUser?.user?.id
          : currentUser?.id;

      // Check if current user was blocked
      if (data.blocked_user_id === currentUserId) {
        setIsBlockedYou(true);
        Alert.alert('Blocked', 'You have been blocked by this user.', [
          { text: 'OK' },
        ]);
      } else if (data.blocked_by_id === currentUserId) {
        // Current user blocked someone
        _setIsBlockedByYou(true);
      }
    },
    [currentUser]
  );

  // Update handler refs when handlers are defined
  useEffect(() => {
    handleNewMessageRef.current = handleNewMessage;
    handleMessageReadRef.current = handleMessageRead;
    handleMessageDeliveredRef.current = handleMessageDelivered;
    handleParticipantBlockedRef.current = handleParticipantBlocked;
  }, [
    handleNewMessage,
    handleMessageRead,
    handleMessageDelivered,
    handleParticipantBlocked,
  ]);

  // Keep messagesRef in sync with messages state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Initial fetch and setup Pusher
  // Only run when conversationId changes, not when callbacks are recreated
  useEffect(() => {
    if (conversationId) {
      // Reset messages ref when conversation changes
      messagesRef.current = [];
      fetchMessages();
      setupPusherListeners();

      return () => {
        // Cleanup Pusher subscription
        if (unsubscribeConversationRef.current) {
          unsubscribeConversationRef.current();
          unsubscribeConversationRef.current = null;
        }
        // Clear typing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        // Reset fetching flag
        isFetchingMessagesRef.current = false;
      };
    }
  }, [conversationId]);

  // Mark all unread messages as read individually when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (!conversationId || messages.length === 0) return;

      const currentUserId =
        currentUser?.id === 'guardian'
          ? currentUser?.user?.id
          : currentUser?.id;

      if (!currentUserId) return;

      // Mark each unread message from other users as read and delivered individually
      messages.forEach((message) => {
        // Only mark messages from other users
        if (message.sender_id !== currentUserId && message.id) {
          // Mark as read if not already read
          if (!markedAsReadRef.current.has(message.id)) {
            // Check if message is already read by checking statuses
            const isAlreadyRead = message.statuses?.some(
              (status) =>
                status.participant_id === currentUserId &&
                status.read_at !== null
            );

            if (!isAlreadyRead) {
              markedAsReadRef.current.add(message.id);
              messageServices
                .markMessageAsRead(message.id)
                .then(() => {
                  console.log(
                    '[SingleChat] ✅ Marked message as read on focus:',
                    message.id
                  );
                })
                .catch((error) => {
                  console.error(
                    '[SingleChat] Error marking message as read on focus:',
                    error
                  );
                  // Remove from set on error so we can retry
                  markedAsReadRef.current.delete(message.id);
                });
            } else {
              // Mark as processed even if already read to avoid duplicate checks
              markedAsReadRef.current.add(message.id);
            }
          }

          // Mark as delivered if not already delivered
          if (!markedAsDeliveredRef.current.has(message.id)) {
            // Check if message is already delivered by checking statuses
            const isAlreadyDelivered = message.statuses?.some(
              (status) =>
                status.participant_id === currentUserId &&
                status.delivered_at !== null
            );

            if (!isAlreadyDelivered) {
              markedAsDeliveredRef.current.add(message.id);
              messageServices
                .markMessageDelivered(message.id)
                .then(() => {
                  console.log(
                    '[SingleChat] ✅ Marked message as delivered on focus:',
                    message.id
                  );
                })
                .catch((error) => {
                  console.error(
                    '[SingleChat] Error marking message as delivered on focus:',
                    error
                  );
                  // Remove from set on error so we can retry
                  markedAsDeliveredRef.current.delete(message.id);
                });
            } else {
              // Mark as processed even if already delivered to avoid duplicate checks
              markedAsDeliveredRef.current.add(message.id);
            }
          }
        }
      });
    }, [conversationId, messages, currentUser])
  );

  const { onSendPress } = useSendMessage({
    otherUserData,
    conversationData,
    setConversationData,
    messages,
    setMessages,
    conversationId,
    setConversationId,
    isBlockedByYou,
    setInputMessage,
  });

  useEffect(() => {
    const unsubscribe = props.navigation.addListener('blur', () => {
      evaluateAndMaybeShowRatingPrompt(
        'chat_activity',
        currentUser?.created_at
      );
    });
    return unsubscribe;
  }, [props.navigation, currentUser?.created_at]);

  useEffect(() => {
    const quotes = [
      t('adviceOneText'),
      t('adviceTwoText'),
      t('adviceThreeText'),
      t('adviceFourText'),
      t('adviceFiveText'),
      t('adviceSixText'),
      t('adviceSevenText'),
      t('adviceEightText'),
      t('adviceNineText'),
      t('adviceTenText'),
      t('adviceElevenText'),
      t('adviceTwelveText'),
      t('adviceThirteenText'),
    ];
    setQuote([...quotes].sort(() => Math.random() - 0.5)[0]);
  }, []);

  const onMessagePress = (messageId: number) => {
    if (messageId === messagePressedId) {
      setMessagePressedId(null);
    } else {
      setMessagePressedId(messageId);
    }
  };

  const onInputFocus = () => {
    if (flatListRef?.current) {
      flatListRef?.current?.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const onScrollBegin = () => {
    if (inputRef.current && inputRef.current.isFocused()) {
      inputRef.current.blur();
    }
  };

  const onDisabledInputPress = () => {
    flashInfoMessage(LanguageKeys.disabledChatDescription);
  };

  const onWaliPress = () => {
    props.navigation.navigate('AddWali', { fromSettings: true });
  };

  const handleSubmitEditing = async () => {
    if (inputMessage.trim().length > 0) {
      const res = await onSendPress(inputMessage);

      if (res?.type === 'blockedByYou') {
        Alert.alert(
          `You have blocked ${otherUserData?.name} please unblock first to send message`
        );
      }
    }
  };

  const clearVoiceTimer = () => {
    if (voiceTimerRef.current) {
      clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }
  };

  const startVoiceRecording = async () => {
    try {
      setVoiceElapsedSeconds(0);
      await chatAudioService.startRecording();
      setIsRecordingVoice(true);
      voiceTimerRef.current = setInterval(() => {
        setVoiceElapsedSeconds((seconds) => {
          if (seconds >= 60) {
            clearVoiceTimer();
            return 60;
          }
          return seconds + 1;
        });
      }, 1000);
    } catch (error) {
      flashErrorMessage(LanguageKeys.microphonePermissionDenied);
    }
  };

  const cancelVoiceRecording = async () => {
    clearVoiceTimer();
    await chatAudioService.cancelRecording();
    setIsRecordingVoice(false);
    setVoiceElapsedSeconds(0);
  };

  const sendVoiceRecording = async () => {
    if (isSendingVoice) return;
    setIsSendingVoice(true);
    clearVoiceTimer();
    try {
      const recording = await chatAudioService.stopRecording(
        Math.max(1, voiceElapsedSeconds)
      );
      await onSendPress({
        type: 'audio',
        audio: {
          uri: recording.uri,
          name: recording.name,
          type: recording.type,
        },
        duration_seconds: recording.duration_seconds,
      });
      setIsRecordingVoice(false);
      setVoiceElapsedSeconds(0);
    } finally {
      setIsSendingVoice(false);
    }
  };

  return (
    <Container>
      {/* {(currentUser?.membership_status === 0 ||
        currentUser?.membership_status === null) && (
        <PremiumButton
          heading={LanguageKeys.goPremiumButtonHeadingOne}
          description={LanguageKeys.goPremiumButtonHeadingTwo}
        />
      )} */}

      <SingleChatHeader
        navigation={props?.navigation}
        otherUserData={otherUserData}
        messages={messages}
        conversationData={conversationData}
        conversationId={conversationId}
        currentUserId={currentUser?.id}
        isBlockedByYou={isBlockedByYou}
        isBlockedYou={isBlockedYou}
        setMessages={setMessages}
      />
      <ScrollView
        contentContainerStyle={Styles.innerContainer}
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps={'handled'}
        scrollEnabled={false}
      >
        {guardian ? (
          <Ripple style={Styles.guardianTextWrapper} onPress={onWaliPress}>
            <Text style={Styles.guardianText}>{t('monitoredByWali')}</Text>
          </Ripple>
        ) : currentUser?.gender === 'female' ? (
          <Ripple style={Styles.guardianTextWrapper} onPress={onWaliPress}>
            <Text style={Styles.guardianText}>{t('addAWali')}</Text>
          </Ripple>
        ) : null}

        {/* Typing Indicator */}
        {isOtherUserTyping && (
          <TypingIndicator userName={otherUserData?.name} />
        )}

        <ScrollView
          horizontal
          scrollEnabled={false}
          contentContainerStyle={{ flex: 1 }}
        >
          {loader ? (
            <ActivityIndicator
              color={Colors.primary}
              size={'small'}
              style={{ marginLeft: wp(46) }}
            />
          ) : messages?.length ? (
            <VirtualizedList
              onScrollBeginDrag={onScrollBegin}
              initialNumToRender={10}
              windowSize={15}
              ref={flatListRef}
              data={messages}
              inverted
              renderItem={({ item, index }) => {
                const currentUserId =
                  currentUser?.id === 'guardian'
                    ? currentUser?.user?.id
                    : currentUser?.id;

                return (
                  <MessageBubble
                    item={item}
                    index={index}
                    currentUserId={currentUserId}
                    guardianUserId={currentUser?.user?.id}
                    otherUserId={otherUserData?.id}
                    otherUserImage={otherUserData?.image}
                    isBlockedYou={isBlockedYou}
                    messages={messages}
                    messagePressedId={messagePressedId}
                    onMessagePress={onMessagePress}
                    Styles={Styles}
                  />
                );
              }}
              contentContainerStyle={Styles.messagesListContainer}
              getItem={(data, index) => data[index]}
              getItemCount={(data) => data.length}
              keyExtractor={(item: any, index: any) => index}
            />
          ) : (
            <View style={Styles.textContainer}>
              <Image
                source={Images.quotesIcon}
                resizeMode="contain"
                style={Styles.logo}
              />
              <Text style={Styles.subText}>{quote?.split('|')[0]}</Text>
              <Text style={[Styles.subText, { fontWeight: 'bold' }]}>
                {quote?.split('|')[1]}
              </Text>
            </View>
          )}
        </ScrollView>
        {isRecordingVoice ? (
          <VoiceRecorderBar
            elapsedSeconds={voiceElapsedSeconds}
            isSending={isSendingVoice}
            onCancel={cancelVoiceRecording}
            onSend={sendVoiceRecording}
          />
        ) : (
          <View
            style={{
              ...Styles.messageInputOuter,
              flexDirection: Rtl ? 'row-reverse' : 'row',
            }}
          >
            <TextInput
              ref={inputRef}
              style={{
                ...Styles.messageInput,
                textAlign: Rtl ? 'right' : 'left',
              }}
              placeholder={t('message')}
              placeholderTextColor={Colors.muted}
              value={inputMessage}
              onChangeText={onChangeInputMessage}
              onFocus={onInputFocus}
              onSubmitEditing={handleSubmitEditing}
              maxLength={350}
              submitBehavior="blurAndSubmit"
              returnKeyType="send"
            />
            <TouchableOpacity
              style={{
                ...Styles.sendBtn,
                backgroundColor:
                  inputMessage.trim().length === 0
                    ? Colors.primaryLite
                    : Colors.primary,
              }}
              onPress={async () => {
                if (inputMessage.trim().length === 0) {
                  await startVoiceRecording();
                  return;
                }
                const res = await onSendPress(inputMessage);

                if (res?.type === 'blockedByYou') {
                  Alert.alert(
                    `You have blocked ${otherUserData?.name} please unblock first to send message`
                  );
                }
              }}
            >
              <Ionicons
                name={inputMessage.trim().length === 0 ? 'mic' : 'send'}
                size={wp(4.6)}
                color={Colors.color2}
                style={{
                  marginLeft: Rtl ? 0 : wp(0.5),
                  marginRight: Rtl ? wp(0.5) : 0,
                  transform: Rtl ? [{ scaleX: -1 }] : [],
                }}
              />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </Container>
  );
};

export default SingleChat;
