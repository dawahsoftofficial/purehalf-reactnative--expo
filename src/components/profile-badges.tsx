import moment from 'moment';
import React, { useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import PopularBadgeIcon from '../assets/svgs/badges/popular-badge.svg';
import ProfileCompleteBadgeIcon from '../assets/svgs/badges/profile-complete-badge.svg';
import VipBadgeIcon from '../assets/svgs/badges/vip-badge.svg';
import { hp, Typography, wp } from '../global';
import { checkProfileCompleted } from '../lib/utils/profile-utils';
import { Colors, Fonts } from '../res';
import { StorageManager, useGlobalContext } from '../services';
import { usePremiumStore } from '../stores';

type ProfileBadgesProps = {
  userData?: {
    id?: number;
    media?: {
      primary_image_to_show?: string;
      cover_image?: string;
    };
    detail?: {
      tagline?: string;
      family_plan_id?: number;
      marriage_plan_id?: number;
      relocation_plan_id?: number;
      personality_id?: number[];
    };
    boosted?: boolean;
    is_boosted?: boolean;
    membership_status?: number | null;
    membership_expiry?: string | null;
  };
  isSelf?: boolean;
  showText?: boolean;
  vertical?: boolean;
  iconOnly?: boolean;
  variant?: 'default' | 'pill';
  containerStyle?: StyleProp<ViewStyle>;
};

export function ProfileBadges({
  userData,
  isSelf = false,
  showText = true,
  vertical = false,
  iconOnly = false,
  variant = 'default',
  containerStyle,
}: ProfileBadgesProps) {
  const { currentUser } = useGlobalContext();
  const { getData, storageKeys } = StorageManager;
  const isPremium = usePremiumStore((state) => state.isPremium);
  const [isProfileCompleted, setIsProfileCompleted] = React.useState(false);

  const isVIP = useMemo(() => {
    if (!userData) return false;
    if (isSelf) {
      return isPremium();
    }
    // For other users, check membership status and expiry
    if (userData.membership_status === 1) {
      return true;
    }
    if (userData.membership_expiry) {
      const now = moment();
      return moment(userData.membership_expiry).isAfter(now);
    }
    return false;
  }, [userData, isSelf, isPremium]);

  const isBoosted = useMemo(() => {
    if (!userData) return false;
    return Boolean(userData.boosted || userData.is_boosted);
  }, [userData]);

  React.useEffect(() => {
    if (isSelf && currentUser) {
      getData(storageKeys.PROFILE_DETAIL_LOCAL)
        .then((data: unknown) => {
          setIsProfileCompleted(checkProfileCompleted(currentUser, data));
        })
        .catch(() => {
          setIsProfileCompleted(checkProfileCompleted(currentUser, null));
        });
    } else if (userData) {
      setIsProfileCompleted(checkProfileCompleted(userData, null));
    }
  }, [
    isSelf,
    currentUser,
    userData,
    getData,
    storageKeys.PROFILE_DETAIL_LOCAL,
  ]);

  const badges = useMemo(() => {
    const badgeList: Array<{
      icon: React.ReactNode;
      iconName: string;
      label: string;
      tone: 'purple' | 'green';
    }> = [];

    if (isVIP) {
      badgeList.push({
        icon: <VipBadgeIcon width={wp(8)} height={wp(8)} />,
        iconName: 'diamond',
        label: 'VIP',
        tone: 'purple',
      });
    }

    if (isBoosted || false) {
      badgeList.push({
        icon: <PopularBadgeIcon width={wp(8)} height={wp(8)} />,
        iconName: 'trending-up',
        label: 'Boosted',
        tone: 'green',
      });
    }

    if (isProfileCompleted) {
      badgeList.push({
        icon: <ProfileCompleteBadgeIcon width={wp(8)} height={wp(8)} />,
        iconName: 'checkmark-circle',
        label: 'Complete',
        tone: 'green',
      });
    }

    return badgeList;
  }, [isVIP, isBoosted, isProfileCompleted]);

  if (badges.length === 0) {
    return null;
  }

  if (variant === 'pill') {
    return (
      <View
        testID="profile-badges-pill"
        style={[Styles.container, Styles.pillContainer, containerStyle]}
      >
        {badges.map((badge, index) => (
          <View
            key={index}
            style={[
              Styles.pillBadge,
              badge.tone === 'purple' ? Styles.pillBadgePurple : null,
            ]}
          >
            <View
              style={[
                Styles.pillIconWrap,
                badge.tone === 'purple' ? Styles.pillIconWrapPurple : null,
              ]}
            >
              <Ionicons
                name={badge.iconName}
                color={
                  badge.tone === 'purple' ? Colors.primary : Colors.verified
                }
                size={wp(3.4)}
              />
            </View>
            <Text
              style={[
                Styles.pillLabel,
                badge.tone === 'purple' ? Styles.pillLabelPurple : null,
              ]}
              numberOfLines={1}
            >
              {badge.label}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  if (iconOnly) {
    return (
      <View style={[Styles.container, vertical && Styles.containerVertical]}>
        {badges.map((badge, index) => (
          <View key={index} style={Styles.iconOnlyBadge}>
            {badge.icon}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={[Styles.container, vertical && Styles.containerVertical]}>
      {badges.map((badge, index) => (
        <View key={index} style={[Styles.badge]}>
          {badge.icon}
          {showText && <Text style={Styles.badgeLabel}>{badge.label}</Text>}
        </View>
      ))}
    </View>
  );
}

const Styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    flexWrap: 'wrap',
  },
  containerVertical: {
    flexDirection: 'row',
    gap: hp(0.8),
  },
  iconOnlyBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillContainer: {
    marginTop: hp(0.75),
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: wp(1.2),
    maxWidth: '100%',
    paddingVertical: hp(0.55),
    paddingHorizontal: wp(2.2),
    borderRadius: 999,
    backgroundColor: 'rgba(46,158,91,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(46,158,91,0.24)',
  },
  pillIconWrap: {
    width: wp(4.2),
    height: wp(4.2),
    borderRadius: wp(2.1),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  pillBadgePurple: {
    backgroundColor: Colors.primaryRGBA12,
    borderColor: Colors.themeRGBA20,
  },
  pillIconWrapPurple: {
    backgroundColor: Colors.lavender,
  },
  pillLabel: {
    color: Colors.verified,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.tiny1,
    includeFontPadding: false,
    alignSelf: 'center',
  },
  pillLabelPurple: {
    color: Colors.primary,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(1),
    paddingVertical: hp(0.8),
    borderRadius: wp(3),
    gap: wp(1.5),
  },
  badgeLabel: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.tiny2,
    includeFontPadding: false,
  },
});
