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
import type { Message } from '../../services/api/types/message-types';
import MessageBubble from './components/MessageBubble';
import { useSendMessage } from './hooks/useSendMessage';
import Styles from './SingleChat.styles';
import SingleChatHeader from './SingleChatHeader';

const POLLING_INTERVAL = 30000; // 5 seconds for messages
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
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const [inputMessage, setInputMessage] = useState('');
  const onChangeInputMessage = (text: string) => {
    setInputMessage(text);
  };

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

        setLoader(false);
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

    try {
      const conversationIdNum = parseInt(conversationId, 10);
      if (isNaN(conversationIdNum)) return;

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
    } catch (error: unknown) {
      console.error('[SingleChat.fetchMessages] Error:', error);
      setLoader(false);
      // Don't show error toast for polling failures, only log
    }
  }, [conversationId]);

  const startPolling = useCallback(() => {
    if (!conversationId) return;

    // Fetch immediately
    fetchMessages();

    // Set up polling interval
    pollingIntervalRef.current = setInterval(() => {
      fetchMessages();
    }, POLLING_INTERVAL);
  }, [conversationId, fetchMessages]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Poll messages when conversationId is available
  useEffect(() => {
    if (conversationId) {
      startPolling();
      return () => {
        stopPolling();
      };
    }
  }, [conversationId, startPolling, stopPolling]);

  // Mark all messages as read and start polling when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (conversationId) {
        startPolling();

        // Mark all messages as read when conversation is opened
        const conversationIdNum = parseInt(conversationId, 10);
        if (!isNaN(conversationIdNum)) {
          messageServices
            .markAllMessagesAsRead(conversationIdNum)
            .catch((error) => {
              // Silently fail - don't show error to user for read receipts
              console.error('[SingleChat.markAllMessagesAsRead] Error:', error);
            });
        }
      }
      return () => {
        stopPolling();
      };
    }, [conversationId, startPolling, stopPolling])
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
                // Handle guardian case - same logic as Messages.tsx
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
