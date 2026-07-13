import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { hp, Typography, wp } from '../../../global';
import { Colors, Fonts } from '../../../res';

type ProfilePictureHeaderProps = {
  onGuidelinesPress: () => void;
};

function ProfilePictureHeader({
  onGuidelinesPress,
}: ProfilePictureHeaderProps) {
  return (
    <View style={Styles.wrapper}>
      <Text style={Styles.title}>Add your profile picture</Text>
      <Text style={Styles.subtitle}>
        A clear, friendly photo helps you get better matches. You can change it
        anytime.
      </Text>
      <Ripple style={Styles.guidelinesBtn} onPress={onGuidelinesPress}>
        <Ionicons
          name="shield-checkmark-outline"
          size={wp(3.6)}
          color={Colors.primary}
        />
        <Text style={Styles.guidelinesText}>View photo guidelines</Text>
      </Ripple>
    </View>
  );
}

export default memo(ProfilePictureHeader);

const Styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingHorizontal: wp(2),
  },
  title: {
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.large1,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    textAlign: 'center',
    lineHeight: wp(5.4),
    marginTop: hp(1),
    maxWidth: wp(80),
  },
  guidelinesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    marginTop: hp(2),
  },
  guidelinesText: {
    color: Colors.primary,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small1,
    textDecorationLine: 'underline',
  },
});
