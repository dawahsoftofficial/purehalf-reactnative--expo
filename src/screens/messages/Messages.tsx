import { useFocusEffect } from '@react-navigation/native';
import { CommonActions as CommonActionsNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import pusherService from '@/services/pusher';

import {
  AnimatedLoader,
  Button,
  Container,
  Header,
  ModalLoader,
  PurchaseSuccessModal,
  Text,
} from '../../components';
import ChatCreditsBadge from '../../components/badges/chat-credits-badge';
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
import type { Conversation } from '../../services/api/types/message-types';
import { presentChatCreditsPaywall } from '../../services/paywall-service';

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
  const unsubscribeUserChannelRef = useRef<(() => void) | null>(null);

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

  // Setup Pusher real-time updates for user channel
  const setupPusherListeners = useCallback(async () => {
    if (!pusherService.isReady()) {
      console.log('[Messages] Pusher not ready');
      return;
    }

    const userId =
      currentUser?.id === 'guardian' ? currentUser?.user?.id : currentUser?.id;

    if (!userId) {
      console.log('[Messages] No user ID available');
      return;
    }

    try {
      console.log('[Messages] Setting up Pusher for user:', userId);

      // Subscribe to user channel: start.conversation.user.{userId}
      const channelName = `private-start.conversation.user.${userId}`;

      const unsubscribe = await pusherService.subscribeToChannel(
        channelName,
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

            switch (eventType) {
              case 'NewConversationCreated': {
                const conversationData = rawData.conversation || rawData;
                console.log(
                  '[Messages] New conversation created:',
                  conversationData
                );
                handleNewConversation(conversationData as Conversation);
                break;
              }

              // Other events (MessageSent, MessageRead, MessageDelivered, ParticipantBlocked)
              // are handled in conversation-specific channels (private-conversation.{conversationId})
              default:
                console.log(
                  '[Messages] Ignoring event on user channel (handled elsewhere):',
                  eventType
                );
            }
          } catch (error) {
            console.error('[Messages] Error handling Pusher event:', error);
          }
        }
      );

      unsubscribeUserChannelRef.current = unsubscribe;
      console.log('[Messages] ✅ Subscribed to user channel');
    } catch (error) {
      console.error('[Messages] Error setting up Pusher:', error);
    }
  }, [currentUser]);

  // Handle new conversation created
  const handleNewConversation = useCallback(
    (conversationData: Conversation) => {
      setConversations((prevConversations) => {
        // Check if conversation already exists
        const exists = prevConversations.some(
          (c) => c.id === conversationData.id
        );
        if (exists) {
          console.log('[Messages] Conversation already exists, updating');
          return prevConversations.map((c) =>
            c.id === conversationData.id ? conversationData : c
          );
        }

        // Add new conversation at the top
        console.log('[Messages] Adding new conversation');
        return [conversationData, ...prevConversations];
      });
    },
    []
  );

  // Setup Pusher when component mounts and screen is focused
  useEffect(() => {
    if (currentUser) {
      setupPusherListeners();

      return () => {
        // Cleanup Pusher subscription
        if (unsubscribeUserChannelRef.current) {
          unsubscribeUserChannelRef.current();
          unsubscribeUserChannelRef.current = null;
        }
      };
    }
  }, [currentUser, setupPusherListeners]);

  useFocusEffect(
    React.useCallback(() => {
      // Fetch conversations on focus
      fetchConversations();

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
    }, [fetchConversations, t])
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
    // TODO: Backend integration - collect chat credits
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
      Array.isArray(item.last_message_detail.statuses)
    ) {
      const receiverStatus = item?.last_message_detail.statuses?.find(
        (status) => status.participant_id === otherParticipant.id
      );
      isLastMessageSeen = receiverStatus?.read_at !== null;
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
            <>
              <FontAwesome5
                name="user-alt"
                size={wp(6.5)}
                color={Colors.color7}
              />
            </>
          ) : (
            <FontAwesome5
              name="user-alt"
              size={wp(6.5)}
              color={Colors.color7}
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
                    <FontAwesome5
                      name="user-alt"
                      size={wp(2.5)}
                      color={Colors.color2}
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
        <View style={Styles.findMatchButtonContainer}>
          <Button
            text="Find Match"
            onPress={onFindMatchPress}
            buttonStyle={Styles.findMatchButton}
          />
        </View>
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
    // props.navigation.navigate('SearchProfiles');
    props.navigation.navigate('SingleChat', {
      conversationData: null,
      otherUserData: { id: 3640 },
      from: 'messages',
    });
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
              credits={currentUser?.chat_credits || 0}
              onPress={onChatCreditsPress}
              disabled={isChatCreditsLoading}
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
    paddingTop: hp(1),
    width: wp(81),
    flexDirection: 'row',
    justifyContent: 'space-between',
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
});
