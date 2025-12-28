import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/res';

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
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  chipDot: { width: 7, height: 7, borderRadius: 99 },
  dotNeutral: { backgroundColor: 'rgba(255,255,255,0.35)' },
  dotPro: { backgroundColor: 'rgba(167,139,250,0.95)' },
  dotSuccess: { backgroundColor: 'rgba(45,212,191,0.95)' },
  dotWarn: { backgroundColor: 'rgba(251,191,36,0.95)' },
  chipText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontFamily: Fonts.APPFONT_M,
  },
});
