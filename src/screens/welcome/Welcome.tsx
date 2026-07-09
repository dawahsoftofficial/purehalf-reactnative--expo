import notifee from '@notifee/react-native';
import { useFocusEffect } from '@react-navigation/native';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { usePremiumStore, useSettingsStore, useUserStatsStore } from '@/stores';

import {
  CheckMembershipStatus,
  Container,
  Loader,
  ModalLoader,
  PurchaseSuccessModal,
  Swiper,
  Text as AppText,
} from '../../components';
import { hp, Typography, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { CommonActions } from '../../navigation';
import { Colors, Fonts } from '../../res';
import {
  ApiServices,
  flashErrorMessage,
  flashSuccessMessage,
  isIOS,
  StorageManager,
  useGlobalContext,
} from '../../services';
import { presentBoostProfilePaywall } from '../../services/paywall-service';
import { canCollectChatCredits } from '../../services/utils/chat-credits-utils';
import { AccountModal, RecommendationHeart } from './components';
import OptionsBar from './OptionsBar';
import PremiumButton from './PremiumButton';
import PrivatePhotoAccessBtn from './PrivatePhotoAccessBtn';
import UsersList from './UsersList';

type OptionButton = {
  name: string;
  value: string;
};

type ProfileProgressItem = {
  label: string;
  id: string;
  navigation: string;
  scrollTo?: number;
  completed: boolean;
};

type WelcomeRouteParams = {
  openRecommendationModal?: boolean;
};

type WelcomeProps = {
  navigation: any;
  route?: { params?: WelcomeRouteParams };
};

const sortByCompletion = (
  a: ProfileProgressItem,
  b: ProfileProgressItem
): number => Number(b.completed) - Number(a.completed);

// Module-level flag to prevent multiple initial fetches across remounts
let hasInitializedUsers = false;

const Welcome: React.FC<WelcomeProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const Rtl = CheckRtl();
  const optionBarList = useMemo<OptionButton[]>(
    () => [
      {
        name: LanguageKeys.recommended,
        value: '-1',
      },
      {
        name: LanguageKeys.likedByYou,
        value: '2',
      },
      {
        name: LanguageKeys.likedYou,
        value: '1',
      },
      {
        name: LanguageKeys.visitors,
        value: '3',
      },
    ],
    []
  );

  const profileProgressTemplate = useMemo<ProfileProgressItem[]>(
    () => [
      // {
      //   label: LanguageKeys.profileImage,
      //   id: 'primary_image_to_show',
      //   navigation: 'PhotosAndVideos',
      //   completed: false,
      // },
      // Currently not entertaining cover photo
      // {
      //   label: LanguageKeys.coverImage,
      //   id: 'cover_image',
      //   navigation: 'PhotosAndVideos',
      //   completed: false,
      // },
      {
        label: LanguageKeys.tagline,
        id: 'tagline',
        navigation: 'Profile',
        scrollTo: isIOS ? hp(2) : 10,
        completed: false,
      },
      {
        label: LanguageKeys.appearanceHealth,
        id: 'appearance-0',
        navigation: 'Profile',
        scrollTo: hp(80),
        completed: false,
      },
      {
        label: LanguageKeys.familyBackground,
        id: 'familybg-0',
        navigation: 'Profile',
        scrollTo: hp(120),
        completed: false,
      },
      {
        label: LanguageKeys.lifeStyle,
        id: 'life-0',
        navigation: 'Profile',
        scrollTo: hp(160),
        completed: false,
      },
      {
        label: LanguageKeys.personalityRequirements,
        id: 'personality-0',
        navigation: 'Profile',
        scrollTo: hp(210),
        completed: false,
      },
      {
        label: LanguageKeys.islamicValues,
        id: 'islamicval-0',
        navigation: 'Profile',
        scrollTo: hp(250),
        completed: false,
      },
      {
        label: LanguageKeys.futurePlans,
        id: 'futurePlans-0',
        navigation: 'Profile',
        scrollTo: hp(280),
        completed: false,
      },
      {
        label: LanguageKeys.myInterestAndHobbies,
        id: 'myInterestAndHobbies-0',
        navigation: 'Profile',
        scrollTo: hp(30),
        completed: false,
      },
    ],
    []
  );

  const { loaded, isPremium } = usePremiumStore();
  const isPremiumUser = isPremium();

  const { currentUser, updateCurrentUser } = useGlobalContext();
  const { setData, getData, storageKeys } = StorageManager;
  const [loader, setLoader] = useState(true);
  const [loadMoreLoader, setLoadMoreLoader] = useState(false);
  const [modalLoader, setModalLoader] = useState(false);
  // Get user stats from Pusher store (updated via counterUpdate events)
  const { like_count, visit_count, photo_request_count } = useUserStatsStore();
  const [activeOptionButton, setActiveOptionButton] = useState<OptionButton>(
    optionBarList[0]
  );
  const [optionTab, setOptionTab] = useState<string>('');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userListPage, setUserListPage] = useState(1);

  const [recommendationModal, setRecommendationModal] =
    useState<boolean>(false);
  const [headerModal, setHeaderModal] = useState<boolean>(false);
  const [boostSuccessModalVisible, setBoostSuccessModalVisible] =
    useState<boolean>(false);
  const [isBoostLoading, setIsBoostLoading] = useState<boolean>(false);
  const [profileCompleteProgress, setProfileCompleteProgress] = useState<
    ProfileProgressItem[]
  >(() => profileProgressTemplate.map((item) => ({ ...item })));
  const [showRecommendationModal, setShowRecommendationModal] =
    useState<boolean>(false);
  const dailyRecommendations = useSettingsStore().getDailyRecommendations();
  const [profileBannerDismissed, setProfileBannerDismissed] = useState(false);
  const profileIncomplete =
    profileCompleteProgress.length > 0 &&
    profileCompleteProgress.filter((i) => i.completed).length <
      profileCompleteProgress.length;

  // Check if recommendation modal should be shown based on daily recommendations settings
  useEffect(() => {
    if (!dailyRecommendations) return;

    const { status, start, end } = dailyRecommendations;

    // Check if status is enabled ('1')
    if (status !== '1') return;

    // Get current hour in 24-hour format (0-23)
    const currentHour = new Date().getHours();
    const startHour = parseInt(start, 10);
    const endHour = parseInt(end, 10);

    // Check if current time is between start and end hours
    // If end is 24, it means until 23:59 (end of day), so check >= startHour
    const shouldShow =
      endHour === 24
        ? currentHour >= startHour
        : currentHour >= startHour && currentHour < endHour;

    if (shouldShow) {
      setShowRecommendationModal(true);
      setRecommendationModal(true);
    }
  }, [dailyRecommendations]);
  const applyOptionSelection = useCallback((item: OptionButton) => {
    setOptionTab(item.name);
    setActiveOptionButton(item);
    setUserListPage(1);
    setHeaderModal(false);
    setUsersList([]);
  }, []);

  const getAttribute = useCallback(() => {
    getData(storageKeys.ATTRIBUTE).then((res) => {
      if (!res) {
        ApiServices.getAttribute().then((data) => {
          setData(storageKeys.ATTRIBUTE, data);
        });
      }
    });
  }, [getData, setData, storageKeys]);

  const getUsers = useCallback(
    (
      params: { page: number; type: number | string } = { page: 1, type: -1 },
      replace = false
    ) => {
      ApiServices.getUsers(params)
        .then((res) => {
          const list = Array.isArray(res) ? res : [];
          setUsersList((prev) => (replace ? list : [...prev, ...list]));
        })
        .catch(() => {})
        .finally(() => {
          setLoader(false);
          setLoadMoreLoader(false);
        });
    },
    []
  );

  // getUserStats removed - counters now come from Pusher events via useUserStatsStore

  const ensureActiveMembership = useCallback(async (): Promise<boolean> => {
    const now = moment();
    const membershipExpiry = currentUser?.membership_expiry;
    const hasActiveMembership =
      membershipExpiry !== null &&
      membershipExpiry !== undefined &&
      moment(membershipExpiry).isAfter(now);

    if (hasActiveMembership) {
      return true;
    }

    setModalLoader(true);
    try {
      const refreshedUser: any = await ApiServices.getCurrentUserDetail();
      updateCurrentUser(refreshedUser);
      const refreshedExpiry = refreshedUser?.membership_expiry;
      return (
        refreshedExpiry !== null &&
        refreshedExpiry !== undefined &&
        moment(refreshedExpiry).isAfter(now)
      );
    } catch (err) {
      console.log('error while ensuring active membership =>', err);
      return false;
    } finally {
      setModalLoader(false);
    }
  }, [currentUser?.membership_expiry, updateCurrentUser]);

  const onOptionPress = useCallback(
    async (item: OptionButton) => {
      const { value } = item;
      setLoader(true);

      if (value === '1' || value === '3') {
        // const hasMembership = await ensureActiveMembership();
        if (!isPremiumUser) {
          const defaultOption = optionBarList[0];
          applyOptionSelection(defaultOption);
          getUsers({ page: 1, type: defaultOption.value }, true);

          navigation.navigate('ProFeaturesPromotion', {
            navigateTo: 'BottomTab',
          });
          return;
        }
      }

      applyOptionSelection(item);
      getUsers({ page: 1, type: value }, true);
      // Counters now come from Pusher events, no API call needed
    },
    [applyOptionSelection, getUsers, isPremiumUser, navigation, optionBarList]
  );

  const onLoadMorePress = useCallback(() => {
    if (!loadMoreLoader) {
      setLoadMoreLoader(true);
    }

    setUserListPage((prevPage) => {
      const nextPage = prevPage + 1;
      const type = activeOptionButton?.value ?? optionBarList[0].value;
      getUsers({ page: nextPage, type });
      return nextPage;
    });
  }, [activeOptionButton?.value, getUsers, loadMoreLoader, optionBarList]);

  const navigateToChat = useCallback(
    (data: any) => {
      if (data?.conversationId) {
        navigation.navigate('SingleChat', {
          from: 'notification',
          conversationId: data?.conversationId,
          message: data?.message,
          otherUserData: data?.user,
        });
      }
    },
    [navigation]
  );

  const notifeeBackForHandler = useCallback(
    async ({ type, detail }: any) => {
      if (!isIOS) {
        if (type === 1) {
          if (detail?.pressAction?.id === 'openChat') {
            const data = detail?.notification?.data;
            navigateToChat(data);
            await notifee.cancelNotification(detail.notification.id);
          } else if (detail?.pressAction?.id === 'my_liked_you_tab') {
            await onOptionPress({
              name: LanguageKeys.likedYou,
              value: '1',
            });
            await notifee.cancelNotification(detail.notification.id);
          }
        }
      } else if (detail?.pressAction) {
        const pressAction = detail?.notification?.data?.pressAction;
        if (pressAction === 'openChat') {
          const data = detail?.notification?.data;
          navigateToChat(data);
          await notifee.cancelNotification(detail.notification.id);
        } else if (pressAction === 'my_liked_you_tab') {
          await onOptionPress({
            name: LanguageKeys.likedYou,
            value: '1',
          });
          await notifee.cancelNotification(detail.notification.id);
        }
      }
    },
    [navigateToChat, onOptionPress]
  );

  const getInitialNotification = useCallback(async () => {
    const initialNotification: any = await notifee.getInitialNotification();
    if (initialNotification?.pressAction?.id === 'openChat') {
      const data = initialNotification?.notification?.data;
      navigateToChat(data);
    } else if (initialNotification?.pressAction?.id === 'my_liked_you_tab') {
      await onOptionPress({
        name: LanguageKeys.likedYou,
        value: '1',
      });
    }
  }, [navigateToChat, onOptionPress]);

  const handleProfileCompleteData = useCallback(async () => {
    const baseState: Record<string, boolean> = {
      primary_image_to_show: Boolean(currentUser?.primary_image_to_show),
      // Currently not entertaining cover photo
      // cover_image: Boolean(currentUser?.media?.cover_image),
      tagline: Boolean(currentUser?.detail?.tagline),
      'appearance-0': true,
      'familybg-0': true,
      'life-0': true,
      'islamicval-0': true,
      'personality-0': true,
      'futurePlans-0': Boolean(
        currentUser?.detail?.family_plan_id &&
        currentUser?.detail?.marriage_plan_id &&
        currentUser?.detail?.relocation_plan_id
      ),
      'myInterestAndHobbies-0': Boolean(
        currentUser?.detail?.personality_id?.length
      ),
    };

    try {
      const data: any = await getData(storageKeys.PROFILE_DETAIL_LOCAL);
      if (data) {
        let islamicCount = 0;
        Object.keys(data).forEach((childKey) => {
          data[childKey].forEach((element: any) => {
            if (currentUser?.detail && Object.keys(currentUser.detail).length) {
              const value = currentUser.detail[element.apiKey];
              if (value === null || value === undefined) {
                baseState[element?.category] = false;
              }
              if (
                element?.category === 'islamicval-0' &&
                (value !== null || value !== undefined)
              ) {
                islamicCount += 1;
              }
              if (islamicCount < 4) {
                baseState['islamicval-0'] = true;
              }
            } else {
              baseState[element?.category] = false;
            }
          });
        });
      }
    } catch {
      // ignore read errors and keep existing completion defaults
    }

    setProfileCompleteProgress(() => {
      const updated = profileProgressTemplate.map((item) => ({
        ...item,
        completed: Boolean(baseState[item.id]),
      }));
      return updated.sort(sortByCompletion);
    });
  }, [getData, profileProgressTemplate, storageKeys.PROFILE_DETAIL_LOCAL]);

  // Call getAttribute and getUsers on mount
  useEffect(() => {
    getAttribute();
    // Always fetch users on mount, reset flag on unmount to allow refetch on remount
    if (!hasInitializedUsers) {
      hasInitializedUsers = true;
      getUsers(undefined, true);
    }

    return () => {
      // Reset flag on unmount to allow fresh fetch if component remounts
      // This ensures users are fetched after profile picture upload/navigation
      hasInitializedUsers = false;
    };
  }, [getUsers, getAttribute]);

  useEffect(() => {
    getInitialNotification();
    const unsubscribeForeground = notifee.onForegroundEvent(
      notifeeBackForHandler
    );
    notifee.onBackgroundEvent(notifeeBackForHandler);

    return () => {
      if (typeof unsubscribeForeground === 'function') {
        unsubscribeForeground();
      }
    };
  }, [getInitialNotification, notifeeBackForHandler]);

  const onBoostProfilePress = useCallback(async () => {
    setIsBoostLoading(true);
    try {
      const result = await presentBoostProfilePaywall();
      if (result.success) {
        setBoostSuccessModalVisible(true);
      } else if (
        result.error &&
        result.error !== 'Purchase cancelled by user'
      ) {
        flashErrorMessage(result.error || 'Failed to purchase boost');
      }
    } catch (error: any) {
      flashErrorMessage(error.message || 'Failed to purchase boost');
    } finally {
      setIsBoostLoading(false);
    }
  }, []);

  const onBoostSuccessCollect = useCallback(() => {
    setBoostSuccessModalVisible(false);
    // TODO: Backend integration - collect boost credits
    flashSuccessMessage('Boost profile activated successfully!');
  }, []);

  const onRecommendationPress = useCallback((value?: boolean) => {
    if (value) {
      setShowRecommendationModal(true);
      setRecommendationModal(true);
    } else {
      setRecommendationModal((prev) => !prev);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // Counters now come from Pusher events, no API call needed
      handleProfileCompleteData();

      // Ensure users are fetched when screen is focused if list is empty and not loading
      // This handles cases where component remounts after profile picture upload
      if (usersList.length === 0 && !loader && !loadMoreLoader) {
        setLoader(true);
        getUsers(undefined, true);
      }
    }, [
      handleProfileCompleteData,
      usersList.length,
      loader,
      loadMoreLoader,
      getUsers,
    ])
  );

  // Collect chat credits when AccountModal opens (premium members only, once per 24 hours)
  useEffect(() => {
    const canCollect = canCollectChatCredits(
      currentUser?.last_chat_credit_collected_at
    );
    console.log(
      '[Welcome.useEffect] Modal open:',
      headerModal,
      'Premium:',
      isPremiumUser,
      'Can collect:',
      canCollect
    );

    if (headerModal && isPremiumUser && canCollect) {
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
          //     '[Welcome] Error refreshing user data after collect:',
          //     refreshError
          //   );
          // }
        } catch (error) {
          // Silently handle error - don't block modal from opening
          console.error('[Welcome] Error collecting chat credits:', error);
        }
      };
      collectCredits();
    }
  }, [
    headerModal,
    isPremiumUser,
    currentUser,
    updateCurrentUser,
    setData,
    storageKeys.USER,
  ]);

  const onInfoItemPress = useCallback(
    (item: ProfileProgressItem) => {
      setHeaderModal(false);
      navigation.navigate(item.navigation, { scrollTo: item.scrollTo });
    },
    [navigation]
  );

  // Show loading state instead of blank screen if premium store hasn't loaded yet
  // if (!loaded) {
  //   return (
  //     <Container style={Styles.container}>
  //       <Loader />
  //     </Container>
  //   );
  // }

  if (!isPremiumUser) {
    // navigation.replace('ProFeaturesPromotion');
  }
  return (
    <Container style={Styles.container} barBg={Colors.appBg}>
      <View style={Styles.paddingH}>
        <CheckMembershipStatus />
        <ModalLoader visible={modalLoader} useModalLayout={true} />
        <CommonActions navigation={navigation} userId={currentUser?.id} />
        <View
          style={[
            Styles.headerWrapper,
            { flexDirection: Rtl ? 'row-reverse' : 'row' },
          ]}
        >
          <View style={Styles.greetingBlock}>
            <AppText style={Styles.greetingEyebrow}>
              {LanguageKeys.assalamuAlaikum}
            </AppText>
            {currentUser?.first_name ? (
              <AppText variant="display" style={Styles.greetingName}>
                {currentUser.first_name}
              </AppText>
            ) : null}
          </View>
          <View style={Styles.headerRightWrapper}>
            {showRecommendationModal && (
              <RecommendationHeart
                onPress={() => onRecommendationPress(true)}
              />
            )}
            <Ripple
              rippleColor={Colors.primary}
              style={Styles.avatarBtn}
              onPress={() => setHeaderModal(!headerModal)}
            >
              {currentUser?.media?.un_blur_primary_image ? (
                <Image
                  source={{ uri: currentUser?.media?.un_blur_primary_image }}
                  style={Styles.avatarImg}
                />
              ) : (
                <Text style={Styles.headerText}>
                  {currentUser?.first_name?.slice(0, 1)}
                </Text>
              )}
              {isPremiumUser ? (
                <View style={Styles.premiumBadge}>
                  <Ionicons
                    name="diamond"
                    size={wp(2.6)}
                    color={Colors.surface}
                  />
                </View>
              ) : null}
            </Ripple>
          </View>
        </View>
        {!currentUser?.is_approved && (
          <Ripple
            style={[
              Styles.pendingApprovalBanner,
              { flexDirection: Rtl ? 'row-reverse' : 'row' },
            ]}
            onPress={() => setHeaderModal(true)}
          >
            <View style={Styles.pendingIconChip}>
              <Ionicons
                name="time-outline"
                size={wp(4.5)}
                color={Colors.primary}
              />
            </View>
            <Text style={Styles.pendingApprovalText}>
              {t(LanguageKeys.profileInReview)}
            </Text>
            <Ionicons
              name={Rtl ? 'chevron-back' : 'chevron-forward'}
              size={wp(4.5)}
              color={Colors.primaryMid}
            />
          </Ripple>
        )}
        {profileIncomplete && !profileBannerDismissed && (
          <Ripple
            style={[
              Styles.pendingApprovalBanner,
              { flexDirection: Rtl ? 'row-reverse' : 'row' },
            ]}
            onPress={() =>
              navigation.navigate('OnboardingProfile', { from: 'Home' })
            }
          >
            <View style={Styles.pendingIconChip}>
              <Ionicons
                name="sparkles-outline"
                size={wp(4.5)}
                color={Colors.primary}
              />
            </View>
            <View style={Styles.completeBannerTextWrap}>
              <Text style={Styles.pendingApprovalText}>
                {t(LanguageKeys.completeProfileCta)}
              </Text>
              <Text style={Styles.completeBannerSub}>
                {t(LanguageKeys.completeProfileBannerBody)}
              </Text>
            </View>
            <Ripple
              onPress={() => setProfileBannerDismissed(true)}
              style={Styles.bannerDismiss}
            >
              <Ionicons name="close" size={wp(4.5)} color={Colors.muted} />
            </Ripple>
          </Ripple>
        )}
        {!isPremiumUser ? <PremiumButton /> : null}
      </View>
      <AccountModal
        visible={headerModal}
        onClose={() => setHeaderModal(false)}
        profileCompleteProgress={profileCompleteProgress}
        onInfoItemPress={onInfoItemPress}
        currentUser={currentUser}
      />
      {/* <RecommendationButton onPress={onRecommendationPress} /> */}
      {recommendationModal ? <Swiper onPress={onRecommendationPress} /> : null}
      {photo_request_count && photo_request_count >= 1 ? (
        <PrivatePhotoAccessBtn
          navigation={navigation}
          photoRequests={photo_request_count}
        />
      ) : null}
      <PurchaseSuccessModal
        visible={boostSuccessModalVisible}
        onCollect={onBoostSuccessCollect}
        title="Boost Profile Purchased!"
        message="Your profile boost has been activated successfully."
      />
      <OptionsBar
        onPress={onOptionPress}
        userStats={{
          like_you_counter: like_count,
          visit_you_counter: visit_count,
          photo_requested_you_counter: photo_request_count,
        }}
        activeOptionButton={activeOptionButton}
        options={optionBarList}
      />
      {loader ? (
        <Loader />
      ) : (
        <UsersList
          data={usersList}
          navigation={navigation}
          onLoadMorePress={onLoadMorePress}
          optionTab={optionTab}
        />
      )}
      {loadMoreLoader && (
        <ActivityIndicator color={Colors.primary} size="small" />
      )}
    </Container>
  );
};

export default Welcome;

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
  },
  paddingH: {
    paddingHorizontal: wp(3),
  },
  headerWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp(1),
  },
  greetingBlock: {
    flex: 1,
    paddingRight: wp(2),
  },
  greetingEyebrow: {
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small1,
    color: Colors.muted,
    includeFontPadding: false,
  },
  greetingName: {
    fontSize: Typography.large1,
    color: Colors.ink,
    textTransform: 'capitalize',
    marginTop: hp(0.2),
    includeFontPadding: false,
  },
  headerRightWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2.5),
  },
  avatarBtn: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    backgroundColor: Colors.lavender,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
  },
  headerText: {
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.large1,
    color: Colors.primary,
    textTransform: 'capitalize',
  },
  premiumBadge: {
    width: wp(5),
    height: wp(5),
    borderRadius: wp(2.5),
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: -2,
    right: -2,
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  pendingApprovalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lavender,
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(1.3),
    borderRadius: 14,
    marginTop: hp(1.4),
    gap: wp(3),
  },
  pendingIconChip: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingApprovalText: {
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small1,
    color: Colors.ink,
    flex: 1,
  },
  completeBannerTextWrap: {
    flex: 1,
  },
  completeBannerSub: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small,
    marginTop: hp(0.2),
  },
  bannerDismiss: {
    padding: wp(1.5),
  },
});
