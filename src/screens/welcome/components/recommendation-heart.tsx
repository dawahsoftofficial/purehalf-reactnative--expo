import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Ripple from 'react-native-material-ripple';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { wp } from '../../../global';
import { Colors } from '../../../res';

type RecommendationHeartProps = {
  onPress: () => void;
};

export const RecommendationHeart = ({ onPress }: RecommendationHeartProps) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    // Heartbeat: two quick beats, then rest before repeating
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 200, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 200, easing: Easing.in(Easing.quad) }),
        withTiming(1.2, { duration: 200, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 200, easing: Easing.in(Easing.quad) }),
        withDelay(1000, withTiming(1, { duration: 0 }))
      ),
      -1
    );
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Ripple
      rippleColor={Colors.primary}
      rippleContainerBorderRadius={wp(6)}
      style={Styles.button}
      onPress={onPress}
    >
      <Animated.View style={animatedStyle}>
        <Ionicons name="heart" size={wp(7)} color={Colors.primary} />
      </Animated.View>
    </Ripple>
  );
};

const Styles = StyleSheet.create({
  button: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    // Light tint of the primary heart color (~12% opacity)
    backgroundColor: `${Colors.primary}1F`,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
