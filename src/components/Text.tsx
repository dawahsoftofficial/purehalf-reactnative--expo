import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type StyleProp,
  Text as RNText,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';

import { CheckRtl } from '../languages';

type TextProps = {
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  containerStyle?: StyleProp<ViewStyle>;
  children: string | string[];
};

const Text = React.memo((props: TextProps) => {
  const { t } = useTranslation();
  const Rtl = CheckRtl();
  const { style, numberOfLines, containerStyle, children } = props;

  const textStyle = useMemo<StyleProp<TextStyle>>(() => {
    const alignSelf: TextStyle = {
      alignSelf: Rtl ? ('flex-end' as const) : ('flex-start' as const),
    };
    return [alignSelf, style];
  }, [Rtl, style]);

  // Handle string children
  if (typeof children === 'string') {
    return (
      <RNText style={textStyle} numberOfLines={numberOfLines}>
        {t(children)}
      </RNText>
    );
  }

  // Handle array of strings
  if (Array.isArray(children) && children.length > 0) {
    return (
      <View
        style={[
          containerStyle,
          { flexDirection: Rtl ? 'row-reverse' : 'row', alignItems: 'center' },
        ]}
      >
        {children.map((element: string, index: number) => (
          <RNText style={textStyle} key={index}>
            {t(element)}
          </RNText>
        ))}
      </View>
    );
  }

  // Return null for empty/invalid children
  return null;
});

Text.displayName = 'Text';

export default Text;
