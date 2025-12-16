import React from 'react';
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
};

const { width } = Dimensions.get('window');

function SettingsButton({
  icon,
  name,
  onPress,
  loading = false,
  iconStyle,
}: SettingsButtonProps) {
  const Rtl = CheckRtl();

  const renderIcon = () => (
    <Image
      source={icon}
      resizeMode="contain"
      style={[Styles.btnIcon, iconStyle]}
    />
  );

  const renderName = () => (
    <Text style={Styles.btnTxt} numberOfLines={1}>
      {name}
    </Text>
  );

  const renderArrow = () => (
    <AntDesign
      name={Rtl ? 'arrowleft' : 'arrowright'}
      color={Colors.color1}
      size={wp(6)}
    />
  );

  return (
    <Ripple style={Styles.btnCon} onPress={onPress}>
      {Rtl && renderArrow()}
      <View
        style={[
          Styles.btnConInner,
          { justifyContent: Rtl ? 'flex-end' : 'flex-start' },
        ]}
      >
        {!Rtl && renderIcon()}
        {renderName()}
        {Rtl && renderIcon()}
      </View>
      {!Rtl && (loading ? <ActivityIndicator /> : renderArrow())}
    </Ripple>
  );
}

export default SettingsButton;

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
});
