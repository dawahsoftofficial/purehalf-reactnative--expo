import React, { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { Text } from '../../../components';
import { hp, Typography, wp } from '../../../global';
import { Colors, Fonts, Images } from '../../../res';

function LogoSection() {
  return (
    <View style={Styles.container}>
      <Image
        source={Images.logoColoured}
        resizeMode="contain"
        style={Styles.logo}
      />
      <Text style={Styles.logoDescription}>logoDescription</Text>
    </View>
  );
}

export default memo(LogoSection);

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
    includeFontPadding: false,
    marginTop: hp(1),
  },
});
