import {
  BlurView as BlurContainer,
  type BlurViewProps,
} from '@react-native-community/blur';
import React from 'react';
import { StyleSheet } from 'react-native';

const BlurView = (props: BlurViewProps) => {
  const { style = {}, blurAmount = 10 } = props;

  return (
    <BlurContainer
      blurType="light"
      blurAmount={blurAmount}
      style={[Styles.mainView, style]}
      reducedTransparencyFallbackColor="white"
      {...props}
    />
  );
};

export default BlurView;

const Styles = StyleSheet.create({
  mainView: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
