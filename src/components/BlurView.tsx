import { BlurView as BlurContainer } from '@react-native-community/blur';
import React from 'react';
import { StyleSheet } from 'react-native';

const BlurView = (props: any) => {
  const { style = null, blurAmount = 10 } = props;

  return (
    <BlurContainer
      style={[Styles.mainView, style]}
      blurType="light"
      blurAmount={blurAmount}
      reducedTransparencyFallbackColor="white"
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
