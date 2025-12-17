import React, { memo, useMemo } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  View,
} from 'react-native';
import Ripple from 'react-native-material-ripple';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { Typography, wp } from '../../global';
import { CheckRtl } from '../../languages';
import { Colors, Fonts } from '../../res';
import Text from '../Text';

type SettingsButtonProps = {
  icon: number;
  name: string;
  onPress: () => void;
  loading?: boolean;
  iconStyle?: object;
  disabled?: boolean;
  accessibilityLabel?: string;
};

const { width } = Dimensions.get('window');

function SettingsButton({
  icon,
  name,
  onPress,
  loading = false,
  iconStyle,
  disabled = false,
  accessibilityLabel,
}: SettingsButtonProps) {
  const Rtl = CheckRtl();

  const iconElement = useMemo(
    () => (
      <Image
        source={icon}
        resizeMode="contain"
        style={[Styles.btnIcon, iconStyle]}
      />
    ),
    [icon, iconStyle]
  );

  const nameElement = useMemo(
    () => (
      <Text style={Styles.btnTxt} numberOfLines={1}>
        {name}
      </Text>
    ),
    [name]
  );

  const arrowElement = useMemo(
    () => (
      <AntDesign
        name={Rtl ? 'arrowleft' : 'arrowright'}
        color={Colors.color1}
        size={wp(6)}
      />
    ),
    [Rtl]
  );

  return (
    <Ripple
      style={Styles.btnCon}
      onPress={onPress}
      disabled={disabled}
      hitSlop={Styles.hitSlop}
      accessibilityLabel={accessibilityLabel ?? name}
      accessibilityRole="button"
    >
      {Rtl && arrowElement}
      <View
        style={[
          Styles.btnConInner,
          { justifyContent: Rtl ? 'flex-end' : 'flex-start' },
        ]}
      >
        {!Rtl && iconElement}
        {nameElement}
        {Rtl && iconElement}
      </View>
      {!Rtl && (loading ? <ActivityIndicator /> : arrowElement)}
    </Ripple>
  );
}

export default memo(SettingsButton);

const Styles = StyleSheet.create({
  btnCon: {
    borderRadius: 8,
    backgroundColor: Colors.color16,
    paddingVertical: width * 0.04,
    paddingHorizontal: wp(4),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: width * 0.04,
  },
  btnConInner: {
    width: wp(75),
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnIcon: {
    width: width * 0.05,
    height: width * 0.05,
  },
  btnTxt: {
    fontSize: Typography.small2,
    alignSelf: 'center',
    fontFamily: Fonts.APPFONT_M,
    marginHorizontal: wp(3),
    color: Colors.color1,
    includeFontPadding: false,
  },
  hitSlop: {
    top: 6,
    bottom: 6,
    left: 6,
    right: 6,
  },
});
