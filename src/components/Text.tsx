import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { CheckRtl } from '../languages';

const Texts = (props: any) => {
  const { t } = useTranslation();
  const Rtl = CheckRtl();
  const {
    style = null,
    numberOfLines = null,
    containerStyle = {},
    children = [],
  } = props;

  return typeof children === 'string' ? (
    <Text
      style={[{ alignSelf: Rtl ? 'flex-end' : 'flex-start' }, style]}
      numberOfLines={numberOfLines && numberOfLines}
    >
      {t(props.children)}
    </Text>
  ) : children && typeof children === 'object' && children.length !== 0 ? (
    <View
      style={[
        containerStyle,
        { flexDirection: Rtl ? 'row-reverse' : 'row', alignItems: 'center' },
      ]}
    >
      {children.map((element: any, index: any) => (
        <Text
          style={[{ alignSelf: Rtl ? 'flex-end' : 'flex-start' }, style]}
          key={index}
        >
          {t(element)}
        </Text>
      ))}
    </View>
  ) : (
    <Text></Text>
  );
};

export default Texts;
