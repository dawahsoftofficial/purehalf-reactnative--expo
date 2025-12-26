import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/res';

export function FinePrint() {
  return (
    <View style={styles.finePrint}>
      <Text style={styles.finePrintText}>
        <Text style={styles.finePrintStrong}>Cancel anytime.</Text> Renews
        monthly unless cancelled in{' '}
        {Platform.OS === 'ios' ? 'App Store' : 'Google Play Store'}.{'\n'}Bonus
        chats are added instantly. Daily chats reset every day (PKT).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  finePrint: {
    marginTop: 10,
    padding: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 6,
  },
  finePrintText: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 12,
    fontFamily: Fonts.APPFONT_R,
    includeFontPadding: false,
  },
  finePrintStrong: {
    color: 'rgba(255,255,255,0.78)',
    fontFamily: Fonts.APPFONT_B,
  },
});
