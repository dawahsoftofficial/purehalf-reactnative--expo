import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/res';

type FooterProps = {
  onRestore: () => void;
};

export function Footer({ onRestore }: FooterProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.footerRow}>
      <Pressable onPress={onRestore} style={styles.linkBtn}>
        <Text style={styles.linkText}>{t('restoreSubscription')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  footerRow: {
    marginTop: 10,
    alignItems: 'center',
  },
  linkBtn: { padding: 8 },
  linkText: {
    color: 'rgba(255,255,255,0.75)',
    textDecorationLine: 'underline',
    fontFamily: Fonts.APPFONT_M,
    fontSize: 12,
    includeFontPadding: false,
  },
});
