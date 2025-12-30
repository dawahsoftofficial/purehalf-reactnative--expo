import {
  type NavigationProp,
  type ParamListBase,
  useFocusEffect,
} from '@react-navigation/native';
import moment from 'moment';
import type { ReactElement } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ImageBackground,
  Modal,
  StatusBar,
  StyleSheet,
  Text as ReactText,
  View,
} from 'react-native';
import Ripple from 'react-native-material-ripple';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import {
  Button,
  CheckMembershipStatus,
  LinearGradient,
  ModalLoader,
  ProfileBadges,
  Text,
} from '../../components';
import { hp, Typography, wp } from '../../global';
import Constants from '../../global/Constants';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts, Images } from '../../res';
import {
  ApiServices,
  capitalize,
  Firebase,
  flashErrorMessage,
  flashSuccessMessage,
  isIOS,
  StorageManager,
  useGlobalContext,
} from '../../services';

const { width, height } = Dimensions.get('window');

type FcmToken = { fcm_token?: string | null };

type UserMedia = {
  primary_image?: string;
  primary_image_to_show?: string;
  cover_image?: string;
  public_gallery?: string[];
  private_photo_count?: number;
  youtube_url?: string;
};

type User = {
  id?: number;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  age?: number;
  city?: string;
  country?: string;
  last_online_at?: string;
  liked?: boolean;
  membership_expiry?: string | null;
  media?: UserMedia;
  fcm_token?: FcmToken[];
  gender?: string;
  is_blur?: boolean;
  blur_allowed_you?: boolean;
  block_by_you?: number;
  blocked?: number;
};

type Conversation = {
  convDetails: {
    participantsDeleteFlag: Record<string, unknown>;
    id?: string;
  };
  messages: unknown[];
};

type HeaderProps = {
  navigation: NavigationProp<ParamListBase>;
  userData: User;
  onLikeUnlikePress?: (liked: boolean) => void;
  onBlockPress?: () => void;
  fromUserProfile?: boolean;
  isBlockedYou?: boolean;
};

type NameRowProps = {
  firstName?: string;
  lastName?: string;
  showStatus: boolean;
  statusColor: string;
  rtl: boolean;
};

const NameRow = React.memo(function NameRow({
  firstName,
  lastName,
  showStatus,
  statusColor,
  rtl,
}: NameRowProps): ReactElement {
  return (
    <View
      style={{ ...Styles.nameCon, flexDirection: rtl ? 'row-reverse' : 'row' }}
    >
      <ReactText style={{ ...Styles.name }}>
        {capitalize(firstName ?? '') + ' ' + capitalize(lastName ?? '')}
      </ReactText>
      {showStatus && (
        <View
          style={{
            ...Styles.onlineStatus,
            backgroundColor: statusColor,
          }}
        />
      )}
    </View>
  );
});

type LocationProps = {
  city?: string;
  country?: string;
};

const LocationText = React.memo(function LocationText({
  city,
  country,
}: LocationProps): ReactElement {
  return (
    <ReactText style={Styles.location} numberOfLines={2}>
      {city}
      {city && ', '}
      {country}
    </ReactText>
  );
});

type AgeProps = {
  age?: number;
};

const AgeText = React.memo(function AgeText({ age }: AgeProps): ReactElement {
  return (
    <ReactText style={Styles.location} numberOfLines={2}>
      {`Age: ${age}`}
    </ReactText>
  );
});

type ActionButtonsProps = {
  rtl: boolean;
  isBlocked: boolean;
  isBlockedByYou: boolean;
  onBlockPress?: () => void;
  onMessagePress: () => void;
  onLikePress: () => void;
  messageButtonLoader: boolean;
  liked: boolean;
};

const ActionButtons = React.memo(function ActionButtons({
  rtl,
  isBlocked,
  isBlockedByYou,
  onBlockPress,
  onMessagePress,
  onLikePress,
  messageButtonLoader,
  liked,
}: ActionButtonsProps): ReactElement {
  const blockIconColor =
    isBlocked || isBlockedByYou ? Colors.theme : Colors.color1;

  return (
    <View
      style={{
        ...Styles.actionBtnCon,
        flexDirection: rtl ? 'row-reverse' : 'row',
      }}
    >
      <Ripple style={Styles.actionIcon} onPress={onBlockPress}>
        <Entypo name="block" color={blockIconColor} size={wp(4.5)} />
      </Ripple>
      <Ripple
        style={[Styles.actionIcon, { backgroundColor: Colors.color47 }]}
        onPress={onMessagePress}
        disabled={messageButtonLoader}
      >
        {messageButtonLoader ? (
          <ActivityIndicator color={Colors.theme} size={'small'} />
        ) : (
          <AntDesign name="mail" color={Colors.color2} size={wp(4.5)} />
        )}
      </Ripple>

      <Ripple style={Styles.actionIcon} onPress={onLikePress}>
        {liked ? (
          <AntDesign name="heart" color={Colors.theme} size={wp(4.5)} />
        ) : (
          <AntDesign name="hearto" color={Colors.color1} size={wp(4.5)} />
        )}
      </Ripple>
    </View>
  );
});

type AllPicturesButtonProps = {
  rtl: boolean;
  fromUserProfile: boolean;
  hasPublicGallery: boolean;
  privatePhotoCount?: number;
  onSeeAllPress: () => void;
  onEditPress: () => void;
};

const AllPicturesButton = React.memo(function AllPicturesButton({
  rtl,
  fromUserProfile,
  hasPublicGallery,
  privatePhotoCount,
  onSeeAllPress,
  onEditPress,
}: AllPicturesButtonProps): ReactElement | null {
  if (!fromUserProfile) {
    return (
      <Ripple
        style={{
          ...Styles.myPhotosBtn,
          flexDirection: rtl ? 'row-reverse' : 'row',
        }}
        onPress={onEditPress}
      >
        <Entypo
          style={{
            marginRight: rtl ? 0 : wp(1.6),
            marginLeft: rtl ? wp(1.6) : 0,
          }}
          name={'camera'}
          size={wp(5.5)}
          color={Colors.color2}
        />
        <View
          style={{
            ...Styles.allPhotosBtnInner,
            flexDirection: rtl ? 'row-reverse' : 'row',
          }}
        >
          <Text style={Styles.allPhotosTxt}>{LanguageKeys.myPhotos}</Text>
        </View>
      </Ripple>
    );
  }

  const showGallery = hasPublicGallery || (privatePhotoCount ?? 0) > 0;
  if (!showGallery) {
    return null;
  }

  return (
    <Ripple
      style={{
        ...Styles.allPhotosBtn,
        flexDirection: rtl ? 'row-reverse' : 'row',
      }}
      onPress={onSeeAllPress}
    >
      <Image
        source={Images.gallery}
        resizeMode="contain"
        style={[
          Styles.galleryIcon,
          {
            marginRight: rtl ? 0 : wp(1.6),
            marginLeft: rtl ? wp(1.6) : 0,
          },
        ]}
      />
      <View
        style={{
          ...Styles.allPhotosBtnInner,
          flexDirection: rtl ? 'row-reverse' : 'row',
        }}
      >
        <Text style={Styles.allPhotosTxt}>{LanguageKeys.seeAllPictures}</Text>
      </View>
    </Ripple>
  );
});

const Header = ({
  navigation,
  fromUserProfile = false,
  onBlockPress = () => null,
  isBlockedYou = false,
  userData: initialUserData,
  onLikeUnlikePress,
}: HeaderProps) => {
  const { currentUser, conversations, updateCurrentUser } = useGlobalContext();
  const [userConversation, setUserConversation] = useState<Conversation | null>(
    null
  );
  const [liked, setLiked] = useState<boolean>(Boolean(initialUserData?.liked));
  const [profileImageLoader, setProfileImageLoader] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);
  const [userData, setUserData] = useState<User>(initialUserData);
  const [isPremiumMember, setIsPremiumMember] = useState<boolean>(false);
  const [modalLoader, setModalLoader] = useState(false);
  const [messageButtonLoader, setMessageButtonLoader] = useState(true);
  const [blurModalVisible, setBlurModalVisible] = useState<boolean>(false);
  const [isUpdatingBlur, setIsUpdatingBlur] = useState(false);

  const chatUserData = useMemo(
    () => ({
      id: userData?.id,
      name: userData?.full_name,
      image: userData?.media?.primary_image_to_show,
      token:
        userData?.fcm_token
          ?.map((item) => item?.fcm_token)
          .filter((token): token is string => Boolean(token)) ?? [],
    }),
    [userData]
  );

  useFocusEffect(
    React.useCallback(() => {
      setIsPremiumMember(
        currentUser?.membership_status === 0 ||
          currentUser?.membership_status === null
          ? false
          : true
      );
      const updatedUserData = {
        ...initialUserData,
        is_blur:
          currentUser?.id === initialUserData?.id
            ? currentUser?.is_blur
            : initialUserData?.is_blur,
      };
      setUserData(updatedUserData);
      setLiked(Boolean(initialUserData?.liked));
      // Reset image loader states when user data changes
      setProfileImageLoader(false);
      setProfileImageError(false);
    }, [initialUserData, currentUser])
  );

  const getUserConversation = useCallback(() => {
    const conversationData = conversations.filter((element: Conversation) => {
      const deleteFlag = element.convDetails.participantsDeleteFlag;
      return deleteFlag.hasOwnProperty(JSON.stringify(userData?.id));
    });
    if (conversationData && conversationData.length !== 0) {
      setUserConversation(conversationData[0]);
      setMessageButtonLoader(false);
      return;
    }
    Firebase.getSingleConversation(currentUser?.id, userData?.id)
      .then((data) => {
        const conversationList = data as Conversation[];
        if (conversationList && conversationList.length !== 0) {
          setUserConversation(conversationList[0]);
        }
        setMessageButtonLoader(false);
      })
      .catch(() => setMessageButtonLoader(false));
  }, [conversations, currentUser?.id, userData?.id]);

  useFocusEffect(
    React.useCallback(() => {
      if (fromUserProfile) {
        getUserConversation();
      }
    }, [fromUserProfile, getUserConversation])
  );

  const navigateToChat = useCallback(() => {
    navigation.navigate('SingleChat', {
      otherUserData: chatUserData,
      conversationData: userConversation,
      fromProfile: true,
    });
  }, [chatUserData, navigation, userConversation]);

  const isPremiumUser = useCallback(() => {
    return new Promise((resolve) => {
      const now = moment();
      const membershipExpiry = currentUser?.membership_expiry;
      if (membershipExpiry !== null && moment(membershipExpiry).isAfter(now)) {
        resolve('premiumUser');
      } else if (
        membershipExpiry === null ||
        moment(membershipExpiry).isBefore(now)
      ) {
        setModalLoader(true);
        ApiServices.getCurrentUserDetail()
          .then((response) => {
            const userResponse = response as User;
            const membershipExpiry = userResponse?.membership_expiry;
            updateCurrentUser(userResponse);
            setModalLoader(false);
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
          .catch(() => {
            setModalLoader(false);
          });
      }
    });
  }, [currentUser?.membership_expiry, navigation, updateCurrentUser]);

  const onMessagePress = useCallback(() => {
    const conversationId = userConversation?.convDetails?.id;
    if (!conversationId) {
      navigateToChat();
      return;
    }
    const handleChatCount = (count: unknown) => {
      const totalChats = typeof count === 'number' ? count : Number(count ?? 0);
      if (totalChats < 5) {
        navigateToChat();
      } else {
        flashErrorMessage(LanguageKeys.conversationLimit);
      }
    };

    if (currentUser?.gender === 'male') {
      isPremiumUser().then(() => {
        Firebase.getNoOfChats(currentUser?.id, conversationId).then(
          handleChatCount
        );
      });
      return;
    }

    Firebase.getNoOfChats(currentUser?.id, conversationId).then(
      handleChatCount
    );
  }, [
    currentUser?.gender,
    currentUser?.id,
    isPremiumUser,
    navigateToChat,
    userConversation?.convDetails?.id,
  ]);

  const Rtl = CheckRtl();

  const lastOnlineFromCurrentTime = useMemo(() => {
    if (!userData?.last_online_at) {
      return 0;
    }
    return parseInt(
      moment
        .duration(moment(new Date()).diff(moment(userData?.last_online_at)))
        .asHours()
        .toFixed()
    );
  }, [userData?.last_online_at]);

  const onlineStatusColor = useMemo(() => {
    if (lastOnlineFromCurrentTime === 1) {
      return Colors.color10;
    }
    if (lastOnlineFromCurrentTime > 1 && lastOnlineFromCurrentTime <= 12) {
      return Colors.color19;
    }
    return Colors.color15;
  }, [lastOnlineFromCurrentTime]);

  const isSelf = currentUser?.id === userData?.id;

  const onEditPress = useCallback(() => {
    navigation.navigate('PhotosAndVideos');
  }, [navigation]);

  const handleLikeToggle = useCallback(() => {
    setLiked((prev) => {
      const next = !prev;
      if (onLikeUnlikePress) {
        onLikeUnlikePress(next);
      }
      return next;
    });
  }, [onLikeUnlikePress]);

  const onSeeAllPicPress = useCallback(() => {
    if (!fromUserProfile) {
      navigation.navigate('PhotosAndVideos');
      return;
    }
    isPremiumUser().then(() => {
      navigation.navigate('ImageViewer', { userData });
    });
  }, [fromUserProfile, isPremiumUser, navigation, userData]);

  const onBackPress = useCallback(() => navigation.goBack(), [navigation]);

  const onBlurButtonPress = useCallback(() => {
    setBlurModalVisible(true);
  }, []);

  const closeBlurModal = useCallback(() => {
    setBlurModalVisible(false);
  }, []);

  const onToggleBlur = useCallback(async () => {
    if (isUpdatingBlur) return;

    const newBlurValue = !userData?.is_blur;
    setIsUpdatingBlur(true);
    try {
      const res = await ApiServices.updateDetails({
        is_blur: newBlurValue ? 1 : 0,
      });
      const { setData, storageKeys } = StorageManager;
      const updatedUser = {
        ...currentUser,
        ...(res as User),
        is_blur: newBlurValue,
      };
      await setData(storageKeys.USER, updatedUser);
      updateCurrentUser(updatedUser);
      setUserData((prev) => ({ ...prev, is_blur: newBlurValue }));
      flashSuccessMessage(
        newBlurValue ? LanguageKeys.turnOnBlur : LanguageKeys.turnOffBlur
      );
      setBlurModalVisible(false);
    } catch {
      // Error is already handled by updateDetails API
    } finally {
      setIsUpdatingBlur(false);
    }
  }, [currentUser, isUpdatingBlur, updateCurrentUser, userData?.is_blur]);

  const onProfileImageLoadStart = useCallback(
    () => setProfileImageLoader(true),
    []
  );
  const onProfileImageLoadEnd = useCallback(
    () => setProfileImageLoader(false),
    []
  );
  const onProfileImageError = useCallback(() => {
    setProfileImageError(true);
    setProfileImageLoader(false);
  }, []);

  // Reset loader when image URI changes
  useEffect(() => {
    setProfileImageLoader(false);
    setProfileImageError(false);
  }, [userData?.media?.primary_image_to_show]);

  const formattedLastOnlineDate = useMemo(() => {
    if (!userData?.last_online_at) {
      return { date: '', time: '' };
    }
    const lastOnline = moment(userData.last_online_at);
    return {
      date: lastOnline.isSame(new Date(), 'day')
        ? ''
        : lastOnline.format('Do MMM, YYYY'),
      time: lastOnline.format('(hh:mm a)'),
    };
  }, [userData?.last_online_at]);

  return (
    <View style={Styles.container}>
      {isPremiumMember && <StatusBar backgroundColor={Colors.color47} />}
      {fromUserProfile && <CheckMembershipStatus />}
      <ModalLoader visible={modalLoader} useModalLayout={true} />

      {userData?.media?.primary_image_to_show &&
      userData?.media?.primary_image_to_show?.length !== 0 &&
      !profileImageError ? (
        <ImageBackground
          style={{
            ...StyleSheet.absoluteFill,
            backgroundColor: Colors.color1,
          }}
          source={{ uri: userData?.media?.primary_image_to_show }}
          resizeMode="contain"
          onLoadStart={onProfileImageLoadStart}
          onLoadEnd={onProfileImageLoadEnd}
          onError={onProfileImageError}
        >
          {profileImageLoader && !profileImageError && (
            <ActivityIndicator
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              color={Colors.theme}
              size={wp(8)}
            />
          )}
        </ImageBackground>
      ) : (
        <View
          style={{
            ...StyleSheet.absoluteFill,
            backgroundColor: Colors.color1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <FontAwesome5 name="user-alt" color={Colors.color8} size={wp(24)} />
        </View>
      )}
      {/* {!userData?.blur_allowed_you && userData?.is_blur ? <BlurView /> : null} */}

      <LinearGradient
        colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.65)']}
        style={{ ...StyleSheet.absoluteFill }}
      />
      <View
        style={[
          Styles.badgesContainer,
          {
            left: Rtl ? wp(2) : undefined,
            right: Rtl ? undefined : wp(2),
          },
        ]}
      >
        <ProfileBadges isSelf={isSelf} showText={false} userData={userData} />
        {/* {isSelf ? (
          <Ripple
            style={Styles.infoChip}
            onPress={() => setToolTipVisible(true)}
            hitSlop={20}
            rippleColor={Colors.theme}
          >
            <Image source={Images.infoIcon} style={Styles.infoIconSmall} />
          </Ripple>
        ) : null} */}
      </View>
      {fromUserProfile && (
        <Ripple
          style={[
            Styles.navButton,
            {
              left: Rtl ? undefined : wp(4),
              right: Rtl ? wp(4) : undefined,
            },
          ]}
          hitSlop={20}
          rippleColor={Colors.theme}
          onPress={onBackPress}
        >
          <AntDesign
            name={Rtl ? 'arrowright' : 'arrowleft'}
            color={Colors.color1}
            size={wp(7)}
          />
        </Ripple>
      )}

      <View
        style={[Styles.surface, fromUserProfile ? { paddingBottom: 0 } : {}]}
      >
        <View
          style={[
            Styles.profileRow,
            { flexDirection: Rtl ? 'row-reverse' : 'row' },
          ]}
        >
          <View
            style={[
              Styles.profileInfo,
              { alignItems: Rtl ? 'flex-end' : 'flex-start' },
            ]}
          >
            <View
              style={[
                Styles.nameWrapper,
                { flexDirection: Rtl ? 'row-reverse' : 'row' },
              ]}
            >
              <NameRow
                firstName={userData?.first_name}
                lastName={userData?.last_name}
                showStatus={fromUserProfile}
                statusColor={onlineStatusColor}
                rtl={Rtl}
              />
            </View>
            <AgeText age={userData?.age} />
            <LocationText city={userData?.city} country={userData?.country} />
            {!isBlockedYou && fromUserProfile && (
              <View style={{ alignItems: Rtl ? 'flex-end' : 'flex-start' }}>
                <Text style={Styles.lastOnlineAt}>
                  {LanguageKeys.lastOnlineAt}
                </Text>
                <View style={Styles.lastOnlineAtInner}>
                  {formattedLastOnlineDate.date ? (
                    <ReactText
                      style={{ ...Styles.lastOnlineAt, marginRight: wp(1) }}
                    >
                      {formattedLastOnlineDate.date}
                    </ReactText>
                  ) : null}
                  <ReactText style={{ ...Styles.lastOnlineAt }}>
                    {formattedLastOnlineDate.time}
                  </ReactText>
                </View>
              </View>
            )}
            <View
              style={[
                Styles.actionsWrapper,
                { flexDirection: Rtl ? 'row-reverse' : 'row' },
              ]}
            >
              {!isBlockedYou && fromUserProfile && (
                <ActionButtons
                  rtl={Rtl}
                  isBlocked={userData?.blocked === 1}
                  isBlockedByYou={userData?.block_by_you === 1}
                  onBlockPress={onBlockPress}
                  onMessagePress={onMessagePress}
                  onLikePress={handleLikeToggle}
                  messageButtonLoader={messageButtonLoader}
                  liked={liked}
                />
              )}

              {!isBlockedYou && (
                <AllPicturesButton
                  rtl={Rtl}
                  fromUserProfile={fromUserProfile}
                  hasPublicGallery={Boolean(
                    userData?.media?.public_gallery?.length
                  )}
                  privatePhotoCount={userData?.media?.private_photo_count}
                  onSeeAllPress={onSeeAllPicPress}
                  onEditPress={onEditPress}
                />
              )}

              {isSelf && (
                <Ripple
                  style={{
                    ...Styles.myPhotosBtn,
                    flexDirection: Rtl ? 'row-reverse' : 'row',
                  }}
                  onPress={onBlurButtonPress}
                >
                  <Entypo
                    style={{
                      marginRight: Rtl ? 0 : wp(1.6),
                      marginLeft: Rtl ? wp(1.6) : 0,
                    }}
                    name={userData?.is_blur ? 'eye' : 'eye-with-line'}
                    size={wp(5.5)}
                    color={Colors.color2}
                  />
                  <View
                    style={{
                      ...Styles.allPhotosBtnInner,
                      flexDirection: Rtl ? 'row-reverse' : 'row',
                    }}
                  >
                    <Text style={Styles.allPhotosTxt}>
                      {userData?.is_blur ? 'Blur My Photos' : 'Blur is ON'}
                    </Text>
                  </View>
                </Ripple>
              )}
            </View>
          </View>
        </View>
      </View>

      <Modal transparent={true} visible={blurModalVisible}>
        <View style={Styles.blurModalWrapper}>
          <View style={Styles.blurModalContent}>
            <Ripple
              style={Styles.blurModalCloseWrapper}
              onPress={closeBlurModal}
            >
              <AntDesign name="close" size={wp(6)} color={Colors.color1} />
            </Ripple>

            <Text style={Styles.blurModalTitle}>
              {LanguageKeys.blurYourPhotoForPrivacy}
            </Text>

            <View style={Styles.blurImageComparison}>
              <View style={Styles.blurImageContainer}>
                <View style={Styles.blurImageWrapper}>
                  <Image
                    source={{
                      uri: userData?.media?.primary_image_to_show,
                    }}
                    style={Styles.blurComparisonImage}
                    resizeMode="cover"
                  />
                </View>
                <Text style={Styles.blurImageLabel}>
                  {LanguageKeys.visibleToOthersUnblurred}
                </Text>
              </View>

              <AntDesign
                name="arrowright"
                size={wp(6)}
                color={Colors.color1}
                style={Styles.blurArrow}
              />

              <View style={Styles.blurImageContainer}>
                <View style={Styles.blurImageWrapper}>
                  <Image
                    source={{
                      uri: userData?.media?.primary_image,
                    }}
                    style={Styles.blurComparisonImage}
                    resizeMode="cover"
                  />
                  {/* <BlurView style={StyleSheet.absoluteFill} blurAmount={10} /> */}
                </View>
                <Text style={Styles.blurImageLabel}>
                  {LanguageKeys.visibleToOthersBlurred}
                </Text>
              </View>
            </View>

            <Text style={Styles.blurDescription}>
              {LanguageKeys.youWillStillSeeOriginal}
            </Text>

            <View style={Styles.blurBenefitsList}>
              <View style={Styles.blurBenefitItem}>
                <AntDesign name="check" size={wp(4)} color={Colors.theme} />
                <Text style={Styles.blurBenefitText}>
                  {LanguageKeys.helpsKeepIdentityPrivate}
                </Text>
              </View>
              <View style={Styles.blurBenefitItem}>
                <AntDesign name="check" size={wp(4)} color={Colors.theme} />
                <Text style={Styles.blurBenefitText}>
                  {LanguageKeys.recommendedForIslamicModesty}
                </Text>
              </View>
              <View style={Styles.blurBenefitItem}>
                <AntDesign name="check" size={wp(4)} color={Colors.theme} />
                <Text style={Styles.blurBenefitText}>
                  {LanguageKeys.youStayInControl}
                </Text>
              </View>
            </View>

            <Text style={Styles.blurSecurityNote}>
              {LanguageKeys.originalPhotoStoredSecurely}
            </Text>

            <View style={Styles.blurModalButtons}>
              <Button
                onPress={closeBlurModal}
                buttonStyle={[
                  Styles.blurModalButton,
                  Styles.blurModalButtonSecondary,
                ]}
                text={LanguageKeys.gotIt}
                textStyle={Styles.blurModalButtonTextSecondary}
              />
              <Button
                onPress={onToggleBlur}
                buttonStyle={[
                  Styles.blurModalButton,
                  Styles.blurModalButtonPrimary,
                ]}
                text={
                  userData?.is_blur
                    ? LanguageKeys.blurIsOn
                    : LanguageKeys.blurForOthers
                }
                textStyle={Styles.blurModalButtonTextPrimary}
                disabled={isUpdatingBlur}
                loading={isUpdatingBlur}
                loadingMessage={LanguageKeys.updating}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Header;

const Styles = StyleSheet.create({
  container: {
    height: height * 0.45,
    // marginBottom: hp(3),
    justifyContent: 'flex-end',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1),
  },
  navButton: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(5.5),
    backgroundColor: Colors.color2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.color8,
    position: 'absolute',
    left: wp(4),
    top: wp(4),
    zIndex: 10,
  },
  surface: {
    padding: wp(4),
  },
  profileRow: {
    width: '100%',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  nameWrapper: {
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: hp(0.5),
  },
  badgesContainer: {
    position: 'absolute',
    top: wp(2),
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
  },
  infoChip: {
    padding: wp(2),
    borderRadius: 12,
    backgroundColor: Colors.color3,
    borderWidth: 1,
    borderColor: Colors.color8,
  },
  infoIconSmall: {
    width: 20,
    height: 20,
  },
  actionsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp(1),
    marginBottom: hp(2),
    width: '100%',
  },
  onlineStatus: {
    width: width * 0.04,
    height: width * 0.04 * 1,
    borderRadius: (width * 0.04 * 1) / 2,
    marginTop: hp(0.1),
    marginHorizontal: wp(1),
  },
  videoVoiceContainer: {
    width: '100%',
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
  },
  videoVoiceIconWrapper: {
    backgroundColor: Colors.color47,
    padding: wp(1),
    borderRadius: 50,
    alignItems: 'center',
  },
  contentContainer: {
    width: '100%',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contentContainerInner: {
    width: wp(50),
    justifyContent: 'flex-end',
  },
  rowCon: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  blurContainer: {
    justifyContent: 'center',
    marginLeft: 10,
  },
  blurText: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_R,
    includeFontPadding: false,
    fontSize: Typography.small2,
  },
  nameCon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.medium1,
    includeFontPadding: false,
  },
  location: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_R,
    includeFontPadding: false,
    fontSize: Typography.small2,
  },
  allPhotosBtn: {
    justifyContent: 'space-between',
    borderRadius: 30,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(2.5),
    backgroundColor: Colors.color47,
  },
  myPhotosBtn: {
    justifyContent: 'space-between',
    borderRadius: 30,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(2.5),
    backgroundColor: Colors.color1,
  },
  allPhotosBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  galleryIcon: {
    width: wp(4),
    height: hp(3),
  },
  allPhotosTxt: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small,
    marginBottom: Constants.fontFamilyMarginBottom,
    marginHorizontal: wp(0.4),
  },
  actionBtnCon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  actionIcon: {
    width: width * 0.1,
    height: width * 0.1 * 1,
    borderRadius: (width * 0.08 * 1) / 2,
    backgroundColor: Colors.color2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconInner: {
    width: width * 0.1,
    height: width * 0.1 * 1,
    borderRadius: (width * 0.08 * 1) / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shadow: {
    shadowColor: Colors.color1,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  profileImageCon: {
    alignSelf: 'flex-start',
    width: width * 0.3,
    height: width * 0.3 * 1,
    borderRadius: (width * 0.3 * 1) / 6,
    marginHorizontal: wp(3),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.color2,
  },
  profileImage: {
    width: width * 0.3,
    height: width * 0.3 * 1,
    borderRadius: (width * 0.3 * 1) / 6,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  youtubeIcon: {
    alignSelf: 'flex-end',
    marginHorizontal: wp(5),
    marginBottom: hp(-0.6),
  },
  lastOnlineAt: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_R,
    includeFontPadding: false,
    fontSize: Typography.small,
  },
  lastOnlineAtInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gradientView: {
    position: 'absolute',
    bottom: 0,
    width: wp(100),
    height: hp(30),
  },
  modalWrapper: {
    flex: 1,
    padding: 10,
    backgroundColor: Colors.color2,
  },
  tooltipWrapper: {
    position: 'absolute',
    left: 125,
    top: -10,
    zIndex: 9,
    backgroundColor: Colors.color2,
    borderRadius: 25,
    // padding: 7,
  },
  infoIcon: {
    width: 30,
    height: 30,
  },
  quotesIcon: {
    width: 80,
    height: 80,
    opacity: 0.3,
  },
  tootltipTextWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  closeWrapper: {
    alignSelf: 'flex-end',
    paddingRight: 10,
    marginTop: isIOS ? 40 : 2,
  },
  tootltipTitle: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.medium,
    marginTop: 20,
  },
  description: {
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    color: Colors.color1,
  },
  tootltipText: {
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    color: Colors.color1,
  },
  closeBtn: {
    backgroundColor: Colors.color2,
    borderWidth: 1,
    borderColor: Colors.greyRGBA61,
    marginBottom: hp(2),
    marginHorizontal: wp(5),
  },
  closeBtnText: {
    color: Colors.blackRGBA70,
  },
  italic: { fontStyle: 'italic' },
  userIcon: {
    marginTop: hp(3),
  },
  profileCameraIcon: {
    position: 'absolute',
    bottom: hp(-0.2),
    backgroundColor: '#D9DADF',
    width: width * 0.1,
    height: width * 0.1 * 1,
    borderRadius: (width * 0.1 * 1) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    right: wp(-3),
  },
  coverCameraIcon: {
    position: 'absolute',
    bottom: hp(-0.5),
    right: wp(4),
    backgroundColor: '#D9DADF',
    width: width * 0.1,
    height: width * 0.1 * 1,
    borderRadius: (width * 0.1 * 1) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  premiumBadge: {
    width: width * 0.07,
    height: width * 0.07,
    borderRadius: 50,
    backgroundColor: Colors.color47,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: -7,
    left: 100,
  },
  premiumBadgeIcon: {
    width: 14,
    height: 14,
  },
  blurModalWrapper: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurModalContent: {
    backgroundColor: Colors.color2,
    borderRadius: wp(4),
    padding: wp(5),
    width: '95%',
    maxHeight: hp(90),
  },
  blurModalCloseWrapper: {
    alignSelf: 'flex-end',
    padding: wp(2),
    marginTop: -wp(2),
    marginRight: -wp(2),
  },
  blurModalTitle: {
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.medium1,
    color: Colors.color1,
    marginBottom: hp(2),
    alignSelf: 'center',
  },
  blurImageComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  blurImageContainer: {
    flex: 1,
    alignItems: 'center',
  },
  blurImageWrapper: {
    width: wp(35),
    height: wp(35),
    borderRadius: wp(2),
    overflow: 'hidden',
    marginBottom: hp(1),
  },
  blurComparisonImage: {
    width: '100%',
    height: '100%',
  },
  blurImageLabel: {
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small2,
    color: Colors.color1,
    textAlign: 'center',
    marginTop: hp(0.5),
  },
  blurArrow: {
    marginHorizontal: wp(2),
  },
  blurDescription: {
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    color: Colors.color1,
    marginBottom: hp(2),
  },
  blurBenefitsList: {
    marginBottom: hp(2),
  },
  blurBenefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp(1),
  },
  blurBenefitText: {
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    color: Colors.color1,
    marginLeft: wp(2),
    flex: 1,
    includeFontPadding: false,
  },
  blurSecurityNote: {
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    color: Colors.color1,
    marginBottom: hp(2),
  },
  blurModalButtons: {
    flexDirection: 'row',
    gap: wp(2),
  },
  blurModalButton: {
    flex: 1,
    paddingVertical: hp(1.5),
  },
  blurModalButtonPrimary: {
    backgroundColor: Colors.theme,
  },
  blurModalButtonSecondary: {
    backgroundColor: Colors.color2,
    borderWidth: 1,
    borderColor: Colors.color8,
  },
  blurModalButtonTextPrimary: {
    color: Colors.color2,
    // fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small2,
  },
  blurModalButtonTextSecondary: {
    color: Colors.color1,
    // fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small2,
  },
});
