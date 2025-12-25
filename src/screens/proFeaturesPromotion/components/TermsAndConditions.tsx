import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Fonts } from '@/res';

const FONT = {
  regular: Fonts.APPFONT_R,
};

export function TermsAndConditions() {
  const { t } = useTranslation();

  return (
    <>
      <View style={styles.termsCon}>
        <Text style={styles.termsDes}>{t('bySubscribingDes')}</Text>
        <TouchableOpacity
          onPress={() =>
            Linking.openURL('https://purehalf.com/terms-conditions/')
          }
          activeOpacity={0.7}
        >
          <Text style={[styles.termsDes, styles.termsLink]}>
            {' '}
            {t('termsAndConditions')}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.termsCon, { marginTop: 0 }]}>
        <Text style={styles.termsDes}>{t('alsoRefund')}</Text>
        <TouchableOpacity
          onPress={() => Linking.openURL('https://purehalf.com/refund-policy/')}
          activeOpacity={0.7}
        >
          <Text style={[styles.termsDes, styles.termsLink]}>
            {' '}
            {t('refundPolicyText')}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  termsCon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  termsDes: {
    fontSize: 12,
    alignSelf: 'center',
    textAlign: 'center',
    fontFamily: FONT.regular,
    color: 'rgba(255,255,255,0.68)',
  },
  termsLink: {
    textDecorationLine: 'underline',
  },
});
