import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Animation } from '../../animations';
import { Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import Constants from '../../global/Constants';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';

type InterestItem = { selected?: boolean; value?: string };

type InterestAndHobbyCardProps = {
  data?: InterestItem[];
  headerHeading?: string;
  onEditPress?: (payload: { data: InterestItem[]; from: string }) => void;
  fromUserProfile?: boolean;
  from?: string;
};

const InterestAndHobbyCard = ({
  data = [],
  headerHeading = '',
  onEditPress,
  fromUserProfile = false,
  from = '',
}: InterestAndHobbyCardProps) => {
  const Rtl = CheckRtl();

  const onEdit = useCallback(() => {
    if (onEditPress) {
      onEditPress({ data, from: headerHeading });
    }
  }, [data, headerHeading, onEditPress]);

  const selectedItems = useMemo(
    () => data.filter((item) => item?.selected),
    [data]
  );

  const hasSelected = selectedItems.length > 0;

  // Other-member payloads redact private interests to an empty value. Do not
  // turn that redaction (or a genuinely empty answer) into a visible profile
  // section that hints at a hidden field.
  if (fromUserProfile && !hasSelected) {
    return <View />;
  }

  return data.length !== 0 ? (
    <Ripple
      onPress={onEdit}
      style={Styles.container}
      rippleColor={Colors.theme}
      disabled={fromUserProfile}
    >
      <View
        style={[
          Styles.headerContainer,
          { flexDirection: Rtl ? 'row-reverse' : 'row' },
        ]}
      >
        <View
          style={[
            Styles.headerLeft,
            { flexDirection: Rtl ? 'row-reverse' : 'row' },
          ]}
        >
          <View style={Styles.headerIconChip}>
            <Ionicons
              name="color-palette-outline"
              size={wp(4.6)}
              color={Colors.primary}
            />
          </View>
          <Text variant="display" style={Styles.headerTxt}>
            {headerHeading}
          </Text>
        </View>
        {!fromUserProfile ? (
          <View style={Styles.editButton}>
            <Feather name="edit-2" color={Colors.primary} size={wp(4)} />
          </View>
        ) : null}
      </View>
      <Animation animation={'fadeInDown'} duration={500}>
        {from === 'waliInformation' && fromUserProfile && data.length !== 0 ? (
          <Text style={Styles.waliInfoDes}>{LanguageKeys.moderatedByWali}</Text>
        ) : (
          <View
            style={[
              Styles.listItemContainer,
              { flexDirection: Rtl ? 'row-reverse' : 'row' },
            ]}
          >
            {hasSelected ? (
              selectedItems.map((item, index) => (
                <View
                  key={`${item?.value ?? index}-${index}`}
                  style={Styles.item}
                >
                  <Text style={Styles.itemValue}>{item?.value ?? ''}</Text>
                </View>
              ))
            ) : (
              <Text style={Styles.emptyTxt}>
                {!fromUserProfile
                  ? LanguageKeys.noInterestAndHobbiesSelected
                  : LanguageKeys.noInterestAndHobbiesAvailable}
              </Text>
            )}
          </View>
        )}
      </Animation>
    </Ripple>
  ) : (
    <View />
  );
};

export default React.memo(InterestAndHobbyCard);

const Styles = StyleSheet.create({
  container: {
    marginHorizontal: wp(4),
    backgroundColor: Colors.surface,
    paddingTop: hp(1.8),
    borderRadius: 16,
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: Colors.hairline,
    overflow: 'hidden',
    paddingBottom: hp(1.5),
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingBottom: hp(1.2),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2.5),
    flexShrink: 1,
  },
  headerIconChip: {
    width: wp(8.5),
    height: wp(8.5),
    borderRadius: wp(4.25),
    backgroundColor: Colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTxt: {
    color: Colors.ink,
    fontSize: Typography.medium1,
    marginBottom: Constants.fontFamilyMarginBottom,
    flexShrink: 1,
  },
  editButton: {
    paddingVertical: hp(1),
    paddingHorizontal: wp(2),
    marginRight: wp(-2),
  },
  waliInfoDes: {
    color: Colors.color11,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small3,
    includeFontPadding: false,
    marginTop: hp(-2),
    marginBottom: hp(2),
    marginHorizontal: wp(4),
  },
  emptyTxt: {
    flex: 1,
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    includeFontPadding: false,
  },
  listItemContainer: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(0.5),
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: wp(2),
  },
  item: {
    backgroundColor: Colors.lavender,
    borderWidth: 1,
    borderColor: Colors.hairline,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.7),
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
