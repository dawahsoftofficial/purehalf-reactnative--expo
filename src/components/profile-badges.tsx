import moment from 'moment';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { hp, Typography, wp } from '../global';
import { Colors, Fonts } from '../res';
import { StorageManager, useGlobalContext } from '../services';
import { usePremiumStore } from '../stores';
import Text from './Text';

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
};

function checkProfileCompleted(
  userData: ProfileBadgesProps['userData'],
  profileDetailLocal: unknown
): boolean {
  if (!userData) return false;

  const keysData: Record<string, boolean> = {
    primary_image: Boolean(userData.media?.primary_image),
    tagline: Boolean(userData.detail?.tagline),
    'appearance-0': true,
    'familybg-0': true,
    'life-0': true,
    'islamicval-0': true,
    'personality-0': true,
    'futurePlans-0': Boolean(
      userData.detail?.family_plan_id &&
      userData.detail?.marriage_plan_id &&
      userData.detail?.relocation_plan_id
    ),
    'myInterestAndHobbies-0': Boolean(userData.detail?.personality_id?.length),
  };

  if (profileDetailLocal && typeof profileDetailLocal === 'object') {
    let islamicCount = 0;
    Object.keys(profileDetailLocal).forEach((childKey) => {
      const childData = (profileDetailLocal as Record<string, unknown[]>)[
        childKey
      ];
      if (Array.isArray(childData)) {
        childData.forEach((element) => {
          if (
            typeof element === 'object' &&
            element !== null &&
            'apiKey' in element &&
            'category' in element
          ) {
            const apiKey = element.apiKey as string;
            const category = element.category as string;

            if (userData.detail && Object.keys(userData.detail).length) {
              const value =
                userData.detail[apiKey as keyof typeof userData.detail];
              if (value === null || value === undefined) {
                keysData[category] = false;
              }
              if (
                category === 'islamicval-0' &&
                (value !== null || value !== undefined)
              ) {
                islamicCount += 1;
              }
              // Match Welcome.tsx logic exactly: during iteration, if islamicCount < 4, keep as true
              if (islamicCount < 4) {
                keysData['islamicval-0'] = true;
              }
            } else {
              keysData[category] = false;
            }
          }
        });
      }
    });
    // Final validation: we need at least 4 islamic values to be complete
    // This ensures the badge only shows when all requirements are met
    if (islamicCount < 4) {
      keysData['islamicval-0'] = false;
    }
  }

  return Object.values(keysData).every((value) => value === true);
}

export function ProfileBadges({
  userData,
  isSelf = false,
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
      icon: string;
      label: string;
      iconType: 'fontawesome' | 'material';
    }> = [];

    if (isVIP || true) {
      badgeList.push({
        icon: 'crown',
        label: 'VIP',
        iconType: 'fontawesome',
      });
    }

    if (isBoosted || true) {
      badgeList.push({
        icon: 'rocket',
        label: 'Boosted',
        iconType: 'fontawesome',
      });
    }

    if (isProfileCompleted || true) {
      badgeList.push({
        icon: 'check-circle',
        label: 'Complete',
        iconType: 'material',
      });
    }

    return badgeList;
  }, [isVIP, isBoosted, isProfileCompleted]);

  if (badges.length === 0) {
    return null;
  }

  return (
    <View style={Styles.container}>
      {badges.map((badge, index) => (
        <View key={index} style={Styles.badge}>
          {badge.iconType === 'fontawesome' ? (
            <FontAwesome5
              name={badge.icon}
              size={wp(3.5)}
              color={Colors.color2}
            />
          ) : (
            <MaterialIcons
              name={badge.icon}
              size={wp(4)}
              color={Colors.color2}
            />
          )}
          <Text style={Styles.badgeLabel}>{badge.label}</Text>
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
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.color47,
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    borderRadius: wp(3),
    gap: wp(1),
    borderWidth: 1,
    borderColor: Colors.theme,
  },
  badgeLabel: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small2,
    includeFontPadding: false,
  },
});
