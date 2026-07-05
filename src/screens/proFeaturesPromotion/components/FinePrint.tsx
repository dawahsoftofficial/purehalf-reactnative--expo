import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts } from '@/res';

export function FinePrint() {
  return (
    <View style={styles.finePrint}>
      <Text style={styles.finePrintText}>
        <Text style={styles.finePrintStrong}>Cancel anytime.</Text> Renews
        monthly unless cancelled in{' '}
        {Platform.OS === 'ios' ? 'App Store' : 'Google Play Store'}. Bonus chats
        are added instantly. Daily chats reset every day (PKT).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  finePrint: {
    marginTop: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.surface,
    gap: 6,
  },
  finePrintText: {
    color: Colors.muted,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.APPFONT_R,
    includeFontPadding: false,
  },
  finePrintStrong: {
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_B,
  },
});
