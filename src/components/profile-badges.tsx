import moment from 'moment';
import React, { useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';

import NewBadgeIcon from '../assets/svgs/badges/new-badge.svg';
import PopularBadgeIcon from '../assets/svgs/badges/popular-badge.svg';
import ProfileCompleteBadgeIcon from '../assets/svgs/badges/profile-complete-badge.svg';
import VipBadgeIcon from '../assets/svgs/badges/vip-badge.svg';
import { hp, Typography, wp } from '../global';
import { checkProfileCompleted } from '../lib/utils/profile-utils';
import { Colors, Fonts } from '../res';
import { StorageManager, useGlobalContext } from '../services';
import {
  type BadgesAndPayments,
  type BadgeVisibility,
  usePremiumStore,
  useSettingsStore,
} from '../stores';

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
    created_at?: string | null;
    is_tester?: boolean;
  };
  isSelf?: boolean;
  showText?: boolean;
  vertical?: boolean;
  iconOnly?: boolean;
  variant?: 'default' | 'pill';
  containerStyle?: StyleProp<ViewStyle>;
  surface?: keyof BadgeVisibility;
  iconSize?: number;
};

export function ProfileBadges({
  userData,
  isSelf = false,
  showText = true,
  vertical = false,
  iconOnly = false,
  variant = 'default',
  containerStyle,
  surface = 'singleProfile',
  iconSize,
}: ProfileBadgesProps) {
  const { currentUser } = useGlobalContext();
  const { getData, storageKeys } = StorageManager;
  const isPremium = usePremiumStore((state) => state.isPremium);
  const badgeConfig = useSettingsStore((state) => {
    const setting = state.settings?.results.find(
      (item) => item.key === 'badges_and_payments'
    );
    return (setting?.value as BadgesAndPayments | undefined)?.badges ?? null;
  });
  const [isProfileCompleted, setIsProfileCompleted] = React.useState(false);
  const badgeIconSize = iconSize ?? wp(8);
  const forceAllBadges = Boolean(
    currentUser?.tester_mode_enabled === true &&
    currentUser?.is_tester &&
    currentUser?.tester_show_all_badges &&
    (isSelf ? currentUser?.is_tester : userData?.is_tester)
  );
  const pillBadgeIconSize = wp(4.2);

  const isVisibleByConfig = React.useCallback(
    (key: 'completedProfile' | 'boosted' | 'vipMember' | 'newMember') => {
      const config = badgeConfig?.[key];

      if (forceAllBadges) return true;

      // Preserve the three established badges when an older server has not
      // returned the setting yet. New is opt-in because its age rule is new.
      if (!config) return key !== 'newMember';

      return config.enabled && config.visibility?.[surface] !== false;
    },
    [badgeConfig, forceAllBadges, surface]
  );

  const isVIP = useMemo(() => {
    if (forceAllBadges) return true;
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
  }, [forceAllBadges, userData, isSelf, isPremium]);

  const isBoosted = useMemo(() => {
    if (forceAllBadges) return true;
    if (!userData) return false;
    return Boolean(userData.boosted || userData.is_boosted);
  }, [forceAllBadges, userData]);

  const isNew = useMemo(() => {
    if (forceAllBadges) return true;
    if (!userData?.created_at || !isVisibleByConfig('newMember')) return false;

    const maxAccountAgeDays = Math.max(
      1,
      badgeConfig?.newMember?.maxAccountAgeDays ?? 7
    );
    const createdAt = moment(userData.created_at);
    const now = moment();

    return (
      createdAt.isValid() &&
      !createdAt.isAfter(now) &&
      createdAt.isSameOrAfter(now.clone().subtract(maxAccountAgeDays, 'days'))
    );
  }, [
    badgeConfig?.newMember?.maxAccountAgeDays,
    forceAllBadges,
    isVisibleByConfig,
    userData,
  ]);

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
      pillIcon: React.ReactNode;
      label: string;
      tone: 'purple' | 'green' | 'blue';
    }> = [];

    if (isVIP && isVisibleByConfig('vipMember')) {
      badgeList.push({
        icon: <VipBadgeIcon width={badgeIconSize} height={badgeIconSize} />,
        pillIcon: (
          <VipBadgeIcon width={pillBadgeIconSize} height={pillBadgeIconSize} />
        ),
        label: 'VIP',
        tone: 'purple',
      });
    }

    if (isBoosted && isVisibleByConfig('boosted')) {
      badgeList.push({
        icon: <PopularBadgeIcon width={badgeIconSize} height={badgeIconSize} />,
        pillIcon: (
          <PopularBadgeIcon
            width={pillBadgeIconSize}
            height={pillBadgeIconSize}
          />
        ),
        label: 'Boosted',
        tone: 'green',
      });
    }

    if (
      (forceAllBadges || isProfileCompleted) &&
      isVisibleByConfig('completedProfile')
    ) {
      badgeList.push({
        icon: (
          <ProfileCompleteBadgeIcon
            width={badgeIconSize}
            height={badgeIconSize}
          />
        ),
        pillIcon: (
          <ProfileCompleteBadgeIcon
            width={pillBadgeIconSize}
            height={pillBadgeIconSize}
          />
        ),
        label: 'Complete',
        tone: 'green',
      });
    }

    if (isNew) {
      badgeList.push({
        icon: <NewBadgeIcon width={badgeIconSize} height={badgeIconSize} />,
        pillIcon: (
          <NewBadgeIcon width={pillBadgeIconSize} height={pillBadgeIconSize} />
        ),
        label: 'New',
        tone: 'blue',
      });
    }

    return badgeList;
  }, [
    badgeIconSize,
    pillBadgeIconSize,
    isVIP,
    isBoosted,
    isProfileCompleted,
    forceAllBadges,
    isNew,
    isVisibleByConfig,
  ]);

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
              badge.tone === 'blue' ? Styles.pillBadgeBlue : null,
            ]}
          >
            <View
              style={[
                Styles.pillIconWrap,
                badge.tone === 'purple' ? Styles.pillIconWrapPurple : null,
                badge.tone === 'blue' ? Styles.pillIconWrapBlue : null,
              ]}
            >
              {badge.pillIcon}
            </View>
            <Text
              style={[
                Styles.pillLabel,
                badge.tone === 'purple' ? Styles.pillLabelPurple : null,
                badge.tone === 'blue' ? Styles.pillLabelBlue : null,
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
      <View
        style={[
          Styles.container,
          vertical && Styles.containerVertical,
          containerStyle,
        ]}
      >
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
  pillBadgeBlue: {
    backgroundColor: 'rgba(75,159,234,0.1)',
    borderColor: 'rgba(75,159,234,0.28)',
  },
  pillIconWrapPurple: {
    backgroundColor: Colors.lavender,
  },
  pillIconWrapBlue: {
    backgroundColor: '#EAF4FF',
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
  pillLabelBlue: {
    color: '#287FC2',
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
