import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts } from '@/res';

type ChipProps = {
  label: string;
  dot: 'neutral' | 'pro' | 'success' | 'warn';
};

export function Chip({ label, dot }: ChipProps) {
  const dotStyle =
    dot === 'pro'
      ? styles.dotPro
      : dot === 'success'
        ? styles.dotSuccess
        : dot === 'warn'
          ? styles.dotWarn
          : styles.dotNeutral;

  return (
    <View style={styles.chip}>
      <View style={[styles.chipDot, dotStyle]} />
      <Text style={styles.chipText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: Colors.lavender,
  },
  chipDot: { width: 7, height: 7, borderRadius: 99 },
  dotNeutral: { backgroundColor: Colors.primaryLite },
  dotPro: { backgroundColor: Colors.primary },
  dotSuccess: { backgroundColor: Colors.verified },
  dotWarn: { backgroundColor: Colors.primaryMid },
  chipText: {
    color: Colors.primary,
    fontSize: 12,
    fontFamily: Fonts.APPFONT_M,
  },
});
