import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  Image,
  Dimensions,
  PanResponder,
  Animated,
  Easing,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ripple from 'react-native-material-ripple';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { CommonActions as CommonActionsNav } from '@react-navigation/native';
import messaging from '@react-native-firebase/messaging';
import Rate from 'react-native-rate';

import { Typography, hp, wp } from '../global';
import { Colors, Fonts } from '../res';
import {
  ApiServices,
  stopConversationsListener,
  StorageManager,
  useGlobalContext,
} from '../services';

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

  const handleOnMessage = (data: any, remoteMessage: any) => {
    setRemoteMessageData(data);
    setRemoteMessage(remoteMessage);
    showNotification();
  };

  useEffect(() => {
    messaging().onMessage(async (remoteMessage: any) => {
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

  const onLogoutPress = async () => {
    let verificationId = await getData(storageKeys.FIREBASE_VERIFICATION_ID);
    await AsyncStorage.setItem('isRecommended', 'false');
    await ApiServices.logout().catch();
    auth().signOut().catch();
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

  const showNotification = () => {
    slideAnimation.setValue(-Dimensions.get('window').height); // Set initial position to the top (negative value)
    Animated.timing(slideAnimation, {
      toValue: 0, // Slide down to the center
      duration: 500,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
    setTimeout(() => {
      hideNotification(() => {
        setRemoteMessage(null);
        setRemoteMessageData(null);
      });
    }, 10000);
  };

  const hideNotification = (callback: () => void) => {
    Animated.timing(slideAnimation, {
      toValue: -Dimensions.get('window').height, // Slide down to the bottom
      duration: 500,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(callback);
  };

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
      case 'account_unsuspended':
        // navigation.navigate('UserProfile', {
        //   userData: { id: remoteMessageData?.other_user_id }
        // })
        break;
      case 'account_deletion':
        hideNotification(() => {
          setRemoteMessage(null);
          setRemoteMessageData(null);
        });
        onLogoutPress();
        break;
      case 'membership_upgraded':
        // navigation.navigate('UserProfile', {
        //   userData: { id: remoteMessageData?.other_user_id }
        // })
        break;
      case 'membership_downgraded':
        // navigation.navigate('UserProfile', {
        //   userData: { id: remoteMessageData?.other_user_id }
        // })
        break;
      case 'membership_extended':
        hideNotification(() => {
          setRemoteMessage(null);
          setRemoteMessageData(null);
        });
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
        break;
      case 'membership_cancelled':
        // navigation.navigate('UserProfile', {
        //   userData: { id: remoteMessageData?.other_user_id }
        // })
        break;
      case 'membership_expiring':
        // navigation.navigate('UserProfile', {
        //   userData: { id: remoteMessageData?.other_user_id }
        // })
        break;
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
      case 'membership_renewed':
        hideNotification(() => {
          setRemoteMessage(null);
          setRemoteMessageData(null);
        });
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'MembershipCongrats',
              params: {
                date_of_expiry: remoteMessageData?.date_of_expiry,
                amount: remoteMessageData?.amount,
                title: remoteMessageData?.title,
              },
            },
          ],
        });
        break;
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
      case 'expired_discount':
        hideNotification(() => {
          setRemoteMessage(null);
          setRemoteMessageData(null);
        });
        await AsyncStorage.setItem(
          'membership_discount',
          new Date().getTime().toString()
        );
        navigation.navigate('DiscountProFeaturesPromotion');
        break;

      case 'new_message':
        hideNotification(() => {
          setRemoteMessage(null);
          setRemoteMessageData(null);
        });
        navigation.navigate('Messages');
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
      case 'profile_picture_update_required':
        currentUser.media.primary_image = null;
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
