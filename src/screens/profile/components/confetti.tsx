import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { hp, wp } from '../../../global';
import { Colors } from '../../../res';

const PIECE_COLORS = [
  Colors.primary,
  Colors.verified,
  '#F5B942',
  '#4EA1F3',
  '#F36FA0',
];
const PIECE_COUNT = 18;

// Deterministic pseudo-scatter from the piece's own index — avoids
// re-rolling each piece's column/rotation on every re-render, which a
// render-time Math.random() call would do.
const ConfettiPiece = ({ index }: { index: number }) => {
  const progress = useSharedValue(0);
  const color = PIECE_COLORS[index % PIECE_COLORS.length];
  const leftPct = (index * 53) % 100;
  const delay = (index % 6) * 60;
  const baseRotate = (index * 37) % 360;
  const drift = index % 2 === 0 ? 1 : -1;

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) })
    );
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateY: progress.value * hp(22) },
      { translateX: drift * progress.value * wp(6) },
      { rotate: `${baseRotate + progress.value * 180}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        Styles.piece,
        { left: `${leftPct}%`, backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
};

// One-shot confetti burst — mount it only while a success state is visible;
// unmounting resets it, so a repeat celebration replays cleanly.
const Confetti = () => (
  <View pointerEvents="none" style={Styles.container}>
    {Array.from({ length: PIECE_COUNT }).map((_, index) => (
      <ConfettiPiece key={index} index={index} />
    ))}
  </View>
);

export default Confetti;

const Styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  piece: {
    position: 'absolute',
    top: 0,
    width: wp(2.2),
    height: wp(3.2),
    borderRadius: 2,
  },
});
