import React, { useMemo } from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import { hasNotch } from 'react-native-device-info';
import Ripple from 'react-native-material-ripple';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { hp, wp } from '../global';
import { Colors, Fonts, Images } from '../res';
import Wiggle from '../screens/profile/components/wiggle';
import { computeGiftStatus } from '../screens/profile/gift-status';
import { isIOS, useGlobalContext } from '../services';
import { useConversationStore, useSettingsStore } from '../stores';

const CustomBottomTab = ({ state, descriptors, navigation }: any) => {
  const unreadConversationsCount = useConversationStore(
    (state) => state.unreadConversationsCount
  );
  const { conversations, updateConversations, currentUser } =
    useGlobalContext();
  const giftThreshold =
    useSettingsStore().getProfileCompletionThresholdPercent();
  const giftEligible = useMemo(
    () => computeGiftStatus(currentUser, giftThreshold).eligible,
    [currentUser, giftThreshold]
  );
  const focusedOptions = descriptors[state.routes[state.index].key].options;

  if (focusedOptions.tabBarVisible === false) {
    return null;
  }

  // useEffect(() => {
  //   const totalUnreadMessages = _.reduce(
  //     conversations,
  //     (sum, conv) => {
  //       if (
  //         !conv?.convDetails?.participantsBlockFlag?.[currentUser?.id]
  //           ?.blockStatus
  //       ) {
  //         const convUnreadCount =
  //           conv.convDetails.unReadCount[currentUser?.id] || 0;
  //         return sum + convUnreadCount;
  //       } else {
  //         return sum;
  //       }
  //     },
  //     0
  //   );
  //   setTotalUnReadMessages(totalUnreadMessages);
  // }, [updateConversations]);

  return (
    <View style={[Styles.tabContainer, Styles.shadow]}>
      {state.routes.map((route: any, index: any) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const icon =
          route.name === 'Settings' ? (
            <Image
              source={
                isFocused ? Images.bottomSettingsTheme : Images.bottomSettings
              }
              resizeMode="contain"
              style={Styles.imageIcon}
            />
          ) : route.name === 'Profile' ? (
            <Image
              source={
                isFocused ? Images.bottomProfileTheme : Images.bottomProfile
              }
              resizeMode="contain"
              style={Styles.imageIcon}
            />
          ) : route.name === 'Welcome' ? (
            <Image
              source={
                isFocused ? Images.bottomWelcomeTheme : Images.bottomWelcome
              }
              resizeMode="contain"
              style={Styles.imageIcon}
            />
          ) : route.name === 'SearchProfiles' ? (
            <Image
              source={isFocused ? Images.searchTheme : Images.search}
              resizeMode="contain"
              style={{ ...Styles.imageIcon, width: 21 }}
            />
          ) : route.name === 'Messages' ? (
            <Image
              source={
                isFocused ? Images.bottomMessagesTheme : Images.bottomMessages
              }
              resizeMode="contain"
              style={Styles.imageIcon}
            />
          ) : null;
        const iconText =
          route.name === 'Settings'
            ? 'Settings'
            : route.name === 'Profile'
              ? 'Me'
              : route.name === 'Welcome'
                ? 'Home'
                : route.name === 'SearchProfiles'
                  ? 'Search'
                  : route.name === 'Messages'
                    ? 'Inbox'
                    : null;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            if (route?.name === 'Welcome') {
              navigation.navigate(route.name, {
                openRecommendationModal: false,
              });
            } else {
              navigation.navigate(route.name);
            }
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <View key={index}>
            <Ripple
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={Styles.button}
            >
              {icon}
              <Text
                style={[
                  Styles.iconText,
                  { color: isFocused ? Colors.primary : Colors.muted },
                ]}
              >
                {iconText}
              </Text>
              {route.name === 'Messages' && unreadConversationsCount > 0 && (
                <View
                  style={{
                    ...Styles.unReadCon,
                    width:
                      unreadConversationsCount.toString().length >= 4
                        ? wp(10)
                        : unreadConversationsCount.toString().length == 3
                          ? wp(8)
                          : unreadConversationsCount.toString().length == 2
                            ? wp(6)
                            : wp(5),
                  }}
                >
                  <Text style={Styles.unReadCount} numberOfLines={1}>
                    {unreadConversationsCount}
                  </Text>
                </View>
              )}
              {route.name === 'Profile' && giftEligible && (
                <View style={Styles.giftBadgeDot}>
                  <Wiggle active>
                    <Ionicons
                      name="gift"
                      size={wp(2.8)}
                      color={Colors.color2}
                    />
                  </Wiggle>
                </View>
              )}
            </Ripple>
          </View>
        );
      })}
    </View>
  );
};

export default CustomBottomTab;

const { width } = Dimensions.get('window');
const Styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: Colors.color2,
    paddingHorizontal: wp(4),
    borderTopWidth: 0.7,
    borderColor: Colors.hairline,
  },
  button: {
    paddingHorizontal: wp(4.9),
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 5,
    paddingBottom: isIOS && hasNotch() ? 20 : 6,
  },
  imageIcon: {
    // width: wp(6),
    // height: hp(5),
    width: 20,
    height: 30,
    borderWidth: 0,
  },
  unReadCon: {
    height: width * 1 * 0.048,
    borderRadius: (width * 1 * 0.048) / 2,
    backgroundColor: Colors.theme,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(1.5),
    position: 'absolute',
    left: wp(10),
    top: hp(1.5),
  },
  unReadCount: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_R,
    fontSize: wp(3),
    maxWidth: wp(10),
  },
  giftBadgeDot: {
    position: 'absolute',
    top: 0,
    right: wp(2.5),
    width: wp(4.2),
    height: wp(4.2),
    borderRadius: wp(2.1),
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.color2,
  },
  shadow: {
    shadowColor: Colors.color1,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconText: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_R,
    fontSize: 12,
    marginTop: -3,
    textAlign: 'center',
    alignSelf: 'center',
  },
});
