import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { CityPicker, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import Constants from '../../global/Constants';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts, Images } from '../../res';
import { isIOS } from '../../services';

const CityPickerBtn = (props: any) => {
  const Rtl = CheckRtl();
  const {
    value = {
      country: 'PK',
      name: 'Islamabad',
      lat: '33.72148',
      lng: '73.04329',
    },
  } = props;
  const [selectedCity, setSelectedCity] = useState(value);
  const [cityPickerVisible, setCityPickerVisible] = useState(false);

  const RenderDownIcon = () => (
    <AntDesign name="down" size={wp(3.5)} color={Colors.color4} />
  );
  const RenderGlobeImage = () => (
    <Image
      source={Images.globe}
      resizeMode="contain"
      style={Styles.globeIcon}
    />
  );

  const RenderCountryText = () => (
    <Text style={Styles.outerBtnLabel}>{selectedCity.name}</Text>
  );

  const onPressBtn = () => setCityPickerVisible(true);
  const closeCountryPicker = () => setCityPickerVisible(false);

  const onSelectCountry = (item: any) => {
    setSelectedCity(item);
    setCityPickerVisible(false);
    props.onSelect(item);
  };

  return (
    <View>
      <Text style={Styles.label}>{LanguageKeys.city}</Text>
      {Rtl ? (
        <Ripple style={Styles.container} onPress={onPressBtn}>
          <RenderDownIcon />
          <View style={Styles.innerContainer}>
            <RenderCountryText />
            <RenderGlobeImage />
          </View>
        </Ripple>
      ) : (
        <Ripple style={Styles.container} onPress={onPressBtn}>
          <View style={Styles.innerContainer}>
            <RenderGlobeImage />
            <RenderCountryText />
          </View>
          <RenderDownIcon />
        </Ripple>
      )}
      <CityPicker
        visible={cityPickerVisible}
        onClose={closeCountryPicker}
        onPress={onSelectCountry}
      />
    </View>
  );
};

export default CityPickerBtn;

const Styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.color3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: wp(12),
    paddingHorizontal: wp(2),
    borderBottomWidth: 0.7,
    borderColor: Colors.color1,
    marginTop: hp(0.8),
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: hp(6),
  },
  label: {
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_R,
    marginBottom: Constants.fontFamilyMarginBottom,
    color: Colors.color1,
  },
  globeIcon: {
    width: wp(4.5),
    height: hp(4),
  },
  outerBtnLabel: {
    fontFamily: Fonts.APPFONT_R,
    color: Colors.color1,
    fontSize: Typography.small3,
    marginTop: !isIOS ? hp(0.35) : 0,
    alignSelf: 'center',
    marginHorizontal: wp(3),
  },
});
