import React, { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type WiggleProps = {
  active: boolean;
  children: React.ReactNode;
};

// Attention-getting rotate wobble for an actionable icon (idle otherwise).
// Same withRepeat(withSequence(...), -1) loop-then-pause shape as
// recommendation-heart.tsx's pulse, applied to rotation instead of scale.
const Wiggle = ({ active, children }: WiggleProps) => {
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      rotate.value = withTiming(0, { duration: 150 });
      return;
    }
    rotate.value = withRepeat(
      withSequence(
        withTiming(-1, { duration: 100, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 100, easing: Easing.inOut(Easing.quad) }),
        withTiming(-1, { duration: 100, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 100, easing: Easing.inOut(Easing.quad) }),
        withDelay(1600, withTiming(0, { duration: 0 }))
      ),
      -1
    );
  }, [active, rotate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value * 14}deg` }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
};

export default Wiggle;
