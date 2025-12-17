import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import Feather from 'react-native-vector-icons/Feather';

import { Animation } from '../../animations';
import { Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import Constants from '../../global/Constants';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';

const InterestAndHobbyCard = (props: any) => {
  const Rtl = CheckRtl();
  const {
    data = [],
    headerHeading = '',
    onEditPress = () => null,
    fromUserProfile = false,
    from = '',
  } = props;

  const RenderHeaderHeading = () => (
    <Text style={Styles.headerTxt}>{headerHeading}</Text>
  );

  const RenderEditBtn = () => (
    <Ripple
      style={Styles.editButton}
      onPress={onEditPress.bind(null, {
        data: data,
        from: headerHeading,
      })}
    >
      <Feather name="edit-2" color={Colors.color1} size={wp(4)} />
    </Ripple>
  );

  return data.length !== 0 ? (
    <View style={Styles.container}>
      <View
        style={{
          ...Styles.headerContainer,
          flexDirection: Rtl ? 'row-reverse' : 'row',
        }}
      >
        <RenderHeaderHeading />
        {!fromUserProfile && <RenderEditBtn />}
      </View>
      <Animation animation={'fadeInDown'} duration={500}>
        {from === 'waliInformation' && fromUserProfile && data.length !== 0 ? (
          <Text style={Styles.waliInfoDes}>{LanguageKeys.moderatedByWali}</Text>
        ) : (
          <View
            style={{
              ...Styles.listItemContainer,
              flexDirection: Rtl ? 'row-reverse' : 'row',
            }}
          >
            {data?.find((item: any) => item?.selected) ? (
              data?.map((item: any, index: number) =>
                item?.selected ? (
                  <View key={index} style={Styles.item}>
                    <Text style={Styles.itemValue}>{item?.value}</Text>
                  </View>
                ) : null
              )
            ) : (
              <View>
                <Text style={Styles.passInfoDes}>
                  {!fromUserProfile
                    ? LanguageKeys.noInterestAndHobbiesSelected
                    : LanguageKeys.noInterestAndHobbiesAvailable}
                </Text>
              </View>
            )}
          </View>
        )}
      </Animation>
    </View>
  ) : (
    <View />
  );
};

export default InterestAndHobbyCard;

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
    paddingBottom: hp(2),
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
  passInfoDes: {
    color: Colors.color11,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small3,
    includeFontPadding: false,
  },
  listItemContainer: {
    paddingHorizontal: wp(3.5),
    flexWrap: 'wrap',
  },
  item: {
    backgroundColor: Colors.color3,
    paddingHorizontal: wp(2),
    paddingVertical: hp(1),
    margin: hp(0.5),
    borderRadius: 50,
    borderColor: Colors.color4,
    borderWidth: 1,
  },
  itemValue: {
    color: Colors.color11,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small1,
    marginBottom: Constants.fontFamilyMarginBottom,
    alignSelf: 'flex-start',
  },
});
