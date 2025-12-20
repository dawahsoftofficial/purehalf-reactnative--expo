import { useFocusEffect } from '@react-navigation/native';
import _ from 'lodash';
import React, {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
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
import { hp, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Images } from '../../res';
import {
  ApiServices,
  flashInfoMessage,
  getTimeStamp,
  StorageManager,
  useGlobalContext,
} from '../../services';
import MessageBubble from './components/MessageBubble';
import { useConversationRealtime } from './hooks/useConversationRealtime';
import { useMessagePagination } from './hooks/useMessagePagination';
import { useReadReceipts } from './hooks/useReadReceipts';
import { useSendMessage } from './hooks/useSendMessage';
import Styles from './SingleChat.styles';
import SingleChatHeader from './SingleChatHeader';
const SingleChat = (props: any) => {
  const Rtl = CheckRtl();
  const { setData, storageKeys } = StorageManager;
  const flatListRef: any = useRef(null);
  const inputRef: any = useRef(null);
  const [chatOpenTimeStamp, setChatOpenTimeStamp] = useState<number | null>(
    null
  );
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const { t }: any = useTranslation();
  const { currentUser, conversations, updateCurrentUser } = useGlobalContext();
  const fromNotification =
    props?.route?.params?.from === 'notification' ? true : false;
  const fromMessages = props?.route?.params?.from === 'messages' ? true : false;
  const guardian = currentUser?.guardian ? currentUser?.guardian : false;
  const [otherUserData, setOtherUserData] = useState(
    props?.route?.params?.otherUserData
  );
  const [isBlockedByYou, setIsBlockedByYou] = useState(false);
  const [isBlockedYou, setIsBlockedYou] = useState<any>(false);
  const [listReachedStart, setListReachedStart] = useState(true);
  const [loader, setLoader] = useState(true);
  const [messagePressedId, setMessagePressedId] = useState(null);
  const [quote, setQuote] = useState('');

  const [messages, setMessages] = useState<any>([]);
  const [lastDeletedByFound, setLastDeletedByFound] = useState(false);
  const [totalMessages, setTotalMessages] = useState([]);
  const [conversationData, setConversationData] = useState<any>('');
  const [conversationId, setConversationId] = useState('');

  const [inputMessage, setInputMessage] = useState('');
  const messagesRef: any = useRef(messages);
  const { handleReadBy } = useReadReceipts({
    currentUserId: currentUser?.id,
    otherUserId: otherUserData?.id,
    setConversationData,
  });
  const onChangeInputMessage = (text: any) => {
    setInputMessage(text);
  };

  const handleLastDeletedBy = (
    messages: any,
    lastDeleted = lastDeletedByFound
  ) => {
    return new Promise(async (resolve) => {
      messages = await _.reject(
        messages,
        (message) =>
          _.get(message, `blockedParticipants.${otherUserData?.id}`) === true
      );
      const lastDeletedByIndex: any = _.findIndex(messages, (message: any) => {
        return (
          message.deletedBy &&
          message.deletedBy[currentUser?.id] &&
          message.deletedBy[currentUser?.id] === true
        );
      });
      if (lastDeleted) {
        resolve('ignore');
      } else if (lastDeletedByIndex !== -1) {
        setLastDeletedByFound(true);
        messages = _.take(messages, lastDeletedByIndex);
        resolve(messages);
      } else {
        resolve(messages);
      }
    });
  };
  const { footerLoading, handleEndReached, resetToFirstPage } =
    useMessagePagination({
      totalMessages,
      messages,
      setMessages,
      handleLastDeletedBy,
      listReachedStart,
      setListReachedStart,
      setLastDeletedByFound,
    });

  const getOtherUserData = async () => {
    if (currentUser?.id === 'guardian') {
      const response = await ApiServices.getUserDetailGuardian(
        otherUserData?.id
      );
      const fcmToken = response?.fcm_token || [];
      setOtherUserData((otherUserData: any) => {
        otherUserData.token = fcmToken
          ?.map((item: any) => item?.fcm_token)
          .filter((token: any) => token !== undefined && token !== null);
        return otherUserData;
      });
    } else {
      ApiServices.getUserDetail(otherUserData?.id).then((res: any) => {
        if (res?.fcm_token) {
          setOtherUserData((otherUserData: any) => {
            otherUserData.token = res?.fcm_token
              ?.map((item: any) => item?.fcm_token)
              .filter((token: any) => token !== undefined && token !== null);
            return otherUserData;
          });
        }
      });
    }
  };

  useEffect(() => {
    if (fromMessages) {
      getOtherUserData();
    } else if (fromNotification) {
      setLoader(false);
      const conversationId = props?.route?.params?.conversationId;
      const message = props?.route?.params?.message;

      const conversationData = conversations.filter((element: any) => {
        if (element?.convDetails?.id === conversationId) {
          if (!element.messages[message?.id]) {
            element.messages = {
              [message?.id]: message,
              ...element.messages,
            };
          }
          return true;
        }
        return false;
      });

      if (conversationData && conversationData?.length !== 0) {
        setConversationId(conversationId);
        props.route.params.conversationData = conversationData[0];
      } else {
        setLoader(false);
      }
      getOtherUserData();
    }
  }, []);

  useEffect(() => {
    const conversationData = props?.route?.params?.conversationData;
    if (
      conversationData &&
      Object.keys(conversationData?.convDetails).length !== 0
    ) {
      const { convDetails, messages } = conversationData;
      setConversationData(convDetails);

      const messagesArray: any = messages
        ? _.orderBy(Object.values(messages), ['createdAt'], ['desc'])
        : [];
      setTotalMessages(messagesArray);

      if (messagesArray.length === 0) {
        setLoader(false);
      } else {
        const last15Messages = _.slice(messagesArray, 0, 15);
        handleLastDeletedBy(last15Messages)
          .then(async (res: any) => {
            if (res !== 'ignore') {
              setMessages(res);
              await handleReadBy(convDetails, res);
            }
          })
          .finally(() => setLoader(false));
      }

      setConversationId(convDetails?.id);
      setIsBlockedByYou(
        convDetails?.participantsBlockFlag?.[otherUserData?.id]?.blockStatus ===
          true
      );
      setIsBlockedYou(
        convDetails?.participantsBlockFlag?.[currentUser?.id]?.blockStatus ===
          true
      );
    } else if (!fromNotification) {
      setLoader(false);
    }
  }, [props?.route?.params?.conversationData]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const setOpenedConversation = async (conversationId: any) => {
    await setData(storageKeys.OPENED_CONVERSATION_ID, conversationId);
  };

  // Initialize chatOpenTimeStamp
  useEffect(() => {
    const initializeTimestamp = async () => {
      const timestamp = await getTimeStamp();
      setChatOpenTimeStamp(timestamp);
    };
    initializeTimestamp();
  }, []);

  useConversationRealtime({
    conversationId,
    chatOpenTimeStamp,

    currentUserId: currentUser?.id,
    otherUserId: otherUserData?.id,

    conversationData,

    setMessages,
    messagesRef,

    setConversationData,
    setIsBlockedYou,
    setIsBlockedByYou,

    setOpenedConversation: async (id) => {
      await setOpenedConversation(id);
    },
    clearOpenedConversation: async () => {
      await setData(storageKeys.OPENED_CONVERSATION_ID, null);
    },

    handleReadBy,
    forceUpdate,
  });
  const { onSendPress } = useSendMessage({
    currentUser,
    otherUserData,

    conversationData,
    setConversationData,

    messages,
    setMessages,

    setConversationId,

    isBlockedYou,
    isBlockedByYou,

    setInputMessage,

    updateCurrentUser,
    setData,
    storageKeys,

    navigation: props.navigation,
    forceUpdate,
  });

  // Add focus effect to refresh messages when screen comes back into focus
  useFocusEffect(
    useCallback(() => {
      if (conversationId?.length !== 0) {
        // Find the current conversation in the global context
        const currentConversation = conversations.find(
          (conv: any) => conv?.convDetails?.id === conversationId
        );

        if (currentConversation) {
          const { convDetails, messages: convMessages } = currentConversation;

          // Update conversation data
          setConversationData(convDetails);

          // Process messages
          const messagesArray = convMessages
            ? _.orderBy(Object.values(convMessages), ['createdAt'], ['desc'])
            : [];

          setTotalMessages(messagesArray as any);

          if (messagesArray.length > 0) {
            const last15Messages = _.slice(messagesArray, 0, 15);
            handleLastDeletedBy(last15Messages).then(async (res: any) => {
              if (res !== 'ignore') {
                setMessages(res);
                if (convDetails?.length !== 0) {
                  await handleReadBy(convDetails, res);
                }
                forceUpdate();
              }
            });
          }
        }
      }

      return () => {
        // Cleanup if needed
      };
    }, [conversationId, conversations])
  );

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

  const onMessagePress = (messageId: any) => {
    if (messageId === messagePressedId) {
      setMessagePressedId(null);
      forceUpdate();
    } else {
      setMessagePressedId(messageId);
      forceUpdate();
    }
  };

  const FooterLoader = () =>
    footerLoading ? (
      <ActivityIndicator
        color={Colors.theme}
        style={{ marginVertical: hp(2) }}
      />
    ) : null;

  const onInputFocus = () => {
    if (flatListRef?.current) {
      flatListRef?.current?.scrollToOffset({ offset: 0, animated: true });
    }
    resetToFirstPage().catch(() => {});
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
        currentUserId={currentUser?.id}
        isBlockedByYou={isBlockedByYou}
        isBlockedYou={isBlockedYou}
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
              renderItem={({ item, index }) => (
                <MessageBubble
                  item={item}
                  index={index}
                  currentUserId={currentUser?.id}
                  guardianUserId={currentUser?.user?.id}
                  otherUserId={otherUserData?.id}
                  otherUserImage={otherUserData?.image}
                  isBlockedYou={isBlockedYou}
                  messages={messages}
                  messagePressedId={messagePressedId}
                  onMessagePress={onMessagePress}
                  Styles={Styles}
                />
              )}
              contentContainerStyle={Styles.messagesListContainer}
              onEndReachedThreshold={0.1}
              onEndReached={handleEndReached}
              ListFooterComponent={FooterLoader}
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
            value={
              messages?.length === 1 && messages[0]?.sender === currentUser?.id
                ? ''
                : inputMessage
            }
            onChangeText={onChangeInputMessage}
            onFocus={onInputFocus}
            editable={
              messages?.length === 1 && messages[0]?.sender === currentUser?.id
                ? false
                : true
            }
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
          {messages?.length === 1 &&
            messages[0]?.sender === currentUser?.id && (
              <TouchableOpacity
                style={Styles.disabledInputCon}
                onPress={onDisabledInputPress}
              />
            )}
        </View>
      </ScrollView>
    </Container>
  );
};

export default SingleChat;
