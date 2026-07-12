import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { hp, Typography, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors } from '../../res';
import Text from '../Text';

function SettingsHeader({
  navigation,
}: {
  navigation: { goBack: () => void };
}) {
  const Rtl = CheckRtl();

  return (
    <View style={Styles.container}>
      <TouchableOpacity
        style={[Styles.backButton, Rtl ? Styles.backButtonRtl : null]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <AntDesign
          name={Rtl ? 'arrowright' : 'arrowleft'}
          color={Colors.ink}
          size={wp(6)}
        />
      </TouchableOpacity>
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
    justifyContent: 'center',
    paddingHorizontal: wp(4),
    minHeight: hp(6),
  },
  backButton: {
    position: 'absolute',
    left: wp(4),
    zIndex: 1,
    padding: wp(1),
  },
  backButtonRtl: {
    left: undefined,
    right: wp(4),
  },
  title: {
    fontSize: Typography.large1,
    color: Colors.ink,
  },
});
