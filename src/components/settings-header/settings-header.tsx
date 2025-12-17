import React from 'react';
import { StyleSheet, View } from 'react-native';

import { hp, Typography } from '../../global';
import { LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';
import Text from '../Text';

function SettingsHeader() {
  return (
    <View style={Styles.container}>
      <Text style={Styles.title}>{LanguageKeys.generalSettings}</Text>
    </View>
  );
}

export default SettingsHeader;

const Styles = StyleSheet.create({
  container: {
    paddingBottom: hp(0.5),
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_B,
    color: Colors.color1,
  },
});
