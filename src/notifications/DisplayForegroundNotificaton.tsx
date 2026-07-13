import { getApp } from '@react-native-firebase/app';
import { getMessaging, onMessage } from '@react-native-firebase/messaging';
import { useNavigation } from '@react-navigation/native';
import { CommonActions as CommonActionsNav } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ripple from 'react-native-material-ripple';
import { SafeAreaView } from 'react-native-safe-area-context';

import { openAppStore } from '@/lib/utils/rate-app';

import { hp, Typography, wp } from '../global';
import { Colors, Fonts } from '../res';
import {
  ApiServices,
  cleanupSession,
  StorageManager,
  useGlobalContext,
} from '../services';
import { useNotificationStore } from '../stores';
import { routeNotification } from './routeNotification';

const firebaseApp = getApp();
const messaging = getMessaging(firebaseApp);

const DisplayForegroundNotification = () => {
  const { getData, setData, storageKeys } = StorageManager;
  const { currentUser, updateCurrentUser, language } = useGlobalContext();
  const navigation: any = useNavigation();
  const [remoteMessage, setRemoteMessage] = useState<any>(null);
  const [remoteMessageData, setRemoteMessageData] = useState<any>(null);
  const [slideAnimation] = useState(
    new Animated.Value(Dimensions.get('window').height)
  );

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      const { dx, dy } = gestureState;
      if (dy < 0 && Math.abs(dy) > Math.abs(dx)) {
        // Upward swipe
        Animated.timing(slideAnimation, {
          toValue: 0, // Slide up to the top
          duration: 500,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start();
      } else if (dx < 0 && Math.abs(dx) > Math.abs(dy)) {
        // Left swipe
        hideNotification(() => {
          setRemoteMessage(null);
          setRemoteMessageData(null);
        });
      } else if (dx > 0 && Math.abs(dx) > Math.abs(dy)) {
        // Right swipe
        hideNotification(() => {
          setRemoteMessage(null);
          setRemoteMessageData(null);
        });
      }
    },
  });

  const showNotification = () => {
    Animated.timing(slideAnimation, {
      toValue: 0, // Slide up to show
      duration: 500,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  };

  const hideNotification = (callback: () => void) => {
    Animated.timing(slideAnimation, {
      toValue: -Dimensions.get('window').height, // Slide down to the bottom
      duration: 500,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(callback);
  };

  const handleOnMessage = (data: any, remoteMessage: any) => {
    setRemoteMessageData(data);
    setRemoteMessage(remoteMessage);
    showNotification();
    if (data?.notification_type && data?.notification_type !== 'new_message') {
      useNotificationStore.getState().increment();
    }
  };

  const onLogoutPress = async () => {
    // Best-effort server-side logout — failure here shouldn't block the local
    // teardown (server may already have invalidated the session if this was
    // triggered by an account_suspended push).
    try {
      await ApiServices.logout();
    } catch (error) {
      console.log('[DisplayForegroundNotification] ApiServices.logout:', error);
    }
    // Full session teardown — same helper used by handleLogout and account
    // deletion. Preserves language and firebase verification id.
    await cleanupSession({ language });
    updateCurrentUser(null);
    navigation.dispatch(
      CommonActionsNav.reset({
        index: 1,
        routes: [{ name: 'AuthWelcome' }],
      })
    );
  };

  useEffect(() => {
    // Subscribe to foreground FCM messages. The listener needs cleaning up
    // on unmount (M4 audit finding) — otherwise the callback closes over
    // stale handlers after user-switch and never stops firing.
    const unsubscribe = onMessage(messaging, async (remoteMessage: any) => {
      const pressAction = remoteMessage?.data?.pressAction;

      // Parse the payload exactly once. Re-parsing the already-parsed
      // object (as the old code did) throws "[object Object]" errors and
      // silently dropped most non-openChat notifications.
      let data: any = null;
      try {
        const raw = remoteMessage?.data?.data;
        if (typeof raw === 'string' && raw.length > 0) {
          data = JSON.parse(raw);
        } else if (raw && typeof raw === 'object') {
          data = raw;
        }
      } catch (error) {
        console.error(
          '[DisplayForegroundNotification] Failed to parse data payload:',
          error
        );
      }

      if (pressAction === 'openChat') {
        getData(storageKeys.OPENED_CONVERSATION_ID)
          .then((res) => {
            if (
              res === data?.conversationId ||
              (res === 'hide' && data?.conversationId)
            ) {
              return null;
            } else {
              handleOnMessage(data, remoteMessage);
            }
          })
          .catch(() => {
            handleOnMessage(data, remoteMessage);
          });
      } else if (data?.notification_type === 'account_suspended') {
        handleOnMessage(data, remoteMessage);
        onLogoutPress();
      } else if (
        data?.notification_type === 'membership_extended' ||
        data?.notification_type === 'payment_received'
      ) {
        handleOnMessage(data, remoteMessage);
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'MembershipCongrats',
              params: {
                date_of_expiry: data?.date_of_expiry,
                amount: data?.amount,
                title: data?.title,
              },
            },
          ],
        });
      } else {
        handleOnMessage(data, remoteMessage);
      }
    });

    return () => {
      try {
        unsubscribe?.();
      } catch (error) {
        console.error(
          '[DisplayForegroundNotification] Failed to unsubscribe FCM listener:',
          error
        );
      }
    };
    // Intentionally not depending on currentUser / navigation — the listener
    // reads navigation and dispatcher functions that are stable across renders,
    // and we don't want to re-bind the FCM listener on every profile update.
  }, []);

  const onNotificationPress = async () => {
    const type = remoteMessageData?.notification_type;
    const data = remoteMessageData;

    hideNotification(() => {
      setRemoteMessage(null);
      setRemoteMessageData(null);
    });

    await routeNotification(navigation, type, {
      data,
      deps: {
        onLogout: onLogoutPress,
        openAppStore,
        onProfilePictureUpdateRequired: async () => {
          const updatedUser = {
            ...currentUser,
            primary_image_to_show: null,
          };
          updateCurrentUser(updatedUser);
          await setData(storageKeys.USER, updatedUser);
        },
      },
    });
  };

  let userImage = '';
  if (remoteMessage?.data?.pressAction === 'openChat') {
    if (remoteMessageData?.user?.image) {
      userImage = remoteMessageData?.user?.image;
    }
  } else if (remoteMessageData?.data) {
    const userData = JSON.parse(remoteMessageData?.data);
    if (userData?.user?.image) {
      userImage = userData?.user?.image;
    }
  }
  // return null;
  return remoteMessage ? (
    <SafeAreaView style={Styles.container} {...panResponder.panHandlers}>
      <Ripple onPress={onNotificationPress}>
        <Animated.View
          style={[
            Styles.innerContainer,
            { transform: [{ translateY: slideAnimation }] },
          ]}
        >
          {userImage ? (
            <View style={Styles.profilePictureCon}>
              <Image
                source={{ uri: userImage }}
                style={Styles.image}
                resizeMode="cover"
              />
              {/* :
            <FontAwesome5
              name='user-alt'
              size={wp(7)}
              color={Colors.color7}
              style={{ marginTop: hp(1) }}
            /> */}
            </View>
          ) : null}
          <View style={Styles.nameMsgCon}>
            <Text numberOfLines={2} style={Styles.name}>
              {remoteMessage?.data?.title}
            </Text>
            <Text numberOfLines={4} style={Styles.message}>
              {remoteMessage?.data?.body}
            </Text>
          </View>
        </Animated.View>
      </Ripple>
    </SafeAreaView>
  ) : null;
};

export default DisplayForegroundNotification;

const { width } = Dimensions.get('window');
const Styles = StyleSheet.create({
  container: {
    paddingVertical: hp(2),
    position: 'absolute',
    alignSelf: 'center',
    marginHorizontal: wp(8),
    top: 0,
    zIndex: 1,
    width: wp(95),
  },
  innerContainer: {
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(1),
    borderRadius: 10,
    flexDirection: 'row',
    backgroundColor: Colors.blackRGBA90,
  },
  image: {
    width: width * 0.1,
    height: width * 1 * 0.1,
    borderRadius: (width * 1 * 0.1) / 2,
  },
  nameMsgCon: {
    width: wp(90),
    paddingHorizontal: wp(1),
  },
  name: {
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small3,
    color: Colors.color2,
    includeFontPadding: false,
  },
  message: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small1,
    includeFontPadding: false,
    paddingTop: 5,
  },
  profilePictureCon: {
    borderWidth: 2,
    borderColor: Colors.color7,
    width: width * 0.1,
    height: width * 1 * 0.1,
    borderRadius: (width * 1 * 0.1) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.color18,
    overflow: 'hidden',
  },
});
