import React, { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { Text } from '../../../components';
import { hp, Typography, wp } from '../../../global';
import { LanguageKeys } from '../../../languages';
import { Colors, Fonts, Images } from '../../../res';

function PhoneLogoSection() {
  return (
    <View style={Styles.container}>
      <Image
        source={Images.logoColoured}
        resizeMode="contain"
        style={Styles.logo}
      />
      <Text style={Styles.logoDescription}>{LanguageKeys.logoDescription}</Text>
    </View>
  );
}

export default memo(PhoneLogoSection);

const Styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: wp(40),
    height: hp(16),
  },
  logoDescription: {
    color: Colors.color1,
    fontSize: Typography.small2,
    fontFamily: Fonts.APPFONT_R,
    alignSelf: 'center',
    textAlign: 'center',
    lineHeight: wp(6),
    includeFontPadding: false,
    marginTop: hp(1),
  },
});
