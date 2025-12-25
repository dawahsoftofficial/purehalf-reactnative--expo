import React, { memo } from 'react';
import { StyleSheet } from 'react-native';

import { Text } from '../../../components';
import { hp, Typography } from '../../../global';
import { LanguageKeys } from '../../../languages';
import { Colors, Fonts } from '../../../res';

function UserInputHeader() {
  return <Text style={Styles.heading}>{LanguageKeys.signupDes}</Text>;
}

export default memo(UserInputHeader);

const Styles = StyleSheet.create({
  heading: {
    fontSize: Typography.large2,
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_B,
    includeFontPadding: false,
    marginBottom: hp(3),
  },
});
