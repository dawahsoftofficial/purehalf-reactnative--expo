import moment from 'moment';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
      primary_image?: string;
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
};

export function ProfileBadges({
  userData,
  isSelf = false,
  showText = true,
  vertical = false,
  iconOnly = false,
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
      label: string;
    }> = [];

    if (isVIP || true) {
      badgeList.push({
        icon: <VipBadgeIcon width={wp(6)} height={wp(6)} />,
        label: 'VIP',
      });
    }

    if (isBoosted || true) {
      badgeList.push({
        icon: <PopularBadgeIcon width={wp(6)} height={wp(6)} />,
        label: 'Boosted',
      });
    }

    if (isProfileCompleted || true) {
      badgeList.push({
        icon: <ProfileCompleteBadgeIcon width={wp(6)} height={wp(6)} />,
        label: 'Complete',
      });
    }

    return badgeList;
  }, [isVIP, isBoosted, isProfileCompleted]);

  if (badges.length === 0) {
    return null;
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
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(2.5),
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
