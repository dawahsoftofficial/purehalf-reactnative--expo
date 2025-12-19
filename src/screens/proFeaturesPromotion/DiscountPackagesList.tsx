import React, { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

import { Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';

const DiscountPackagesList = (props: any) => {
  const Rtl = CheckRtl();
  const { data } = props;

  const [selectedPackage, setSelectedPackage] = useState<any>({
    index: 2,
    data: data[2],
  });

  const onItemPress = (item: any, index: any) => {
    if (!item && !index) {
      if (props.navigation?.canGoBack()) {
        props.navigation.goBack();
      } else {
        props.navigation.reset({
          index: 0,
          routes: [{ name: 'BottomTab' }],
        });
      }
    }
    setSelectedPackage({ index: index, data: item });
    props?.onPackageSelection && props.onPackageSelection(item);
  };

  const renderPackages = ({ item, index }: any) => {
    const currencySymbol = item?.product?.priceString
      ?.match(/^[^\d]+/)[0]
      ?.trim();
    const selected = index === selectedPackage.index ? true : false;
    return (
      <Ripple
        style={{
          ...Styles.itemContainer,
          borderColor: selected ? Colors.color38 : Colors.color2,
          backgroundColor: selected ? Colors.color39 : 'transparent',
          flexDirection: Rtl ? 'row-reverse' : 'row',
        }}
        onPress={onItemPress.bind(null, item, index)}
      >
        <View
          style={{
            ...Styles.itemFirstCon,
            flexDirection: Rtl ? 'row-reverse' : 'row',
          }}
        >
          <Text style={Styles.number}>
            {item?.packageType === 'WEEKLY'
              ? '1'
              : item?.packageType === 'MONTHLY'
                ? '1'
                : item?.packageType === 'TWO_MONTH'
                  ? '2'
                  : item?.packageType === 'THREE_MONTH'
                    ? '3'
                    : item?.packageType === 'SIX_MONTH'
                      ? '6'
                      : item?.packageType === 'ANNUAL'
                        ? '12'
                        : ''}
          </Text>
          <View
            style={{
              paddingLeft: Rtl ? 0 : wp(2),
              paddingRight: Rtl ? wp(2) : 0,
              marginTop: hp(-0.3),
            }}
          >
            <Text style={Styles.description}>
              {item?.packageType === 'WEEKLY'
                ? LanguageKeys.week
                : item?.packageType === 'MONTHLY'
                  ? LanguageKeys.month
                  : LanguageKeys.months}
            </Text>
            <View style={{ flexDirection: Rtl ? 'row-reverse' : 'row' }}>
              <Text style={Styles.description} numberOfLines={1}>
                {item?.product?.priceString?.includes('.')
                  ? item.product.priceString.split('.')[0]
                  : item?.product?.priceString}
              </Text>
              <View style={{ flexDirection: Rtl ? 'row-reverse' : 'row' }}>
                <Text style={Styles.description} numberOfLines={1}>
                  {' '}
                  {Rtl ? ')' : '('} {currencySymbol}{' '}
                  {item?.packageType === 'WEEKLY'
                    ? item?.product?.price
                    : item?.packageType === 'MONTHLY'
                      ? item?.product?.price.toFixed()
                      : item?.packageType === 'TWO_MONTH'
                        ? (item?.product?.price / 2).toFixed()
                        : item?.packageType === 'THREE_MONTH'
                          ? (item?.product?.price / 3).toFixed()
                          : item?.packageType === 'SIX_MONTH'
                            ? (item?.product?.price / 6).toFixed()
                            : item?.packageType === 'ANNUAL'
                              ? (item?.product?.price / 12).toFixed()
                              : ''}
                </Text>
                <Text style={Styles.description} numberOfLines={1}>
                  {' '}
                  /{' '}
                </Text>
                <Text style={Styles.description} numberOfLines={1}>
                  {item?.packageType === 'WEEKLY'
                    ? LanguageKeys.week
                    : LanguageKeys.month}{' '}
                  {Rtl ? '(' : ')'}
                </Text>
              </View>
            </View>
          </View>
        </View>
        {index === 2 && (
          <View style={Styles.itemSecondCon}>
            <Text
              style={{
                ...Styles.description,
                alignSelf: Rtl ? 'flex-start' : 'flex-end',
                marginLeft: Rtl ? wp(1) : 0,
              }}
            >
              bestValue
            </Text>
            <View
              style={{
                ...Styles.saveCon,
                alignSelf: Rtl ? 'flex-start' : 'flex-end',
              }}
            >
              <Text style={Styles.saveTxt}>Save 30%</Text>
            </View>
          </View>
        )}
      </Ripple>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <Ripple
        style={{
          ...Styles.itemContainer,
          flexDirection: Rtl ? 'row-reverse' : 'row',
          borderColor:
            selectedPackage?.data?.title === 'free'
              ? Colors.color38
              : Colors.color2,
          backgroundColor:
            selectedPackage?.data?.title === 'free'
              ? Colors.color39
              : 'transparent',
        }}
        onPress={onItemPress.bind(null, { title: 'free' }, 10)}
      >
        <View
          style={{
            ...Styles.itemFirstCon,
          }}
        >
          <View
            style={{
              width: '100%',
              paddingLeft: Rtl ? 0 : wp(2),
              paddingRight: Rtl ? wp(2) : 0,
              marginTop: hp(-0.3),
            }}
          >
            <Text style={Styles.description}>
              Free Version - Enjoy Basic Features
            </Text>
            <View style={{ flexDirection: Rtl ? 'row-reverse' : 'row' }}>
              <Text style={Styles.descriptionSummary} numberOfLines={1}>
                Reply only to incoming messages; limited features
              </Text>
            </View>
          </View>
        </View>
      </Ripple>
      <FlatList
        data={data}
        renderItem={renderPackages}
        contentContainerStyle={Styles.listContainer}
      />
    </View>
  );
};

export default DiscountPackagesList;

const Styles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
  itemContainer: {
    borderWidth: 1,
    borderColor: Colors.color2,
    borderRadius: 8,
    marginTop: hp(2),
    height: wp(15),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemFirstCon: {
    flex: 1,
    paddingHorizontal: wp(2),
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemSecondCon: {
    width: wp(32),
    paddingHorizontal: wp(3),
  },
  number: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: wp(10),
    alignSelf: 'center',
    includeFontPadding: false,
  },
  descriptionSummary: {
    color: Colors.color2,
    includeFontPadding: false,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.tiny2,
  },
  description: {
    color: Colors.color2,
    includeFontPadding: false,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.tiny2,
    fontWeight: '700',
  },
  saveCon: {
    backgroundColor: Colors.color37,
    width: wp(16),
    marginTop: hp(0.3),
    borderRadius: 30,
  },
  saveTxt: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.tiny1,
    alignSelf: 'center',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
