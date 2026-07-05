import React from 'react';
import { StyleSheet, View } from 'react-native';

import { hp, Typography } from '../../global';
import { LanguageKeys } from '../../languages';
import { Colors } from '../../res';
import Text from '../Text';

function SettingsHeader() {
  return (
    <View style={Styles.container}>
      <Text variant="display" style={Styles.title}>
        {LanguageKeys.generalSettings}
      </Text>
    </View>
  );
}

export default SettingsHeader;

const Styles = StyleSheet.create({
  container: {
    paddingTop: hp(1),
    paddingBottom: hp(1.5),
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.large1,
    color: Colors.ink,
  },
});
