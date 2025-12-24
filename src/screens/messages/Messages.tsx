import { useFocusEffect } from '@react-navigation/native';
import { CommonActions as CommonActionsNavigation } from '@react-navigation/native';
import _ from 'lodash';
import React, { useState } from 'react';
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

import {
  AnimatedLoader,
  Container,
  Header,
  ModalLoader,
  PremiumButton,
  PurchaseSuccessModal,
  Text,
} from '../../components';
import BlurView from '../../components/BlurView';
import { hp, Typography, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { CommonActions } from '../../navigation';
import { Colors, Fonts, Images } from '../../res';
import {
  ApiServices,
  flashErrorMessage,
  flashSuccessMessage,
  formatDate,
  stopConversationsListener,
  StorageManager,
  useGlobalContext,
} from '../../services';
import { presentChatCreditsPaywall } from '../../services/paywall-service';

const Messages = (props: any) => {
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
  const { setData, storageKeys } = StorageManager;
  const {
    conversations,
    coversationLoading,
    currentUser,
    updateCurrentUser,
    language,
  } = useGlobalContext();

  const onItemPress = (item: any, otherUserData: any) => {
    props.navigation.navigate('SingleChat', {
      conversationData: item,
      otherUserData: otherUserData,
      from: 'messages',
    });
  };

  const handleNotificationDisplay = async (param: any) => {
    await setData(storageKeys.OPENED_CONVERSATION_ID, param);
  };

  useFocusEffect(
    React.useCallback(() => {
      handleNotificationDisplay('hide');
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
      return () => {
        handleNotificationDisplay(null);
      };
    }, [])
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
    } catch (error: any) {
      flashErrorMessage(error.message || 'Failed to purchase chat credits');
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
    await ApiServices.logoutGuardian().catch(hideModalLoader);
    await deleteAll()
      .then(async () => {
        updateCurrentUser(null);
        await setData(storageKeys.LANGUAGE, language);
        await stopConversationsListener();
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

  const renderConversations = ({ item }: any) => {
    console.log('first item', JSON.stringify(item, null, 2));
    const convDetails = item?.convDetails;
    const currentUserId =
      currentUser?.id === 'guardian' ? currentUser?.user?.id : currentUser?.id;

    const otherUserData = _.filter(
      convDetails?.participantsData,
      (element) => element?.id !== currentUserId
    )[0];

    const formattedDate = formatDate(convDetails?.latestMessageCreatedAt);
    const unReadCount = convDetails?.unReadCount?.[currentUser?.id];
    const isBlockedYou =
      convDetails?.participantsBlockFlag?.[currentUser?.id]?.blockStatus ===
      true;

    let hideLatestMessage = false;
    if (item?.messages) {
      hideLatestMessage =
        Object.keys(item?.messages).length === 0 ? true : false;
    }

    // Check if last message was sent by current user and seen by receiver
    // Also get the actual latest message text from messages array
    let isLastMessageSeen = false;
    let latestMessageText = convDetails?.latestMessage || '';

    if (!hideLatestMessage && item?.messages) {
      const messagesArray = Object.values(item.messages);
      if (messagesArray.length > 0) {
        // Get the last message (most recent)
        const lastMessage: any = messagesArray[0];

        // Use the actual latest message text from messages array
        if (lastMessage?.message) {
          latestMessageText = lastMessage.message;
        }

        // Check if last message was sent by current user
        if (lastMessage?.sender === currentUserId) {
          // Check if receiver has seen it
          const otherUserId = otherUserData?.id;
          isLastMessageSeen = lastMessage?.readBy?.[otherUserId]?.seen === true;
        }
      }
    }

    return (
      <Ripple
        style={[
          Styles.itemContainer,
          Styles.itemHeight,
          { flexDirection: Rtl ? 'row-reverse' : 'row' },
        ]}
        onPress={onItemPress.bind(null, item, otherUserData)}
      >
        <View style={Styles.profilePictureCon}>
          {otherUserData?.image &&
          otherUserData?.image?.length !== 0 &&
          !isBlockedYou ? (
            <>
              {otherUserData?.is_blur === 0 ? <BlurView /> : null}
              <Image
                source={{ uri: otherUserData.image }}
                style={Styles.image}
                resizeMode="cover"
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
            <Text style={Styles.itemHeading}>{otherUserData?.name}</Text>
            {!hideLatestMessage && (
              <Text style={Styles.itemMessage} numberOfLines={2}>
                {latestMessageText}
              </Text>
            )}
          </View>
          <View style={Styles.timeCon}>
            {!hideLatestMessage && (
              <ReactText
                style={[
                  Styles.itemMessage,
                  { alignSelf: Rtl ? 'flex-start' : 'flex-end' },
                ]}
              >
                {formattedDate}
              </ReactText>
            )}
            <View
              style={[
                Styles.timeAndSeenCon,
                { flexDirection: Rtl ? 'row-reverse' : 'row' },
              ]}
            >
              {unReadCount && unReadCount !== 0 && !hideLatestMessage ? (
                <View
                  style={[
                    Styles.unReadCountCon,
                    {
                      alignSelf: Rtl ? 'flex-start' : 'flex-end',
                      marginRight: Rtl ? 0 : wp(1.5),
                      marginLeft: Rtl ? wp(1.5) : 0,
                    },
                  ]}
                >
                  <ReactText numberOfLines={1} style={Styles.unReadCount}>
                    {unReadCount}
                  </ReactText>
                </View>
              ) : null}
              {isLastMessageSeen &&
              otherUserData?.image &&
              otherUserData?.image?.length !== 0 &&
              !isBlockedYou ? (
                <View
                  style={[
                    Styles.seenProfileIconContainer,
                    {
                      marginRight: Rtl ? 0 : wp(1),
                      marginLeft: Rtl ? wp(1) : 0,
                    },
                  ]}
                >
                  <Image
                    source={{ uri: otherUserData.image }}
                    style={Styles.seenProfileIcon}
                    resizeMode="cover"
                  />
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </Ripple>
    );
  };

  const renderEmptyList = () => {
    return (
      <View style={Styles.textContainer}>
        <Image
          source={Images.quotesIcon}
          resizeMode="contain"
          style={Styles.logo}
        />
        <View>
          <Text style={Styles.subText}>{quote?.split('|')[0]}</Text>
          <Text style={[Styles.subText, { fontWeight: 'bold' }]}>
            {quote?.split('|')[1]}
          </Text>
        </View>
      </View>
    );
  };

  const keyExtractor = (item: any) => item?.convDetails?.id;
  const getItemCount = () => conversations?.length;
  const getItem = (data: any, index: any) => data[index];

  const onChangePasswordPress = () => {
    props.navigation.navigate('GuardianChangePassword');
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
      <Header
        title={LanguageKeys.messages}
        customConponent={() => (
          <View
            style={[
              Styles.headerRightContainer,
              { flexDirection: Rtl ? 'row-reverse' : 'row' },
            ]}
          >
            {/* {currentUser?.chat_credits !== undefined &&
              currentUser?.chat_credits !== null && ( */}
            <Ripple
              style={[
                Styles.chatCreditsContainer,
                {
                  marginRight: Rtl ? 0 : wp(2),
                  marginLeft: Rtl ? wp(2) : 0,
                },
              ]}
              onPress={onChatCreditsPress}
              disabled={isChatCreditsLoading}
            >
              <Text style={Styles.chatCreditsLabel}>
                {LanguageKeys.chatCredits}:
              </Text>
              <Text style={Styles.chatCreditsValue}>
                {currentUser?.chat_credits}
              </Text>
            </Ripple>
            {/* )} */}
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
        {coversationLoading ? (
          <AnimatedLoader
            text={LanguageKeys.loading}
            visible={true}
            style={{ height: hp(60) }}
          />
        ) : conversations?.length ? (
          <VirtualizedList
            initialNumToRender={10}
            windowSize={15}
            data={conversations}
            getItemCount={getItemCount}
            getItem={getItem}
            renderItem={renderConversations}
            ListEmptyComponent={renderEmptyList}
            keyExtractor={keyExtractor}
          />
        ) : (
          <View style={Styles.textContainer}>
            <Image
              source={Images.quotesIcon}
              resizeMode="contain"
              style={Styles.logo}
            />
            <View>
              <Text style={Styles.subText}>{quote?.split('|')[0]}</Text>
              <Text style={[Styles.subText, { fontWeight: 'bold' }]}>
                {quote?.split('|')[1]}
              </Text>
            </View>
          </View>
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
  chatCreditsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.theme,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderRadius: wp(4),
  },
  chatCreditsLabel: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small,
    includeFontPadding: false,
    marginRight: wp(1),
  },
  chatCreditsValue: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small1,
    includeFontPadding: false,
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
  },
  seenProfileIcon: {
    width: wp(5),
    height: wp(5),
    borderRadius: wp(2.5),
  },
});
