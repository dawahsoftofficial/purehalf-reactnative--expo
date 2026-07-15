import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Animation } from '../../animations';
import { Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import Constants from '../../global/Constants';
import { CheckRtl } from '../../languages';
import { stripLeadingEmoji } from '../../lib/utils/profile-utils';
import { Colors, Fonts } from '../../res';
import { useGlobalContext } from '../../services';

type InterestItem = { id?: number; value?: string };

type InterestAndHobbyCardStaticProps = {
  data?: InterestItem[];
  headerHeading?: string;
  fromUserProfile?: boolean;
  from?: string;
  matchPercentage?: number;
};

const InterestAndHobbyCardStatic = ({
  data = [],
  headerHeading = '',
  fromUserProfile = false,
  matchPercentage,
}: InterestAndHobbyCardStaticProps) => {
  const Rtl = CheckRtl();
  const { currentUser } = useGlobalContext();

  const matchingData = useMemo(() => {
    if (!data?.length || !currentUser?.detail?.personality_id) {
      return [];
    }
    return data.filter((item) =>
      currentUser.detail.personality_id?.includes(item?.id)
    );
  }, [currentUser?.detail?.personality_id, data]);

  if (
    !fromUserProfile ||
    matchPercentage === null ||
    matchPercentage === undefined
  ) {
    return null;
  }

  const hasShared = matchingData.length !== 0;

  return (
    <View style={Styles.card}>
      <View
        style={[Styles.head, { flexDirection: Rtl ? 'row-reverse' : 'row' }]}
      >
        <View style={Styles.headText}>
          <Text variant="display" style={Styles.title}>
            {headerHeading}
          </Text>
        </View>
        <View style={Styles.badge}>
          <Text style={Styles.badgePct}>
            {`${matchPercentage?.toFixed(0)}%`}
          </Text>
        </View>
      </View>
      {hasShared ? (
        <Animation animation={'fadeInDown'} duration={500}>
          <View
            style={[
              Styles.pills,
              { flexDirection: Rtl ? 'row-reverse' : 'row' },
            ]}
          >
            {matchingData.map((item, index) => (
              <View key={`${item?.id ?? index}-${index}`} style={Styles.item}>
                <Text style={Styles.itemValue}>
                  {stripLeadingEmoji(item?.value ?? '')}
                </Text>
              </View>
            ))}
          </View>
        </Animation>
      ) : null}
    </View>
  );
};

export default React.memo(InterestAndHobbyCardStatic);

const Styles = StyleSheet.create({
  card: {
    marginHorizontal: wp(4),
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.hairline,
    marginBottom: hp(2),
    padding: wp(4),
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headText: {
    flex: 1,
    paddingHorizontal: wp(2),
  },
  title: {
    color: Colors.ink,
    fontSize: Typography.medium1,
  },
  badge: {
    width: wp(16),
    height: wp(16),
    borderRadius: wp(8),
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePct: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.medium,
    includeFontPadding: false,
  },
  pills: {
    flexWrap: 'wrap',
    marginTop: hp(1.6),
  },
  item: {
    backgroundColor: Colors.lavender,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.9),
    margin: hp(0.5),
    marginTop: 0,
    marginBottom: hp(1),
    borderRadius: 999,
  },
  itemValue: {
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small1,
    marginBottom: Constants.fontFamilyMarginBottom,
    alignSelf: 'flex-start',
  },
});
