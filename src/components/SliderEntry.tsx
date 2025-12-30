import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { t } from 'i18next';
import moment from 'moment';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import Ripple from 'react-native-material-ripple';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { hp, Typography } from '../global';
import { CheckRtl, LanguageKeys } from '../languages';
import { Colors, Fonts, Images } from '../res';
import {
  ApiServices,
  Firebase,
  flashErrorMessage,
  isIOS,
  useGlobalContext,
} from '../services';
import { Button } from './buttons';

const { width: viewportWidth } = Dimensions.get('window');

const wp = (percentage: any) => {
  const value = (percentage * viewportWidth) / 100;
  return Math.round(value);
};

export const sliderWidth = viewportWidth;
export const itemWidth = viewportWidth;

const entryBorderRadius = 8;

const SliderEntry = ({
  data,
  even,
  onLikePress,
  onPassPress,
  onPress,
}: any) => {
  const Rtl = CheckRtl();
  const { currentUser, conversations } = useGlobalContext();
  const navigation: any = useNavigation();
  const [userConversation, setUserConversation] = useState({
    convDetails: {},
    messages: [],
  });
  const [profileImageLoader, setProfileImageLoader] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);
  const [matchingData, setMatchingData] = useState<any>([]);
  const likeIconRef = useRef<any>(null);
  const unLikeIconRef = useRef<any>(null);

  const chatUserData = {
    id: data?.id,
    name: data?.full_name,
    age: data?.age,
    city: data?.city,
    country: data?.country,
    image: data?.media?.primary_image_to_show,
    token: data?.fcm_token
      ?.map((item: any) => item?.fcm_token)
      .filter((token: any) => token !== undefined && token !== null),
  };

  useFocusEffect(
    React.useCallback(() => {
      getUserConversation();
    }, [conversations])
  );

  useFocusEffect(
    React.useCallback(() => {
      if (data?.detail?.personality_id_value?.length) {
        setMatchingData(
          data?.detail?.personality_id_value
            ?.slice(0, 4)
            ?.filter((userData: any) =>
              currentUser?.detail?.personality_id?.includes(userData?.id)
            )
        );
      }
    }, [data?.detail?.personality_id_value?.length])
  );

  const getUserConversation = () => {
    const conversationData = conversations?.filter((element: any) => {
      const deleteFlag = element?.convDetails?.participantsDeleteFlag;
      return deleteFlag?.hasOwnProperty(JSON.stringify(data?.id));
    });
    if (conversationData && conversationData?.length !== 0) {
      setUserConversation(conversationData[0]);
    } else {
      Firebase.getSingleConversation(currentUser?.id, data?.id).then(
        (data: any) => {
          if (data && data?.length !== 0) {
            setUserConversation(data[0]);
          }
        }
      );
    }
  };

  const isPremiumUser = () => {
    return new Promise((resolve) => {
      const now = moment();
      const membershipExpiry = currentUser?.membership_expiry;
      if (membershipExpiry !== null && moment(membershipExpiry).isAfter(now)) {
        resolve('premiumUser');
      } else if (
        membershipExpiry === null ||
        moment(membershipExpiry).isBefore(now)
      ) {
        ApiServices.getCurrentUserDetail()
          .then((res: any) => {
            const membershipExpiry = res?.membership_expiry;
            if (
              membershipExpiry === null ||
              moment(membershipExpiry).isBefore(now)
            ) {
              navigation.navigate('ProFeaturesPromotion', {
                navigateTo: 'goBack',
              });
            } else {
              resolve('premiumUser');
            }
          })
          .catch(() => {});
      }
    });
  };

  const onMessagePress = () => {
    const userConversationDetail: any = userConversation;
    if (
      // userConversation?.messages?.length === 0 &&
      currentUser?.gender === 'male'
      // && conversations?.length >= 3
    ) {
      isPremiumUser().then(() => {
        Firebase.getNoOfChats(
          currentUser?.id,
          userConversationDetail?.convDetails?.id
        ).then((numberOfChats: any) => {
          if (numberOfChats < 5) {
            setProfileImageError(false);
            navigateToChat();
          } else {
            flashErrorMessage(LanguageKeys.conversationLimit);
          }
        });
      });
    } else {
      Firebase.getNoOfChats(
        currentUser?.id,
        userConversationDetail?.convDetails?.id
      ).then((numberOfChats: any) => {
        if (numberOfChats < 5) {
          setProfileImageError(false);
          navigateToChat();
        } else {
          flashErrorMessage(LanguageKeys.conversationLimit);
        }
      });
    }
  };

  const navigateToChat = () => {
    onPress();
    navigation.navigate('SingleChat', {
      otherUserData: chatUserData,
      conversationData: userConversation,
      fromProfile: true,
    });
  };

  const onLikeUnlike = (type: string) => {
    if (type === 'like') {
      setProfileImageError(false);
      likeIconRef.current?.bounce(500);
      onLikePress(data?.id);
    } else {
      onPassPress(data?.id);
      setProfileImageError(false);
      unLikeIconRef.current?.bounce(500);
    }
  };

  const onProfileImageLoadStart = () => setProfileImageLoader(true);
  const onProfileImageLoadEnd = () => setProfileImageLoader(false);
  const onProfileImageError = () => {
    setProfileImageLoader(false);
    setProfileImageError(true);
  };

  const image = (
    <View
      style={{
        ...Styles.profileImageCon,
        ...Styles.shadow,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {!profileImageError && data?.media?.primary_image_to_show ? (
        <Image
          source={
            data?.media?.primary_image_to_show
              ? { uri: data?.media?.primary_image_to_show }
              : Images.userPlaceholderVertical
          }
          onLoadStart={onProfileImageLoadStart}
          onLoadEnd={onProfileImageLoadEnd}
          onError={onProfileImageError}
          style={Styles.image}
          resizeMode="contain"
        />
      ) : (
        <Image
          source={Images.userPlaceholderVertical}
          style={{ ...Styles.image, height: '100%' }}
          resizeMode="contain"
        />
      )}
      {profileImageLoader && (
        <ActivityIndicator
          style={{ position: 'absolute' }}
          color={Colors.theme}
          size={wp(8)}
        />
      )}
    </View>
  );

  if (!data?.id) {
    return (
      <View style={Styles.nullSlideInnerContainer}>
        <View style={Styles.nullUserInfoContainer}>
          <Image source={Images.recommendationIcon2} style={Styles.nullIcon} />
          <Text style={Styles.userNullTxtName}>
            {t('noRcommendedUserAvailable')}
          </Text>
        </View>
        <View style={Styles.closeTextContainer}>
          <Button
            text={LanguageKeys.close}
            buttonStyle={Styles.btnContainer}
            onPress={() => onPress()}
            textStyle={Styles.closeBtnText}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={Styles.slideInnerContainer}>
      <View style={Styles.shadow} />
      <View
        style={[Styles.imageContainer, even ? Styles.imageContainerEven : {}]}
      >
        {image}
      </View>
      <View style={Styles.userDataContainer}>
        <View>
          <Text style={Styles.userInfoTxtName}>
            {chatUserData?.name}, {chatUserData?.age}
          </Text>
          {chatUserData?.city && (
            <Text style={Styles.userInfoTxt}>
              {chatUserData?.city}
              {chatUserData?.city && chatUserData?.country && ', '}
              {chatUserData?.country}
            </Text>
          )}
        </View>
        {matchingData?.length ? (
          <View
            style={{
              ...Styles.listItemContainer,
              flexDirection: Rtl ? 'row-reverse' : 'row',
            }}
          >
            {matchingData?.map((item: any, index: number) => (
              <View key={index} style={Styles.item}>
                <Text style={Styles.itemValue}>{item?.value}</Text>
              </View>
            ))}
          </View>
        ) : null}
        <View style={Styles.textContainer}>
          <Animatable.View
            ref={likeIconRef}
            style={[
              Styles.bottomBtnContainer,
              { backgroundColor: Colors.color22 },
            ]}
          >
            <Ripple
              style={Styles.btnWrapper}
              onPress={() => onLikeUnlike('like')}
            >
              <View style={Styles.iconCon}>
                <AntDesign name="like1" size={wp(5)} color={Colors.color2} />
              </View>
              <Text style={[Styles.btnTxt]}>Like</Text>
            </Ripple>
          </Animatable.View>
          <Animatable.View
            ref={unLikeIconRef}
            style={[
              Styles.bottomBtnContainer,
              { backgroundColor: Colors.color22 },
            ]}
          >
            <Ripple
              style={Styles.btnWrapper}
              onPress={() => onLikeUnlike('unlike')}
            >
              <View style={Styles.iconCon}>
                <AntDesign name="dislike1" size={wp(5)} color={Colors.color2} />
              </View>
              <Text style={Styles.btnTxt}>Pass</Text>
            </Ripple>
          </Animatable.View>
          <Ripple
            style={[
              Styles.bottomBtnContainer,
              { flex: 1.5, backgroundColor: Colors.color47 },
            ]}
            onPress={onMessagePress}
          >
            <View style={Styles.iconCon}>
              <MaterialCommunityIcons
                name="message-processing-outline"
                size={wp(5)}
                color={Colors.color2}
              />
            </View>
            <Text style={[Styles.btnTxt, { color: Colors.color2 }]}>
              Message
            </Text>
          </Ripple>
        </View>
      </View>
      <LinearGradient
        colors={[
          'rgba(0,0,0,0)',
          'rgba(0,0,0,0)',
          'rgba(0,0,0,.7)',
          'rgba(0,0,0,1)',
        ]}
        locations={[0, 0.3, 0.8, 1]}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '50%',
        }}
      />
    </View>
  );
};

export default SliderEntry;

const Styles = StyleSheet.create({
  nullSlideInnerContainer: {
    width: itemWidth,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nullUserInfoContainer: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.color2,
  },
  nullIcon: {
    marginBottom: 20,
    width: 102,
    height: 100,
  },
  userNullTxtName: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small3,
    paddingLeft: wp(3),
    paddingRight: wp(3),
    // textShadowColor: Colors.blackRGBA70,
    // textShadowOffset: { width: 2, height: 2 },
    // textShadowRadius: 15,
    textAlign: 'center',
  },
  closeTextContainer: {
    position: 'absolute',
    bottom: 0,
    marginBottom: 10,
    justifyContent: 'center',
    width: '95%',
  },
  slideInnerContainer: {
    height: '100%',
    backgroundColor: Colors.greyRGBA61,
    width: '100%',
  },
  shadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    shadowColor: 'rgba(0, 0, 0, 0.7)',
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    backgroundColor: Colors.color2,
  },
  imageContainer: {
    marginBottom: isIOS ? 0 : -1,
    backgroundColor: Colors.color2,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  imageContainerEven: {
    backgroundColor: Colors.color1,
  },
  profileImageCon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
    backgroundColor: Colors.greyRGBA61,
  },
  userDataContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    zIndex: 9,
  },
  userInfoTxtName: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.large2,
    paddingHorizontal: wp(2.5),
    textShadowColor: Colors.blackRGBA70,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 15,
    textTransform: 'capitalize',
  },
  userInfoTxt: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.medium2,
    paddingHorizontal: wp(2.5),
    textShadowColor: Colors.blackRGBA70,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 15,
  },
  listItemContainer: {
    flexWrap: 'wrap',
    paddingHorizontal: wp(2.5),
    gap: 5,
    marginBottom: 10,
  },
  item: {
    marginTop: 10,
    paddingHorizontal: wp(1.5),
    paddingVertical: hp(0.5),
    borderRadius: 50,
    borderColor: Colors.color2,
    borderWidth: 1,
    textShadowColor: Colors.blackRGBA70,
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 15,
  },
  itemValue: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small,
    alignSelf: 'flex-start',
    textShadowColor: Colors.blackRGBA70,
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 15,
  },
  textContainer: {
    paddingHorizontal: wp(2.5),
    marginBottom: 10,
    justifyContent: 'center',
    flexDirection: 'row',
    borderBottomLeftRadius: entryBorderRadius,
    borderBottomRightRadius: entryBorderRadius,
    gap: 5,
    marginTop: 10,
  },
  btnContainer: {
    backgroundColor: Colors.color2,
    borderWidth: 1,
    borderColor: Colors.greyRGBA61,
  },
  closeBtnText: {
    color: Colors.blackRGBA70,
  },
  bottomBtnContainer: {
    flex: 1,
    height: hp(5.5),
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  btnWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btnTxt: {
    alignSelf: 'center',
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small2,
    paddingLeft: wp(2.5),
  },
  iconCon: {
    justifyContent: 'center',
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
