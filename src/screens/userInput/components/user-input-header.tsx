import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Text } from '../../../components';
import { hp, Typography, wp } from '../../../global';
import { LanguageKeys } from '../../../languages';
import { Colors, Fonts } from '../../../res';

// Onboarding header for the "about you" signup step. Gives the screen a warm,
// oriented feel: a progress hint, a brand badge, an editorial title and a
// supportive one-liner — instead of a bare heading floating on white.
function UserInputHeader() {
  return (
    <View style={Styles.container}>
      <View style={Styles.progressRow}>
        <View style={Styles.progressTrack}>
          <View style={Styles.progressFill} />
        </View>
        <Text style={Styles.eyebrow}>{LanguageKeys.createYourProfile}</Text>
      </View>

      <View style={Styles.badge}>
        <Ionicons name="person-outline" size={wp(6.5)} color={Colors.primary} />
      </View>

      <Text variant="display" style={Styles.title}>
        {LanguageKeys.signupDes}
      </Text>
      <Text style={Styles.subtitle}>{LanguageKeys.aboutYouSubtitle}</Text>
    </View>
  );
}

export default memo(UserInputHeader);

const Styles = StyleSheet.create({
  container: {
    marginBottom: hp(3),
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2.5),
  },
  progressTrack: {
    flex: 1,
    height: hp(0.7),
    borderRadius: hp(0.35),
    backgroundColor: Colors.lavender,
    overflow: 'hidden',
  },
  progressFill: {
    width: '66%',
    height: '100%',
    borderRadius: hp(0.35),
    backgroundColor: Colors.primary,
  },
  eyebrow: {
    marginLeft: wp(3),
    color: Colors.primaryMid,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small,
    letterSpacing: 0.3,
    includeFontPadding: false,
  },
  badge: {
    width: wp(13),
    height: wp(13),
    borderRadius: wp(6.5),
    backgroundColor: Colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(1.6),
  },
  title: {
    fontSize: Typography.large2,
    color: Colors.ink,
    includeFontPadding: false,
    marginBottom: hp(0.8),
  },
  subtitle: {
    fontSize: Typography.small2,
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    lineHeight: hp(2.6),
    includeFontPadding: false,
  },
});
