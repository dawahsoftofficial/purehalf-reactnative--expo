import CheckBox from '@react-native-community/checkbox';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, Text as DefaultText, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

import { hp, Typography, wp } from '../../../global';
import { Colors, Fonts } from '../../../res';
import { isIOS } from '../../../services';

type TermsAndConditionsProps = {
  checkBox: boolean;
  onCheckboxChange: (value: boolean) => void;
};

function TermsAndConditions({
  checkBox,
  onCheckboxChange,
}: TermsAndConditionsProps) {
  const { t } = useTranslation();

  const handleTermsPress = () => {
    Linking.openURL('https://purehalf.com/terms-conditions/');
  };

  const handlePrivacyPress = () => {
    Linking.openURL('https://purehalf.com/privacy-policy/');
  };

  return (
    <View style={Styles.container}>
      <CheckBox
        disabled={false}
        value={checkBox}
        onValueChange={onCheckboxChange}
        tintColors={{ true: Colors.theme, false: Colors.color15 }}
      />
      <View>
        <View style={Styles.textRow}>
          <DefaultText style={Styles.termsAndConditionText}>
            {t('acceptTermsAndConditions')}{' '}
          </DefaultText>
          <Ripple
            onPress={handleTermsPress}
            style={Styles.ripple}
            accessibilityRole="link"
            accessibilityLabel={t('termsAndConditions')}
          >
            <DefaultText style={Styles.underline}>
              {t('termsAndConditions')}
            </DefaultText>
          </Ripple>
          <DefaultText style={Styles.termsAndConditionText}>
            {t('and')}
          </DefaultText>
        </View>
        <Ripple
          onPress={handlePrivacyPress}
          accessibilityRole="link"
          accessibilityLabel={t('privacyPolicy')}
        >
          <DefaultText style={[Styles.underline, Styles.privacyText]}>
            {t('privacyPolicy')}
          </DefaultText>
        </Ripple>
      </View>
    </View>
  );
}

export default memo(TermsAndConditions);

const Styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(2),
    alignSelf: 'flex-start',
  },
  textRow: {
    flexDirection: 'row',
    marginLeft: 3,
  },
  termsAndConditionText: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_R,
    includeFontPadding: false,
    fontSize: Typography.small1,
    alignSelf: 'center',
    marginLeft: wp(1),
  },
  underline: {
    textDecorationLine: 'underline',
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small1,
  },
  privacyText: {
    marginLeft: 7,
  },
  ripple: {
    paddingTop: isIOS ? 0 : 5,
  },
});
