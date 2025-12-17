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

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const id = item?.id;
      if (!id) {
        return true;
      }
      if (fromUserProfile) {
        return !(
          (id === 'doYouHaveABeard' && isMale) ||
          (id === 'hijab-0' && !isMale)
        );
      }
      return !(
        (id === 'doYouHaveABeard' && !isMale) ||
        (id === 'hijab-0' && isMale)
      );
    });
  }, [data, fromUserProfile, isMale]);

  const keyExtractor = useCallback(
    (item: InfoItem, index: number) => `${item?.id ?? index}-${index}`,
    []
  );

  const renderHeader = useMemo(
    () => <Text style={Styles.headerTxt}>{headerHeading}</Text>,
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

      return (
        <View
          style={[
            Styles.listItemContainer,
            {
              flexDirection: Rtl ? 'row-reverse' : 'row',
              backgroundColor: index % 2 === 0 ? Colors.color31 : Colors.color2,
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
    [Rtl]
  );

  if (data.length === 0) {
    return <View />;
  }

  return (
    <View style={Styles.container}>
      <View
        style={[
          Styles.headerContainer,
          { flexDirection: Rtl ? 'row-reverse' : 'row' },
        ]}
      >
        {renderHeader}
        {!fromUserProfile ? (
          <Ripple style={Styles.editButton} onPress={onEdit}>
            <Feather name="edit-2" color={Colors.color1} size={wp(4)} />
          </Ripple>
        ) : null}
      </View>

      <Animation
        style={Styles.listContainer}
        animation={'fadeInDown'}
        duration={500}
      >
        {from === 'waliInformation' && fromUserProfile && data.length !== 0 ? (
          <Text style={Styles.waliInfoDes}>{LanguageKeys.moderatedByWali}</Text>
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
    </View>
  );
};

export default React.memo(InfoCard);

const Styles = StyleSheet.create({
  container: {
    marginHorizontal: wp(4),
    backgroundColor: Colors.color2,
    paddingTop: hp(1.5),
    borderRadius: 10,
    marginBottom: hp(4.5),
    borderWidth: 0.5,
    borderColor: Colors.color27,
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
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.medium,
    marginBottom: Constants.fontFamilyMarginBottom,
  },
  listContainer: {
    marginTop: hp(1),
  },
  listItemContainer: {
    paddingHorizontal: wp(4),
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: wp(92),
    paddingVertical: hp(1),
  },
  itemHeading: {
    width: wp(45),
    color: Colors.color12,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small1,
    marginBottom: Constants.fontFamilyMarginBottom,
    paddingRight: 5,
  },
  itemValue: {
    width: wp(39),
    color: Colors.color11,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small1,
    marginBottom: Constants.fontFamilyMarginBottom,
    alignSelf: 'flex-start',
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
  editButton: {
    paddingVertical: hp(1),
    paddingHorizontal: wp(2),
    marginRight: wp(-2),
  },
});
