import { useNavigation } from '@react-navigation/native';
import moment from 'moment';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import Ionicons from 'react-native-vector-icons/Ionicons';

import { hp, Typography, wp } from '../../../global';
import { CheckRtl, LanguageKeys } from '../../../languages';
import { checkProfileCompleted } from '../../../lib/utils/profile-utils';
import { Colors, Fonts } from '../../../res';
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
  last_name?: string;
  age?: number;
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

type AccountModalProps = {
  visible: boolean;
  onClose: () => void;
  profileCompleteProgress: ProfileProgressItem[];
  onInfoItemPress: (item: ProfileProgressItem) => void;
  currentUser: User | null;
};

export function AccountModal({
  visible,
  onClose,
  profileCompleteProgress,
  onInfoItemPress,
  currentUser,
}: AccountModalProps) {
  const { navigate } = useNavigation();
  const { bottom } = useSafeAreaInsets();
  const { t } = useTranslation();
  const Rtl = CheckRtl();
  const isPremium = usePremiumStore((state) => state.isPremium);
  const { getData, storageKeys } = StorageManager;
  const [isProfileCompleted, setIsProfileCompleted] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const displayFont = Rtl ? Fonts.APPFONT_B : Fonts.DISPLAY;

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

  const fullName = [currentUser?.first_name, currentUser?.last_name]
    .filter(Boolean)
    .join(' ');
  const nameLine = [
    fullName || '—',
    currentUser?.age != null ? String(currentUser.age) : null,
  ]
    .filter(Boolean)
    .join(', ');
  const tagline = currentUser?.detail?.tagline;

  const completed = profileCompleteProgress.filter((i) => i.completed).length;
  const total = profileCompleteProgress.length || 1;
  const pct = Math.min(1, completed / total);

  const openPhotos = () =>
    (navigate as (name: string) => void)('PhotosAndVideos');

  return (
    <Modal
      isVisible={visible}
      style={Styles.modal}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      swipeDirection="down"
      onSwipeComplete={onClose}
      propagateSwipe
      useNativeDriverForBackdrop
    >
      <View style={[Styles.sheet, { paddingBottom: bottom + hp(1) }]}>
        <View style={Styles.dragHandle} />

        {/* ---- Identity header ---- */}
        <View
          style={[
            Styles.header,
            { flexDirection: Rtl ? 'row-reverse' : 'row' },
          ]}
        >
          <Ripple
            style={Styles.avatarWrap}
            onPress={openPhotos}
            rippleColor={Colors.primary}
          >
            {currentUser?.media?.un_blur_primary_image ? (
              <Image
                source={{ uri: currentUser?.media?.un_blur_primary_image }}
                style={Styles.avatar}
              />
            ) : (
              <View style={Styles.avatarPlaceholder}>
                <Text style={Styles.avatarInitial}>
                  {currentUser?.first_name?.slice(0, 1)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View style={Styles.cameraBadge}>
              <Ionicons name="camera" size={wp(3.4)} color={Colors.surface} />
            </View>
          </Ripple>

          <View style={Styles.infoCol}>
            <Text
              style={[
                Styles.name,
                { fontFamily: displayFont, textAlign: Rtl ? 'right' : 'left' },
              ]}
              numberOfLines={1}
            >
              {nameLine}
            </Text>
            {tagline ? (
              <Text
                style={[Styles.tagline, { textAlign: Rtl ? 'right' : 'left' }]}
                numberOfLines={1}
              >
                {tagline}
              </Text>
            ) : null}
            <View
              style={[
                Styles.chipsRow,
                { flexDirection: Rtl ? 'row-reverse' : 'row' },
              ]}
            >
              {isVIP && (
                <View style={Styles.iconChip}>
                  <Ionicons
                    name="diamond"
                    size={wp(3.6)}
                    color={Colors.primary}
                  />
                </View>
              )}
              {isProfileCompleted && (
                <View style={Styles.iconChip}>
                  <Ionicons
                    name="checkmark-circle"
                    size={wp(4)}
                    color={Colors.verified}
                  />
                </View>
              )}
              <View
                style={[
                  Styles.creditsPill,
                  { flexDirection: Rtl ? 'row-reverse' : 'row' },
                ]}
              >
                <Ionicons name="sparkles" size={wp(4)} color={Colors.primary} />
                <Text style={Styles.creditsTxt}>
                  {currentUser?.chat_credits ?? 0}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={onClose}
            style={Styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={wp(5.5)} color={Colors.muted} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={Styles.body}
          bounces={false}
        >
          {/* ---- Profile completion ---- */}
          <View style={Styles.card}>
            <Ripple
              style={[
                Styles.cardHeader,
                { flexDirection: Rtl ? 'row-reverse' : 'row' },
              ]}
              onPress={() => setExpanded((p) => !p)}
              rippleColor={Colors.primary}
            >
              <View style={Styles.chip}>
                <Ionicons name="person" size={wp(4.2)} color={Colors.primary} />
              </View>
              <View style={Styles.cardHeaderCol}>
                <Text style={Styles.cardTitle}>
                  {t(LanguageKeys.profileCompletion)}
                </Text>
                <Text style={Styles.cardSub}>
                  {completed} / {total}
                </Text>
              </View>
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={wp(5)}
                color={Colors.muted}
              />
            </Ripple>

            <View style={Styles.progressWrap}>
              <View style={Styles.progressTrack}>
                <View
                  style={[Styles.progressFill, { width: `${pct * 100}%` }]}
                />
              </View>
            </View>

            {expanded && (
              <View style={Styles.steps}>
                {profileCompleteProgress?.map((item, ind) => (
                  <Ripple
                    key={ind}
                    style={[
                      Styles.stepRow,
                      { flexDirection: Rtl ? 'row-reverse' : 'row' },
                      ind === profileCompleteProgress.length - 1 &&
                        Styles.stepRowLast,
                    ]}
                    onPress={() => onInfoItemPress(item)}
                    rippleColor={Colors.primary}
                  >
                    <Ionicons
                      name={
                        item.completed ? 'checkmark-circle' : 'ellipse-outline'
                      }
                      size={wp(5)}
                      color={
                        item.completed ? Colors.verified : Colors.primaryLite
                      }
                    />
                    <Text style={Styles.stepTxt} numberOfLines={1}>
                      {t(item.label)}
                    </Text>
                    <Ionicons
                      name={Rtl ? 'chevron-back' : 'chevron-forward'}
                      size={wp(4)}
                      color={Colors.muted}
                    />
                  </Ripple>
                ))}
              </View>
            )}
          </View>

          {/* ---- Approval status ---- */}
          {!currentUser?.is_approved ? (
            <View
              style={[
                Styles.statusCard,
                { flexDirection: Rtl ? 'row-reverse' : 'row' },
              ]}
            >
              <View style={Styles.chip}>
                <Ionicons
                  name="time-outline"
                  size={wp(4.6)}
                  color={Colors.primaryMid}
                />
              </View>
              <View style={Styles.statusCol}>
                <Text
                  style={[Styles.statusTitle, { color: Colors.primaryMid }]}
                >
                  {t(LanguageKeys.profileInReview)}
                </Text>
                <Text
                  style={[
                    Styles.statusDesc,
                    { textAlign: Rtl ? 'right' : 'left' },
                  ]}
                >
                  {t(LanguageKeys.profileInReviewDesc)}
                </Text>
              </View>
            </View>
          ) : (
            <View
              style={[
                Styles.statusCard,
                { flexDirection: Rtl ? 'row-reverse' : 'row' },
              ]}
            >
              <View style={Styles.chip}>
                <Ionicons
                  name="checkmark-circle"
                  size={wp(4.8)}
                  color={Colors.verified}
                />
              </View>
              <View style={Styles.statusCol}>
                <Text style={[Styles.statusTitle, { color: Colors.verified }]}>
                  {t(LanguageKeys.profileApprovedTitle)}
                </Text>
                <Text
                  style={[
                    Styles.statusDesc,
                    { textAlign: Rtl ? 'right' : 'left' },
                  ]}
                >
                  {t(LanguageKeys.profileApprovedDesc)}
                </Text>
              </View>
            </View>
          )}
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
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: hp(88),
  },
  dragHandle: {
    width: wp(11),
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.hairline,
    alignSelf: 'center',
    marginTop: hp(1.2),
  },
  // header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4.5),
    paddingTop: hp(2),
    paddingBottom: hp(1.8),
  },
  avatarWrap: {
    width: wp(18),
    height: wp(18),
    borderRadius: wp(9),
    overflow: 'hidden',
    backgroundColor: Colors.lavender,
    borderWidth: 2,
    borderColor: Colors.lavender,
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.lavender,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.large2,
    color: Colors.primary,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: wp(6),
    height: wp(6),
    borderRadius: wp(3),
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  infoCol: {
    flex: 1,
    marginHorizontal: wp(3.5),
    justifyContent: 'center',
  },
  name: {
    fontSize: Typography.large,
    color: Colors.ink,
    includeFontPadding: false,
  },
  tagline: {
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small,
    color: Colors.muted,
    includeFontPadding: false,
    marginTop: hp(0.2),
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(1),
  },
  iconChip: {
    width: wp(7),
    height: wp(7),
    borderRadius: wp(3.5),
    backgroundColor: Colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(2),
  },
  creditsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lavender,
    borderRadius: 999,
    paddingHorizontal: wp(2.6),
    paddingVertical: hp(0.5),
  },
  creditsTxt: {
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small1,
    color: Colors.ink,
    includeFontPadding: false,
    marginHorizontal: wp(1.4),
  },
  closeBtn: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    backgroundColor: Colors.appBg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  // body
  body: {
    paddingHorizontal: wp(4.5),
    paddingTop: hp(0.5),
    paddingBottom: hp(2),
    gap: hp(1.4),
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.hairline,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingTop: hp(1.8),
    paddingBottom: hp(1.2),
  },
  chip: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    backgroundColor: Colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: wp(0.5),
  },
  cardHeaderCol: {
    flex: 1,
    marginHorizontal: wp(3),
  },
  cardTitle: {
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small2,
    color: Colors.ink,
    includeFontPadding: false,
  },
  cardSub: {
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.tiny2,
    color: Colors.muted,
    includeFontPadding: false,
    marginTop: hp(0.2),
  },
  progressWrap: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(1.8),
  },
  progressTrack: {
    height: wp(1.8),
    borderRadius: 999,
    backgroundColor: Colors.lavender,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: Colors.primary,
  },
  steps: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    paddingHorizontal: wp(4),
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
  },
  stepRowLast: {
    borderBottomWidth: 0,
  },
  stepTxt: {
    flex: 1,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small1,
    color: Colors.ink,
    includeFontPadding: false,
    marginHorizontal: wp(3),
  },
  // status
  statusCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: wp(4),
  },
  statusCol: {
    flex: 1,
    marginHorizontal: wp(3),
  },
  statusTitle: {
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small2,
    includeFontPadding: false,
    marginBottom: hp(0.4),
  },
  statusDesc: {
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small,
    color: Colors.muted,
    lineHeight: wp(5),
    includeFontPadding: false,
  },
});
