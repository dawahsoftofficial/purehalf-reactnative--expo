import React, { useCallback, useMemo } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import Feather from 'react-native-vector-icons/Feather';

import { Animation } from '../../animations';
import { Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import Constants from '../../global/Constants';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';

type InfoItem = {
  id?: string;
  title?: string;
  selected?: {
    value?: number | string;
    scale?: string;
  };
};

type InfoCardProps = {
  data?: InfoItem[];
  headerHeading?: string;
  onEditPress?: (payload: { data: InfoItem[]; from: string }) => void;
  fromUserProfile?: boolean;
  from?: string;
  userData?: { gender?: string };
};

const InfoCard = ({
  data = [],
  headerHeading = '',
  onEditPress,
  fromUserProfile = false,
  from = '',
  userData,
}: InfoCardProps) => {
  const Rtl = CheckRtl();

  const isMale = useMemo(
    () => (userData?.gender === 'female' ? false : true),
    [userData?.gender]
  );

  const hasRealValue = useCallback((item: InfoItem) => {
    const value = item?.selected?.value;
    if (typeof value === 'number') {
      return true;
    }
    if (typeof value === 'string' && value.length !== 0) {
      return true;
    }
    // disabilities still renders a meaningful "None" when empty
    return item?.title === 'disabilities';
  }, []);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const id = item?.id;
      if (id) {
        if (fromUserProfile) {
          if (
            (id === 'doYouHaveABeard' && isMale) ||
            (id === 'hijab-0' && !isMale)
          ) {
            return false;
          }
        } else if (
          (id === 'doYouHaveABeard' && !isMale) ||
          (id === 'hijab-0' && isMale)
        ) {
          return false;
        }
      }
      // On another member's profile, hide fields they haven't filled in.
      if (fromUserProfile && !hasRealValue(item)) {
        return false;
      }
      return true;
    });
  }, [data, fromUserProfile, isMale, hasRealValue]);

  const keyExtractor = useCallback(
    (item: InfoItem, index: number) => `${item?.id ?? index}-${index}`,
    []
  );

  const renderHeader = useMemo(
    () => (
      <Text variant="display" style={Styles.headerTxt}>
        {headerHeading}
      </Text>
    ),
    [headerHeading]
  );

  const onEdit = useCallback(() => {
    if (onEditPress) {
      onEditPress({ data, from: headerHeading });
    }
  }, [data, headerHeading, onEditPress]);

  const renderItem = useCallback(
    ({ item, index }: { item: InfoItem; index: number }) => {
      const value = item?.selected?.value;
      const scale = item?.selected?.scale ?? '';
      const isNumber = typeof value === 'number';
      const formattedValue = isNumber
        ? value === 1
          ? 'Yes'
          : value === 0
            ? 'No'
            : item?.id === 'height' || item?.id === 'weight'
              ? `${value.toFixed()} ${scale}`
              : value.toFixed()
        : value && (value as string).length !== 0
          ? String(value)
          : item?.title === 'disabilities'
            ? LanguageKeys.none
            : LanguageKeys.notYetProvided;
      const title = item.title ?? '';
      const isLast = index === filteredData.length - 1;

      return (
        <View
          style={[
            Styles.listItemContainer,
            {
              flexDirection: Rtl ? 'row-reverse' : 'row',
              borderBottomWidth: isLast ? 0 : 1,
            },
          ]}
        >
          <Text
            style={{ ...Styles.itemHeading, textAlign: Rtl ? 'right' : 'left' }}
          >
            {title}
          </Text>
          <Text
            style={{ ...Styles.itemValue, textAlign: Rtl ? 'right' : 'left' }}
          >
            {formattedValue}
          </Text>
        </View>
      );
    },
    [Rtl, filteredData.length]
  );

  if (data.length === 0) {
    return <View />;
  }

  return (
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
        {renderHeader}
        {!fromUserProfile ? (
          <View style={Styles.editButton}>
            <Feather name="edit-2" color={Colors.color1} size={wp(4)} />
          </View>
        ) : null}
      </View>

      <Animation
        style={Styles.listContainer}
        animation={'fadeInDown'}
        duration={500}
      >
        {from === 'waliInformation' && fromUserProfile && data.length !== 0 ? (
          <Text style={Styles.waliInfoDes}>{LanguageKeys.moderatedByWali}</Text>
        ) : fromUserProfile && filteredData.length === 0 ? (
          <View
            style={{
              ...Styles.emptyRow,
              flexDirection: Rtl ? 'row-reverse' : 'row',
            }}
          >
            <View style={Styles.emptyChip}>
              <Feather name="inbox" color={Colors.primary} size={wp(4)} />
            </View>
            <Text style={Styles.emptyTxt}>{LanguageKeys.notYetProvided}</Text>
          </View>
        ) : (
          <ScrollView horizontal scrollEnabled={false}>
            <FlatList
              data={filteredData}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              scrollEnabled={false}
            />
          </ScrollView>
        )}
      </Animation>
    </Ripple>
  );
};

export default React.memo(InfoCard);

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
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingBottom: hp(1),
  },
  headerTxt: {
    color: Colors.ink,
    fontSize: Typography.medium1,
    marginBottom: Constants.fontFamilyMarginBottom,
  },
  listContainer: {
    marginTop: hp(1),
  },
  listItemContainer: {
    paddingHorizontal: wp(4),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: wp(92),
    paddingVertical: hp(1.3),
    borderBottomColor: Colors.hairline,
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    paddingHorizontal: wp(4),
    paddingBottom: hp(0.6),
  },
  emptyChip: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    backgroundColor: Colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTxt: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    includeFontPadding: false,
    alignSelf: 'center',
  },
  itemHeading: {
    width: wp(42),
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small1,
  },
  itemValue: {
    width: wp(38),
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small1,
  },
  waliInfoDes: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small3,
    includeFontPadding: false,
    marginTop: hp(-2),
    marginBottom: hp(2),
    marginHorizontal: wp(4),
  },
  editButton: {
    paddingVertical: hp(1),
    paddingHorizontal: wp(2),
    marginRight: wp(-2),
  },
});
