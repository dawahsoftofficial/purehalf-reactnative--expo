import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

import { Animation } from '../../animations';
import { hp, Typography, wp } from '../../global';
import Constants from '../../global/Constants';
import { CheckRtl } from '../../languages';
import { Colors, Fonts } from '../../res';
import { Text } from '..';

const Button = (props: any) => {
  const Rtl = CheckRtl();
  const {
    icon = <View />,
    text = '',
    onPress = null,
    buttonStyle = {},
    disabled = false,
    loading = false,
    loadingMessage = '',
    textStyle = {},
    // 'primary' (default) | 'outline' | 'ghost'
    variant = 'primary',
  } = props;

  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';

  const backgroundColor =
    disabled || loading
      ? isOutline
        ? 'transparent'
        : isGhost
          ? Colors.lavender
          : Colors.themeRGBA50
      : isOutline
        ? 'transparent'
        : isGhost
          ? Colors.lavender
          : Colors.theme;

  const foreground = isOutline || isGhost ? Colors.primary : Colors.color2;

  return (
    <Ripple
      style={[
        Styles.btnContainer,
        {
          backgroundColor,
          borderWidth: isOutline ? 1.5 : 0,
          borderColor: isOutline ? Colors.primaryLite : 'transparent',
          opacity: disabled ? 0.5 : 1,
        },
        buttonStyle,
      ]}
      onPress={disabled ? () => {} : onPress}
      {...props}
    >
      <Animation
        style={{
          ...Styles.iconCon,
          alignItems: Rtl ? 'flex-start' : 'flex-end',
        }}
        animation="fadeInRight"
        duration={600}
      >
        {loading ? <ActivityIndicator color={foreground} size="small" /> : icon}
      </Animation>
      <Text style={[Styles.btnTxt, { color: foreground }, textStyle]}>
        {loading && loadingMessage ? loadingMessage : text}
      </Text>
    </Ripple>
  );
};

export default Button;

const Styles = StyleSheet.create({
  btnContainer: {
    height: hp(6.5),
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTxt: {
    alignSelf: 'center',
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.medium,
    marginBottom: Constants.fontFamilyMarginBottom,
    textAlign: 'center',
    maxWidth: wp(60),
  },
  iconCon: {
    position: 'absolute',
    justifyContent: 'center',
    height: hp(6.5),
    borderRadius: 16,
    width: wp(84),
    paddingHorizontal: wp(4),
  },
});
