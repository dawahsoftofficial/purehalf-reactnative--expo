import moment from 'moment';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TextStyle, ViewStyle } from 'react-native';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ripple from 'react-native-material-ripple';
import Modal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import ProfileCompleteBadgeIcon from '../../../assets/svgs/badges/profile-complete-badge.svg';
import VipBadgeIcon from '../../../assets/svgs/badges/vip-badge.svg';
import ChaCoinIcon from '../../../assets/svgs/coins/chat-coin.svg';
import { hp, Typography, wp } from '../../../global';
import { CheckRtl, LanguageKeys } from '../../../languages';
import { checkProfileCompleted } from '../../../lib/utils/profile-utils';
import { Colors, Fonts, Images } from '../../../res';
import { StorageManager } from '../../../services';
import { usePremiumStore } from '../../../stores';

type ProfileProgressItem = {
  label: string;
  id: string;
  navigation: string;
  scrollTo?: number;
  completed: boolean;
};

type User = {
  is_approved?: boolean;
  chat_credits?: number | null;
  boost_credits?: number | null;
  boosted?: boolean;
  is_boosted?: boolean;
  membership_status?: number | null;
  membership_expiry?: string | null;
  first_name?: string;
  primary_image_to_show?: string;
  media?: {
    cover_image?: string;
    un_blur_primary_image?: string;
  };
  detail?: {
    tagline?: string;
    family_plan_id?: number;
    marriage_plan_id?: number;
    relocation_plan_id?: number;
    personality_id?: number[];
  };
  [key: string]: unknown;
};

type AccordionItemProps = {
  children: React.ReactNode;
  title: string;
  count?: React.ReactNode;
  type?: 'profile';
  titleStyle?: TextStyle;
  counterWrapperStyle?: ViewStyle;
  counterTextStyle?: TextStyle;
  accordionContainerStyle?: ViewStyle;
};

type AccountModalProps = {
  visible: boolean;
  onClose: () => void;
  profileCompleteProgress: ProfileProgressItem[];
  onInfoItemPress: (item: ProfileProgressItem) => void;
  currentUser: User | null;
};

function AccordionItem({
  children,
  title,
  count = 0,
  titleStyle,
  counterWrapperStyle,
  accordionContainerStyle,
  counterTextStyle,
}: AccordionItemProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleItem = () => {
    setExpanded((prev) => !prev);
  };

  return (
    <View style={[Styles.accordContainer, accordionContainerStyle]}>
      <Ripple
        rippleColor={Colors.theme}
        style={Styles.accordHeader}
        onPress={toggleItem}
      >
        <View style={Styles.headerListLeftWrapper}>
          {count !== undefined && count !== 0 && (
            <View
              style={[Styles.headerlistCounterWrapper, counterWrapperStyle]}
            >
              {typeof count === 'string' || typeof count === 'number' ? (
                <Text style={[Styles.headerlistCounterText, counterTextStyle]}>
                  {count}
                </Text>
              ) : (
                count
              )}
            </View>
          )}
          <View style={{}}>
            <Text style={[Styles.accordTitle, titleStyle]}>{title}</Text>
          </View>
        </View>
        <Entypo name={expanded ? 'chevron-up' : 'chevron-down'} size={wp(6)} />
      </Ripple>
      {expanded && <View style={Styles.accordBody}>{children}</View>}
    </View>
  );
}

export function AccountModal({
  visible,
  onClose,
  profileCompleteProgress,
  onInfoItemPress,
  currentUser,
}: AccountModalProps) {
  const { bottom } = useSafeAreaInsets();
  const { t } = useTranslation();
  const Rtl = CheckRtl();
  const isPremium = usePremiumStore((state) => state.isPremium);
  const { getData, storageKeys } = StorageManager;
  const [isProfileCompleted, setIsProfileCompleted] = useState(false);

  const isVIP = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.membership_status === 1) {
      return true;
    }
    if (currentUser.membership_expiry) {
      const now = moment();
      return moment(currentUser.membership_expiry).isAfter(now);
    }
    return isPremium();
  }, [currentUser, isPremium]);

  const isBoosted = useMemo(() => {
    if (!currentUser) return false;
    return Boolean(currentUser.boosted || currentUser.is_boosted);
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      getData(storageKeys.PROFILE_DETAIL_LOCAL)
        .then((data: unknown) => {
          setIsProfileCompleted(checkProfileCompleted(currentUser, data));
        })
        .catch(() => {
          setIsProfileCompleted(checkProfileCompleted(currentUser, null));
        });
    }
  }, [currentUser, getData, storageKeys.PROFILE_DETAIL_LOCAL]);

  return (
    <Modal isVisible={visible} style={Styles.modal} onBackdropPress={onClose}>
      <View style={[Styles.modalContent, { paddingBottom: bottom }]}>
        <View style={Styles.modalHeader}>
          <View style={Styles.modalHeaderContent}>
            <View style={Styles.profileSection}>
              <View style={Styles.profileImageContainer}>
                {currentUser?.media?.un_blur_primary_image ? (
                  <Image
                    source={{ uri: currentUser?.media?.un_blur_primary_image }}
                    style={Styles.profileImage}
                  />
                ) : (
                  <View style={Styles.profileImagePlaceholder}>
                    <Text style={Styles.profileImageText}>
                      {currentUser?.first_name?.slice(0, 1)?.toUpperCase() ||
                        'U'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View style={Styles.rightBadgesContainer}>
              {isVIP && (
                <View style={Styles.vipBadgeBelow}>
                  <VipBadgeIcon width={wp(8)} height={wp(8)} />
                  {/* <Text style={Styles.badgeLabel}>VIP</Text> */}
                </View>
              )}
              {/* {(isBoosted || true) && (
                <View style={Styles.badge}>
                  <PopularBadgeIcon width={wp(6)} height={wp(6)} />
                  <Text style={Styles.badgeLabel}>Boosted</Text>
                </View>
              )} */}
              {isProfileCompleted && (
                <View style={Styles.badge}>
                  <ProfileCompleteBadgeIcon width={wp(8)} height={wp(8)} />
                  {/* <Text style={Styles.badgeLabel}>Completed</Text> */}
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={Styles.modalCloseBtn}>
            <Entypo name="cross" size={wp(6)} />
          </TouchableOpacity>
        </View>
        <View style={Styles.creditsContainer}>
          {/* <View style={Styles.creditBadge}>
            <BoostCoinIcon width={wp(6)} height={wp(6)} />
            <Text style={Styles.creditText}>
              {currentUser?.boost_credits || 0}
            </Text>
          </View> */}
          <View style={Styles.creditBadge}>
            <ChaCoinIcon width={wp(8)} height={wp(8)} />
            <Text style={Styles.creditText}>
              {currentUser?.chat_credits || 0}
            </Text>
          </View>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={Styles.modalBody}>
            <AccordionItem
              title={`${t(LanguageKeys.profileCompletion)} (${profileCompleteProgress.filter((item) => item.completed).length} out of ${profileCompleteProgress.length})`}
              type="profile"
              count={
                <Image
                  source={Images.userCircle}
                  style={Styles.modalHeaderIcon}
                />
              }
              counterWrapperStyle={{
                borderWidth: 0,
                width: wp(7),
                height: wp(7),
              }}
              accordionContainerStyle={{ marginBottom: 0 }}
            >
              <View style={Styles.completeProfileWrapper}>
                {profileCompleteProgress?.map((item, ind) => (
                  <Ripple
                    key={ind}
                    style={{
                      ...Styles.infoItemCon,
                      flexDirection: Rtl ? 'row-reverse' : 'row',
                    }}
                    onPress={() => onInfoItemPress(item)}
                  >
                    <View
                      style={{
                        ...Styles.checkCircle,
                        backgroundColor: item.completed
                          ? Colors.color10
                          : Colors.color46,
                      }}
                    />
                    <Text style={Styles.infoItemText}>{t(item.label)}</Text>
                  </Ripple>
                ))}
              </View>
            </AccordionItem>
            {!currentUser?.is_approved ? (
              <AccordionItem
                title={t(LanguageKeys.profileInReview)}
                accordionContainerStyle={{ marginBottom: 0 }}
                count={
                  <MaterialCommunityIcons
                    size={wp(5)}
                    color={Colors.color37}
                    name="information-variant"
                  />
                }
                titleStyle={{ color: Colors.color37 }}
                counterWrapperStyle={{ borderColor: Colors.color37 }}
                counterTextStyle={{ color: Colors.color37 }}
              >
                <View style={Styles.completeProfileWrapper}>
                  <Text style={Styles.completeProfileText}>
                    Your profile is being reviewed! During this brief period,
                    visibility will be limited. We are just making sure
                    everything is top-notch to ensure the best experience to all
                    our members. You will be notified upon approval.
                  </Text>
                </View>
              </AccordionItem>
            ) : (
              <AccordionItem
                title="Your profile has been approved!"
                count={
                  <AntDesign name="check" size={wp(5)} color={Colors.color10} />
                }
                titleStyle={{ color: Colors.color10 }}
                counterWrapperStyle={{ borderColor: Colors.color10 }}
                counterTextStyle={{ color: Colors.color10 }}
                accordionContainerStyle={{ marginBottom: 0 }}
              >
                <View style={Styles.completeProfileWrapper}>
                  <Text style={Styles.completeProfileText}>
                    Your profile is being reviewed! During this brief period,
                    visibility will be limited. We are just making sure
                    everything is top-notch to ensure the best experience to all
                    our members. You will be notified upon approval.
                  </Text>
                </View>
              </AccordionItem>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const Styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: Colors.color2,
    borderTopLeftRadius: wp(5),
    borderTopRightRadius: wp(5),
    maxHeight: hp(90),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flex: 1,
    gap: wp(3),
  },
  modalCloseBtn: {
    padding: wp(1),
  },
  modalHeaderIcon: {
    width: wp(7),
    height: wp(7),
  },
  profileSection: {
    alignItems: 'center',
    gap: hp(1),
  },
  profileImageContainer: {
    width: wp(30),
    height: wp(30),
    borderRadius: wp(20),
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.color8,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.themeLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.large3,
    color: Colors.theme,
  },
  vipBadgeBelow: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: Colors.color47,
    // paddingHorizontal: wp(2),
    // paddingVertical: hp(0.6),
    borderRadius: wp(3),
    gap: wp(1),
    // borderWidth: 1,
    // borderColor: Colors.color47,
  },
  rightBadgesContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: hp(1),
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.theme,
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.8),
    borderRadius: wp(3),
    gap: wp(1.5),
    borderWidth: 1,
    borderColor: Colors.theme,
  },
  badgeLabel: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.tiny2,
    includeFontPadding: false,
  },
  creditsContainer: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: wp(2),
    paddingBottom: hp(2),
    paddingHorizontal: wp(4),
  },
  creditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: Colors.theme,
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.6),
    borderRadius: wp(3),
    gap: wp(1.5),
  },
  creditText: {
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small1,
    color: Colors.color1,
    includeFontPadding: false,
  },
  modalBody: {
    // paddingBottom: hp(2),
  },
  accordContainer: {
    marginBottom: hp(2),
    borderRadius: wp(2),
    borderWidth: 1,
    borderColor: Colors.themeLight,
    overflow: 'hidden',
  },
  accordHeader: {
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerListLeftWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerlistCounterWrapper: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    borderWidth: 1,
    borderColor: Colors.color47,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
  },
  headerlistCounterText: {
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small,
    color: Colors.color1,
  },
  accordTitle: {
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small,
    color: Colors.color1,
  },
  accordBody: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(2),
    gap: hp(1.2),
  },
  completeProfileWrapper: {
    marginTop: hp(2),
  },
  infoItemCon: {
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: Colors.color46,
    alignItems: 'center',
  },
  checkCircle: {
    width: wp(3),
    height: wp(3),
    borderRadius: wp(1.5),
    marginRight: wp(2),
  },
  infoItemText: {
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small,
    color: Colors.color1,
    flex: 1,
  },
  completeProfileText: {
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small,
    color: Colors.color1,
    lineHeight: wp(5),
  },
});
