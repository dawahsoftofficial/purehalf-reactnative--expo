import React, { useEffect, useMemo } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { hp, Typography, wp } from '../../../global';
import { Colors, Fonts } from '../../../res';

interface TypingIndicatorProps {
  userName?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ userName }) => {
  // useMemo (not useRef) so we don't read `.current` during render —
  // satisfies React 19's react-hooks/refs rule.
  const dot1 = useMemo(() => new Animated.Value(0), []);
  const dot2 = useMemo(() => new Animated.Value(0), []);
  const dot3 = useMemo(() => new Animated.Value(0), []);

  const translate1 = useMemo(
    () => dot1.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }),
    [dot1]
  );
  const translate2 = useMemo(
    () => dot2.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }),
    [dot2]
  );
  const translate3 = useMemo(
    () => dot3.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }),
    [dot3]
  );

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation = Animated.parallel([
      animateDot(dot1, 0),
      animateDot(dot2, 200),
      animateDot(dot3, 400),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <Text style={styles.text}>
          {userName ? `${userName} is typing` : 'Typing'}
        </Text>
        <View style={styles.dotsContainer}>
          <Animated.View
            style={[
              styles.dot,
              { opacity: dot1, transform: [{ translateY: translate1 }] },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              { opacity: dot2, transform: [{ translateY: translate2 }] },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              { opacity: dot3, transform: [{ translateY: translate3 }] },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lavender,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(1),
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: Typography.small,
    fontFamily: Fonts.APPFONT_M,
    color: Colors.muted,
    marginRight: wp(2),
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginHorizontal: 2,
  },
});

export default TypingIndicator;
