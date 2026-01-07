import { useFocusEffect } from '@react-navigation/native';
import { CommonActions as CommonActionsNavigation } from '@react-navigation/native';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text as ReactText,
  View,
  VirtualizedList,
} from 'react-native';
import Ripple from 'react-native-material-ripple';
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
} from 'react-native-popup-menu';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import ChatCreditsBadge from '@/components/badges/chat-credits-badge';
import pusherService from '@/services/pusher';

import {
  AnimatedLoader,
  Container,
  Header,
  ModalLoader,
  PurchaseSuccessModal,
  Text,
} from '../../components';
import { hp, Typography, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { CommonActions } from '../../navigation';
import { Colors, Fonts, Images } from '../../res';
import {
  ApiServices,
  flashErrorMessage,
  flashSuccessMessage,
  formatDate,
  StorageManager,
  useGlobalContext,
} from '../../services';
import messageServices from '../../services/api/message-services';
import type {
  Conversation,
  ConversationUpdatedEventData,
  NewConversationCreatedEventData,
  UnreadConversationCounterEventData,
} from '../../services/api/types/message-types';
import { presentChatCreditsPaywall } from '../../services/paywall-service';
import { canCollectChatCredits } from '../../services/utils/chat-credits-utils';
import { useConversationStore, usePremiumStore } from '../../stores';

type MessagesProps = {
  navigation: {
    navigate: (screen: string, params?: unknown) => void;
    dispatch: (action: unknown) => void;
  };
};

const Messages = (props: MessagesProps) => {
  const { t } = useTranslation();
  const { deleteAll } = StorageManager;
  const Rtl = CheckRtl();
  const [modalLoader, setModalLoader] = useState({
    visible: false,
    message: '',
  });
  const [quote, setQuote] = useState('');
  const [chatCreditsSuccessModalVisible, setChatCreditsSuccessModalVisible] =
    useState<boolean>(false);
  const [isChatCreditsLoading, setIsChatCreditsLoading] =
    useState<boolean>(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setData, storageKeys } = StorageManager;
  const { currentUser, updateCurrentUser, language } = useGlobalContext();
  const isPremium = usePremiumStore((state) => state.isPremium);
  const unsubscribeUserChannelRef = useRef<(() => void) | null>(null);
  const subscribedUserIdRef = useRef<string | number | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const data = await messageServices.getConversationsList();
      setConversations(data);
      setIsLoading(false);
    } catch (error: unknown) {
      console.error('[Messages.fetchConversations] Error:', error);
      setIsLoading(false);
    }
  }, []);

  // Get store actions
  const setUnreadCounts = useConversationStore(
    (state) => state.setUnreadCounts
  );
  const resetConversationStore = useConversationStore((state) => state.reset);

  // Handle new conversation created event
  const handleNewConversationCreated = useCallback(
    (data: NewConversationCreatedEventData) => {
      const conversationData = data.conversation;

      console.log('[Messages] New conversation created:', conversationData.id);

      // Check if conversation has participants, if not, fetch full list
      if (
        !conversationData.participants ||
        conversationData.participants.length === 0
      ) {
        console.log(
          '[Messages] New conversation missing participants, fetching conversations'
        );
        fetchConversations();
        return;
      }

      setConversations((prevConversations) => {
        // Check if conversation already exists
        const exists = prevConversations.some(
          (c) => c.id === conversationData.id
        );

        if (exists) {
          console.log(
            '[Messages] Conversation already exists, updating:',
            conversationData.id
          );
          return prevConversations
            .map((c) => (c.id === conversationData.id ? conversationData : c))
            .sort((a, b) => {
              // Sort by last message time (most recent first)
              const timeA = new Date(a.last_message_at).getTime();
              const timeB = new Date(b.last_message_at).getTime();
              return timeB - timeA;
            });
        }

        // Add new conversation at the top
        console.log(
          '[Messages] Adding new conversation to list:',
          conversationData.id
        );
        return [conversationData, ...prevConversations].sort((a, b) => {
          // Sort by last message time (most recent first)
          const timeA = new Date(a.last_message_at).getTime();
          const timeB = new Date(b.last_message_at).getTime();
          return timeB - timeA;
        });
      });
    },
    [fetchConversations]
  );

  // Handle conversation updated event
  const handleConversationUpdated = useCallback(
    (data: ConversationUpdatedEventData) => {
      const conversationData = data.conversation;

      setConversations((prevConversations) => {
        // Check if conversation already exists
        const exists = prevConversations.some(
          (c) => c.id === conversationData.id
        );

        if (exists) {
          // Update existing conversation
          console.log(
            '[Messages] Updating existing conversation:',
            conversationData.id,
            'update_type:',
            data.update_type
          );
          return prevConversations
            .map((c) => (c.id === conversationData.id ? conversationData : c))
            .sort((a, b) => {
              // Sort by last message time (most recent first)
              const timeA = new Date(a.last_message_at).getTime();
              const timeB = new Date(b.last_message_at).getTime();
              return timeB - timeA;
            });
        }

        // Add new conversation at the top
        console.log('[Messages] Adding new conversation:', conversationData.id);
        return [conversationData, ...prevConversations].sort((a, b) => {
          // Sort by last message time (most recent first)
          const timeA = new Date(a.last_message_at).getTime();
          const timeB = new Date(b.last_message_at).getTime();
          return timeB - timeA;
        });
      });
    },
    []
  );

  // Handle unread conversation counter event
  const handleUnreadConversationCounter = useCallback(
    (data: UnreadConversationCounterEventData) => {
      const { participant } = data;
      const unreadConversationsCount =
        participant.unread_conversations_count || 0;
      const unreadMessagesCount =
        typeof participant.unread_messages_count === 'string'
          ? parseInt(participant.unread_messages_count, 10) || 0
          : participant.unread_messages_count || 0;

      console.log(
        '[Messages] Unread conversation counter updated:',
        unreadConversationsCount,
        'conversations,',
        unreadMessagesCount,
        'messages'
      );

      setUnreadCounts(unreadConversationsCount, unreadMessagesCount);
    },
    [setUnreadCounts]
  );

  // Extract userId using useMemo to avoid unnecessary re-renders
  const userId = useMemo(() => {
    return currentUser?.id === 'guardian'
      ? currentUser?.user?.id
      : currentUser?.id;
  }, [currentUser?.id, currentUser?.user?.id]);

  // Setup Pusher real-time updates for user channel
  const setupPusherListeners = useCallback(async () => {
    if (!pusherService.isReady()) {
      console.log('[Messages] Pusher not ready');
      return;
    }

    if (!userId) {
      console.log('[Messages] No user ID available');
      // Cleanup if we were subscribed to a different user
      if (
        unsubscribeUserChannelRef.current &&
        subscribedUserIdRef.current !== userId
      ) {
        unsubscribeUserChannelRef.current();
        unsubscribeUserChannelRef.current = null;
        subscribedUserIdRef.current = null;
      }
      return;
    }

    // If already subscribed to the same user, don't resubscribe
    if (
      subscribedUserIdRef.current === userId &&
      unsubscribeUserChannelRef.current
    ) {
      console.log(
        '[Messages] Already subscribed to inbox channel for user:',
        userId
      );
      return;
    }

    try {
      // Cleanup previous subscription if switching users
      if (
        unsubscribeUserChannelRef.current &&
        subscribedUserIdRef.current !== userId
      ) {
        console.log(
          '[Messages] Unsubscribing from previous user:',
          subscribedUserIdRef.current
        );
        unsubscribeUserChannelRef.current();
        unsubscribeUserChannelRef.current = null;
      }

      console.log('[Messages] Setting up Pusher for user:', userId);

      // Subscribe to user inbox channel: private-user.inbox.{userId}
      const inboxChannelName = `private-user.inbox.${userId}`;

      const unsubscribeInbox = await pusherService.subscribeToChannel(
        inboxChannelName,
        (event) => {
          console.log('[Messages] Pusher event received:', event.eventName);

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

            console.log('[Messages] Normalized event type:', eventType);

            // Handle different event types
            if (eventType === 'NewConversationCreated') {
              console.log('[Messages] New conversation created:', rawData);
              handleNewConversationCreated(
                rawData as NewConversationCreatedEventData
              );
            } else if (eventType === 'ConversationUpdated') {
              console.log('[Messages] Conversation updated:', rawData);
              handleConversationUpdated(
                rawData as ConversationUpdatedEventData
              );
            } else if (eventType === 'UnreadConversationCounter') {
              console.log('[Messages] Unread conversation counter:', rawData);
              handleUnreadConversationCounter(
                rawData as UnreadConversationCounterEventData
              );
            } else {
              console.log(
                '[Messages] Ignoring event on user channel:',
                eventType
              );
            }
          } catch (error) {
            console.error('[Messages] Error handling Pusher event:', error);
          }
        }
      );

      unsubscribeUserChannelRef.current = unsubscribeInbox;
      subscribedUserIdRef.current = userId;
      console.log('[Messages] ✅ Subscribed to user inbox channel');
    } catch (error) {
      console.error('[Messages] Error setting up Pusher:', error);
      subscribedUserIdRef.current = null;
    }
  }, [
    userId,
    handleNewConversationCreated,
    handleConversationUpdated,
    handleUnreadConversationCounter,
  ]);

  // Setup Pusher when component mounts and screen is focused
  useEffect(() => {
    if (userId) {
      setupPusherListeners();

      return () => {
        // Only cleanup on unmount or when userId actually changes
        // This cleanup will run when the component unmounts or userId changes
        if (
          unsubscribeUserChannelRef.current &&
          subscribedUserIdRef.current !== userId
        ) {
          console.log(
            '[Messages] Cleanup: Unsubscribing from user:',
            subscribedUserIdRef.current
          );
          unsubscribeUserChannelRef.current();
          unsubscribeUserChannelRef.current = null;
          subscribedUserIdRef.current = null;
        }
      };
    }
    // Only depend on userId to avoid resubscribing when currentUser object reference changes
    // but userId remains the same
  }, [userId, setupPusherListeners]);

  useFocusEffect(
    React.useCallback(() => {
      // Fetch conversations on focus
      fetchConversations();

      // Collect chat credits for premium members when screen is focused (once per 24 hours)
      const isUserPremium = isPremium();
      console.log(
        '[Messages.useFocusEffect] last_chat_credit_collected_at:',
        currentUser?.last_chat_credit_collected_at
      );
      const canCollect = canCollectChatCredits(
        currentUser?.last_chat_credit_collected_at
      );
      console.log(
        '[Messages.useFocusEffect] Premium check:',
        isUserPremium,
        'Can collect:',
        canCollect
      );

      if (isUserPremium && canCollect) {
        const collectCredits = async () => {
          try {
            await ApiServices.collectChatCredits();
            // Refresh user data to get updated chat credits and last_chat_credit_collected_at
            // try {
            //   const refreshedUser =
            //     (await ApiServices.getCurrentUserDetail()) as typeof currentUser;
            //   if (refreshedUser) {
            //     updateCurrentUser(refreshedUser);
            //     await setData(storageKeys.USER, refreshedUser);
            //   }
            // } catch (refreshError) {
            //   console.error(
            //     '[Messages] Error refreshing user data after collect:',
            //     refreshError
            //   );
            // }
          } catch (error) {
            // Silently handle error - don't block screen from loading
            console.error('[Messages] Error collecting chat credits:', error);
          }
        };
        collectCredits();
      }

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
    }, [
      fetchConversations,
      t,
      isPremium,
      updateCurrentUser,
      setData,
      storageKeys.USER,
    ])
  );

  const hideModalLoader = () => {
    setModalLoader({
      visible: false,
      message: '',
    });
  };

  const onChatCreditsPress = async () => {
    setIsChatCreditsLoading(true);
    try {
      const result = await presentChatCreditsPaywall();
      if (result.success) {
        setChatCreditsSuccessModalVisible(true);
      } else if (
        result.error &&
        result.error !== 'Purchase cancelled by user'
      ) {
        flashErrorMessage(result.error || 'Failed to purchase chat credits');
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to purchase chat credits';
      flashErrorMessage(errorMessage);
    } finally {
      setIsChatCreditsLoading(false);
    }
  };

  const onChatCreditsSuccessCollect = () => {
    setChatCreditsSuccessModalVisible(false);

    flashSuccessMessage('Chat credits added successfully!');
  };

  const onLogoutPress = async () => {
    setModalLoader({
      visible: true,
      message: LanguageKeys.loggingOut,
    });

    // Cleanup Pusher
    if (unsubscribeUserChannelRef.current) {
      unsubscribeUserChannelRef.current();
      unsubscribeUserChannelRef.current = null;
    }

    await ApiServices.logoutGuardian().catch(hideModalLoader);
    await deleteAll()
      .then(async () => {
        updateCurrentUser(null);
        resetConversationStore(); // Reset unread counts on logout
        await setData(storageKeys.LANGUAGE, language);
        hideModalLoader();
        props.navigation.dispatch(
          CommonActionsNavigation.reset({
            index: 1,
            routes: [{ name: 'AuthWelcome' }],
          })
        );
      })
      .catch(hideModalLoader);
  };

  const onItemPress = (item: Conversation) => {
    const currentUserId =
      currentUser?.id === 'guardian' ? currentUser?.user?.id : currentUser?.id;
    const currentUserIdStr =
      currentUserId != null ? String(currentUserId) : null;

    const otherParticipant = item?.participants?.find(
      (p) => String(p.id) !== currentUserIdStr
    );

    props.navigation.navigate('SingleChat', {
      conversationData: item,
      otherUserData: otherParticipant,
      from: 'messages',
    });
  };

  const renderConversations = ({ item }: { item: Conversation }) => {
    const currentUserId =
      currentUser?.id === 'guardian' ? currentUser?.user?.id : currentUser?.id;
    const currentUserIdStr =
      currentUserId != null ? String(currentUserId) : null;

    const otherParticipant = item?.participants?.find(
      (p) => String(p.id) !== currentUserIdStr
    );

    if (!otherParticipant) {
      return null;
    }

    const formattedDate = formatDate(item.last_message_at);
    // Get unread count from current user's participant object
    const currentUserParticipant = item?.participants?.find(
      (p) => String(p.id) === currentUserIdStr
    );
    const unReadCount = currentUserParticipant?.unread_count || 0;
    const isBlockedYou = otherParticipant.is_blocked;

    const hasLastMessage =
      !!item.last_message && item.last_message.trim() !== '';

    // Check if last message was sent by current user and seen by receiver
    let isLastMessageSeen = false;
    if (
      item.last_message_detail &&
      String(item.last_message_detail.sender_id) === currentUserIdStr &&
      otherParticipant?.last_read_message_id !== null
    ) {
      // Check if receiver's last_read_message_id is >= last message id
      // This means the receiver has read up to or past the last message
      isLastMessageSeen =
        otherParticipant.last_read_message_id >= item.last_message_detail.id;
    }

    return (
      <Ripple
        style={[
          Styles.itemContainer,
          Styles.itemHeight,
          { flexDirection: Rtl ? 'row-reverse' : 'row' },
        ]}
        onPress={() => onItemPress(item)}
      >
        <View style={Styles.profilePictureCon}>
          {otherParticipant?.name && !isBlockedYou ? (
            <Image
              source={{ uri: otherParticipant.image }}
              resizeMode="cover"
              style={Styles.image}
            />
          ) : (
            <FontAwesome5
              name="user-alt"
              size={wp(6.5)}
              color={Colors.color1}
            />
          )}
        </View>
        <View
          style={[
            Styles.itemInnerCon,
            Styles.itemHeight,
            { flexDirection: Rtl ? 'row-reverse' : 'row' },
          ]}
        >
          <View style={Styles.nameMsgCon}>
            <Text style={Styles.itemHeading}>{otherParticipant.name}</Text>
            {hasLastMessage && (
              <Text style={Styles.itemMessage} numberOfLines={2}>
                {item.last_message}
              </Text>
            )}
          </View>
          <View style={Styles.timeCon}>
            {hasLastMessage && (
              <View style={Styles.timeAndSeenCon}>
                <ReactText
                  style={[
                    Styles.itemMessage,
                    { fontSize: Typography.tiny2, marginBottom: hp(0.2) },
                  ]}
                >
                  {formattedDate}
                </ReactText>
                {isLastMessageSeen && (
                  <View style={Styles.seenProfileIconContainer}>
                    <Image
                      source={{ uri: otherParticipant.image }}
                      resizeMode="cover"
                      style={Styles.seenProfileIcon}
                    />
                  </View>
                )}
              </View>
            )}
            {unReadCount > 0 && (
              <View style={Styles.unReadCountCon}>
                <ReactText style={Styles.unReadCount}>{unReadCount}</ReactText>
              </View>
            )}
          </View>
        </View>
      </Ripple>
    );
  };

  const renderEmptyList = () => {
    return (
      <View style={Styles.textContainer}>
        <View style={Styles.logoContainer}>
          <Image
            source={Images.quotesIcon}
            resizeMode="contain"
            style={Styles.logo}
          />
          <Text style={Styles.subText}>{quote?.split('|')[0]}</Text>
          <Text style={[Styles.subText, { fontFamily: Fonts.APPFONT_B }]}>
            {quote?.split('|')[1]}
          </Text>
        </View>
        {/* <View style={Styles.findMatchButtonContainer}>
          <Button
            text="Find Match"
            onPress={onFindMatchPress}
            buttonStyle={Styles.findMatchButton}
          />
        </View> */}
      </View>
    );
  };

  const keyExtractor = (item: Conversation) => item.id.toString();

  const onChangePasswordPress = () => {
    props.navigation.navigate('GuardianChangePassword');
  };

  const onWaliPress = () => {
    props.navigation.navigate('AddWali', { fromSettings: true });
  };

  const onFindMatchPress = () => {
    props.navigation.navigate('SearchProfiles');
    // props.navigation.navigate('SingleChat', {
    //   conversationData: null,
    //   otherUserData: { id: 3640 },
    //   from: 'messages',
    // });
  };

  return (
    <Container>
      <Header
        title={LanguageKeys.messages}
        customConponent={() => (
          <View
            style={[
              Styles.headerRightContainer,
              { flexDirection: Rtl ? 'row-reverse' : 'row' },
            ]}
          >
            <ChatCreditsBadge
              onPress={onChatCreditsPress}
              disabled={isChatCreditsLoading}
              credits={currentUser?.chat_credits || 0}
            />
            {currentUser?.role === 'guardian' && (
              <View style={[Styles.gaurdianHeader]}>
                <Menu>
                  <MenuTrigger>
                    <Image
                      source={Images.verticalDots}
                      style={Styles.menuBtn}
                      resizeMode="contain"
                    />
                  </MenuTrigger>
                  <MenuOptions
                    optionsContainerStyle={Styles.menuOptionsContainer}
                  >
                    <MenuOption
                      onSelect={onChangePasswordPress}
                      text={t(LanguageKeys.changePassword)}
                    />
                    <MenuOption
                      onSelect={onLogoutPress}
                      text={t(LanguageKeys.logOut)}
                      style={Styles.destructiveOption}
                    />
                  </MenuOptions>
                </Menu>
              </View>
            )}
          </View>
        )}
      />
      {currentUser?.guardian ? (
        <Ripple style={Styles.guardianTextWrapper} onPress={onWaliPress}>
          <Text style={Styles.guardianText}>{t('monitoredByWali')}</Text>
        </Ripple>
      ) : currentUser?.gender === 'female' ? (
        <Ripple style={Styles.guardianTextWrapper} onPress={onWaliPress}>
          <Text style={Styles.guardianText}>{t('addAWali')}</Text>
        </Ripple>
      ) : null}
      {currentUser?.role === 'guardian' && (
        <CommonActions
          navigation={props.navigation}
          userId={currentUser?.user?.id}
        />
      )}
      <PurchaseSuccessModal
        visible={chatCreditsSuccessModalVisible}
        onCollect={onChatCreditsSuccessCollect}
        title="Chat Credits Purchased!"
        message="Your chat credits have been added successfully."
      />
      <View style={Styles.contentContainer}>
        {isLoading ? (
          <AnimatedLoader
            text={LanguageKeys.loading}
            visible={true}
            style={{ height: hp(60) }}
          />
        ) : conversations.length ? (
          <VirtualizedList
            initialNumToRender={10}
            windowSize={15}
            data={conversations}
            getItemCount={(data) => data.length}
            getItem={(data, index) => data[index]}
            renderItem={renderConversations}
            ListEmptyComponent={renderEmptyList}
            keyExtractor={keyExtractor}
          />
        ) : (
          renderEmptyList()
        )}
      </View>
      <Ripple style={Styles.btnPlus} onPress={onFindMatchPress}>
        <AntDesign name="plus" size={wp(8)} color={Colors.color2} />
      </Ripple>
      <ModalLoader
        visible={modalLoader.visible}
        message={modalLoader.message}
      />
    </Container>
  );
};

export default Messages;

const { width } = Dimensions.get('window');

const Styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    textAlign: 'center',
  },
  mainText: {
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_B,
    color: Colors.color1,
  },
  subText: {
    width: wp(80),
    textAlign: 'center',
    fontSize: Typography.small1,
    fontFamily: Fonts.APPFONT_R,
    color: Colors.color4,
    marginTop: 10,
  },
  itemHeight: {
    height: width * 1 * 0.18,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 0.7,
    borderBottomColor: Colors.color7,
    backgroundColor: Colors.color56,
  },
  profilePictureCon: {
    borderWidth: 1,
    borderColor: Colors.color7,
    width: width * 0.135,
    height: width * 1 * 0.135,
    borderRadius: (width * 1 * 0.135) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.color18,
    marginHorizontal: wp(3),
    overflow: 'hidden',
    marginTop: hp(1),
  },
  image: {
    width: width * 0.13,
    height: width * 1 * 0.13,
    borderRadius: (width * 1 * 0.13) / 2,
  },
  itemInnerCon: {
    width: wp(81),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameMsgCon: {
    width: wp(47),
  },
  timeCon: {
    width: wp(34),
    alignItems: 'flex-end',
    paddingHorizontal: wp(4),
  },
  itemHeading: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small1,
    includeFontPadding: false,
  },
  itemMessage: {
    color: Colors.color35,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small,
    includeFontPadding: false,
  },
  unReadCountCon: {
    marginTop: hp(1),
    minWidth: width * 0.05,
    minHeight: width * 1 * 0.052,
    borderRadius: (width * 1 * 0.05) / 2,
    backgroundColor: Colors.theme,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(1.5),
  },
  unReadCount: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.tiny2,
    includeFontPadding: false,
  },
  logoutBtn: {
    position: 'absolute',
    flexDirection: 'row',
    right: wp(4),
  },
  logoutTxt: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small2,
    marginHorizontal: wp(2),
  },
  logoutIcon: {
    width: width * 0.05,
    height: width * 0.05 * 1,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  gaurdianHeader: {
    paddingHorizontal: wp(1),
  },
  menuBtn: {
    width: wp(8),
    height: hp(3.5),
    resizeMode: 'contain',
  },
  menuOptionsContainer: {
    borderRadius: wp(2),
    paddingVertical: hp(0.5),
  },
  destructiveOption: {
    backgroundColor: Colors.color2,
  },
  guardianTextWrapper: {
    backgroundColor: Colors.color55,
    paddingHorizontal: wp(2),
  },
  guardianText: {
    width: wp(100),
    fontSize: Typography.small2,
    fontFamily: Fonts.APPFONT_R,
    color: Colors.color2,
  },
  timeAndSeenCon: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: hp(0.5),
  },
  seenProfileIconContainer: {
    width: wp(5),
    height: wp(5),
    borderRadius: wp(2.5),
    borderWidth: 1,
    borderColor: Colors.color2,
    overflow: 'hidden',
    backgroundColor: Colors.color18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seenProfileIcon: {
    width: wp(5),
    height: wp(5),
    borderRadius: wp(2.5),
  },
  findMatchButtonContainer: {
    marginTop: hp(4),
    paddingHorizontal: wp(10),
    width: '100%',
  },
  findMatchButton: {
    width: '100%',
    opacity: 1,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  btnPlus: {
    position: 'absolute',
    bottom: 0,
    right: wp(8),
    backgroundColor: Colors.theme,
    borderRadius: wp(10),
    padding: wp(4),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.color1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
});
