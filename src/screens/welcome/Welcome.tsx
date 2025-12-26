import notifee from '@notifee/react-native';
import { useFocusEffect } from '@react-navigation/native';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ripple from 'react-native-material-ripple';

import { usePremiumStore } from '@/stores';

import BoostCoinIcon from '../../assets/svgs/coins/boost-coin.svg';
import {
  CheckMembershipStatus,
  Container,
  Loader,
  ModalLoader,
  PurchaseSuccessModal,
  Swiper,
} from '../../components';
import { hp, Typography, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { CommonActions } from '../../navigation';
import { Colors, Fonts, Images } from '../../res';
import {
  ApiServices,
  flashErrorMessage,
  flashSuccessMessage,
  isIOS,
  StorageManager,
  useGlobalContext,
} from '../../services';
import { presentBoostProfilePaywall } from '../../services/paywall-service';
import { AccountModal } from './components';
import OptionsBar from './OptionsBar';
import PremiumButton from './PremiumButton';
import PrivatePhotoAccessBtn from './PrivatePhotoAccessBtn';
import RecommendationButton from './RecommendationButton';
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

type UserStats = {
  photo_requested_you_counter?: number;
  [key: string]: unknown;
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

const { width } = Dimensions.get('window');

// Module-level flag to prevent multiple initial fetches across remounts
let hasInitializedUsers = false;

const Welcome: React.FC<WelcomeProps> = ({ navigation, route }) => {
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
      {
        label: LanguageKeys.profileImage,
        id: 'primary_image',
        navigation: 'PhotosAndVideos',
        completed: false,
      },
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
  const [userStats, setUserStats] = useState<UserStats>({});
  const [activeOptionButton, setActiveOptionButton] = useState<OptionButton>(
    optionBarList[0]
  );
  const [optionTab, setOptionTab] = useState<string>('');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userListPage, setUserListPage] = useState(1);
  console.log('userListPage', userListPage);
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

  const getUserStats = useCallback(() => {
    ApiServices.getUserStats()
      .then((res: any) => {
        setUserStats(res);
      })
      .catch(() => {});
  }, []);

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
          getUserStats();
          navigation.navigate('ProFeaturesPromotion', {
            navigateTo: 'BottomTab',
          });
          return;
        }
      }

      applyOptionSelection(item);
      getUsers({ page: 1, type: value }, true);
      getUserStats();
    },
    [
      applyOptionSelection,
      getUserStats,
      getUsers,
      isPremiumUser,
      navigation,
      optionBarList,
    ]
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
      primary_image: Boolean(currentUser?.media?.primary_image),
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

  const checkNewTransaction = useCallback(() => {
    if (currentUser?.latest_transaction?.paid_tracking === 0) {
      flashSuccessMessage('New transaction detected!');
      navigation.navigate('MembershipCongrats', {
        isNewTransaction: true,
        title: currentUser?.latest_transaction?.name,
        amount: currentUser?.latest_transaction?.amount,
      });
    }
  }, [currentUser?.latest_transaction, navigation]);

  // Call getAttribute and getUsers once on mount only (using module-level flag to prevent refetch on remount)
  useEffect(() => {
    getAttribute();
    if (!hasInitializedUsers) {
      hasInitializedUsers = true;
      getUsers(undefined, true);
    }
  }, []);

  useEffect(() => {
    getInitialNotification();
    const unsubscribeForeground = notifee.onForegroundEvent(
      notifeeBackForHandler
    );
    notifee.onBackgroundEvent(notifeeBackForHandler);
    const timer = setTimeout(() => {
      checkNewTransaction();
    }, 100);

    return () => {
      if (typeof unsubscribeForeground === 'function') {
        unsubscribeForeground();
      }
      clearTimeout(timer);
    };
  }, [checkNewTransaction, getInitialNotification, notifeeBackForHandler]);

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
      getUserStats();
      handleProfileCompleteData();
    }, [])
  );

  useFocusEffect(
    React.useCallback(() => {
      if (showRecommendationModal && route?.params?.openRecommendationModal) {
        onRecommendationPress(true);
      }
    }, [
      onRecommendationPress,
      route?.params?.openRecommendationModal,
      showRecommendationModal,
    ])
  );

  const onInfoItemPress = useCallback(
    (item: ProfileProgressItem) => {
      setHeaderModal(false);
      navigation.navigate(item.navigation, { scrollTo: item.scrollTo });
    },
    [navigation]
  );

  if (!loaded) return null;

  if (!isPremiumUser) {
    // navigation.replace('ProFeaturesPromotion');
  }
  return (
    <Container style={Styles.container}>
      <View style={Styles.paddingH}>
        <CheckMembershipStatus />
        <ModalLoader visible={modalLoader} useModalLayout={true} />
        <CommonActions navigation={navigation} userId={currentUser?.id} />
        <View style={Styles.headerWrapper}>
          {!isPremiumUser ? (
            // TODO: Premium Check
            <PremiumButton />
          ) : (
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => {
                flashSuccessMessage('You are already a premium member');
                navigation.navigate('ProFeaturesPromotion', {
                  navigateTo: 'BottomTab',
                });
              }}
              style={Styles.headerIconWrapper}
            >
              <Image source={Images.membership} style={Styles.headerIcon} />
            </TouchableOpacity>
          )}
          <View style={Styles.headerRightWrapper}>
            {showRecommendationModal && (
              <Ripple
                style={Styles.headerIconWrapper}
                onPress={() => onRecommendationPress(true)}
              >
                <Image
                  source={Images.recommendationIcon}
                  style={[Styles.headerIcon, { width: 25, height: 25 }]}
                />
              </Ripple>
            )}
            <Ripple
              style={[
                Styles.headerIconWrapper,
                { backgroundColor: Colors.color7 },
              ]}
              onPress={() => setHeaderModal(!headerModal)}
            >
              {currentUser?.media?.primary_image &&
              currentUser?.media?.primary_image?.length ? (
                <Image
                  source={{ uri: currentUser.media.primary_image }}
                  style={[
                    Styles.headerIcon,
                    { width: 45, height: 45, borderRadius: 25 },
                  ]}
                />
              ) : (
                <Text style={Styles.headerText}>
                  {currentUser?.first_name?.slice(0, 1)}
                </Text>
              )}
              {isPremiumUser ? (
                <View style={Styles.premiumBadge}>
                  <Image
                    source={Images.membership}
                    style={Styles.premiumBadgeIcon}
                  />
                </View>
              ) : null}
            </Ripple>
          </View>
        </View>
      </View>
      <AccountModal
        visible={headerModal}
        onClose={() => setHeaderModal(false)}
        profileCompleteProgress={profileCompleteProgress}
        onInfoItemPress={onInfoItemPress}
        currentUser={currentUser}
      />
      <RecommendationButton onPress={onRecommendationPress} />
      {recommendationModal ? <Swiper onPress={onRecommendationPress} /> : null}
      {userStats?.photo_requested_you_counter &&
      userStats?.photo_requested_you_counter >= 1 ? (
        <PrivatePhotoAccessBtn
          navigation={navigation}
          photoRequests={userStats?.photo_requested_you_counter}
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
        userStats={userStats}
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
        <ActivityIndicator color={Colors.theme} size="small" />
      )}
      {(activeOptionButton?.value === '-1' ||
        activeOptionButton?.value === '1' ||
        activeOptionButton?.value === '3') && (
        <Ripple
          style={Styles.fabContainer}
          onPress={onBoostProfilePress}
          disabled={isBoostLoading}
        >
          <BoostCoinIcon width={wp(8)} height={wp(8)} />
        </Ripple>
      )}
    </Container>
  );
};

export default Welcome;

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.color2,
  },
  paddingH: {
    paddingHorizontal: wp(3),
  },
  headerWrapper: { flexDirection: 'row', justifyContent: 'space-between' },
  headerIconWrapper: {
    width: 45,
    height: 45,
    borderWidth: 1,
    borderColor: Colors.color47,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    width: 20,
    height: 20,
  },
  headerRightWrapper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerText: {
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.large3,
    color: Colors.color1,
    textTransform: 'capitalize',
    top: 3,
  },
  premiumBadge: {
    width: width * 0.05,
    height: width * 0.05,
    borderRadius: 50,
    backgroundColor: Colors.color47,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -5,
    left: -3,
  },
  premiumBadgeIcon: {
    width: 10,
    height: 10,
  },
  headerCounterWrapper: {
    width: width * 0.04,
    height: width * 0.04,
    borderRadius: 50,
    backgroundColor: Colors.color50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -7,
    right: -7,
  },
  headerCounterText: {
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small1,
    color: Colors.color2,
  },
  fabContainer: {
    position: 'absolute',
    bottom: hp(2),
    right: wp(4),
    width: wp(14),
    height: wp(14),
    borderRadius: wp(7),
    backgroundColor: Colors.theme,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: Colors.color1,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});
