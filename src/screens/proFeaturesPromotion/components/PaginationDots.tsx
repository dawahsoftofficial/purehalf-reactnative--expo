import React from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { type PurchasesPackage } from 'react-native-purchases';

type PaginationDotsProps = {
  packages: PurchasesPackage[];
  currentIndex: number;
  scrollX: Animated.Value;
  cardWidth: number;
  cardGap: number;
  onSelect: (index: number) => void;
};

export function PaginationDots({
  packages,
  currentIndex,
  scrollX,
  cardWidth,
  cardGap,
  onSelect,
}: PaginationDotsProps) {
  return (
    <View style={styles.dotsRow}>
      {packages.map((_, i) => {
        const inputRange = [
          (i - 1) * (cardWidth + cardGap),
          i * (cardWidth + cardGap),
          (i + 1) * (cardWidth + cardGap),
        ];

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.35, 1, 0.35],
          extrapolate: 'clamp',
        });

        const scale = scrollX.interpolate({
          inputRange,
          outputRange: [1, 1.35, 1],
          extrapolate: 'clamp',
        });

        return (
          <Pressable
            key={`dot-${i}`}
            onPress={() => onSelect(i)}
            style={{ padding: 6 }}
          >
            <Animated.View
              style={[styles.dot, { opacity, transform: [{ scale }] }]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
});
