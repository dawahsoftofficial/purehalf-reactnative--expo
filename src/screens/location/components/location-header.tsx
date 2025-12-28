import React, { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { Text } from '../../../components';
import { hp, Typography, wp } from '../../../global';
import { LanguageKeys } from '../../../languages';
import { Colors, Fonts, Images } from '../../../res';

function LocationHeader() {
  return (
    <View style={Styles.container}>
      <Image
        source={Images.logoColoured}
        resizeMode="contain"
        style={Styles.logo}
      />
      <View style={Styles.textContainer}>
        <Text style={Styles.mainText}>{LanguageKeys.meetPartner}</Text>
        <Text style={Styles.subText}>{LanguageKeys.enableLocationDes}</Text>
      </View>
    </View>
  );
}

export default memo(LocationHeader);

const Styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logo: {
    width: wp(40),
    height: hp(16),
  },
  textContainer: {
    width: wp(80),
    marginTop: hp(2),
  },
  mainText: {
    fontSize: Typography.medium,
    alignSelf: 'center',
    fontFamily: Fonts.APPFONT_B,
    color: Colors.color1,
  },
  subText: {
    fontSize: Typography.small1,
    textAlign: 'center',
    fontFamily: Fonts.APPFONT_R,
    color: Colors.color4,
  },
});
