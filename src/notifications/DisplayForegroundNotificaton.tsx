import { getApp } from '@react-native-firebase/app';
import { getAuth, signOut } from '@react-native-firebase/auth';
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
import Rate from 'react-native-rate';
import { SafeAreaView } from 'react-native-safe-area-context';

import { hp, Typography, wp } from '../global';
import { Colors, Fonts } from '../res';
import {
  ApiServices,
  stopConversationsListener,
  StorageManager,
  useGlobalContext,
} from '../services';

const firebaseApp = getApp();
const auth = getAuth(firebaseApp);
const messaging = getMessaging(firebaseApp);

const DisplayForegroundNotification = () => {
  const { getData, setData, deleteAll, storageKeys } = StorageManager;
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
  };

  const onLogoutPress = async () => {
    const verificationId = await getData(storageKeys.FIREBASE_VERIFICATION_ID);
    StorageManager.setString(storageKeys.IS_RECOMMENDED, 'false');
    await ApiServices.logout().catch();
    await signOut(auth).catch();
    await deleteAll()
      .then(async () => {
        updateCurrentUser(null);
        const { setData } = StorageManager;
        await setData(storageKeys.LANGUAGE, language);
        await setData(storageKeys.FIREBASE_VERIFICATION_ID, verificationId);
        await stopConversationsListener();
        navigation.dispatch(
          CommonActionsNav.reset({
            index: 1,
            routes: [{ name: 'AuthWelcome' }],
          })
        );
      })
      .catch();
  };

  useEffect(() => {
    onMessage(messaging, async (remoteMessage: any) => {
      const pressAction = remoteMessage?.data?.pressAction;

      const data = JSON.parse(remoteMessage?.data?.data || {});
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
      } else {
        if (JSON.parse(data)?.notification_type === 'account_suspended') {
          handleOnMessage(JSON.parse(data), remoteMessage);
          onLogoutPress();
        } else if (
          JSON.parse(data)?.notification_type === 'membership_extended'
        ) {
          handleOnMessage(JSON.parse(data), remoteMessage);
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'MembershipCongrats',
                params: {
                  date_of_expiry: JSON.parse(data)?.date_of_expiry,
                  amount: JSON.parse(data)?.amount,
                  title: JSON.parse(data)?.title,
                },
              },
            ],
          });
        } else if (JSON.parse(data)?.notification_type === 'payment_received') {
          handleOnMessage(JSON.parse(data), remoteMessage);
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'MembershipCongrats',
                params: {
                  date_of_expiry: JSON.parse(data)?.date_of_expiry,
                  amount: JSON.parse(data)?.amount,
                  title: JSON.parse(data)?.title,
                },
              },
            ],
          });
        } else {
          handleOnMessage(JSON.parse(data), remoteMessage);
        }
      }
    });
  }, []);

  const onNotificationPress = async () => {
    switch (remoteMessageData?.notification_type) {
      case 'profile_liked':
        hideNotification(() => {
          setRemoteMessage(null);
          setRemoteMessageData(null);
        });
        navigation.navigate('UserProfile', {
          userData: { id: remoteMessageData?.id },
        });
        break;
      case 'profile_visited':
        hideNotification(() => {
          setRemoteMessage(null);
          setRemoteMessageData(null);
        });
        navigation.navigate('UserProfile', {
          userData: { id: remoteMessageData?.id },
        });
        break;
      case 'photo_access_request':
        hideNotification(() => {
          setRemoteMessage(null);
          setRemoteMessageData(null);
        });
        navigation.navigate('PrivatePhotoRequest');
        break;
      case 'photo_request_declined':
        hideNotification(() => {
          setRemoteMessage(null);
          setRemoteMessageData(null);
        });
        navigation.navigate('PrivatePhotoRequest');
        break;
      case 'photo_request_approved':
        hideNotification(() => {
          setRemoteMessage(null);
          setRemoteMessageData(null);
        });
        navigation.navigate('UserProfile', {
          userData: { id: remoteMessageData?.id },
        });
        break;
      case 'account_suspended':
        hideNotification(() => {
          setRemoteMessage(null);
          setRemoteMessageData(null);
        });
        // navigation.reset({
        //   index: 0,
        //   routes: [{
        //     name: "AccountSuspended"
        //   }],
        // });
        break;
      // case 'account_unsuspended':
      // navigation.navigate('UserProfile', {
      //   userData: { id: remoteMessageData?.other_user_id }
      // })
      // break;
      case 'account_deletion':
        hideNotification(() => {
          setRemoteMessage(null);
          setRemoteMessageData(null);
        });
        onLogoutPress();
        break;
      // case 'membership_upgraded':
      // navigation.navigate('UserProfile', {
      //   userData: { id: remoteMessageData?.other_user_id }
      // })
      // break;
      // case 'membership_downgraded':
      // navigation.navigate('UserProfile', {
      //   userData: { id: remoteMessageData?.other_user_id }
      // })
      // break;
      // case 'membership_extended':
      //   hideNotification(() => {
      //     setRemoteMessage(null);
      //     setRemoteMessageData(null);
      //   });
      // navigation.reset({
      //   index: 0,
      //   routes: [{
      //     name: "MembershipCongrats", params: {
      //       date_of_expiry: remoteMessageData?.date_of_expiry
      //       // amount: remoteMessageData?.price,
      //       // title: remoteMessageData?.title
      //     }
      //   }],
      // });
      // break;
      // case 'membership_cancelled':
      // navigation.navigate('UserProfile', {
      //   userData: { id: remoteMessageData?.other_user_id }
      // })
      // break;
      // case 'membership_expiring':
      // navigation.navigate('UserProfile', {
      //   userData: { id: remoteMessageData?.other_user_id }
      // })
      // break;
      // case "payment_received":
      //   hideNotification(() => {
      //     setRemoteMessage(null);
      //     setRemoteMessageData(null);
      //   });
      //   navigation.reset({
      //     index: 0,
      //     routes: [{
      //       name: "MembershipCongrats", params: {
      //         date_of_expiry: remoteMessageData?.date_of_expiry,
      //         amount: remoteMessageData?.amount,
      //         title: remoteMessageData?.title
      //       }
      //     }],
      //   });
      //   break;
      // case 'membership_renewed':
      //   hideNotification(() => {
      //     setRemoteMessage(null);
      //     setRemoteMessageData(null);
      //   });
      //   navigation.reset({
      //     index: 0,
      //     routes: [
      //       {
      //         name: 'MembershipCongrats',
      //         params: {
      //           date_of_expiry: remoteMessageData?.date_of_expiry,
      //           amount: remoteMessageData?.amount,
      //           title: remoteMessageData?.title,
      //         },
      //       },
      //     ],
      //   });
      //   break;
      case 'daily_matches':
        hideNotification(() => {
          setRemoteMessage(null);
          setRemoteMessageData(null);
        });
        navigation.navigate('Welcome', {
          openRecommendationModal: true,
        });
        break;
      case 'new_female_signups':
        hideNotification(() => {
          setRemoteMessage(null);
          setRemoteMessageData(null);
        });
        navigation.navigate('Welcome');
        break;
      case 'new_male_signups':
        hideNotification(() => {
          setRemoteMessage(null);
          setRemoteMessageData(null);
        });
        navigation.navigate('Welcome');
        break;
      // case 'expired_discount':
      //   hideNotification(() => {
      //     setRemoteMessage(null);
      //     setRemoteMessageData(null);
      //   });
      //   StorageManager.setString(
      //     storageKeys.MEMBERSHIP_DISCOUNT,
      //     new Date().getTime().toString()
      //   );
      //   navigation.navigate('DiscountProFeaturesPromotion');
      //   break;

      case 'new_message':
        hideNotification(() => {
          setRemoteMessage(null);
          setRemoteMessageData(null);
        });
        navigation.navigate('Messages');
        // TODO: Shoaib - Add conversationId to the notification
        // if (remoteMessageData?.conversationId) {
        //   hideNotification(() => {
        //     setRemoteMessage(null);
        //     setRemoteMessageData(null);
        //   });
        //   navigation.navigate('SingleChat', {
        //     from: 'notification',
        //     conversationId: remoteMessageData?.conversationId,
        //     otherUserData: remoteMessageData?.user,
        //     message: remoteMessageData?.message
        //   })
        // }
        break;
      case 'app_update':
        const options = {
          AppleAppID: '6450672518',
          GooglePackageName: 'com.zojayn',
          preferInApp: false,
          openAppStoreIfInAppFails: true,
        };
        Rate.rate(options, (success, errorMessage) => {
          if (success) {
          }
          if (errorMessage) {
            console.log(errorMessage);
          }
        });
        break;
      case 'profile_picture_update_required':
        currentUser.primary_image_to_show = null;
        updateCurrentUser(currentUser);
        await setData(storageKeys.USER, currentUser);
        navigation.navigate('ProfilePicture');
        break;
      default:
        break;
    }
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
  return null;
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
