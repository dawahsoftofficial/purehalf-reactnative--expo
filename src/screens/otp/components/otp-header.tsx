import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '../../../components';
import { hp, Typography } from '../../../global';
import { LanguageKeys } from '../../../languages';
import { Colors, Fonts } from '../../../res';

type OtpHeaderProps = {
  phoneNumber: string;
  type?: 'email' | 'phone';
  textColor: string;
};

function OtpHeader({ phoneNumber, type = 'phone', textColor }: OtpHeaderProps) {
  return (
    <>
      <View style={Styles.headingCon}>
        <Text style={[Styles.description, { color: textColor }]}>
          {type === 'email' ? LanguageKeys.emailSent : LanguageKeys.smsSent}
        </Text>
      </View>
      <View style={Styles.headingCon}>
        <Text style={[Styles.heading, { color: textColor }]}>
          {phoneNumber}
        </Text>
      </View>
      <View style={Styles.descriptionCon}>
        <Text style={[Styles.description, { color: textColor }]}>
          {LanguageKeys.enterVerification}
        </Text>
      </View>
    </>
  );
}

export default memo(OtpHeader);

const Styles = StyleSheet.create({
  headingCon: {
    marginBottom: hp(1),
  },
  heading: {
    fontSize: Typography.medium2,
    includeFontPadding: false,
    fontFamily: Fonts.APPFONT_B,
    color: Colors.color2,
  },
  descriptionCon: {
    marginBottom: hp(3),
  },
  description: {
    fontSize: Typography.small2,
    includeFontPadding: false,
    fontFamily: Fonts.APPFONT_R,
    color: Colors.color2,
  },
});
