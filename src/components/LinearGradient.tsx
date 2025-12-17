import React from 'react';
import LinearGradient from 'react-native-linear-gradient';

import { Colors } from '../res';

const CustomLinearGradient = (props: any) => {
  return (
    <LinearGradient colors={[Colors.theme, Colors.theme]} {...props}>
      {props.children}
    </LinearGradient>
  );
};

export default CustomLinearGradient;
