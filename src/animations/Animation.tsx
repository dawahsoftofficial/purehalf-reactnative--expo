import React, { memo } from 'react';
import type { ViewStyle } from 'react-native';
import * as Animatable from 'react-native-animatable';

type AnimationProps = {
  animation?: string;
  duration?: number;
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
};

function Animation({
  animation = 'fadeInUp',
  duration = 400,
  style,
  children,
}: AnimationProps) {
  return (
    <Animatable.View
      animation={animation}
      useNativeDriver={true}
      duration={duration}
      style={style}
      easing="ease-out"
    >
      {children}
    </Animatable.View>
  );
}

export default memo(Animation);
