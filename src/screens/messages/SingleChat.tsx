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

import pusherService from '@/services/pusher';

import { Container, PremiumButton } from '../../components';
import { wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Images } from '../../res';
import {
  ApiServices,
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
  TypingEventData,
} from '../../services/api/types/message-types';
import MessageBubble from './components/MessageBubble';
import TypingIndicator from './components/TypingIndicator';
import { useSendMessage } from './hooks/useSendMessage';
import Styles from './SingleChat.styles';
import SingleChatHeader from './SingleChatHeader';

const TYPING_INDICATOR_TIMEOUT = 3000;
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

  const [inputMessage, setInputMessage] = useState('');
  const onChangeInputMessage = (text: string) => {
    setInputMessage(text);
    // Send typing indicator when user types
    handleTypingIndicator(text);
  };

  // Handle typing indicator
  const handleTypingIndicator = useCallback(
    (text: string) => {
      if (!conversationId) return;

      const now = Date.now();
      // Throttle typing events - only send every 1 second
      if (now - lastTypingEventRef.current < 1000) return;

      lastTypingEventRef.current = now;

      // if (text.length > 0) {
      //   // User is typing - trigger typing indicator via API
      //   messageServices
      //     .sendTypingIndicator(parseInt(conversationId, 10), true)
      //     .catch((err) =>
      //       console.error('[SingleChat] Error sending typing indicator:', err)
      //     );
      // } else {
      //   // User stopped typing
      //   messageServices
      //     .sendTypingIndicator(parseInt(conversationId, 10), false)
      //     .catch((err) =>
      //       console.error('[SingleChat] Error sending stop typing:', err)
      //     );
      // }
    },
    [conversationId]
  );

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

    // Set loader to true when starting to fetch messages
    setLoader(true);

    try {
      const conversationIdNum = parseInt(conversationId, 10);
      if (isNaN(conversationIdNum)) {
        setLoader(false);
        return;
      }

      const fetchedMessages = await messageServices.getConversationMessages(
        conversationIdNum,
        { per_page: 50 }
      );

      // Sort messages by created_at (newest first) for inverted list
      const sortedMessages = [...fetchedMessages].sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return timeB - timeA; // Descending order (newest first)
      });
      setMessages(sortedMessages);
      setLoader(false);

      // Reset the marked as read tracking when messages are fetched
      // This ensures we can mark messages as read when screen is focused
      markedAsReadRef.current.clear();
    } catch (error: unknown) {
      console.error('[SingleChat.fetchMessages] Error:', error);
      setLoader(false);
    }
  }, [conversationId]);

  // Setup Pusher real-time listeners for this conversation
  const setupPusherListeners = useCallback(async () => {
    if (!conversationId || !pusherService.isReady()) {
      console.log('[SingleChat] Pusher not ready or no conversation ID');
      return;
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
                const messageData = rawData.message || rawData;
                console.log('[SingleChat] New message received:', messageData);
                handleNewMessage(messageData as MessageSentEventData);
                break;
              }

              case 'MessageRead': {
                // Backend sends: {event: 'MessageRead', message_id: 50, read_by: {id: 3642, type: 'User'}}
                const readData = rawData;
                console.log('[SingleChat] Message read:', readData);
                handleMessageRead(readData as MessageReadEventData);
                break;
              }

              case 'MessageDelivered': {
                // Backend sends: {event: 'MessageDelivered', message_id: 50, delivered_by: {id: 3642, type: 'User'}}
                const deliveredData = rawData;
                console.log('[SingleChat] Message delivered:', deliveredData);
                handleMessageDelivered(
                  deliveredData as MessageDeliveredEventData
                );
                break;
              }

              case 'ParticipantBlocked': {
                console.log('[SingleChat] Participant blocked:', rawData);
                handleParticipantBlocked(
                  rawData as ParticipantBlockedEventData
                );
                break;
              }

              case 'client-typing': {
                console.log('[SingleChat] User typing:', rawData);
                handleTypingEvent(rawData as TypingEventData);
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
    } catch (error) {
      console.error('[SingleChat] Error setting up Pusher:', error);
    }
  }, [conversationId]);

  // Handle new message from Pusher
  const handleNewMessage = useCallback(
    (messageData: MessageSentEventData) => {
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
        body: messageData.body || messageData.message || '',
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

        const newMessages = [message, ...prevMessages];
        return newMessages.sort((a, b) => {
          const timeA = new Date(a.created_at).getTime();
          const timeB = new Date(b.created_at).getTime();
          return timeB - timeA;
        });
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
      if (message.id) {
        messageServices.markMessageDelivered(message.id).catch((error) => {
          console.error(
            '[SingleChat] Error marking message as delivered:',
            error
          );
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

  // Handle typing indicator event
  const handleTypingEvent = useCallback(
    (data: TypingEventData) => {
      const currentUserId =
        currentUser?.id === 'guardian'
          ? currentUser?.user?.id
          : currentUser?.id;

      // Only show typing indicator if it's from other user
      if (data.user_id !== currentUserId) {
        setIsOtherUserTyping(data.is_typing);

        // Auto-hide typing indicator after timeout
        if (data.is_typing) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setIsOtherUserTyping(false);
          }, TYPING_INDICATOR_TIMEOUT);
        } else {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
        }
      }
    },
    [currentUser]
  );

  // Initial fetch and setup Pusher
  useEffect(() => {
    if (conversationId) {
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
      };
    }
  }, [conversationId, fetchMessages, setupPusherListeners]);

  // Mark all unread messages as read individually when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (!conversationId || messages.length === 0) return;

      const currentUserId =
        currentUser?.id === 'guardian'
          ? currentUser?.user?.id
          : currentUser?.id;

      if (!currentUserId) return;

      // Mark each unread message from other users as read individually
      messages.forEach((message) => {
        // Only mark messages from other users that haven't been marked yet
        if (
          message.sender_id !== currentUserId &&
          message.id &&
          !markedAsReadRef.current.has(message.id)
        ) {
          // Check if message is already read by checking statuses
          const isAlreadyRead = message.statuses?.some(
            (status) =>
              status.participant_id === currentUserId && status.read_at !== null
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

  return (
    <Container>
      {(currentUser?.membership_status === 0 ||
        currentUser?.membership_status === null) && (
        <PremiumButton
          heading={LanguageKeys.goPremiumButtonHeadingOne}
          description={LanguageKeys.goPremiumButtonHeadingTwo}
        />
      )}

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
              color={Colors.theme}
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
            placeholderTextColor={Colors.color15}
            multiline
            value={inputMessage}
            onChangeText={onChangeInputMessage}
            onFocus={onInputFocus}
            maxLength={350}
          />
          <TouchableOpacity
            style={{
              ...Styles.sendBtn,
              backgroundColor:
                inputMessage.trim().length === 0
                  ? Colors.themeRGBA50
                  : Colors.theme,
            }}
            onPress={async () => {
              const res = await onSendPress(inputMessage);

              if (res?.type === 'blockedByYou') {
                Alert.alert(
                  `You have blocked ${otherUserData?.name} please unblock first to send message`
                );
              }
            }}
            disabled={inputMessage.trim().length === 0 ? true : false}
          >
            {Rtl ? (
              <Image
                source={Images.sendLeft}
                resizeMode="contain"
                style={[Styles.sendIcon, { marginRight: wp(0.5) }]}
              />
            ) : (
              <Image
                source={Images.sendRight}
                resizeMode="contain"
                style={[Styles.sendIcon, { marginLeft: wp(0.5) }]}
              />
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Container>
  );
};

export default SingleChat;
