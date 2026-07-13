import React, { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';

const PackagesList = (props: any) => {
  const Rtl = CheckRtl();
  const { data } = props;

  const [selectedPackage, setSelectedPackage] = useState<any>({
    index: -1,
    data: null,
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
    if (props?.onPackageSelection) {
      props.onPackageSelection(item);
    }
  };

  const renderPackages = ({ item, index }: any) => {
    const currencySymbol = item?.product?.priceString
      ?.match(/^[^\d]+/)?.[0]
      ?.trim();
    const selected = index === selectedPackage.index ? true : false;
    const features = item?.features || [];
    return (
      <Ripple
        style={{
          ...Styles.itemContainer,
          borderColor: selected ? Colors.color38 : Colors.color2,
          backgroundColor: selected ? Colors.color39 : 'transparent',
          flexDirection: Rtl ? 'row-reverse' : 'row',
          minHeight: features.length > 0 ? wp(25) : wp(15),
        }}
        onPress={onItemPress.bind(null, item, index)}
      >
        <View
          style={{
            ...Styles.itemFirstCon,
            flexDirection: Rtl ? 'row-reverse' : 'row',
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={Styles.title}>{item?.identifier}</Text>
            <View style={{ flexDirection: Rtl ? 'row-reverse' : 'row' }}>
              <View style={{ flexDirection: Rtl ? 'row-reverse' : 'row' }}>
                <Text style={Styles.description} numberOfLines={1}>
                  {currencySymbol}
                  {item?.product?.price?.toFixed(2)}
                </Text>
                <Text style={Styles.description} numberOfLines={1}>
                  {' '}
                  /{' '}
                </Text>
                <Text style={Styles.description} numberOfLines={1}>
                  {LanguageKeys.month}
                </Text>
              </View>
            </View>
            {features.length > 0 && (
              <View style={Styles.featuresContainer}>
                {features.map((feature: string, featureIndex: number) => (
                  <View
                    key={featureIndex}
                    style={[
                      Styles.featureItem,
                      { flexDirection: Rtl ? 'row-reverse' : 'row' },
                    ]}
                  >
                    <AntDesign
                      name="checkcircle"
                      size={wp(3)}
                      color={selected ? Colors.color38 : Colors.color2}
                      style={{
                        marginRight: Rtl ? 0 : wp(1.5),
                        marginLeft: Rtl ? wp(1.5) : 0,
                      }}
                    />
                    <Text style={Styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Ripple>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={data}
        renderItem={renderPackages}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.identifier}
        contentContainerStyle={Styles.listContainer}
      />
    </View>
  );
};

export default PackagesList;

const Styles = StyleSheet.create({
  listContainer: {
    flexGrow: 1,
  },
  itemContainer: {
    borderWidth: 1,
    borderColor: Colors.color2,
    borderRadius: 8,
    marginTop: hp(2),
    paddingVertical: hp(1.5),
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  itemFirstCon: {
    flex: 1,
    paddingHorizontal: wp(2),
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemSecondCon: {
    width: wp(32),
    paddingHorizontal: wp(3),
  },

  descriptionSummary: {
    color: Colors.color2,
    includeFontPadding: false,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.tiny2,
  },
  title: {
    color: Colors.color2,
    includeFontPadding: false,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small,
  },
  description: {
    color: Colors.color2,
    includeFontPadding: false,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.tiny2,
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
  featuresContainer: {
    marginTop: hp(1),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(0.5),
  },
  featureText: {
    color: Colors.color2,
    includeFontPadding: false,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.tiny2,
    flex: 1,
  },
});
